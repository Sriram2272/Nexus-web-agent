"""
Configuration management for NexusAI Browser Service.
"""

import os
from typing import Dict, Any, Optional
from pathlib import Path


def load_config() -> Dict[str, Any]:
    """
    Load configuration from environment variables with sensible defaults.
    
    Returns:
        Dict containing all configuration values
    """
    return {
        # Playwright browser settings
        "headless": os.getenv("PLAYWRIGHT_HEADLESS", "true").lower() == "true",
        "browser_type": os.getenv("PLAYWRIGHT_BROWSER", "chromium").lower(),
        "browser_timeout": int(os.getenv("BROWSER_TIMEOUT", "30000")),
        "page_timeout": int(os.getenv("PAGE_TIMEOUT", "10000")),
        "navigation_timeout": int(os.getenv("NAVIGATION_TIMEOUT", "30000")),
        
        # Storage directories
        "video_dir": os.getenv("VIDEO_DIR", "./browser_videos"),
        "sessions_dir": os.getenv("SESSIONS_DIR", "./sessions"),
        "screenshots_dir": os.getenv("SCREENSHOTS_DIR", "./screenshots"),
        "logs_dir": os.getenv("LOGS_DIR", "./logs"),
        
        # Security and rate limiting
        "respect_robots_txt": os.getenv("RESPECT_ROBOTS_TXT", "true").lower() == "true",
        "rate_limit_delay": float(os.getenv("RATE_LIMIT_DELAY", "1.0")),
        "max_retries": int(os.getenv("MAX_RETRIES", "3")),
        "session_encryption_key": os.getenv("SESSION_ENCRYPTION_KEY"),
        "allow_external_network": os.getenv("ALLOW_EXTERNAL_NETWORK", "true").lower() == "true",
        
        # Browser launch options
        "viewport_width": int(os.getenv("VIEWPORT_WIDTH", "1280")),
        "viewport_height": int(os.getenv("VIEWPORT_HEIGHT", "720")),
        "user_agent": os.getenv("USER_AGENT", 
            "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"),
        
        # Video recording settings
        "video_size": {
            "width": int(os.getenv("VIDEO_WIDTH", "1280")),
            "height": int(os.getenv("VIDEO_HEIGHT", "720"))
        },
        "video_fps": int(os.getenv("VIDEO_FPS", "25")),
        
        # Testing and debugging
        "debug_mode": os.getenv("DEBUG_MODE", "false").lower() == "true",
        "skip_ci_tests": os.getenv("PLAYWRIGHT_SKIP_CI", "false").lower() == "true",
        "slow_mo": int(os.getenv("SLOW_MO", "0")),  # Milliseconds to slow down operations
        
        # Search engine settings
        "default_search_engine": os.getenv("DEFAULT_SEARCH_ENGINE", "duckduckgo"),
        "search_results_limit": int(os.getenv("SEARCH_RESULTS_LIMIT", "10")),
    }


def ensure_directories(config: Dict[str, Any]) -> None:
    """
    Ensure all configured directories exist.
    
    Args:
        config: Configuration dictionary
    """
    directories = [
        config["video_dir"],
        config["sessions_dir"], 
        config["screenshots_dir"],
        config["logs_dir"]
    ]
    
    for directory in directories:
        Path(directory).mkdir(parents=True, exist_ok=True)


def get_browser_launch_options(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get Playwright browser launch options from configuration.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Dict of browser launch options
    """
    options = {
        "headless": config["headless"],
        "args": [
            "--no-sandbox",
            "--disable-dev-shm-usage",
            "--disable-gpu",
            "--disable-web-security",
            "--disable-features=VizDisplayCompositor"
        ]
    }
    
    if config["debug_mode"]:
        options["args"].extend([
            "--remote-debugging-port=9222",
            "--disable-background-timer-throttling",
            "--disable-renderer-backgrounding"
        ])
    
    if config["slow_mo"] > 0:
        options["slow_mo"] = config["slow_mo"]
    
    return options


def get_context_options(config: Dict[str, Any]) -> Dict[str, Any]:
    """
    Get Playwright browser context options from configuration.
    
    Args:
        config: Configuration dictionary
        
    Returns:
        Dict of context options
    """
    return {
        "viewport": {
            "width": config["viewport_width"], 
            "height": config["viewport_height"]
        },
        "user_agent": config["user_agent"],
        "java_script_enabled": True,
        "accept_downloads": True,
        "ignore_https_errors": True,  # For testing environments
        "record_video_dir": config["video_dir"] if not config["headless"] else None,
        "record_video_size": config["video_size"]
    }


def validate_config(config: Dict[str, Any]) -> None:
    """
    Validate configuration values and raise errors for invalid settings.
    
    Args:
        config: Configuration dictionary
        
    Raises:
        ValueError: If configuration is invalid
    """
    # Validate browser type
    valid_browsers = ["chromium", "firefox", "webkit"]
    if config["browser_type"] not in valid_browsers:
        raise ValueError(f"Invalid browser type: {config['browser_type']}. Must be one of: {valid_browsers}")
    
    # Validate timeouts
    if config["browser_timeout"] < 1000:
        raise ValueError("Browser timeout must be at least 1000ms")
    
    if config["page_timeout"] < 1000:
        raise ValueError("Page timeout must be at least 1000ms")
    
    # Validate viewport
    if config["viewport_width"] < 100 or config["viewport_height"] < 100:
        raise ValueError("Viewport dimensions must be at least 100x100")
    
    # Validate rate limiting
    if config["rate_limit_delay"] < 0:
        raise ValueError("Rate limit delay cannot be negative")
    
    if config["max_retries"] < 0:
        raise ValueError("Max retries cannot be negative")


def get_validated_config() -> Dict[str, Any]:
    """
    Load and validate configuration.
    
    Returns:
        Validated configuration dictionary
        
    Raises:
        ValueError: If configuration is invalid
    """
    config = load_config()
    validate_config(config)
    ensure_directories(config)
    return config