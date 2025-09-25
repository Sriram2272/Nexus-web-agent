"""
Configuration management for NexusAI adapters.
"""

import os
from typing import Dict, Any


def load_config() -> Dict[str, Any]:
    """
    Load configuration from environment variables with sensible defaults.
    
    Returns:
        Dict containing configuration values
    """
    return {
        "ollama_url": os.getenv("OLLAMA_URL", "http://localhost:11434"),
        "ollama_enabled": os.getenv("OLLAMA_ENABLED", "true").lower() == "true",
        "ollama_model": os.getenv("OLLAMA_MODEL", "llama2"),
        "llama_cpp_model_path": os.getenv("LLAMA_CPP_MODEL_PATH"),
        "adapter_timeout": int(os.getenv("ADAPTER_TIMEOUT", "30")),
        "max_retries": int(os.getenv("MAX_RETRIES", "2")),
        "temperature": float(os.getenv("TEMPERATURE", "0.1")),
        "preferred_adapter": os.getenv("PREFERRED_ADAPTER", "ollama").lower(),
    }


def get_ollama_config() -> Dict[str, Any]:
    """Get Ollama-specific configuration."""
    config = load_config()
    return {
        "url": config["ollama_url"],
        "model": config["ollama_model"],
        "timeout": config["adapter_timeout"],
        "enabled": config["ollama_enabled"],
        "max_retries": config["max_retries"],
    }


def get_llama_cpp_config() -> Dict[str, Any]:
    """Get llama-cpp-python specific configuration."""
    config = load_config()
    return {
        "model_path": config["llama_cpp_model_path"],
        "timeout": config["adapter_timeout"],
        "n_ctx": int(os.getenv("LLAMACPP_N_CTX", "2048")),
        "n_gpu_layers": int(os.getenv("LLAMACPP_N_GPU_LAYERS", "0")),
    }