"""
Adapter manager for NexusAI - handles fallback between different LLM adapters.
"""

import logging
from typing import List, Dict, Any

from .config import load_config
from .ollama_adapter import OllamaAdapter
from .llama_cpp_adapter import LlamaCppAdapter

logger = logging.getLogger(__name__)


class AdapterManager:
    """Manages multiple LLM adapters with automatic fallback."""
    
    def __init__(self):
        self.config = load_config()
        self.ollama_adapter = OllamaAdapter()
        self.llama_cpp_adapter = LlamaCppAdapter()
    
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        """
        Generate text using available adapters with automatic fallback.
        
        Args:
            prompt: The input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            str: Generated text response
            
        Raises:
            RuntimeError: If no adapters are available or all fail
        """
        if not prompt or not prompt.strip():
            raise ValueError("Prompt cannot be empty")
        
        errors = []
        
        # Try Ollama first if enabled and preferred
        if (self.config["ollama_enabled"] and 
            self.config["preferred_adapter"] == "ollama"):
            try:
                logger.info("Attempting generation with Ollama adapter")
                result = self.ollama_adapter.generate(prompt, max_tokens, temperature)
                logger.info("Successfully generated text using Ollama")
                return result
            except Exception as e:
                error_msg = f"Ollama adapter failed: {e}"
                logger.warning(error_msg)
                errors.append(error_msg)
        
        # Try llama-cpp as fallback
        if self.llama_cpp_adapter.is_available():
            try:
                logger.info("Attempting generation with llama-cpp adapter")
                result = self.llama_cpp_adapter.generate(prompt, max_tokens, temperature)
                logger.info("Successfully generated text using llama-cpp")
                return result
            except Exception as e:
                error_msg = f"llama-cpp adapter failed: {e}"
                logger.warning(error_msg)
                errors.append(error_msg)
        
        # Try Ollama as final fallback if not already tried
        if (self.config["ollama_enabled"] and 
            self.config["preferred_adapter"] != "ollama"):
            try:
                logger.info("Attempting generation with Ollama adapter (fallback)")
                result = self.ollama_adapter.generate(prompt, max_tokens, temperature)
                logger.info("Successfully generated text using Ollama (fallback)")
                return result
            except Exception as e:
                error_msg = f"Ollama adapter failed: {e}"
                logger.warning(error_msg)
                errors.append(error_msg)
        
        # If we get here, all adapters failed
        error_summary = "; ".join(errors)
        raise RuntimeError(
            f"No LLM adapters available or all failed. Errors: {error_summary}. "
            f"Please check your configuration and ensure either Ollama is running "
            f"or llama-cpp model is properly configured."
        )
    
    def available_adapters(self) -> List[str]:
        """
        Get list of available adapters.
        
        Returns:
            List[str]: Names of available adapters
        """
        adapters = []
        
        if self.config["ollama_enabled"] and self.ollama_adapter.is_available():
            adapters.append("ollama")
        
        if self.llama_cpp_adapter.is_available():
            adapters.append("llama-cpp")
        
        return adapters
    
    def healthcheck(self) -> Dict[str, Any]:
        """
        Perform health check on all adapters.
        
        Returns:
            Dict containing status of each adapter
        """
        status = {
            "timestamp": str(logging.Formatter().formatTime(logging.LogRecord(
                name="", level=0, pathname="", lineno=0, msg="", args=(), exc_info=None
            ))),
            "adapters": {}
        }
        
        # Check Ollama
        ollama_available = self.ollama_adapter.is_available()
        status["adapters"]["ollama"] = {
            "available": ollama_available,
            "enabled": self.config["ollama_enabled"],
            "url": self.config["ollama_url"],
            "model": self.ollama_adapter.model
        }
        
        # Check llama-cpp
        llama_cpp_available = self.llama_cpp_adapter.is_available()
        status["adapters"]["llama-cpp"] = {
            "available": llama_cpp_available,
            "model_path": self.config["llama_cpp_model_path"],
            "configured": bool(self.config["llama_cpp_model_path"])
        }
        
        status["summary"] = {
            "total_available": len(self.available_adapters()),
            "preferred_adapter": self.config["preferred_adapter"]
        }
        
        return status


# Global adapter manager instance
_adapter_manager = None


def get_adapter() -> AdapterManager:
    """Get the global adapter manager instance."""
    global _adapter_manager
    if _adapter_manager is None:
        _adapter_manager = AdapterManager()
    return _adapter_manager


def generate(prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
    """
    Generate text using the best available adapter.
    
    Args:
        prompt: The input prompt
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature
        
    Returns:
        str: Generated text response
    """
    return get_adapter().generate(prompt, max_tokens, temperature)


def available_adapters() -> List[str]:
    """Get list of available adapters."""
    return get_adapter().available_adapters()


def healthcheck() -> Dict[str, Any]:
    """Perform health check on all adapters."""
    return get_adapter().healthcheck()