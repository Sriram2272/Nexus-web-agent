"""
Job Results and Status Management for NexusAI Task Queue

Provides helpers to fetch job results, status, and maintain job history.
"""
import json
import logging
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
from rq import Connection, Queue
from rq.job import Job
from rq.exceptions import NoSuchJobError
import redis

from .config import get_config

logger = logging.getLogger(__name__)


class JobResultManager:
    """Manages job results and provides query capabilities"""
    
    def __init__(self, redis_conn=None):
        self.redis_conn = redis_conn or self._get_redis_connection()
    
    def _get_redis_connection(self):
        """Get Redis connection from config"""
        config = get_config()
        return redis.from_url(config.redis_url)
    
    def get_job_result(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get comprehensive job result including status and metadata
        
        Args:
            job_id: Job identifier
            
        Returns:
            Dict with job information or None if not found
        """
        try:
            with Connection(self.redis_conn):
                job = Job.fetch(job_id)
                
                return {
                    'job_id': job.id,
                    'status': job.get_status(),
                    'result': job.result,
                    'created_at': job.created_at.isoformat() if job.created_at else None,
                    'started_at': job.started_at.isoformat() if job.started_at else None,
                    'ended_at': job.ended_at.isoformat() if job.ended_at else None,
                    'meta': job.meta,
                    'exc_info': job.exc_info,
                    'timeout': job.timeout,
                    'ttl': job.ttl,
                    'func_name': job.func_name,
                    'args': job.args,
                    'kwargs': job.kwargs,
                    'origin': getattr(job, 'origin', None),
                    'description': job.description
                }
                
        except NoSuchJobError:
            logger.warning(f"Job {job_id} not found")
            return None
        except Exception as e:
            logger.error(f"Error fetching job {job_id}: {str(e)}")
            return None
    
    def get_job_status(self, job_id: str) -> Optional[str]:
        """
        Get job status only (faster than full result)
        
        Args:
            job_id: Job identifier
            
        Returns:
            Job status string or None if not found
        """
        try:
            with Connection(self.redis_conn):
                job = Job.fetch(job_id)
                return job.get_status()
                
        except NoSuchJobError:
            return None
        except Exception as e:
            logger.error(f"Error fetching job status {job_id}: {str(e)}")
            return None
    
    def list_recent_jobs(self, queue_names: List[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
        """
        List recent jobs from specified queues
        
        Args:
            queue_names: List of queue names to check
            limit: Maximum number of jobs to return
            
        Returns:
            List of job information dicts
        """
        if not queue_names:
            config = get_config()
            queue_names = [config.default_queue, config.high_priority_queue, "low"]
        
        jobs = []
        
        try:
            with Connection(self.redis_conn):
                for queue_name in queue_names:
                    queue = Queue(queue_name, connection=self.redis_conn)
                    
                    # Collect job IDs from different registries
                    job_ids = []
                    
                    # Active jobs (queued and started)
                    job_ids.extend(queue.get_job_ids()[:limit//4])
                    job_ids.extend(queue.started_job_registry.get_job_ids()[:limit//4])
                    
                    # Completed jobs (finished and failed)
                    job_ids.extend(queue.finished_job_registry.get_job_ids()[:limit//4])
                    job_ids.extend(queue.failed_job_registry.get_job_ids()[:limit//4])
                    
                    # Fetch job details
                    for job_id in job_ids:
                        if len(jobs) >= limit:
                            break
                        
                        try:
                            job = Job.fetch(job_id)
                            job_info = {
                                'job_id': job.id,
                                'status': job.get_status(),
                                'func_name': job.func_name,
                                'created_at': job.created_at.isoformat() if job.created_at else None,
                                'started_at': job.started_at.isoformat() if job.started_at else None,
                                'ended_at': job.ended_at.isoformat() if job.ended_at else None,
                                'queue': queue_name,
                                'description': job.description,
                                'timeout': job.timeout
                            }
                            
                            # Add result for finished jobs
                            if job.get_status() == 'finished' and job.result:
                                job_info['result_preview'] = str(job.result)[:200]  # Truncated preview
                            
                            # Add error info for failed jobs
                            if job.get_status() == 'failed' and job.exc_info:
                                job_info['error'] = str(job.exc_info)[:200]  # Truncated error
                            
                            jobs.append(job_info)
                            
                        except NoSuchJobError:
                            continue
                        except Exception as e:
                            logger.error(f"Error fetching job {job_id}: {str(e)}")
                            continue
            
            # Sort by creation time (newest first)
            jobs.sort(key=lambda x: x.get('created_at', ''), reverse=True)
            return jobs[:limit]
            
        except Exception as e:
            logger.error(f"Error listing jobs: {str(e)}")
            return []
    
    def get_job_progress(self, job_id: str) -> Optional[Dict[str, Any]]:
        """
        Get job progress information from meta
        
        Args:
            job_id: Job identifier
            
        Returns:
            Progress information or None if not found
        """
        try:
            with Connection(self.redis_conn):
                job = Job.fetch(job_id)
                
                if not job.meta:
                    return None
                
                return {
                    'job_id': job.id,
                    'status': job.get_status(),
                    'progress': job.meta.get('progress', 0),
                    'current_step': job.meta.get('current_step'),
                    'total_steps': job.meta.get('total_steps'),
                    'message': job.meta.get('message'),
                    'updated_at': job.meta.get('updated_at'),
                    'started_at': job.started_at.isoformat() if job.started_at else None
                }
                
        except NoSuchJobError:
            return None
        except Exception as e:
            logger.error(f"Error fetching job progress {job_id}: {str(e)}")
            return None
    
    def search_jobs(self, 
                   func_name: str = None,
                   status: str = None,
                   since: datetime = None,
                   limit: int = 100) -> List[Dict[str, Any]]:
        """
        Search jobs by criteria
        
        Args:
            func_name: Filter by function name
            status: Filter by job status
            since: Only return jobs created after this datetime
            limit: Maximum results
            
        Returns:
            List of matching jobs
        """
        jobs = self.list_recent_jobs(limit=limit * 2)  # Get more to filter
        
        filtered_jobs = []
        
        for job in jobs:
            # Apply filters
            if func_name and func_name not in job.get('func_name', ''):
                continue
            
            if status and job.get('status') != status:
                continue
            
            if since:
                job_created = job.get('created_at')
                if job_created:
                    try:
                        job_created_dt = datetime.fromisoformat(job_created.replace('Z', '+00:00'))
                        if job_created_dt < since:
                            continue
                    except ValueError:
                        continue
            
            filtered_jobs.append(job)
            
            if len(filtered_jobs) >= limit:
                break
        
        return filtered_jobs
    
    def get_queue_stats(self, queue_names: List[str] = None) -> Dict[str, Any]:
        """
        Get statistics for queues
        
        Args:
            queue_names: List of queue names to analyze
            
        Returns:
            Statistics dict
        """
        if not queue_names:
            config = get_config()
            queue_names = [config.default_queue, config.high_priority_queue, "low"]
        
        stats = {
            'queues': {},
            'total_queued': 0,
            'total_started': 0,
            'total_finished': 0,
            'total_failed': 0,
            'timestamp': datetime.utcnow().isoformat()
        }
        
        try:
            with Connection(self.redis_conn):
                for queue_name in queue_names:
                    queue = Queue(queue_name, connection=self.redis_conn)
                    
                    queued_count = len(queue)
                    started_count = len(queue.started_job_registry)
                    finished_count = len(queue.finished_job_registry)
                    failed_count = len(queue.failed_job_registry)
                    deferred_count = len(queue.deferred_job_registry)
                    
                    queue_stats = {
                        'queued': queued_count,
                        'started': started_count,
                        'finished': finished_count,
                        'failed': failed_count,
                        'deferred': deferred_count,
                        'total': queued_count + started_count + finished_count + failed_count + deferred_count
                    }
                    
                    stats['queues'][queue_name] = queue_stats
                    
                    # Add to totals
                    stats['total_queued'] += queued_count
                    stats['total_started'] += started_count
                    stats['total_finished'] += finished_count
                    stats['total_failed'] += failed_count
            
            return stats
            
        except Exception as e:
            logger.error(f"Error getting queue stats: {str(e)}")
            return stats
    
    def cleanup_old_jobs(self, older_than_days: int = 7, dry_run: bool = True) -> Dict[str, int]:
        """
        Clean up old job results to free memory
        
        Args:
            older_than_days: Remove jobs older than this many days
            dry_run: If True, only count jobs to be removed
            
        Returns:
            Dict with cleanup statistics
        """
        cutoff_date = datetime.utcnow() - timedelta(days=older_than_days)
        
        stats = {
            'total_scanned': 0,
            'total_removed': 0,
            'finished_removed': 0,
            'failed_removed': 0,
            'errors': 0
        }
        
        config = get_config()
        queue_names = [config.default_queue, config.high_priority_queue, "low"]
        
        try:
            with Connection(self.redis_conn):
                for queue_name in queue_names:
                    queue = Queue(queue_name, connection=self.redis_conn)
                    
                    # Check finished jobs
                    for job_id in queue.finished_job_registry.get_job_ids():
                        try:
                            stats['total_scanned'] += 1
                            job = Job.fetch(job_id)
                            
                            if job.ended_at and job.ended_at < cutoff_date:
                                if not dry_run:
                                    job.delete()
                                stats['total_removed'] += 1
                                stats['finished_removed'] += 1
                                
                        except NoSuchJobError:
                            continue
                        except Exception as e:
                            stats['errors'] += 1
                            logger.error(f"Error processing job {job_id}: {str(e)}")
                    
                    # Check failed jobs
                    for job_id in queue.failed_job_registry.get_job_ids():
                        try:
                            stats['total_scanned'] += 1
                            job = Job.fetch(job_id)
                            
                            if job.ended_at and job.ended_at < cutoff_date:
                                if not dry_run:
                                    job.delete()
                                stats['total_removed'] += 1
                                stats['failed_removed'] += 1
                                
                        except NoSuchJobError:
                            continue
                        except Exception as e:
                            stats['errors'] += 1
                            logger.error(f"Error processing job {job_id}: {str(e)}")
            
            action = "Would remove" if dry_run else "Removed"
            logger.info(f"{action} {stats['total_removed']} old jobs (scanned {stats['total_scanned']})")
            
            return stats
            
        except Exception as e:
            logger.error(f"Error during cleanup: {str(e)}")
            stats['errors'] += 1
            return stats


# Global result manager instance
_result_manager: Optional[JobResultManager] = None


def get_result_manager() -> JobResultManager:
    """Get global result manager instance"""
    global _result_manager
    if _result_manager is None:
        _result_manager = JobResultManager()
    return _result_manager


# Convenience functions
def get_job_result(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job result by ID"""
    return get_result_manager().get_job_result(job_id)


def get_job_status(job_id: str) -> Optional[str]:
    """Get job status by ID"""
    return get_result_manager().get_job_status(job_id)


def list_recent_jobs(queue_names: List[str] = None, limit: int = 50) -> List[Dict[str, Any]]:
    """List recent jobs"""
    return get_result_manager().list_recent_jobs(queue_names, limit)


def get_job_progress(job_id: str) -> Optional[Dict[str, Any]]:
    """Get job progress"""
    return get_result_manager().get_job_progress(job_id)


def search_jobs(**kwargs) -> List[Dict[str, Any]]:
    """Search jobs by criteria"""
    return get_result_manager().search_jobs(**kwargs)


def get_queue_stats(queue_names: List[str] = None) -> Dict[str, Any]:
    """Get queue statistics"""
    return get_result_manager().get_queue_stats(queue_names)


def cleanup_old_jobs(older_than_days: int = 7, dry_run: bool = True) -> Dict[str, int]:
    """Clean up old jobs"""
    return get_result_manager().cleanup_old_jobs(older_than_days, dry_run)