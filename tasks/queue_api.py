"""
FastAPI router for NexusAI Task Queue management

Provides REST endpoints for enqueueing, scheduling, and monitoring tasks.
"""
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, Optional, List
from fastapi import APIRouter, HTTPException, Query, Depends
from pydantic import BaseModel, Field, validator
from rq import Queue, Connection
from rq.job import Job
from rq.exceptions import NoSuchJobError
import redis

from .config import get_config, ALLOWED_JOBS
from .jobs import get_job_function
from .scheduler import get_scheduler
from .results import get_job_result, get_job_status, list_recent_jobs

logger = logging.getLogger(__name__)

# Create FastAPI router
router = APIRouter(prefix="/queue", tags=["task_queue"])

# Pydantic models for request/response validation
class EnqueueRequest(BaseModel):
    """Request model for enqueueing immediate jobs"""
    job_name: str = Field(..., description="Name of the job function to execute")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Job arguments")
    priority: Optional[str] = Field(default="default", description="Queue priority (default, high, low)")
    timeout: Optional[int] = Field(default=300, description="Job timeout in seconds")
    
    @validator('job_name')
    def validate_job_name(cls, v):
        if v not in ALLOWED_JOBS:
            raise ValueError(f"Job '{v}' not allowed. Allowed jobs: {list(ALLOWED_JOBS)}")
        return v
    
    @validator('priority')
    def validate_priority(cls, v):
        if v not in ['default', 'high', 'low']:
            raise ValueError("Priority must be one of: default, high, low")
        return v


class ScheduleRequest(BaseModel):
    """Request model for scheduling future jobs"""
    job_name: str = Field(..., description="Name of the job function to execute")
    payload: Dict[str, Any] = Field(default_factory=dict, description="Job arguments")
    run_at: datetime = Field(..., description="When to run the job (ISO format)")
    priority: Optional[str] = Field(default="default", description="Queue priority")
    timeout: Optional[int] = Field(default=300, description="Job timeout in seconds")
    
    @validator('job_name')
    def validate_job_name(cls, v):
        if v not in ALLOWED_JOBS:
            raise ValueError(f"Job '{v}' not allowed. Allowed jobs: {list(ALLOWED_JOBS)}")
        return v
    
    @validator('run_at')
    def validate_run_at(cls, v):
        if v <= datetime.utcnow():
            raise ValueError("run_at must be in the future")
        return v


class JobResponse(BaseModel):
    """Response model for job creation"""
    job_id: str
    status: str
    created_at: datetime
    queue_name: str


class JobStatusResponse(BaseModel):
    """Response model for job status"""
    job_id: str
    status: str
    created_at: Optional[datetime]
    started_at: Optional[datetime]
    ended_at: Optional[datetime]
    result: Optional[Dict[str, Any]]
    meta: Optional[Dict[str, Any]]
    exc_info: Optional[str]
    queue_name: str


class JobListResponse(BaseModel):
    """Response model for job listing"""
    jobs: List[JobStatusResponse]
    total: int
    page: int
    page_size: int


# Dependency to get Redis connection
def get_redis_connection():
    """Get Redis connection from config"""
    config = get_config()
    return redis.from_url(config.redis_url)


# Dependency to get RQ queue
def get_queue(priority: str = "default"):
    """Get RQ queue by priority"""
    config = get_config()
    redis_conn = get_redis_connection()
    
    queue_name = priority
    if priority == "default":
        queue_name = config.default_queue
    elif priority == "high":
        queue_name = config.high_priority_queue
    
    return Queue(queue_name, connection=redis_conn)


@router.post("/enqueue", response_model=JobResponse)
async def enqueue_job(request: EnqueueRequest):
    """
    Enqueue a job for immediate execution
    
    Args:
        request: Job enqueue request
        
    Returns:
        Job information including job_id
    """
    try:
        config = get_config()
        queue = get_queue(request.priority)
        job_func = get_job_function(request.job_name)
        
        # Enqueue the job
        job = queue.enqueue(
            job_func,
            **request.payload,
            job_timeout=request.timeout,
            retry_count=config.retry_count,
            job_id=None  # Let RQ generate ID
        )
        
        logger.info(f"Job enqueued - ID: {job.id}, Function: {request.job_name}, Queue: {queue.name}")
        
        return JobResponse(
            job_id=job.id,
            status=job.get_status(),
            created_at=job.created_at,
            queue_name=queue.name
        )
        
    except Exception as e:
        logger.error(f"Failed to enqueue job: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to enqueue job: {str(e)}")


@router.post("/schedule", response_model=JobResponse)
async def schedule_job(request: ScheduleRequest):
    """
    Schedule a job for future execution
    
    Args:
        request: Job schedule request
        
    Returns:
        Scheduled job information
    """
    try:
        config = get_config()
        
        if not config.scheduler_enabled:
            raise HTTPException(status_code=503, detail="Scheduler is disabled")
        
        scheduler = get_scheduler()
        job_func = get_job_function(request.job_name)
        
        # Schedule the job
        job = scheduler.enqueue_at(
            request.run_at,
            job_func,
            **request.payload,
            timeout=request.timeout
        )
        
        logger.info(f"Job scheduled - ID: {job.id}, Function: {request.job_name}, Run at: {request.run_at}")
        
        return JobResponse(
            job_id=job.id,
            status="scheduled",
            created_at=datetime.utcnow(),
            queue_name="scheduler"
        )
        
    except Exception as e:
        logger.error(f"Failed to schedule job: {str(e)}")
        raise HTTPException(status_code=400, detail=f"Failed to schedule job: {str(e)}")


@router.get("/job/{job_id}", response_model=JobStatusResponse)
async def get_job_status_endpoint(job_id: str):
    """
    Get job status and result
    
    Args:
        job_id: Job identifier
        
    Returns:
        Job status and result information
    """
    try:
        redis_conn = get_redis_connection()
        
        with Connection(redis_conn):
            job = Job.fetch(job_id)
            
            return JobStatusResponse(
                job_id=job.id,
                status=job.get_status(),
                created_at=job.created_at,
                started_at=job.started_at,
                ended_at=job.ended_at,
                result=job.result,
                meta=job.meta,
                exc_info=job.exc_info,
                queue_name=getattr(job, 'origin', 'unknown')
            )
            
    except NoSuchJobError:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        logger.error(f"Failed to get job status: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get job status: {str(e)}")


@router.post("/cancel/{job_id}")
async def cancel_job(job_id: str):
    """
    Cancel a scheduled or queued job
    
    Args:
        job_id: Job identifier
        
    Returns:
        Cancellation status
    """
    try:
        redis_conn = get_redis_connection()
        
        with Connection(redis_conn):
            job = Job.fetch(job_id)
            
            if job.get_status() in ['finished', 'failed']:
                raise HTTPException(status_code=400, detail=f"Cannot cancel job with status: {job.get_status()}")
            
            job.cancel()
            
            logger.info(f"Job cancelled - ID: {job_id}")
            
            return {"job_id": job_id, "status": "cancelled", "cancelled_at": datetime.utcnow()}
            
    except NoSuchJobError:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    except Exception as e:
        logger.error(f"Failed to cancel job: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to cancel job: {str(e)}")


@router.get("/list", response_model=JobListResponse)
async def list_jobs(
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(10, ge=1, le=100, description="Jobs per page"),
    status: Optional[str] = Query(None, description="Filter by status"),
    queue: Optional[str] = Query(None, description="Filter by queue name")
):
    """
    List recent jobs with pagination
    
    Args:
        page: Page number (1-based)
        page_size: Number of jobs per page
        status: Optional status filter
        queue: Optional queue filter
        
    Returns:
        Paginated job list
    """
    try:
        redis_conn = get_redis_connection()
        
        # Get jobs from all queues
        config = get_config()
        queue_names = [config.default_queue, config.high_priority_queue, "low"]
        
        if queue:
            queue_names = [queue]
        
        all_jobs = []
        
        with Connection(redis_conn):
            for queue_name in queue_names:
                q = Queue(queue_name, connection=redis_conn)
                
                # Get jobs from different registries
                job_ids = []
                job_ids.extend(q.get_job_ids())  # Queued jobs
                job_ids.extend(q.finished_job_registry.get_job_ids())  # Finished jobs
                job_ids.extend(q.failed_job_registry.get_job_ids())  # Failed jobs
                job_ids.extend(q.started_job_registry.get_job_ids())  # Started jobs
                
                for job_id in job_ids:
                    try:
                        job = Job.fetch(job_id)
                        job_status = job.get_status()
                        
                        if status and job_status != status:
                            continue
                        
                        job_info = JobStatusResponse(
                            job_id=job.id,
                            status=job_status,
                            created_at=job.created_at,
                            started_at=job.started_at,
                            ended_at=job.ended_at,
                            result=job.result if job_status == 'finished' else None,
                            meta=job.meta,
                            exc_info=job.exc_info if job_status == 'failed' else None,
                            queue_name=queue_name
                        )
                        all_jobs.append(job_info)
                        
                    except NoSuchJobError:
                        continue
        
        # Sort by creation time (newest first)
        all_jobs.sort(key=lambda x: x.created_at or datetime.min, reverse=True)
        
        # Apply pagination
        total = len(all_jobs)
        start_idx = (page - 1) * page_size
        end_idx = start_idx + page_size
        paginated_jobs = all_jobs[start_idx:end_idx]
        
        return JobListResponse(
            jobs=paginated_jobs,
            total=total,
            page=page,
            page_size=page_size
        )
        
    except Exception as e:
        logger.error(f"Failed to list jobs: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to list jobs: {str(e)}")


@router.get("/stats")
async def get_queue_stats():
    """
    Get queue statistics
    
    Returns:
        Queue statistics including job counts by status
    """
    try:
        redis_conn = get_redis_connection()
        config = get_config()
        
        stats = {}
        
        with Connection(redis_conn):
            for queue_name in [config.default_queue, config.high_priority_queue, "low"]:
                q = Queue(queue_name, connection=redis_conn)
                
                stats[queue_name] = {
                    "queued": len(q),
                    "finished": len(q.finished_job_registry),
                    "failed": len(q.failed_job_registry),
                    "started": len(q.started_job_registry),
                    "deferred": len(q.deferred_job_registry),
                }
        
        return {"queues": stats, "timestamp": datetime.utcnow()}
        
    except Exception as e:
        logger.error(f"Failed to get queue stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to get queue stats: {str(e)}")


@router.get("/health")
async def health_check():
    """
    Health check endpoint
    
    Returns:
        Health status of queue system
    """
    try:
        redis_conn = get_redis_connection()
        
        # Test Redis connection
        redis_conn.ping()
        
        # Test queue access
        config = get_config()
        queue = Queue(config.default_queue, connection=redis_conn)
        
        return {
            "status": "healthy",
            "redis": "connected",
            "scheduler_enabled": config.scheduler_enabled,
            "timestamp": datetime.utcnow()
        }
        
    except Exception as e:
        logger.error(f"Health check failed: {str(e)}")
        return {
            "status": "unhealthy", 
            "error": str(e),
            "timestamp": datetime.utcnow()
        }