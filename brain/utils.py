"""
Utility functions for text sanitization, JSON parsing, and configuration.
"""

import re
import json
import os
from typing import Dict, Any, Union, Optional


def sanitize(text: str) -> str:
    """
    Remove or replace sensitive information from user input.
    
    Args:
        text: Raw user input text
        
    Returns:
        Sanitized text with PII patterns removed/masked
    """
    if not isinstance(text, str):
        return str(text)
    
    # Email pattern
    email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
    text = re.sub(email_pattern, '[EMAIL]', text)
    
    # Phone number patterns (various formats)
    phone_patterns = [
        r'\b\d{3}[-.]?\d{3}[-.]?\d{4}\b',  # US format
        r'\b\(\d{3}\)\s?\d{3}[-.]?\d{4}\b',  # (123) 456-7890
        r'\b\+\d{1,3}[-.\s]?\d{1,14}\b',  # International
        r'\b\d{10,15}\b'  # Long number sequences
    ]
    
    for pattern in phone_patterns:
        text = re.sub(pattern, '[PHONE]', text)
    
    # Credit card patterns (basic)
    cc_pattern = r'\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b'
    text = re.sub(cc_pattern, '[CARD]', text)
    
    # Social Security Number (US format)
    ssn_pattern = r'\b\d{3}-\d{2}-\d{4}\b'
    text = re.sub(ssn_pattern, '[SSN]', text)
    
    # Remove excessive whitespace
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Limit length to prevent injection attacks
    if len(text) > 2000:
        text = text[:2000] + "..."
    
    return text


def safe_json_load(text: str) -> Union[Dict, list]:
    """
    Robustly parse JSON from LLM output, handling common formatting issues.
    
    Args:
        text: Raw text that should contain JSON
        
    Returns:
        Parsed JSON object (dict or list)
        
    Raises:
        ValueError: If no valid JSON could be extracted
    """
    if not text or not isinstance(text, str):
        raise ValueError("Input text is empty or not a string")
    
    # Remove common markdown formatting
    text = text.strip()
    
    # Remove markdown code blocks
    text = re.sub(r'^```(?:json)?\n', '', text, flags=re.MULTILINE)
    text = re.sub(r'\n```$', '', text, flags=re.MULTILINE)
    
    # Remove backticks
    text = text.replace('```', '').replace('`', '')
    
    # Try to find JSON array or object boundaries
    json_patterns = [
        r'\[.*\]',  # Array
        r'\{.*\}',  # Object
    ]
    
    attempts = [text]  # First try the cleaned text as-is
    
    # Extract potential JSON using patterns
    for pattern in json_patterns:
        match = re.search(pattern, text, re.DOTALL)
        if match:
            attempts.append(match.group(0))
    
    # Try parsing each attempt
    for attempt in attempts:
        try:
            # Clean up the attempt
            cleaned = attempt.strip()
            if not cleaned:
                continue
                
            # Try to parse
            result = json.loads(cleaned)
            
            # Validate result type
            if isinstance(result, (dict, list)):
                return result
                
        except json.JSONDecodeError:
            continue
    
    # If all attempts failed, provide helpful error
    raise ValueError(
        f"Could not parse valid JSON from text. "
        f"Text preview: '{text[:200]}...'" if len(text) > 200 else f"Full text: '{text}'"
    )


def load_config() -> Dict[str, Any]:
    """
    Load configuration from environment variables with sensible defaults.
    
    Returns:
        Configuration dictionary
    """
    config = {
        # Ollama configuration
        'ollama_url': os.getenv('OLLAMA_URL', 'http://localhost:11434'),
        'ollama_model': os.getenv('OLLAMA_MODEL', 'llama2'),
        'ollama_timeout': int(os.getenv('OLLAMA_TIMEOUT', '30')),
        
        # llama-cpp-python configuration
        'llamacpp_model_path': os.getenv('LLAMACPP_MODEL_PATH', ''),
        'llamacpp_n_ctx': int(os.getenv('LLAMACPP_N_CTX', '2048')),
        'llamacpp_n_gpu_layers': int(os.getenv('LLAMACPP_N_GPU_LAYERS', '0')),
        
        # General LLM settings
        'max_tokens': int(os.getenv('MAX_TOKENS', '1024')),
        'temperature': float(os.getenv('TEMPERATURE', '0.1')),
        'max_retries': int(os.getenv('MAX_RETRIES', '2')),
        
        # Adapter preference
        'preferred_adapter': os.getenv('PREFERRED_ADAPTER', 'ollama'),  # 'ollama' or 'llamacpp'
    }
    
    return config


def retry_with_backoff(func, max_retries: int = 3, backoff_factor: float = 1.0):
    """
    Decorator for retrying functions with exponential backoff.
    
    Args:
        func: Function to retry
        max_retries: Maximum number of retry attempts
        backoff_factor: Multiplier for delay between retries
        
    Returns:
        Decorated function
    """
    import time
    import functools
    
    @functools.wraps(func)
    def wrapper(*args, **kwargs):
        last_exception = None
        
        for attempt in range(max_retries + 1):
            try:
                return func(*args, **kwargs)
            except Exception as e:
                last_exception = e
                
                if attempt < max_retries:
                    delay = backoff_factor * (2 ** attempt)
                    time.sleep(delay)
                    continue
                else:
                    raise last_exception
    
    return wrapper


def validate_instruction(instruction: str) -> str:
    """
    Validate and clean user instruction input.
    
    Args:
        instruction: Raw user instruction
        
    Returns:
        Cleaned and validated instruction
        
    Raises:
        ValueError: If instruction is invalid
    """
    if not instruction or not isinstance(instruction, str):
        raise ValueError("Instruction must be a non-empty string")
    
    # Sanitize the instruction
    cleaned = sanitize(instruction.strip())
    
    if len(cleaned) < 5:
        raise ValueError("Instruction must be at least 5 characters long")
    
    if len(cleaned) > 1000:
        raise ValueError("Instruction must be less than 1000 characters")
    
    return cleaned