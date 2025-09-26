"""
NexusAI Task Queue System

A Redis-based task queue and scheduler using RQ (Redis Queue) for handling
long-running operations like web scraping, data processing, and orchestration.

Main components:
- queue_api: FastAPI router for task management
- worker: RQ worker processes
- jobs: Predefined job functions
- scheduler: Task scheduling with rq_scheduler
- results: Job result helpers
"""

from .config import get_config
from .queue_api import router as queue_router
from .jobs import run_plan, scrape_page, export_results
from .results import get_job_result, get_job_status

__version__ = "1.0.0"

__all__ = [
    "get_config",
    "queue_router", 
    "run_plan",
    "scrape_page",
    "export_results",
    "get_job_result",
    "get_job_status"
]