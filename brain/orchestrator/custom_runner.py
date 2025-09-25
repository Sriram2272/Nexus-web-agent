"""
Custom orchestrator implementation for NexusAI.
Minimal executor that runs plan steps without LangChain.
"""

import logging
import time
import traceback
from typing import List, Dict, Any, Optional, Callable
from concurrent.futures import ThreadPoolExecutor, TimeoutError as FutureTimeoutError

from .schema import PlanStep, ExecutionStepResult, ExecutionResult
from .tools import get_tool_function
from .config import load_orchestrator_config

logger = logging.getLogger(__name__)


class CustomRunner:
    """Custom orchestrator that executes plans step by step."""
    
    def __init__(self):
        self.config = load_orchestrator_config()
        self.step_timeout = self.config["step_timeout"]
        self.max_retries = self.config["max_retries"]
    
    def execute_plan(
        self, 
        plan_steps: List[Dict[str, Any]], 
        task_id: str,
        session_id: Optional[str] = None,
        on_update: Optional[Callable[[int, str, Any], None]] = None
    ) -> ExecutionResult:
        """
        Execute a plan using custom orchestrator.
        
        Args:
            plan_steps: List of plan step dictionaries
            task_id: Unique task identifier
            session_id: Optional session identifier
            on_update: Optional callback for progress updates
            
        Returns:
            ExecutionResult with step results
        """
        logger.info(f"Starting plan execution with custom runner (task_id: {task_id})")
        
        # Create execution result
        result = ExecutionResult(
            task_id=task_id,
            status="running",
            session_id=session_id
        )
        
        # Validate and convert plan steps
        try:
            validated_steps = [PlanStep(**step) for step in plan_steps]
        except Exception as e:
            error_msg = f"Invalid plan format: {e}"
            logger.error(error_msg)
            result.mark_finished("error", error_msg)
            return result
        
        # Context to pass data between steps
        step_context = {}
        
        # Execute each step
        for step in validated_steps:
            step_result = ExecutionStepResult(
                step_id=step.step_id,
                status="running"
            )
            result.steps.append(step_result)
            
            if on_update:
                on_update(step.step_id, "running", None)
            
            try:
                # Execute the step
                output = self._execute_step(step, step_context)
                
                # Mark as successful
                step_result.mark_finished("ok", output)
                logger.info(f"Step {step.step_id} completed successfully")
                
                if on_update:
                    on_update(step.step_id, "ok", output)
                
                # Store output in context for next steps
                step_context[f"step_{step.step_id}_output"] = output
                
            except Exception as e:
                error_msg = str(e)
                logger.error(f"Step {step.step_id} failed: {error_msg}")
                
                # Handle retries
                if step.retry and step_result.retry_count < step.retry:
                    step_result.retry_count += 1
                    logger.info(f"Retrying step {step.step_id} (attempt {step_result.retry_count})")
                    
                    try:
                        time.sleep(1)  # Brief delay before retry
                        output = self._execute_step(step, step_context)
                        step_result.mark_finished("ok", output)
                        step_context[f"step_{step.step_id}_output"] = output
                        
                        if on_update:
                            on_update(step.step_id, "ok", output)
                        continue
                        
                    except Exception as retry_error:
                        error_msg = f"Step failed after {step_result.retry_count} retries: {retry_error}"
                        logger.error(error_msg)
                
                # Handle human intervention requirement
                if step.requires_human:
                    step_result.mark_finished("paused", None, f"Human intervention required: {error_msg}")
                    result.mark_finished("paused", f"Step {step.step_id} requires human intervention")
                    
                    if on_update:
                        on_update(step.step_id, "paused", error_msg)
                    return result
                
                # Mark step as failed
                step_result.mark_finished("error", None, error_msg)
                
                if on_update:
                    on_update(step.step_id, "error", error_msg)
                
                # Stop execution on critical failure
                result.mark_finished("error", f"Step {step.step_id} failed: {error_msg}")
                return result
        
        # All steps completed successfully
        result.mark_finished("ok")
        logger.info(f"Plan execution completed successfully (task_id: {task_id})")
        
        return result
    
    def _execute_step(self, step: PlanStep, context: Dict[str, Any]) -> Any:
        """
        Execute a single plan step.
        
        Args:
            step: The plan step to execute
            context: Context data from previous steps
            
        Returns:
            Step output
        """
        logger.debug(f"Executing step {step.step_id}: {step.tool}")
        
        # Get the tool function
        try:
            tool_func = get_tool_function(step.tool)
        except ValueError as e:
            raise RuntimeError(f"Tool not available: {e}")
        
        # Prepare arguments
        args = step.args.copy()
        
        # Inject context data if needed
        if step.tool == "extract" and "html" not in args:
            # Try to get HTML from previous step
            for key, value in context.items():
                if isinstance(value, str) and value.startswith("<"):
                    args["html"] = value
                    break
        
        # Execute with timeout
        with ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(tool_func, **args)
            
            try:
                result = future.result(timeout=self.step_timeout)
                return result
                
            except FutureTimeoutError:
                raise RuntimeError(f"Step {step.step_id} timed out after {self.step_timeout} seconds")
            
            except Exception as e:
                # Re-raise the original exception
                raise RuntimeError(f"Tool execution failed: {e}") from e