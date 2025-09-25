"""
LLM adapter implementations for different local model backends.
"""

import requests
import time
from abc import ABC, abstractmethod
from typing import Optional, Dict, Any
from .utils import load_config, retry_with_backoff


class LLMAdapter(ABC):
    """Abstract base class for LLM adapters."""
    
    @abstractmethod
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        """
        Generate text using the LLM.
        
        Args:
            prompt: Input prompt for the model
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature (0.0 = deterministic)
            
        Returns:
            Generated text response
            
        Raises:
            Exception: If generation fails
        """
        pass
    
    @abstractmethod
    def is_available(self) -> bool:
        """Check if the LLM backend is available and responsive."""
        pass


class OllamaAdapter(LLMAdapter):
    """Adapter for Ollama local LLM server."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or load_config()
        self.url = self.config['ollama_url']
        self.model = self.config['ollama_model']
        self.timeout = self.config['ollama_timeout']
        
    def is_available(self) -> bool:
        """Check if Ollama server is running and responsive."""
        try:
            response = requests.get(f"{self.url}/api/tags", timeout=5)
            return response.status_code == 200
        except Exception:
            return False
    
    @retry_with_backoff
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        """
        Generate text using Ollama API.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate  
            temperature: Sampling temperature
            
        Returns:
            Generated text
            
        Raises:
            Exception: If Ollama request fails
        """
        if not self.is_available():
            raise ConnectionError(
                f"Ollama server not available at {self.url}. "
                "Please ensure Ollama is running with: ollama serve"
            )
        
        # Prepare request payload
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": max(0.01, temperature),  # Ollama doesn't like 0.0
                "top_p": 0.9,
                "stop": ["</s>", "[INST]", "[/INST]"]
            }
        }
        
        try:
            response = requests.post(
                f"{self.url}/api/generate",
                json=payload,
                timeout=self.timeout
            )
            
            if response.status_code != 200:
                raise Exception(f"Ollama API error {response.status_code}: {response.text}")
            
            result = response.json()
            
            if 'response' not in result:
                raise Exception(f"Invalid Ollama response format: {result}")
            
            generated_text = result['response'].strip()
            
            if not generated_text:
                raise Exception("Ollama returned empty response")
            
            return generated_text
            
        except requests.exceptions.Timeout:
            raise Exception(f"Ollama request timed out after {self.timeout}s")
        except requests.exceptions.ConnectionError:
            raise Exception(f"Could not connect to Ollama server at {self.url}")
        except Exception as e:
            raise Exception(f"Ollama generation failed: {str(e)}")


class LlamaCppAdapter(LLMAdapter):
    """Adapter for llama-cpp-python local inference."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.config = config or load_config()
        self.model_path = self.config['llamacpp_model_path']
        self.n_ctx = self.config['llamacpp_n_ctx']
        self.n_gpu_layers = self.config['llamacpp_n_gpu_layers']
        self._llama = None
        
    def _get_model(self):
        """Lazy load the llama-cpp-python model."""
        if self._llama is None:
            try:
                from llama_cpp import Llama
                
                if not self.model_path:
                    raise ValueError(
                        "LLAMACPP_MODEL_PATH environment variable must be set to model file path"
                    )
                
                self._llama = Llama(
                    model_path=self.model_path,
                    n_ctx=self.n_ctx,
                    n_gpu_layers=self.n_gpu_layers,
                    verbose=False
                )
                
            except ImportError:
                raise ImportError(
                    "llama-cpp-python not installed. Install with: pip install llama-cpp-python"
                )
            except Exception as e:
                raise Exception(f"Failed to load llama-cpp model: {str(e)}")
        
        return self._llama
    
    def is_available(self) -> bool:
        """Check if llama-cpp-python model can be loaded."""
        try:
            model = self._get_model()
            return model is not None
        except Exception:
            return False
    
    @retry_with_backoff
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        """
        Generate text using llama-cpp-python.
        
        Args:
            prompt: Input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            Generated text
            
        Raises:
            Exception: If generation fails
        """
        try:
            model = self._get_model()
            
            # Generate response
            result = model(
                prompt,
                max_tokens=max_tokens,
                temperature=max(0.01, temperature),  # Avoid exactly 0.0
                top_p=0.9,
                echo=False,
                stop=["</s>", "\n\n", "User:", "Assistant:"]
            )
            
            if 'choices' not in result or not result['choices']:
                raise Exception("Invalid llama-cpp response format")
            
            generated_text = result['choices'][0]['text'].strip()
            
            if not generated_text:
                raise Exception("llama-cpp returned empty response")
            
            return generated_text
            
        except Exception as e:
            raise Exception(f"llama-cpp generation failed: {str(e)}")


def get_adapter(preferred: Optional[str] = None) -> LLMAdapter:
    """
    Get the best available LLM adapter based on preference and availability.
    
    Args:
        preferred: Preferred adapter ('ollama' or 'llamacpp')
        
    Returns:
        Available LLM adapter instance
        
    Raises:
        Exception: If no adapters are available
    """
    config = load_config()
    preferred = preferred or config['preferred_adapter']
    
    # Try adapters in order of preference
    adapters_to_try = []
    
    if preferred == 'ollama':
        adapters_to_try = [
            ('Ollama', OllamaAdapter),
            ('llama-cpp-python', LlamaCppAdapter)
        ]
    else:
        adapters_to_try = [
            ('llama-cpp-python', LlamaCppAdapter),
            ('Ollama', OllamaAdapter)
        ]
    
    errors = []
    
    for name, adapter_class in adapters_to_try:
        try:
            adapter = adapter_class(config)
            if adapter.is_available():
                print(f"Using {name} adapter")
                return adapter
            else:
                errors.append(f"{name}: not available")
        except Exception as e:
            errors.append(f"{name}: {str(e)}")
    
    # If we get here, no adapters worked
    error_msg = "No LLM adapters available. Tried:\n" + "\n".join(f"- {err}" for err in errors)
    error_msg += "\n\nSetup instructions:"
    error_msg += "\n- For Ollama: Install Ollama and run 'ollama serve' and 'ollama pull llama2'"
    error_msg += "\n- For llama-cpp-python: Set LLAMACPP_MODEL_PATH to your .gguf model file"
    
    raise Exception(error_msg)