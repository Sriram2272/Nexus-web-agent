# NexusAI Local AI Model Adapter

A unified adapter system for local LLM inference with automatic fallback between Ollama and llama-cpp-python.

## Features

- **Multiple Backends**: Supports Ollama HTTP API and llama-cpp-python
- **Automatic Fallback**: Tries Ollama first, falls back to llama-cpp if unavailable
- **Robust Error Handling**: Clear error messages and retry logic
- **Health Monitoring**: Built-in health checks and adapter status
- **Easy Configuration**: Environment variable based configuration

## Quick Start

### 1. Install Dependencies

```bash
# Core dependencies
pip install requests pydantic

# For llama-cpp-python support (optional)
pip install llama-cpp-python
```

### 2. Configure Adapters

**Option A: Ollama (Recommended)**
```bash
# Start Ollama server
ollama serve

# Pull a model
ollama pull llama2

# Set environment variables (optional, these are defaults)
export OLLAMA_URL="http://localhost:11434"
export OLLAMA_MODEL="llama2"
export OLLAMA_ENABLED="true"
```

**Option B: llama-cpp-python**
```bash
# Download a GGUF model file
export LLAMA_CPP_MODEL_PATH="/path/to/your/model.gguf"

# Optional GPU acceleration
export LLAMACPP_N_GPU_LAYERS=32
```

### 3. Basic Usage

```python
from brain.adapter import generate, available_adapters, healthcheck

# Check what's available
print("Available adapters:", available_adapters())

# Generate text
response = generate(
    prompt="Write a brief plan for organizing a workshop",
    max_tokens=512,
    temperature=0.7
)
print(response)

# Health check
status = healthcheck()
print("Adapter status:", status)
```

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `OLLAMA_URL` | `http://localhost:11434` | Ollama server URL |
| `OLLAMA_MODEL` | `llama2` | Model name to use with Ollama |
| `OLLAMA_ENABLED` | `true` | Enable/disable Ollama adapter |
| `LLAMA_CPP_MODEL_PATH` | None | Path to GGUF model file |
| `ADAPTER_TIMEOUT` | `30` | Request timeout in seconds |
| `MAX_RETRIES` | `2` | Number of retry attempts |
| `TEMPERATURE` | `0.1` | Default sampling temperature |
| `PREFERRED_ADAPTER` | `ollama` | Preferred adapter (`ollama` or `llamacpp`) |
| `LLAMACPP_N_CTX` | `2048` | Context window size for llama-cpp |
| `LLAMACPP_N_GPU_LAYERS` | `0` | Number of layers to run on GPU |

## API Reference

### `generate(prompt, max_tokens=1024, temperature=0.0)`

Generate text using the best available adapter.

**Parameters:**
- `prompt` (str): Input text prompt
- `max_tokens` (int): Maximum tokens to generate
- `temperature` (float): Sampling temperature (0.0 = deterministic)

**Returns:**
- `str`: Generated text response

**Raises:**
- `RuntimeError`: If no adapters are available
- `ValueError`: If prompt is empty

### `available_adapters()`

Get list of currently available adapters.

**Returns:**
- `List[str]`: Names of available adapters (`['ollama', 'llama-cpp']`)

### `healthcheck()`

Perform comprehensive health check on all adapters.

**Returns:**
- `Dict`: Status information for all adapters

## Advanced Usage

### Direct Adapter Access

```python
from brain.adapter.ollama_adapter import OllamaAdapter
from brain.adapter.llama_cpp_adapter import LlamaCppAdapter

# Use specific adapter
ollama = OllamaAdapter()
if ollama.is_available():
    response = ollama.generate("Hello world", max_tokens=100)

# Check adapter health
llama_cpp = LlamaCppAdapter()
print("llama-cpp available:", llama_cpp.is_available())
```

### Custom Configuration

```python
from brain.adapter.adapter_manager import AdapterManager

# Create custom manager
manager = AdapterManager()

# Generate with custom parameters
response = manager.generate(
    prompt="Analyze this data",
    max_tokens=2048,
    temperature=0.8
)
```

## Troubleshooting

### "No LLM adapters available"
- **Ollama**: Start server with `ollama serve` and pull a model
- **llama-cpp**: Set `LLAMA_CPP_MODEL_PATH` to a valid GGUF file

### "Ollama server not available"
- Check if Ollama is running: `curl http://localhost:11434/api/tags`
- Verify the URL in `OLLAMA_URL` environment variable
- Try a different port if 11434 is occupied

### "Model not found"
- List available models: `ollama list`
- Pull the model: `ollama pull llama2`
- Check model name in `OLLAMA_MODEL` environment variable

### "llama-cpp model loading failed"
- Verify the model file exists and is readable
- Check if it's a valid GGUF format
- Ensure sufficient RAM/VRAM for the model

### Timeout Errors
- Increase `ADAPTER_TIMEOUT` for larger prompts
- Use a smaller model for faster inference
- Check system resources (CPU/RAM/GPU)

## Model Recommendations

### Ollama Models
```bash
# Fast and efficient
ollama pull llama2:7b

# Better quality
ollama pull llama2:13b

# Code generation
ollama pull codellama:7b
```

### GGUF Models
- Download from [Hugging Face](https://huggingface.co/models?filter=gguf)
- Recommended: `llama-2-7b-chat.Q4_K_M.gguf` for good speed/quality balance

## Integration with NexusAI

This adapter is designed to work seamlessly with the NexusAI planner:

```python
from brain.adapter import generate

# The planner will call this function
def plan_with_llm(instruction: str) -> str:
    prompt = f"Convert this instruction to JSON plan: {instruction}"
    return generate(prompt, max_tokens=1024, temperature=0.1)
```

## Performance Tips

1. **Use Ollama for production** - Better performance and resource management
2. **Adjust context window** - Set `LLAMACPP_N_CTX` based on prompt length
3. **Enable GPU acceleration** - Set `LLAMACPP_N_GPU_LAYERS` for faster inference
4. **Monitor temperature** - Lower values (0.1-0.3) for consistent JSON output
5. **Set appropriate timeouts** - Balance between responsiveness and generation quality