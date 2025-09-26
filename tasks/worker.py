"""
RQ Worker implementation for NexusAI Task Queue

Starts RQ worker processes to execute queued jobs.
Supports graceful shutdown and multiple worker processes.
"""
import os
import sys
import signal
import logging
from typing import List
import click
from rq import Worker, Connection
from rq.middleware import Middleware
import redis

from .config import get_config


# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


class LoggingMiddleware(Middleware):
    """Middleware to log job execution"""
    
    def call(self, queue, job_func, job, *args, **kwargs):
        """Log job start and completion"""
        logger.info(f"Starting job {job.id}: {job_func.__name__}")
        
        try:
            result = super().call(queue, job_func, job, *args, **kwargs)
            logger.info(f"Completed job {job.id}: {job_func.__name__}")
            return result
        except Exception as e:
            logger.error(f"Failed job {job.id}: {job_func.__name__} - {str(e)}")
            raise


class NexusWorker:
    """NexusAI RQ Worker wrapper with graceful shutdown"""
    
    def __init__(self, queues: List[str], redis_url: str):
        self.queues = queues
        self.redis_url = redis_url
        self.redis_conn = None
        self.worker = None
        self.shutdown = False
        
        # Setup signal handlers for graceful shutdown
        signal.signal(signal.SIGINT, self._signal_handler)
        signal.signal(signal.SIGTERM, self._signal_handler)
        
    def _signal_handler(self, signum, frame):
        """Handle shutdown signals"""
        logger.info(f"Received signal {signum}, initiating graceful shutdown...")
        self.shutdown = True
        
        if self.worker:
            self.worker.request_stop()
    
    def start(self):
        """Start the worker"""
        try:
            # Connect to Redis
            self.redis_conn = redis.from_url(self.redis_url)
            
            # Test connection
            self.redis_conn.ping()
            logger.info(f"Connected to Redis: {self.redis_url}")
            
            # Create worker
            with Connection(self.redis_conn):
                self.worker = Worker(
                    self.queues,
                    connection=self.redis_conn,
                    middleware=[LoggingMiddleware()]
                )
                
                logger.info(f"Starting worker for queues: {', '.join(self.queues)}")
                logger.info(f"Worker ID: {self.worker.name}")
                
                # Start processing jobs
                self.worker.work(
                    with_scheduler=False,  # Scheduler runs separately
                    logging_level=logging.INFO
                )
                
        except KeyboardInterrupt:
            logger.info("Worker interrupted by user")
        except Exception as e:
            logger.error(f"Worker error: {str(e)}")
            raise
        finally:
            self._cleanup()
    
    def _cleanup(self):
        """Clean up resources"""
        if self.worker:
            logger.info("Worker stopped")
        
        if self.redis_conn:
            self.redis_conn.close()
            logger.info("Redis connection closed")


def start_worker(queues: List[str] = None, redis_url: str = None):
    """
    Start a single worker process
    
    Args:
        queues: List of queue names to process
        redis_url: Redis connection URL
    """
    config = get_config()
    
    if not queues:
        queues = [config.default_queue, config.high_priority_queue]
    
    if not redis_url:
        redis_url = config.redis_url
    
    # Set log level from config
    logging.getLogger().setLevel(getattr(logging, config.log_level.upper()))
    
    worker = NexusWorker(queues, redis_url)
    worker.start()


@click.command()
@click.option('--queues', '-q', 
              multiple=True,
              default=['default', 'high'],
              help='Queue names to process (can specify multiple)')
@click.option('--redis-url', '-r',
              envvar='REDIS_URL',
              default='redis://localhost:6379/0',
              help='Redis connection URL')
@click.option('--log-level', '-l',
              default='INFO',
              type=click.Choice(['DEBUG', 'INFO', 'WARNING', 'ERROR']),
              help='Logging level')
@click.option('--verbose', '-v',
              is_flag=True,
              help='Enable verbose logging')
def cli(queues, redis_url, log_level, verbose):
    """
    NexusAI Task Queue Worker
    
    Start an RQ worker to process queued jobs.
    
    Examples:
        python -m tasks.worker
        python -m tasks.worker -q default -q high
        python -m tasks.worker --redis-url redis://localhost:6379/1
    """
    if verbose:
        log_level = 'DEBUG'
    
    # Update logging level
    logging.getLogger().setLevel(getattr(logging, log_level.upper()))
    
    logger.info("Starting NexusAI Task Queue Worker")
    logger.info(f"Queues: {', '.join(queues)}")
    logger.info(f"Redis URL: {redis_url}")
    logger.info(f"Log level: {log_level}")
    
    start_worker(list(queues), redis_url)


if __name__ == '__main__':
    cli()


# For direct module execution
def main():
    """Main entry point for worker"""
    start_worker()


# Multi-worker support for production
class MultiWorkerManager:
    """Manages multiple worker processes"""
    
    def __init__(self, worker_count: int = None):
        config = get_config()
        self.worker_count = worker_count or config.worker_count
        self.workers = []
        
    def start(self):
        """Start multiple worker processes"""
        import multiprocessing
        
        logger.info(f"Starting {self.worker_count} worker processes")
        
        for i in range(self.worker_count):
            process = multiprocessing.Process(
                target=start_worker,
                name=f"nexus-worker-{i+1}"
            )
            process.start()
            self.workers.append(process)
            logger.info(f"Started worker process {i+1} (PID: {process.pid})")
        
        # Wait for all workers
        try:
            for worker in self.workers:
                worker.join()
        except KeyboardInterrupt:
            logger.info("Shutting down all workers...")
            for worker in self.workers:
                worker.terminate()
            logger.info("All workers stopped")


# Docker entrypoint support
def docker_entrypoint():
    """Entrypoint for Docker container"""
    config = get_config()
    
    # Check if running multiple workers
    if config.worker_count > 1:
        manager = MultiWorkerManager(config.worker_count)
        manager.start()
    else:
        start_worker()


# Export for external use
__all__ = ['start_worker', 'NexusWorker', 'MultiWorkerManager', 'docker_entrypoint']