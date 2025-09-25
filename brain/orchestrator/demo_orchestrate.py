"""
Demo runner for NexusAI orchestrator.
Shows how to execute plans with both LangChain and custom runners.
"""

import json
import logging
import os
import sys
from typing import Dict, Any

# Add parent directory to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from orchestrator.executor import execute_plan, ProgressTracker
from orchestrator.prompts import get_sample_plan
from orchestrator.config import load_orchestrator_config

# Set up logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


def demo_simple_plan():
    """Demo with a simple test plan."""
    print("\n" + "="*60)
    print("DEMO 1: Simple Search Plan")
    print("="*60)
    
    plan = get_sample_plan("simple_test")
    print(f"Executing plan with {len(plan)} steps:")
    
    for step in plan:
        print(f"  {step['step_id']}. {step['tool']}: {step['args']}")
    
    # Create progress tracker
    tracker = ProgressTracker("demo_simple")
    
    # Execute plan
    result = execute_plan(plan, session_id="demo_session", on_update=tracker)
    
    print(f"\nResult Status: {result.status}")
    print(f"Execution Time: {(result.finished_at - result.created_at).total_seconds():.2f}s")
    print(f"Steps Completed: {len([s for s in result.steps if s.status == 'ok'])}/{len(result.steps)}")
    
    # Show step results
    for step in result.steps:
        print(f"\nStep {step.step_id}: {step.status}")
        if step.output:
            output_preview = str(step.output)[:200] + "..." if len(str(step.output)) > 200 else str(step.output)
            print(f"  Output: {output_preview}")
        if step.error_message:
            print(f"  Error: {step.error_message}")
    
    return result


def demo_web_research_plan():
    """Demo with web research plan."""
    print("\n" + "="*60)
    print("DEMO 2: Web Research Plan")
    print("="*60)
    
    plan = get_sample_plan("web_research")
    print(f"Executing plan with {len(plan)} steps:")
    
    for step in plan:
        print(f"  {step['step_id']}. {step['tool']}: {step['args']}")
    
    tracker = ProgressTracker("demo_research")
    result = execute_plan(plan, session_id="demo_session", on_update=tracker)
    
    print(f"\nResult Status: {result.status}")
    print(f"Steps Completed: {len([s for s in result.steps if s.status == 'ok'])}/{len(result.steps)}")
    
    return result


def demo_laptop_search_plan():
    """Demo with laptop search plan."""
    print("\n" + "="*60)
    print("DEMO 3: Laptop Search Plan")
    print("="*60)
    
    plan = get_sample_plan("laptop_search")
    print(f"Executing plan with {len(plan)} steps:")
    
    for step in plan:
        print(f"  {step['step_id']}. {step['tool']}: {step['args']}")
    
    tracker = ProgressTracker("demo_laptop")
    result = execute_plan(plan, session_id="demo_session", on_update=tracker)
    
    print(f"\nResult Status: {result.status}")
    print(f"Steps Completed: {len([s for s in result.steps if s.status == 'ok'])}/{len(result.steps)}")
    
    return result


def demo_custom_plan():
    """Demo with a custom comprehensive plan."""
    print("\n" + "="*60)
    print("DEMO 4: Custom Comprehensive Plan")
    print("="*60)
    
    plan = [
        {
            "step_id": 1,
            "tool": "search",
            "args": {"query": "best programming languages 2024"},
            "reason": "Research current programming language trends",
            "confidence": 0.9
        },
        {
            "step_id": 2,
            "tool": "open",
            "args": {"url": "https://httpbin.org/json"},
            "reason": "Test HTTP request with JSON response",
            "confidence": 0.8
        },
        {
            "step_id": 3,
            "tool": "extract",
            "args": {"selector": "body", "url": "https://httpbin.org/html"},
            "reason": "Extract content from test page",
            "confidence": 0.85
        },
        {
            "step_id": 4,
            "tool": "screenshot",
            "args": {"url": "https://httpbin.org", "full_page": True},
            "reason": "Capture screenshot of test site",
            "confidence": 0.7
        }
    ]
    
    print(f"Executing custom plan with {len(plan)} steps:")
    for step in plan:
        print(f"  {step['step_id']}. {step['tool']}: {step.get('reason', 'No reason provided')}")
    
    tracker = ProgressTracker("demo_custom")
    result = execute_plan(plan, session_id="demo_session", on_update=tracker)
    
    print(f"\nResult Status: {result.status}")
    print(f"Steps Completed: {len([s for s in result.steps if s.status == 'ok'])}/{len(result.steps)}")
    
    # Save detailed results
    save_demo_results(result, "demo_custom_execution.json")
    
    return result


def save_demo_results(result, filename: str):
    """Save demo results to JSON file."""
    try:
        with open(filename, 'w', encoding='utf-8') as f:
            json.dump(result.to_dict(), f, indent=2, ensure_ascii=False)
        print(f"\nDetailed results saved to: {filename}")
    except Exception as e:
        print(f"\nFailed to save results: {e}")


def test_both_runners():
    """Test both LangChain and custom runners if available."""
    print("\n" + "="*60)
    print("RUNNER COMPARISON TEST")
    print("="*60)
    
    config = load_orchestrator_config()
    original_langchain = config.get("langchain_enabled", False)
    
    plan = get_sample_plan("simple_test")
    
    # Test custom runner
    print("\n--- Testing Custom Runner ---")
    os.environ["LANGCHAIN_ENABLED"] = "false"
    result_custom = execute_plan(plan, task_id="test_custom")
    print(f"Custom Runner Result: {result_custom.status}")
    
    # Test LangChain runner if available
    print("\n--- Testing LangChain Runner ---")
    try:
        os.environ["LANGCHAIN_ENABLED"] = "true"
        result_langchain = execute_plan(plan, task_id="test_langchain")
        print(f"LangChain Runner Result: {result_langchain.status}")
    except Exception as e:
        print(f"LangChain Runner Failed: {e}")
        print("This is expected if LangChain is not installed")
    
    # Restore original setting
    os.environ["LANGCHAIN_ENABLED"] = str(original_langchain).lower()


def main():
    """Run all demos."""
    print("NexusAI Orchestrator Demo")
    print("=" * 60)
    
    config = load_orchestrator_config()
    print(f"Configuration:")
    print(f"  LangChain Enabled: {config['langchain_enabled']}")
    print(f"  Max Retries: {config['max_retries']}")
    print(f"  Step Timeout: {config['step_timeout']}s")
    print(f"  Output Directory: {config['output_dir']}")
    
    try:
        # Run demos
        demo_simple_plan()
        demo_laptop_search_plan()
        demo_web_research_plan()
        demo_custom_plan()
        
        # Test both runners
        test_both_runners()
        
        print("\n" + "="*60)
        print("ALL DEMOS COMPLETED")
        print("="*60)
        print("\nCheck the orchestrator_runs/ directory for saved execution results.")
        
    except KeyboardInterrupt:
        print("\n\nDemo interrupted by user.")
    except Exception as e:
        logger.error(f"Demo failed: {e}")
        print(f"\nDemo failed with error: {e}")
        return 1
    
    return 0


if __name__ == "__main__":
    sys.exit(main())