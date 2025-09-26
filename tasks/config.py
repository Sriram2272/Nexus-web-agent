"""
Configuration management for NexusAI Task Queue System
"""
import os
from typing import Optional
from pydantic import BaseSettings, Field


class TaskConfig(BaseSettings):
    """Task queue configuration loaded from environment variables"""
    
    # Redis configuration
    redis_url: str = Field(default="redis://redis:6379/0", env="REDIS_URL")
    
    # Queue configuration
    default_queue: str = Field(default="default", env="DEFAULT_QUEUE")
    high_priority_queue: str = Field(default="high", env="HIGH_PRIORITY_QUEUE")
    
    # Worker configuration
    worker_count: int = Field(default=1, env="WORKER_COUNT")
    worker_timeout: int = Field(default=300, env="WORKER_TIMEOUT")  # 5 minutes
    
    # Retry policy
    retry_count: int = Field(default=3, env="RETRY_COUNT")
    retry_backoff: int = Field(default=60, env="RETRY_BACKOFF")  # seconds
    
    # Scheduler configuration
    scheduler_enabled: bool = Field(default=True, env="SCHEDULER_ENABLED")
    scheduler_interval: int = Field(default=1, env="SCHEDULER_INTERVAL")  # seconds
    
    # Rate limiting
    rate_limit_enabled: bool = Field(default=True, env="RATE_LIMIT_ENABLED")
    rate_limit_window: int = Field(default=60, env="RATE_LIMIT_WINDOW")  # seconds
    rate_limit_max_requests: int = Field(default=10, env="RATE_LIMIT_MAX_REQUESTS")
    
    # Job configuration
    job_ttl: int = Field(default=86400, env="JOB_TTL")  # 24 hours
    result_ttl: int = Field(default=604800, env="RESULT_TTL")  # 7 days
    
    # Logging
    log_level: str = Field(default="INFO", env="LOG_LEVEL")
    
    class Config:
        env_file = ".env"
        case_sensitive = False


# Global config instance
_config: Optional[TaskConfig] = None


def get_config() -> TaskConfig:
    """Get global configuration instance"""
    global _config
    if _config is None:
        _config = TaskConfig()
    return _config


def reload_config() -> TaskConfig:
    """Reload configuration from environment"""
    global _config
    _config = TaskConfig()
    return _config


# Queue names for different priorities
QUEUE_NAMES = {
    "default": "default",
    "high": "high", 
    "low": "low",
    "scheduler": "scheduler"
}

# Allowed job names (whitelist for security)
ALLOWED_JOBS = {
    "run_plan",
    "scrape_page", 
    "export_results",
    "health_check"
}