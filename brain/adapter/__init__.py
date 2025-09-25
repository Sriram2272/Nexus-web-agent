"""
NexusAI Local AI Model Adapter

Provides a unified interface for local LLM adapters with automatic fallback.
"""

from .adapter_manager import generate, available_adapters, healthcheck

__version__ = "1.0.0"
__all__ = ["generate", "available_adapters", "healthcheck"]