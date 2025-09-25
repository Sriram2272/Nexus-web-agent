"""
Tests for NexusAI Local AI Model Adapter.
"""

import os
import unittest
from unittest.mock import patch, MagicMock

from brain.adapter import generate, available_adapters, healthcheck
from brain.adapter.adapter_manager import AdapterManager
from brain.adapter.ollama_adapter import OllamaAdapter
from brain.adapter.llama_cpp_adapter import LlamaCppAdapter


class TestAdapterManager(unittest.TestCase):
    """Test cases for AdapterManager functionality."""
    
    def setUp(self):
        """Set up test environment."""
        self.manager = AdapterManager()
    
    def test_available_adapters_returns_list(self):
        """Test that available_adapters returns a list."""
        adapters = available_adapters()
        self.assertIsInstance(adapters, list)
    
    def test_healthcheck_returns_dict(self):
        """Test that healthcheck returns a dictionary with expected structure."""
        status = healthcheck()
        self.assertIsInstance(status, dict)
        self.assertIn("adapters", status)
        self.assertIn("summary", status)
        self.assertIn("timestamp", status)
    
    def test_generate_validates_empty_prompt(self):
        """Test that generate raises ValueError for empty prompt."""
        with self.assertRaises(ValueError):
            generate("")
        
        with self.assertRaises(ValueError):
            generate("   ")
    
    @patch('brain.adapter.ollama_adapter.requests.get')
    def test_ollama_availability_check(self, mock_get):
        """Test Ollama availability checking."""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_get.return_value = mock_response
        
        adapter = OllamaAdapter()
        self.assertTrue(adapter.is_available())
        
        # Mock failed response
        mock_get.side_effect = Exception("Connection failed")
        self.assertFalse(adapter.is_available())
    
    def test_llama_cpp_availability_without_package(self):
        """Test llama-cpp availability when package is not installed."""
        with patch.dict(os.environ, {"LLAMA_CPP_MODEL_PATH": "/fake/path"}):
            with patch('brain.adapter.llama_cpp_adapter.LlamaCppAdapter._ensure_llama_cpp_available') as mock_import:
                mock_import.side_effect = ImportError("Package not found")
                
                adapter = LlamaCppAdapter()
                self.assertFalse(adapter.is_available())
    
    def test_no_adapters_available_error(self):
        """Test that appropriate error is raised when no adapters are available."""
        with patch.object(self.manager.ollama_adapter, 'is_available', return_value=False):
            with patch.object(self.manager.llama_cpp_adapter, 'is_available', return_value=False):
                with patch.dict(os.environ, {"OLLAMA_ENABLED": "false"}):
                    
                    with self.assertRaises(RuntimeError) as context:
                        self.manager.generate("test prompt")
                    
                    error_message = str(context.exception)
                    self.assertIn("No LLM adapters available", error_message)
    
    @patch('brain.adapter.ollama_adapter.requests.post')
    def test_ollama_generate_success(self, mock_post):
        """Test successful Ollama generation."""
        # Mock successful Ollama response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"response": "Generated text"}
        mock_post.return_value = mock_response
        
        with patch.object(OllamaAdapter, 'is_available', return_value=True):
            adapter = OllamaAdapter()
            result = adapter.generate("test prompt", max_tokens=100)
            self.assertEqual(result, "Generated text")
    
    @patch('brain.adapter.ollama_adapter.requests.post')
    def test_ollama_generate_retry_on_failure(self, mock_post):
        """Test Ollama retry logic on connection failure."""
        # Mock connection error
        mock_post.side_effect = [Exception("Connection failed"), Exception("Still failing")]
        
        with patch.object(OllamaAdapter, 'is_available', return_value=True):
            adapter = OllamaAdapter()
            
            with self.assertRaises(Exception):
                adapter.generate("test prompt")
            
            # Should have tried multiple times
            self.assertGreater(mock_post.call_count, 1)


class TestConfigurationLoading(unittest.TestCase):
    """Test configuration loading and environment variables."""
    
    def test_default_config_values(self):
        """Test that default configuration values are loaded correctly."""
        from brain.adapter.config import load_config
        
        with patch.dict(os.environ, {}, clear=True):
            config = load_config()
            
            self.assertEqual(config["ollama_url"], "http://localhost:11434")
            self.assertEqual(config["ollama_enabled"], True)
            self.assertEqual(config["adapter_timeout"], 30)
            self.assertEqual(config["preferred_adapter"], "ollama")
    
    def test_custom_config_values(self):
        """Test that custom environment variables override defaults."""
        from brain.adapter.config import load_config
        
        custom_env = {
            "OLLAMA_URL": "http://custom:8080",
            "OLLAMA_ENABLED": "false",
            "ADAPTER_TIMEOUT": "60",
            "PREFERRED_ADAPTER": "llamacpp"
        }
        
        with patch.dict(os.environ, custom_env):
            config = load_config()
            
            self.assertEqual(config["ollama_url"], "http://custom:8080")
            self.assertEqual(config["ollama_enabled"], False)
            self.assertEqual(config["adapter_timeout"], 60)
            self.assertEqual(config["preferred_adapter"], "llamacpp")


if __name__ == "__main__":
    # Set up basic logging for tests
    import logging
    logging.basicConfig(level=logging.INFO)
    
    # Run tests
    unittest.main(verbosity=2)