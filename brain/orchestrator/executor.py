"""
Main executor interface for NexusAI orchestrator.
Provides a unified API that switches between LangChain and custom runners.
"""

import json
import logging
import os
import uuid
from typing import List, Dict, Any, Optional, Callable
from datetime import datetime

from .config import is_langchain_enabled, get_output_dir
from .schema import ExecutionResult
from .custom_runner import CustomRunner

logger = logging.getLogger(__name__)

# Global runner instances
_custom_runner = None
_langchain_runner = None


def get_runner():
    """Get the appropriate runner based on configuration."""
    global _custom_runner, _langchain_runner
    
    if is_langchain_enabled():
        if _langchain_runner is None:
            try:
                from .langchain_runner import LangChainRunner
                _langchain_runner = LangChainRunner()
                logger.info("Using LangChain runner")
            except ImportError as e:
                logger.warning(f"LangChain runner not available: {e}. Falling back to custom runner.")
                if _custom_runner is None:
                    _custom_runner = CustomRunner()
                return _custom_runner
        return _langchain_runner
    else:
        if _custom_runner is None:
            _custom_runner = CustomRunner()
            logger.info("Using custom runner")
        return _custom_runner


def execute_plan(
    plan: List[Dict[str, Any]], 
    session_id: Optional[str] = None,
    task_id: Optional[str] = None,
    on_update: Optional[Callable[[int, str, Any], None]] = None,
    save_results: bool = True
) -> ExecutionResult:
    """
    Execute a structured plan using the configured orchestrator.
    
    Args:
        plan: List of plan step dictionaries
        session_id: Optional session identifier
        task_id: Optional task identifier (auto-generated if not provided)
        on_update: Optional callback for progress updates (step_id, status, output)
        save_results: Whether to save results to file
        
    Returns:
        ExecutionResult containing step results and overall status
        
    Raises:
        ValueError: If plan is empty or invalid
        RuntimeError: If execution fails critically
    """
    if not plan:
        raise ValueError("Plan cannot be empty")
    
    # Generate task ID if not provided
    if task_id is None:
        task_id = f"task_{uuid.uuid4().hex[:8]}"
    
    logger.info(f"Executing plan with {len(plan)} steps (task_id: {task_id})")
    
    # Create update callback wrapper for logging and saving
    def update_callback(step_id: int, status: str, output: Any):
        logger.info(f"Step {step_id} status: {status}")
        if on_update:
            on_update(step_id, status, output)
    
    # Get the configured runner
    runner = get_runner()
    
    # Execute the plan
    result = runner.execute_plan(
        plan_steps=plan,
        task_id=task_id,
        session_id=session_id,
        on_update=update_callback
    )
    
    # Save results if requested
    if save_results:
        try:
            save_execution_result(result)
        except Exception as e:
            logger.warning(f"Failed to save execution result: {e}")
    
    logger.info(f"Plan execution finished with status: {result.status}")
    return result


def save_execution_result(result: ExecutionResult) -> str:
    """
    Save execution result to a JSON file.
    
    Args:
        result: ExecutionResult to save
        
    Returns:
        Path to saved file
    """
    output_dir = get_output_dir()
    os.makedirs(output_dir, exist_ok=True)
    
    filename = f"{result.task_id}_{result.created_at.strftime('%Y%m%d_%H%M%S')}.json"
    filepath = os.path.join(output_dir, filename)
    
    with open(filepath, 'w', encoding='utf-8') as f:
        json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
    
    logger.info(f"Execution result saved to: {filepath}")
    return filepath


def load_execution_result(filepath: str) -> ExecutionResult:
    """
    Load execution result from a JSON file.
    
    Args:
        filepath: Path to the saved result file
        
    Returns:
        ExecutionResult object
    """
    with open(filepath, 'r', encoding='utf-8') as f:
        data = json.load(f)
    
    # Convert datetime strings back to datetime objects
    if data.get('created_at'):
        data['created_at'] = datetime.fromisoformat(data['created_at'])
    if data.get('finished_at'):
        data['finished_at'] = datetime.fromisoformat(data['finished_at'])
    
    for step in data.get('steps', []):
        if step.get('started_at'):
            step['started_at'] = datetime.fromisoformat(step['started_at'])
        if step.get('finished_at'):
            step['finished_at'] = datetime.fromisoformat(step['finished_at'])
    
    return ExecutionResult(**data)


def get_execution_history(limit: int = 10) -> List[str]:
    """
    Get list of recent execution result files.
    
    Args:
        limit: Maximum number of files to return
        
    Returns:
        List of file paths, most recent first
    """
    output_dir = get_output_dir()
    if not os.path.exists(output_dir):
        return []
    
    files = []
    for filename in os.listdir(output_dir):
        if filename.endswith('.json'):
            filepath = os.path.join(output_dir, filename)
            files.append((filepath, os.path.getmtime(filepath)))
    
    # Sort by modification time (newest first)
    files.sort(key=lambda x: x[1], reverse=True)
    
    return [filepath for filepath, _ in files[:limit]]


class ProgressTracker:
    """Simple progress tracker for console output."""
    
    def __init__(self, task_id: str):
        self.task_id = task_id
        self.start_time = datetime.now()
        
    def __call__(self, step_id: int, status: str, output: Any):
        """Progress callback function."""
        elapsed = (datetime.now() - self.start_time).total_seconds()
        
        print(f"[{elapsed:6.1f}s] Step {step_id}: {status.upper()}")
        
        if status == "ok" and output:
            # Show brief summary of output
            if isinstance(output, list):
                print(f"         → Returned {len(output)} items")
            elif isinstance(output, str):
                preview = output[:100] + "..." if len(output) > 100 else output
                print(f"         → {preview}")
            else:
                print(f"         → {type(output).__name__} result")
        elif status == "error" and output:
            print(f"         → Error: {output}")


# Convenience function for quick testing
def execute_simple_plan(instructions: List[str], session_id: str = None) -> ExecutionResult:
    """
    Execute a simple plan from a list of instruction strings.
    
    Args:
        instructions: List of simple instruction strings
        session_id: Optional session identifier
        
    Returns:
        ExecutionResult
    """
    # Convert instructions to basic plan format
    plan = []
    for i, instruction in enumerate(instructions, 1):
        # Simple heuristic to determine tool type
        if "search" in instruction.lower():
            tool = "search"
            args = {"query": instruction.replace("search for", "").strip()}
        elif "open" in instruction.lower():
            tool = "open"
            # Extract URL if present
            words = instruction.split()
            url = next((word for word in words if word.startswith("http")), "https://example.com")
            args = {"url": url}
        else:
            tool = "search"
            args = {"query": instruction}
        
        plan.append({
            "step_id": i,
            "tool": tool,
            "args": args,
            "reason": instruction,
            "confidence": 0.8
        })
    
    return execute_plan(plan, session_id=session_id)