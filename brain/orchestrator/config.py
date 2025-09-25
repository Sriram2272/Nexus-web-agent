"""
Configuration for NexusAI orchestrator.
"""

import os
from typing import Dict, Any


def load_orchestrator_config() -> Dict[str, Any]:
    """
    Load orchestrator configuration from environment variables.
    
    Returns:
        Dict containing configuration values
    """
    return {
        "langchain_enabled": os.getenv("LANGCHAIN_ENABLED", "false").lower() == "true",
        "max_retries": int(os.getenv("ORCHESTRATOR_MAX_RETRIES", "3")),
        "step_timeout": int(os.getenv("ORCHESTRATOR_STEP_TIMEOUT", "60")),
        "output_dir": os.getenv("ORCHESTRATOR_OUTPUT_DIR", "./orchestrator_runs"),
        "debug_mode": os.getenv("ORCHESTRATOR_DEBUG", "false").lower() == "true",
        "allow_playwright": os.getenv("ALLOW_PLAYWRIGHT", "true").lower() == "true",
        "allow_network": os.getenv("ALLOW_NETWORK", "true").lower() == "true",
    }


def is_langchain_enabled() -> bool:
    """Check if LangChain mode is enabled."""
    return load_orchestrator_config()["langchain_enabled"]


def get_output_dir() -> str:
    """Get the output directory for orchestrator runs."""
    return load_orchestrator_config()["output_dir"]