# NexusAI Brain Module

A modular AI planning system that converts natural language instructions into structured JSON action plans using local LLMs.

## 🧠 Features

- **Multiple LLM Backends**: Supports Ollama and llama-cpp-python with automatic fallback
- **Strict JSON Output**: Validates and ensures well-formed action plans
- **Input Sanitization**: Removes PII and unsafe content from user input
- **Robust Error Handling**: Retries failed generations with improved prompts
- **Modular Design**: Easy to extend with new LLM adapters or tools

## 📁 Project Structure

```
brain/
├── __init__.py          # Package exports
├── adapter.py           # LLM adapters (Ollama, llama-cpp-python)
├── planner.py          # Main planning logic
├── schema.py           # Pydantic models for validation
├── utils.py            # Helper functions (sanitization, JSON parsing)
├── demo_run.py         # CLI demo runner
├── tests/
│   ├── __init__.py
│   └── test_demo.py    # Integration tests
└── README.md           # This file
```

## 🚀 Quick Start

### 1. Install Dependencies

```bash
pip install -r requirements.txt
```

### 2. Set Up LLM Backend

**Option A: Ollama (Recommended)**
```bash
# Install Ollama: https://ollama.ai/
ollama serve
ollama pull llama2
```

**Option B: llama-cpp-python**
```bash
# Download a GGUF model file
export LLAMACPP_MODEL_PATH="/path/to/your/model.gguf"
```

### 3. Run Demo

```bash
python brain/demo_run.py "Find laptops under 50000 INR and return top 5 links"
```

## 📋 Supported Tools

The planner can generate steps using these tools:

- **search**: Search for information (`{"query": "search terms"}`)
- **open**: Open a specific URL (`{"url": "https://example.com"}`)
- **extract**: Extract data from page (`{"selector": "CSS selector"}`)
- **screenshot**: Take page screenshot (`{"full_page": true}`)
- **download**: Download files (`{"url": "file_url", "filename": "name.ext"}`)

## 🔧 Configuration

Set these environment variables:

```bash
# Ollama settings
OLLAMA_URL=http://localhost:11434    # Ollama server URL
OLLAMA_MODEL=llama2                  # Model name
OLLAMA_TIMEOUT=30                    # Request timeout (seconds)

# llama-cpp-python settings  
LLAMACPP_MODEL_PATH=/path/to/model.gguf  # Model file path
LLAMACPP_N_CTX=2048                     # Context window size
LLAMACPP_N_GPU_LAYERS=0                 # GPU layers for acceleration

# General settings
PREFERRED_ADAPTER=ollama             # 'ollama' or 'llamacpp'
MAX_RETRIES=2                       # Retry attempts for failed generations
TEMPERATURE=0.1                     # LLM sampling temperature
```

## 💻 Usage Examples

### Basic Usage

```python
from brain import plan_instruction

# Generate a plan
plan = plan_instruction("Search for gaming laptops under 60k on Flipkart")

# Access steps
for step in plan.steps:
    print(f"Step {step.step_id}: {step.tool}")
    print(f"  Args: {step.args}")
    print(f"  Reason: {step.reason}")
    print(f"  Confidence: {step.confidence}")
```

### Advanced Usage

```python
from brain.planner import InstructionPlanner
from brain.adapter import OllamaAdapter

# Use specific adapter
adapter = OllamaAdapter()
planner = InstructionPlanner(adapter=adapter)

# Generate plan
plan = planner.plan_instruction("Download product catalogs from tech websites")

# Convert to dict for JSON serialization
plan_dict = plan.to_dict()
```

### CLI Demo Examples

```bash
# E-commerce search
python brain/demo_run.py "Find wireless earbuds under 5000 on Amazon"

# Multi-step automation  
python brain/demo_run.py "Search for gaming mice, compare prices, and screenshot the top results"

# File operations
python brain/demo_run.py "Download product specs from electronics websites"
```

## 🧪 Testing

Run the integration tests:

```bash
python brain/tests/test_demo.py
```

## 🔒 Security Features

- **Input Sanitization**: Removes emails, phone numbers, and sensitive data
- **Length Limits**: Prevents excessively long inputs
- **Type Validation**: Ensures all data conforms to expected schemas
- **Safe JSON Parsing**: Robust parsing with fallback strategies

## 🛠️ Extending the Module

### Adding New LLM Adapters

```python
from brain.adapter import LLMAdapter

class CustomAdapter(LLMAdapter):
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        # Your implementation here
        pass
    
    def is_available(self) -> bool:
        # Check if your backend is available
        pass
```

### Adding New Tools

Update `brain/schema.py` to add new tool types:

```python
tool: Literal["search", "open", "extract", "screenshot", "download", "your_new_tool"]
```

## 📝 Output Format

Generated plans follow this JSON schema:

```json
[
  {
    "step_id": 1,
    "tool": "search",
    "args": {"query": "laptops under 50k"},
    "reason": "Search for laptops in the specified budget range",
    "confidence": 0.9
  },
  {
    "step_id": 2, 
    "tool": "open",
    "args": {"url": "https://flipkart.com"},
    "reason": "Visit major e-commerce site for laptop listings",
    "confidence": 0.8
  }
]
```

## ⚠️ Troubleshooting

**"No LLM adapters available"**
- Install and start Ollama: `ollama serve`
- Or set `LLAMACPP_MODEL_PATH` to a valid model file

**"Ollama server not available"**  
- Start Ollama server: `ollama serve`
- Pull a model: `ollama pull llama2`

**"Invalid JSON response"**
- Try a different model (some models generate better JSON)
- Increase `MAX_RETRIES` for more attempts
- Lower `TEMPERATURE` for more consistent output

**Timeout errors**
- Increase `OLLAMA_TIMEOUT`
- Use a smaller/faster model
- Check your system resources

## 📄 License

This module is part of the NexusAI project by CodeCatalysts team.