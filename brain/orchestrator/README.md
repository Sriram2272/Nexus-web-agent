# NexusAI Agent Orchestrator

A sophisticated orchestrator that executes structured JSON plans by mapping steps to concrete tools. Supports both LangChain-based and custom implementations with automatic fallback.

## Features

- **Dual Implementation**: LangChain agent and custom orchestrator
- **Tool Registry**: Extensible tool system with built-in web tools
- **Progress Streaming**: Real-time execution updates via callbacks
- **Robust Error Handling**: Retries, timeouts, and human intervention support
- **Result Persistence**: Automatic saving of execution results
- **Flexible Configuration**: Environment-based configuration switching

## Quick Start

### 1. Install Dependencies

```bash
# Core dependencies
pip install pydantic requests beautifulsoup4

# Optional dependencies
pip install playwright langchain  # For advanced features
```

### 2. Basic Usage

```python
from brain.orchestrator.executor import execute_plan

# Define a plan
plan = [
    {
        "step_id": 1,
        "tool": "search",
        "args": {"query": "laptops under 50000 INR"},
        "reason": "Find affordable laptops",
        "confidence": 0.9
    },
    {
        "step_id": 2,
        "tool": "open",
        "args": {"url": "https://www.flipkart.com"},
        "reason": "Open e-commerce site",
        "confidence": 0.8
    }
]

# Execute the plan
result = execute_plan(plan, session_id="demo123")
print(f"Status: {result.status}")
print(f"Steps completed: {len([s for s in result.steps if s.status == 'ok'])}")
```

### 3. Run Demo

```bash
python brain/orchestrator/demo_orchestrate.py
```

## Configuration

Configure via environment variables:

```bash
# Runner selection
export LANGCHAIN_ENABLED=false        # Use custom runner (default)
export LANGCHAIN_ENABLED=true         # Use LangChain agent

# Execution settings
export ORCHESTRATOR_MAX_RETRIES=3     # Max retries per step
export ORCHESTRATOR_STEP_TIMEOUT=60   # Step timeout in seconds
export ORCHESTRATOR_OUTPUT_DIR="./orchestrator_runs"  # Results directory
export ORCHESTRATOR_DEBUG=true        # Enable debug logging

# Tool permissions
export ALLOW_PLAYWRIGHT=true          # Allow screenshot tool
export ALLOW_NETWORK=true             # Allow network requests
```

## Available Tools

### search(query: str, max_results: int = 10)
Search for information online using DuckDuckGo API.

**Example:**
```json
{
  "tool": "search",
  "args": {"query": "python programming tutorial", "max_results": 5}
}
```

### open(url: str, timeout: int = 30)
Fetch HTML content from a URL.

**Example:**
```json
{
  "tool": "open", 
  "args": {"url": "https://example.com", "timeout": 30}
}
```

### extract(selector: str, html: str = None, url: str = None)
Extract data from HTML using CSS selectors.

**Example:**
```json
{
  "tool": "extract",
  "args": {"selector": ".product-name", "url": "https://shop.com/products"}
}
```

### screenshot(url: str, path: str = None, full_page: bool = True)
Take a screenshot of a webpage (requires Playwright).

**Example:**
```json
{
  "tool": "screenshot",
  "args": {"url": "https://example.com", "full_page": true}
}
```

### download(url: str, filename: str, chunk_size: int = 8192)
Download a file from a URL.

**Example:**
```json
{
  "tool": "download",
  "args": {"url": "https://example.com/file.pdf", "filename": "document.pdf"}
}
```

## Plan Schema

Each plan step must include:

```json
{
  "step_id": 1,                    // Sequential step number
  "tool": "search",                // Tool name
  "args": {"query": "..."},        // Tool arguments
  "reason": "Search for info",     // Step explanation (optional)
  "confidence": 0.9,               // Confidence score 0-1 (optional)
  "retry": 2,                      // Retry attempts (optional)
  "requires_human": false          // Human intervention flag (optional)
}
```

## Advanced Usage

### Custom Progress Tracking

```python
from brain.orchestrator.executor import execute_plan, ProgressTracker

def custom_callback(step_id: int, status: str, output: Any):
    print(f"Step {step_id}: {status}")
    if status == "error":
        print(f"Error: {output}")

# Built-in progress tracker
tracker = ProgressTracker("my_task")
result = execute_plan(plan, on_update=tracker)

# Custom callback
result = execute_plan(plan, on_update=custom_callback)
```

### Loading and Saving Results

```python
from brain.orchestrator.executor import save_execution_result, load_execution_result

# Results are auto-saved by default
result = execute_plan(plan)

# Manual save
filepath = save_execution_result(result)

# Load saved result
loaded_result = load_execution_result(filepath)
```

### Error Handling and Retries

```python
# Plan with retry logic
plan = [
    {
        "step_id": 1,
        "tool": "open",
        "args": {"url": "https://unreliable-site.com"},
        "retry": 3,                    # Retry up to 3 times
        "requires_human": True         # Pause if all retries fail
    }
]

result = execute_plan(plan)
if result.status == "paused":
    print("Human intervention required")
```

## LangChain Integration

When `LANGCHAIN_ENABLED=true`, the orchestrator uses LangChain agents:

```python
# Requires: pip install langchain
# Will automatically use brain adapter for local LLM
# Falls back to custom runner if LangChain unavailable

import os
os.environ["LANGCHAIN_ENABLED"] = "true"

result = execute_plan(plan)  # Uses LangChain agent
```

## Custom Tools

Extend the tool registry with custom functions:

```python
from brain.orchestrator.tools import tool_registry

def my_custom_tool(param1: str, param2: int = 5) -> dict:
    """My custom tool implementation."""
    return {"result": f"Processed {param1} with {param2}"}

# Register the tool
tool_registry.register("my_tool", my_custom_tool, "Custom processing tool")

# Use in plans
plan = [
    {
        "step_id": 1,
        "tool": "my_tool",
        "args": {"param1": "test", "param2": 10}
    }
]
```

## Result Schema

Execution results include detailed information:

```python
result = execute_plan(plan)

# Overall result
print(result.task_id)        # Unique task identifier
print(result.status)         # "ok", "error", "paused", "running"
print(result.created_at)     # Start timestamp
print(result.finished_at)    # End timestamp

# Step results
for step in result.steps:
    print(f"Step {step.step_id}: {step.status}")
    print(f"Output: {step.output}")
    print(f"Duration: {step.finished_at - step.started_at}")
    
# Utility methods
outputs = result.get_step_outputs()  # {step_id: output}
final = result.get_final_output()    # Last successful output
dict_result = result.to_dict()       # JSON-serializable dict
```

## Integration with Planner

The orchestrator works seamlessly with the NexusAI planner:

```python
from brain.planner import plan_instruction
from brain.orchestrator.executor import execute_plan

# Generate plan from natural language
instruction = "Find the best gaming laptops under 60k on Amazon"
plan = plan_instruction(instruction)

# Execute the generated plan
result = execute_plan(plan.steps, session_id="user_123")
```

## Testing

Run the included tests:

```bash
python brain/orchestrator/tests/test_orchestrator.py
```

## Troubleshooting

### "Tool not found" errors
- Check tool name spelling in plan steps
- Use `from brain.orchestrator.tools import list_available_tools; print(list_available_tools())`

### Screenshot tool fails
- Install Playwright: `pip install playwright`
- Run: `playwright install chromium`
- Or set `ALLOW_PLAYWRIGHT=false` to simulate screenshots

### LangChain errors
- Install LangChain: `pip install langchain`
- Ensure brain adapter is properly configured
- Check logs for specific error messages

### Network timeouts
- Increase `ORCHESTRATOR_STEP_TIMEOUT`
- Check network connectivity
- Some tools have built-in retry logic

### Memory issues with large results
- Limit result sizes in tool implementations
- Use `save_results=False` in execute_plan for testing
- Process results in smaller batches

## Performance Tips

1. **Use Custom Runner** - Faster than LangChain for simple plans
2. **Set Appropriate Timeouts** - Balance speed vs reliability
3. **Enable Parallelization** - Future enhancement for concurrent steps
4. **Monitor Tool Performance** - Check step execution times
5. **Optimize Tool Implementations** - Cache results where possible

## File Structure

```
brain/orchestrator/
├── __init__.py              # Package exports
├── config.py               # Configuration management
├── schema.py               # Pydantic models
├── tools.py                # Tool implementations
├── custom_runner.py        # Custom orchestrator
├── langchain_runner.py     # LangChain integration
├── executor.py             # Main API interface
├── prompts.py              # Prompt templates
├── demo_orchestrate.py     # Demo and testing
├── tests/
│   └── test_orchestrator.py
└── README.md               # This file
```

## Dependencies

**Required:**
- `pydantic>=2.0.0` - Data validation
- `requests>=2.28.0` - HTTP client
- `beautifulsoup4>=4.11.0` - HTML parsing

**Optional:**
- `playwright>=1.30.0` - Screenshot tool
- `langchain>=0.1.0` - Agent framework
- `llama-cpp-python` - Local LLM (via brain adapter)

This orchestrator provides a robust foundation for executing AI-generated plans with comprehensive error handling, progress tracking, and extensibility.