"""
Tests for NexusAI Task Queue functionality
"""
import pytest
import json
import time
from datetime import datetime, timedelta
from unittest.mock import patch, MagicMock
from rq import Queue, Worker
from rq.job import Job
import redis

from tasks.config import get_config, TaskConfig
from tasks.jobs import run_plan, scrape_page, export_results, health_check
from tasks.scheduler import NexusScheduler
from tasks.results import JobResultManager
from tasks.queue_api import router as queue_router


class TestConfig:
    """Test configuration management"""
    
    def test_default_config(self):
        """Test default configuration values"""
        config = TaskConfig()
        
        assert config.redis_url == "redis://redis:6379/0"
        assert config.default_queue == "default"
        assert config.retry_count == 3
        assert config.scheduler_enabled == True
    
    def test_config_from_env(self, monkeypatch):
        """Test configuration from environment variables"""
        monkeypatch.setenv("REDIS_URL", "redis://localhost:6379/1")
        monkeypatch.setenv("DEFAULT_QUEUE", "test_queue")
        monkeypatch.setenv("RETRY_COUNT", "5")
        
        config = TaskConfig()
        
        assert config.redis_url == "redis://localhost:6379/1"
        assert config.default_queue == "test_queue"
        assert config.retry_count == 5


class TestJobs:
    """Test job functions"""
    
    @pytest.fixture
    def mock_job(self):
        """Mock RQ job object"""
        job = MagicMock()
        job.id = "test-job-123"
        job.meta = {}
        job.save_meta = MagicMock()
        return job
    
    def test_health_check(self):
        """Test health check job"""
        result = health_check()
        
        assert result["status"] == "healthy"
        assert "timestamp" in result
        assert "job_id" in result
    
    @patch('tasks.jobs.get_current_job')
    def test_run_plan(self, mock_get_job, mock_job):
        """Test plan execution job"""
        mock_get_job.return_value = mock_job
        
        plan = [
            {"step_id": 1, "tool": "search", "args": {"query": "test"}},
            {"step_id": 2, "tool": "open", "args": {"url": "https://example.com"}}
        ]
        
        result = run_plan("task_123", plan, "session_123")
        
        assert result["task_id"] == "task_123"
        assert result["status"] == "completed"
        assert len(result["steps"]) == 2
        assert result["total_steps"] == 2
        
        # Verify job meta was updated
        assert mock_job.save_meta.called
    
    @patch('tasks.jobs.get_current_job')
    def test_scrape_page(self, mock_get_job, mock_job):
        """Test page scraping job"""
        mock_get_job.return_value = mock_job
        
        result = scrape_page("https://example.com", "session_123")
        
        assert result["url"] == "https://example.com"
        assert result["status"] == "success"
        assert result["session_id"] == "session_123"
        assert "scraped_at" in result
    
    @patch('tasks.jobs.get_current_job')
    def test_export_results(self, mock_get_job, mock_job):
        """Test results export job"""
        mock_get_job.return_value = mock_job
        
        result = export_results("task_123", "json")
        
        assert result["task_id"] == "task_123"
        assert result["format"] == "json"
        assert result["status"] == "success"
        assert "output_path" in result
        assert result["output_path"].endswith(".json")


@pytest.mark.skipif(
    not pytest.config.getoption("--run-redis", default=False),
    reason="Redis tests require --run-redis flag"
)
class TestWithRedis:
    """Tests that require Redis connection"""
    
    @pytest.fixture
    def redis_conn(self):
        """Redis connection for testing"""
        try:
            conn = redis.from_url("redis://localhost:6379/15")  # Use test DB
            conn.ping()
            yield conn
            # Cleanup
            conn.flushdb()
        except redis.ConnectionError:
            pytest.skip("Redis not available for testing")
    
    @pytest.fixture
    def test_queue(self, redis_conn):
        """Test RQ queue"""
        return Queue("test", connection=redis_conn)
    
    def test_job_enqueue(self, test_queue):
        """Test job enqueueing"""
        job = test_queue.enqueue(health_check)
        
        assert job.id is not None
        assert job.func_name == "tasks.jobs.health_check"
        assert job.get_status() == "queued"
    
    def test_job_execution(self, test_queue, redis_conn):
        """Test job execution with worker"""
        # Enqueue job
        job = test_queue.enqueue(health_check)
        
        # Create worker and process job
        worker = Worker([test_queue], connection=redis_conn)
        worker.work(burst=True)  # Process jobs and exit
        
        # Check result
        assert job.get_status() == "finished"
        assert job.result is not None
        assert job.result["status"] == "healthy"
    
    def test_job_result_manager(self, test_queue):
        """Test job result management"""
        # Enqueue some jobs
        job1 = test_queue.enqueue(health_check)
        job2 = test_queue.enqueue(scrape_page, "https://example.com")
        
        result_manager = JobResultManager(redis_conn=test_queue.connection)
        
        # Test job status retrieval
        status = result_manager.get_job_status(job1.id)
        assert status == "queued"
        
        # Test job listing
        jobs = result_manager.list_recent_jobs(queue_names=["test"], limit=10)
        assert len(jobs) >= 2
        
        job_ids = [j["job_id"] for j in jobs]
        assert job1.id in job_ids
        assert job2.id in job_ids
    
    def test_scheduler_basic(self, redis_conn):
        """Test basic scheduler functionality"""
        scheduler = NexusScheduler(redis_conn=redis_conn, queue_name="test")
        
        # Schedule job for near future
        run_time = datetime.utcnow() + timedelta(seconds=2)
        job = scheduler.enqueue_at(run_time, health_check)
        
        assert job is not None
        
        # If using basic scheduler, check it's stored
        if not hasattr(scheduler, 'scheduler') or scheduler.scheduler is None:
            # Basic scheduler - check Redis storage
            scheduled_jobs = redis_conn.zrange("scheduled_jobs", 0, -1)
            assert len(scheduled_jobs) >= 1
    
    def test_queue_stats(self, test_queue):
        """Test queue statistics"""
        # Enqueue some jobs
        job1 = test_queue.enqueue(health_check)
        job2 = test_queue.enqueue(health_check)
        
        result_manager = JobResultManager(redis_conn=test_queue.connection)
        stats = result_manager.get_queue_stats(queue_names=["test"])
        
        assert "queues" in stats
        assert "test" in stats["queues"]
        assert stats["queues"]["test"]["queued"] >= 2
        assert stats["total_queued"] >= 2


@pytest.mark.asyncio
class TestAPI:
    """Test FastAPI endpoints"""
    
    @pytest.fixture
    def mock_redis(self):
        """Mock Redis connection"""
        with patch('tasks.queue_api.get_redis_connection') as mock:
            mock_conn = MagicMock()
            mock.return_value = mock_conn
            yield mock_conn
    
    @pytest.fixture  
    def mock_queue(self):
        """Mock RQ queue"""
        with patch('tasks.queue_api.get_queue') as mock:
            mock_q = MagicMock()
            mock_job = MagicMock()
            mock_job.id = "test-job-123"
            mock_job.get_status.return_value = "queued"
            mock_job.created_at = datetime.utcnow()
            mock_q.enqueue.return_value = mock_job
            mock_q.name = "default"
            mock.return_value = mock_q
            yield mock_q
    
    async def test_enqueue_job(self, mock_queue):
        """Test job enqueueing endpoint"""
        from fastapi.testclient import TestClient
        from tasks.main import app
        
        client = TestClient(app)
        
        response = client.post("/queue/enqueue", json={
            "job_name": "health_check",
            "payload": {},
            "priority": "default"
        })
        
        assert response.status_code == 200
        data = response.json()
        assert data["job_id"] == "test-job-123"
        assert data["status"] == "queued"
    
    async def test_invalid_job_name(self):
        """Test validation of job names"""
        from fastapi.testclient import TestClient
        from tasks.main import app
        
        client = TestClient(app)
        
        response = client.post("/queue/enqueue", json={
            "job_name": "invalid_job",
            "payload": {},
            "priority": "default"
        })
        
        assert response.status_code == 422  # Validation error
    
    async def test_health_endpoint(self, mock_redis):
        """Test health check endpoint"""
        from fastapi.testclient import TestClient
        from tasks.main import app
        
        mock_redis.ping.return_value = True
        
        client = TestClient(app)
        response = client.get("/queue/health")
        
        assert response.status_code == 200
        data = response.json()
        assert data["status"] == "healthy"
        assert data["redis"] == "connected"


class TestJobValidation:
    """Test job validation and security"""
    
    def test_allowed_jobs_only(self):
        """Test that only whitelisted jobs are allowed"""
        from tasks.jobs import get_job_function
        from tasks.config import ALLOWED_JOBS
        
        # Should work for allowed jobs
        for job_name in ALLOWED_JOBS:
            func = get_job_function(job_name)
            assert callable(func)
        
        # Should fail for disallowed jobs  
        with pytest.raises(ValueError, match="Unknown job"):
            get_job_function("malicious_job")
    
    def test_job_payload_validation(self):
        """Test job payload validation"""
        from tasks.queue_api import EnqueueRequest
        import pydantic
        
        # Valid request
        request = EnqueueRequest(
            job_name="health_check",
            payload={"arg1": "value1"},
            priority="default"
        )
        assert request.job_name == "health_check"
        
        # Invalid job name
        with pytest.raises(pydantic.ValidationError):
            EnqueueRequest(job_name="invalid_job", payload={})
        
        # Invalid priority
        with pytest.raises(pydantic.ValidationError):
            EnqueueRequest(job_name="health_check", priority="invalid")


# Pytest configuration
def pytest_addoption(parser):
    """Add command line options for tests"""
    parser.addoption(
        "--run-redis", 
        action="store_true", 
        default=False, 
        help="Run tests that require Redis"
    )


def pytest_configure(config):
    """Configure pytest"""
    config.addinivalue_line(
        "markers", "redis: mark test as requiring Redis connection"
    )


def pytest_collection_modifyitems(config, items):
    """Modify test collection based on options"""
    if config.getoption("--run-redis"):
        # Don't skip Redis tests
        return
    
    skip_redis = pytest.mark.skip(reason="need --run-redis option to run")
    for item in items:
        if "redis" in item.keywords:
            item.add_marker(skip_redis)


# Integration test fixtures
@pytest.fixture(scope="session")
def docker_compose_file(pytestconfig):
    """Docker compose file for integration tests"""
    return "docker-compose.test.yml"


@pytest.fixture(scope="session") 
def docker_compose_project_name():
    """Project name for Docker compose"""
    return "nexus_test"


# Mock fixtures for testing without external dependencies
@pytest.fixture
def mock_browser_service():
    """Mock browser service for job testing"""
    with patch('browser_service.service.BrowserService') as mock:
        mock_service = MagicMock()
        mock_service.open_url.return_value = "<html>Test page</html>"
        mock_service.screenshot.return_value = "/path/to/screenshot.png"
        mock.return_value = mock_service
        yield mock_service


@pytest.fixture
def mock_orchestrator():
    """Mock orchestrator for job testing"""
    with patch('brain.orchestrator.executor.execute_plan') as mock:
        mock_result = {
            "task_id": "test_task",
            "status": "completed",
            "steps": [],
            "total_steps": 0
        }
        mock.return_value = mock_result
        yield mock


# Performance test utilities
def measure_execution_time(func, *args, **kwargs):
    """Utility to measure function execution time"""
    start_time = time.time()
    result = func(*args, **kwargs)
    end_time = time.time()
    return result, end_time - start_time


class TestPerformance:
    """Performance tests for task queue"""
    
    @pytest.mark.skipif(
        not pytest.config.getoption("--run-redis", default=False),
        reason="Performance tests require --run-redis flag"
    )
    def test_job_throughput(self, test_queue):
        """Test job enqueueing throughput"""
        num_jobs = 100
        
        _, execution_time = measure_execution_time(
            lambda: [test_queue.enqueue(health_check) for _ in range(num_jobs)]
        )
        
        jobs_per_second = num_jobs / execution_time
        print(f"Enqueued {num_jobs} jobs in {execution_time:.2f}s ({jobs_per_second:.1f} jobs/sec)")
        
        # Should be able to enqueue at least 50 jobs per second
        assert jobs_per_second > 50