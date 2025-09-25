"""
llama-cpp-python adapter for NexusAI local LLM integration.
"""

import logging
from typing import Optional

from .config import get_llama_cpp_config

logger = logging.getLogger(__name__)


class LlamaCppAdapter:
    """Adapter for llama-cpp-python local inference."""
    
    def __init__(self):
        self.config = get_llama_cpp_config()
        self.model_path = self.config["model_path"]
        self.n_ctx = self.config["n_ctx"]
        self.n_gpu_layers = self.config["n_gpu_layers"]
        self._llm = None
    
    def _ensure_llama_cpp_available(self):
        """Check if llama-cpp-python package is available."""
        try:
            import llama_cpp
            return llama_cpp
        except ImportError:
            raise ImportError(
                "llama-cpp-python package not installed. "
                "Install it with: pip install llama-cpp-python"
            )
    
    def _load_model(self):
        """Load the llama-cpp model if not already loaded."""
        if self._llm is not None:
            return self._llm
        
        if not self.model_path:
            raise ValueError(
                "LLAMA_CPP_MODEL_PATH environment variable not set. "
                "Please specify the path to your GGUF model file."
            )
        
        llama_cpp = self._ensure_llama_cpp_available()
        
        try:
            logger.info(f"Loading llama-cpp model from: {self.model_path}")
            self._llm = llama_cpp.Llama(
                model_path=self.model_path,
                n_ctx=self.n_ctx,
                n_gpu_layers=self.n_gpu_layers,
                verbose=False
            )
            logger.info("llama-cpp model loaded successfully")
            return self._llm
            
        except Exception as e:
            error_msg = f"Failed to load llama-cpp model from {self.model_path}: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    def is_available(self) -> bool:
        """
        Check if llama-cpp adapter is available.
        
        Returns:
            bool: True if adapter can be used, False otherwise
        """
        try:
            self._ensure_llama_cpp_available()
            return bool(self.model_path)
        except (ImportError, ValueError):
            return False
    
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        """
        Generate text using llama-cpp-python.
        
        Args:
            prompt: The input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            str: Generated text response
            
        Raises:
            ImportError: If llama-cpp-python is not installed
            ValueError: If model path is not configured
            RuntimeError: If model loading fails
        """
        llm = self._load_model()
        
        try:
            logger.info(f"Generating with llama-cpp (max_tokens={max_tokens}, temp={temperature})")
            
            # Generate response
            response = llm(
                prompt,
                max_tokens=max_tokens,
                temperature=temperature,
                stop=["</s>", "\n\n", "Human:", "Assistant:"],
                echo=False
            )
            
            generated_text = response["choices"][0]["text"]
            logger.info(f"llama-cpp generated {len(generated_text)} characters")
            
            return generated_text.strip()
            
        except Exception as e:
            error_msg = f"llama-cpp generation failed: {e}"
            logger.error(error_msg)
            raise RuntimeError(error_msg)
    
    def unload_model(self):
        """Unload the model to free memory."""
        if self._llm is not None:
            logger.info("Unloading llama-cpp model")
            del self._llm
            self._llm = None


def generate_llama_cpp(prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
    """
    Convenience function for generating text with llama-cpp-python.
    
    Args:
        prompt: The input prompt
        max_tokens: Maximum tokens to generate
        temperature: Sampling temperature
        
    Returns:
        str: Generated text
    """
    adapter = LlamaCppAdapter()
    return adapter.generate(prompt, max_tokens, temperature)