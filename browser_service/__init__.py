"""
NexusAI Browser Service

A comprehensive browser automation package using Playwright for hands-on web interaction.
Provides session management, search capabilities, extraction tools, and multimedia capture.
"""

from .service import BrowserService
from .tools import tool_search, tool_open, tool_extract, tool_screenshot
from .session_manager import SessionManager
from .config import load_config

__version__ = "1.0.0"
__author__ = "NexusAI Team"

__all__ = [
    "BrowserService",
    "SessionManager", 
    "tool_search",
    "tool_open", 
    "tool_extract",
    "tool_screenshot",
    "load_config"
]