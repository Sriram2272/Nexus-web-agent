"""
Ollama adapter for NexusAI local LLM integration.
"""

import json
import logging
import time
from typing import Dict, Any

import requests
from requests.exceptions import RequestException, Timeout, ConnectionError

from .config import get_ollama_config

logger = logging.getLogger(__name__)


class OllamaAdapter:
    """Adapter for communicating with Ollama API."""
    
    def __init__(self):
        self.config = get_ollama_config()
        self.base_url = self.config["url"]
        self.model = self.config["model"]
        self.timeout = self.config["timeout"]
        self.max_retries = self.config["max_retries"]
    
    def is_available(self) -> bool:
        """
        Check if Ollama server is available.
        
        Returns:
            bool: True if server is reachable, False otherwise
        """
        try:
            response = requests.get(
                f"{self.base_url}/api/tags",
                timeout=5
            )
            return response.status_code == 200
        except Exception as e:
            logger.debug(f"Ollama availability check failed: {e}")
            return False
    
    def generate(self, prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
        """
        Generate text using Ollama API.
        
        Args:
            prompt: The input prompt
            max_tokens: Maximum tokens to generate
            temperature: Sampling temperature
            
        Returns:
            str: Generated text response
            
        Raises:
            ConnectionError: If Ollama server is not reachable
            RequestException: If API request fails
            ValueError: If response is invalid
        """
        if not self.config["enabled"]:
            raise ConnectionError("Ollama adapter is disabled")
        
        payload = {
            "model": self.model,
            "prompt": prompt,
            "stream": False,
            "options": {
                "num_predict": max_tokens,
                "temperature": temperature,
            }
        }
        
        last_exception = None
        
        for attempt in range(self.max_retries + 1):
            try:
                logger.info(f"Ollama generation attempt {attempt + 1}/{self.max_retries + 1}")
                
                response = requests.post(
                    f"{self.base_url}/api/generate",
                    json=payload,
                    timeout=self.timeout
                )
                
                if response.status_code == 200:
                    result = response.json()
                    
                    if "response" not in result:
                        raise ValueError(f"Invalid Ollama response format: {result}")
                    
                    generated_text = result["response"]
                    logger.info(f"Ollama generated {len(generated_text)} characters")
                    return generated_text
                    
                elif response.status_code == 404:
                    raise ValueError(f"Model '{self.model}' not found in Ollama. Available models: {self._get_available_models()}")
                    
                else:
                    error_msg = f"Ollama API error {response.status_code}: {response.text}"
                    logger.error(error_msg)
                    raise RequestException(error_msg)
                    
            except (ConnectionError, Timeout) as e:
                last_exception = e
                if attempt < self.max_retries:
                    wait_time = 2 ** attempt
                    logger.warning(f"Ollama connection failed (attempt {attempt + 1}), retrying in {wait_time}s: {e}")
                    time.sleep(wait_time)
                else:
                    logger.error(f"Ollama connection failed after {self.max_retries + 1} attempts")
            
            except Exception as e:
                logger.error(f"Unexpected Ollama error: {e}")
                raise
        
        # If we get here, all retries failed
        raise ConnectionError(f"Ollama server not reachable after {self.max_retries + 1} attempts. Last error: {last_exception}")
    
    def _get_available_models(self) -> list:
        """Get list of available models from Ollama."""
        try:
            response = requests.get(f"{self.base_url}/api/tags", timeout=5)
            if response.status_code == 200:
                return [model["name"] for model in response.json().get("models", [])]
            return []
        except:
            return []


def generate_ollama(prompt: str, max_tokens: int = 1024, temperature: float = 0.0) -> str:
    """
    Convenience function for generating text with Ollama.
    
    Args:
        prompt: The input prompt
        max_tokens: Maximum tokens to generate  
        temperature: Sampling temperature
        
    Returns:
        str: Generated text
    """
    adapter = OllamaAdapter()
    return adapter.generate(prompt, max_tokens, temperature)