"""
Task Scheduler for NexusAI using RQ Scheduler

Provides scheduling capabilities for delayed and recurring jobs.
Falls back to simple polling if rq_scheduler is not available.
"""
import logging
from datetime import datetime, timedelta
from typing import Optional, Dict, Any, Callable
import redis
from rq import Queue

from .config import get_config

logger = logging.getLogger(__name__)

# Try to import rq_scheduler, fall back to basic implementation
try:
    from rq_scheduler import Scheduler as RQScheduler
    RQ_SCHEDULER_AVAILABLE = True
    logger.info("rq_scheduler is available")
except ImportError:
    RQ_SCHEDULER_AVAILABLE = False
    logger.warning("rq_scheduler not available, using basic scheduler")


class NexusScheduler:
    """
    NexusAI Task Scheduler
    
    Wraps rq_scheduler when available, provides basic scheduling otherwise.
    For Celery migration: Replace with celery beat and periodic tasks.
    """
    
    def __init__(self, redis_conn=None, queue_name: str = "default"):
        self.redis_conn = redis_conn or self._get_redis_connection()
        self.queue_name = queue_name
        self.queue = Queue(queue_name, connection=self.redis_conn)
        
        if RQ_SCHEDULER_AVAILABLE:
            self.scheduler = RQScheduler(queue=self.queue, connection=self.redis_conn)
            logger.info(f"Initialized RQ Scheduler for queue: {queue_name}")
        else:
            self.scheduler = None
            logger.info(f"Initialized basic scheduler for queue: {queue_name}")
    
    def _get_redis_connection(self):
        """Get Redis connection from config"""
        config = get_config()
        return redis.from_url(config.redis_url)
    
    def enqueue_at(self, datetime_obj: datetime, func: Callable, *args, **kwargs):
        """
        Schedule a job to run at specific datetime
        
        Args:
            datetime_obj: When to run the job
            func: Function to execute
            *args, **kwargs: Arguments for the function
            
        Returns:
            Scheduled job object
        """
        if RQ_SCHEDULER_AVAILABLE:
            return self.scheduler.enqueue_at(datetime_obj, func, *args, **kwargs)
        else:
            return self._basic_schedule_at(datetime_obj, func, *args, **kwargs)
    
    def enqueue_in(self, time_delta: timedelta, func: Callable, *args, **kwargs):
        """
        Schedule a job to run after a time delta
        
        Args:
            time_delta: Delay before running the job
            func: Function to execute
            *args, **kwargs: Arguments for the function
            
        Returns:
            Scheduled job object
        """
        run_at = datetime.utcnow() + time_delta
        return self.enqueue_at(run_at, func, *args, **kwargs)
    
    def cron(self, cron_string: str, func: Callable, *args, **kwargs):
        """
        Schedule a recurring job using cron syntax
        
        Args:
            cron_string: Cron expression (e.g., "0 * * * *" for hourly)
            func: Function to execute
            *args, **kwargs: Arguments for the function
            
        Returns:
            Scheduled job object
        """
        if RQ_SCHEDULER_AVAILABLE:
            return self.scheduler.cron(cron_string, func, *args, **kwargs)
        else:
            logger.warning("Cron scheduling not supported in basic scheduler")
            raise NotImplementedError("Cron scheduling requires rq_scheduler")
    
    def cancel(self, job_id: str):
        """
        Cancel a scheduled job
        
        Args:
            job_id: ID of the job to cancel
        """
        if RQ_SCHEDULER_AVAILABLE:
            return self.scheduler.cancel(job_id)
        else:
            return self._basic_cancel(job_id)
    
    def get_jobs(self):
        """Get list of scheduled jobs"""
        if RQ_SCHEDULER_AVAILABLE:
            return self.scheduler.get_jobs()
        else:
            return self._basic_get_jobs()
    
    def run(self, burst: bool = False):
        """
        Run the scheduler process
        
        Args:
            burst: If True, process all scheduled jobs and exit
        """
        if RQ_SCHEDULER_AVAILABLE:
            logger.info("Starting RQ Scheduler...")
            self.scheduler.run(burst=burst)
        else:
            logger.info("Starting basic scheduler...")
            self._basic_run(burst=burst)
    
    # Basic scheduler implementation (fallback)
    def _basic_schedule_at(self, datetime_obj: datetime, func: Callable, *args, **kwargs):
        """Basic implementation using Redis sorted sets"""
        import json
        import uuid
        
        job_id = str(uuid.uuid4())
        
        # Store job data
        job_data = {
            'id': job_id,
            'func_name': f"{func.__module__}.{func.__name__}",
            'args': args,
            'kwargs': kwargs,
            'scheduled_at': datetime_obj.isoformat(),
            'created_at': datetime.utcnow().isoformat()
        }
        
        # Store in Redis hash
        self.redis_conn.hset(
            f"scheduled_job:{job_id}",
            mapping={k: json.dumps(v) if isinstance(v, (dict, list)) else str(v) for k, v in job_data.items()}
        )
        
        # Add to sorted set for time-based retrieval
        timestamp = datetime_obj.timestamp()
        self.redis_conn.zadd("scheduled_jobs", {job_id: timestamp})
        
        logger.info(f"Scheduled job {job_id} for {datetime_obj}")
        
        # Return a basic job-like object
        class BasicScheduledJob:
            def __init__(self, job_id, data):
                self.id = job_id
                self.data = data
        
        return BasicScheduledJob(job_id, job_data)
    
    def _basic_cancel(self, job_id: str):
        """Cancel job in basic scheduler"""
        # Remove from sorted set
        self.redis_conn.zrem("scheduled_jobs", job_id)
        
        # Remove job data
        self.redis_conn.delete(f"scheduled_job:{job_id}")
        
        logger.info(f"Cancelled scheduled job {job_id}")
    
    def _basic_get_jobs(self):
        """Get scheduled jobs in basic scheduler"""
        import json
        
        # Get all scheduled job IDs
        job_ids = self.redis_conn.zrange("scheduled_jobs", 0, -1)
        
        jobs = []
        for job_id in job_ids:
            job_data = self.redis_conn.hgetall(f"scheduled_job:{job_id}")
            if job_data:
                # Convert bytes to strings and parse JSON
                parsed_data = {}
                for k, v in job_data.items():
                    k = k.decode() if isinstance(k, bytes) else k
                    v = v.decode() if isinstance(v, bytes) else v
                    try:
                        parsed_data[k] = json.loads(v)
                    except json.JSONDecodeError:
                        parsed_data[k] = v
                
                jobs.append(parsed_data)
        
        return jobs
    
    def _basic_run(self, burst: bool = False):
        """Run basic scheduler polling loop"""
        import json
        import time
        import importlib
        
        config = get_config()
        
        logger.info("Basic scheduler started")
        
        while True:
            try:
                current_time = datetime.utcnow().timestamp()
                
                # Get jobs that should run now
                ready_job_ids = self.redis_conn.zrangebyscore(
                    "scheduled_jobs", 
                    0, 
                    current_time
                )
                
                for job_id in ready_job_ids:
                    try:
                        job_id = job_id.decode() if isinstance(job_id, bytes) else job_id
                        
                        # Get job data
                        job_data = self.redis_conn.hgetall(f"scheduled_job:{job_id}")
                        if not job_data:
                            continue
                        
                        # Parse job data
                        parsed_data = {}
                        for k, v in job_data.items():
                            k = k.decode() if isinstance(k, bytes) else k
                            v = v.decode() if isinstance(v, bytes) else v
                            try:
                                parsed_data[k] = json.loads(v)
                            except json.JSONDecodeError:
                                parsed_data[k] = v
                        
                        # Import and get function
                        func_name = parsed_data['func_name']
                        module_name, function_name = func_name.rsplit('.', 1)
                        module = importlib.import_module(module_name)
                        func = getattr(module, function_name)
                        
                        # Enqueue job
                        job = self.queue.enqueue(
                            func,
                            *parsed_data.get('args', []),
                            **parsed_data.get('kwargs', {})
                        )
                        
                        logger.info(f"Enqueued scheduled job {job_id} as {job.id}")
                        
                        # Remove from scheduled jobs
                        self.redis_conn.zrem("scheduled_jobs", job_id)
                        self.redis_conn.delete(f"scheduled_job:{job_id}")
                        
                    except Exception as e:
                        logger.error(f"Error processing scheduled job {job_id}: {str(e)}")
                        # Remove failed job
                        self.redis_conn.zrem("scheduled_jobs", job_id)
                        self.redis_conn.delete(f"scheduled_job:{job_id}")
                
                if burst:
                    break
                
                # Sleep for configured interval
                time.sleep(config.scheduler_interval)
                
            except KeyboardInterrupt:
                logger.info("Scheduler stopped by user")
                break
            except Exception as e:
                logger.error(f"Scheduler error: {str(e)}")
                time.sleep(5)  # Wait before retrying


# Global scheduler instance
_scheduler: Optional[NexusScheduler] = None


def get_scheduler(queue_name: str = "default") -> NexusScheduler:
    """
    Get global scheduler instance
    
    Args:
        queue_name: Queue name for the scheduler
        
    Returns:
        NexusScheduler instance
    """
    global _scheduler
    if _scheduler is None:
        _scheduler = NexusScheduler(queue_name=queue_name)
    return _scheduler


def start_scheduler_daemon(burst: bool = False):
    """
    Start scheduler as a daemon process
    
    Args:
        burst: If True, process all scheduled jobs and exit
    """
    config = get_config()
    
    if not config.scheduler_enabled:
        logger.warning("Scheduler is disabled in configuration")
        return
    
    scheduler = get_scheduler()
    scheduler.run(burst=burst)


# CLI entry point
if __name__ == '__main__':
    import click
    
    @click.command()
    @click.option('--burst', is_flag=True, help='Process all jobs and exit')
    @click.option('--queue', default='default', help='Queue name')
    def cli(burst, queue):
        """Start NexusAI Task Scheduler"""
        logging.basicConfig(level=logging.INFO)
        
        scheduler = get_scheduler(queue)
        scheduler.run(burst=burst)
    
    cli()


# For Celery migration notes:
"""
Celery Migration Notes:

1. Replace NexusScheduler with Celery Beat:
   - Install celery[redis] 
   - Create celeryconfig.py with Redis broker
   - Use @app.task decorators instead of job functions
   - Use app.send_task() instead of enqueue_at()
   - Replace cron scheduling with celery beat schedule

2. Example Celery setup:
   
   # celery_app.py
   from celery import Celery
   
   app = Celery('nexus_tasks')
   app.config_from_object('celeryconfig')
   
   @app.task(bind=True, max_retries=3)
   def run_plan(self, task_id, plan, session_id=None):
       # Job implementation
       pass
   
   # Schedule task
   from datetime import datetime, timedelta
   run_plan.apply_async(args=[task_id, plan], eta=datetime.utcnow() + timedelta(hours=1))
   
3. Start workers:
   celery -A celery_app worker --loglevel=info
   
4. Start scheduler:
   celery -A celery_app beat --loglevel=info

Trade-offs:
+ Celery: More features, better monitoring, canvas workflows
- Celery: Heavier, more complex setup, requires beat scheduler
+ RQ: Simpler, lightweight, great for basic use cases
- RQ: Fewer features, limited workflow support
"""