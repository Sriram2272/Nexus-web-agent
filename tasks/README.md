# NexusAI Task Queue System

A Redis-based task queue and scheduler using RQ (Redis Queue) for handling long-running operations like web scraping, data processing, and orchestration.

## Features

- **Job Queue**: Enqueue jobs for immediate or delayed execution
- **Scheduler**: Schedule jobs at specific times or with cron expressions  
- **Multiple Priorities**: Support for default, high, and low priority queues
- **Progress Tracking**: Real-time job progress updates via metadata
- **Result Storage**: Persistent job results with TTL management
- **REST API**: FastAPI endpoints for job management
- **Docker Support**: Complete Docker Compose setup with Redis
- **Monitoring**: Integration with RQ Dashboard for job inspection
- **Graceful Shutdown**: Proper signal handling for worker processes
- **Rate Limiting**: Configurable rate limiting for external requests

## Quick Start

### Using Docker Compose (Recommended)

1. **Start the services:**
   ```bash
   cd tasks/docker
   docker-compose up -d
   ```

2. **Check service status:**
   ```bash
   docker-compose ps
   ```

3. **View logs:**
   ```bash
   docker-compose logs -f worker
   docker-compose logs -f api
   ```

4. **Access services:**
   - API Documentation: http://localhost:8000/docs
   - RQ Dashboard: http://localhost:9181
   - Redis: localhost:6379

### Local Development

1. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

2. **Start Redis:**
   ```bash
   docker run -d -p 6379:6379 redis:7-alpine
   ```

3. **Start worker:**
   ```bash
   python -m tasks.worker --queues default high
   ```

4. **Start scheduler (optional):**
   ```bash
   python -m tasks.scheduler
   ```

5. **Start API server:**
   ```bash
   uvicorn tasks.main:app --reload --host 0.0.0.0 --port 8000
   ```

## Usage Examples

### Using the REST API

**Enqueue immediate job:**
```bash
curl -X POST "http://localhost:8000/queue/enqueue" \
     -H "Content-Type: application/json" \
     -d '{
       "job_name": "health_check",
       "payload": {},
       "priority": "default"
     }'
```

**Schedule future job:**
```bash
curl -X POST "http://localhost:8000/queue/schedule" \
     -H "Content-Type: application/json" \
     -d '{
       "job_name": "scrape_page",
       "payload": {
         "url": "https://example.com",
         "session_id": "user123"
       },
       "run_at": "2025-10-01T12:00:00Z"
     }'
```

**Check job status:**
```bash
curl "http://localhost:8000/queue/job/{job_id}"
```

**List recent jobs:**
```bash
curl "http://localhost:8000/queue/list?page=1&page_size=10"
```

**Get queue statistics:**
```bash
curl "http://localhost:8000/queue/stats"
```

### Using Python API

```python
from tasks.queue_api import get_queue
from tasks.jobs import run_plan, scrape_page

# Get queue instance
queue = get_queue("default")

# Enqueue immediate job
job = queue.enqueue(run_plan, 
                   task_id="task_123", 
                   plan=[{"step_id": 1, "tool": "search", "args": {"query": "test"}}])

print(f"Job enqueued: {job.id}")

# Check job result
result = job.result  # Blocks until complete
print(f"Result: {result}")
```

### Scheduling Jobs

```python
from tasks.scheduler import get_scheduler
from tasks.jobs import export_results
from datetime import datetime, timedelta

scheduler = get_scheduler()

# Schedule job for specific time
job = scheduler.enqueue_at(
    datetime.utcnow() + timedelta(hours=1),
    export_results,
    task_id="export_123",
    format="json"
)

# Schedule recurring job (requires rq_scheduler)
scheduler.cron("0 */6 * * *",  # Every 6 hours
               export_results,
               task_id="daily_export",
               format="csv")
```

## Configuration

Environment variables (create `.env` file):

```bash
# Redis Configuration
REDIS_URL=redis://localhost:6379/0

# Queue Configuration  
DEFAULT_QUEUE=default
HIGH_PRIORITY_QUEUE=high

# Worker Configuration
WORKER_COUNT=2
WORKER_TIMEOUT=300

# Retry Policy
RETRY_COUNT=3
RETRY_BACKOFF=60

# Scheduler
SCHEDULER_ENABLED=true
SCHEDULER_INTERVAL=1

# Rate Limiting
RATE_LIMIT_ENABLED=true
RATE_LIMIT_WINDOW=60
RATE_LIMIT_MAX_REQUESTS=10

# Job TTL
JOB_TTL=86400
RESULT_TTL=604800

# Logging
LOG_LEVEL=INFO
```

## Available Jobs

The system includes these predefined job functions:

1. **`run_plan`**: Execute orchestration plans
   ```python
   plan = [{"step_id": 1, "tool": "search", "args": {"query": "laptops under 50000"}}]
   job = queue.enqueue(run_plan, task_id="task_123", plan=plan, session_id="user123")
   ```

2. **`scrape_page`**: Web scraping with Playwright
   ```python
   job = queue.enqueue(scrape_page, url="https://example.com", session_id="user123")
   ```

3. **`export_results`**: Export task results
   ```python
   job = queue.enqueue(export_results, task_id="task_123", format="json")
   ```

4. **`health_check`**: System health verification
   ```python
   job = queue.enqueue(health_check)
   ```

## Job Progress Tracking

Jobs can report progress via metadata:

```python
from rq import get_current_job

def my_job(items):
    job = get_current_job()
    total = len(items)
    
    for i, item in enumerate(items):
        # Process item
        process_item(item)
        
        # Update progress
        if job:
            progress = int((i + 1) / total * 100)
            job.meta['progress'] = progress
            job.meta['current_item'] = item
            job.save_meta()
```

Check progress via API:
```bash
curl "http://localhost:8000/queue/job/{job_id}"
```

## Monitoring and Debugging

### RQ Dashboard

Access the RQ Dashboard at http://localhost:9181 to:
- View job queues and status
- Monitor worker activity  
- Inspect job details and results
- Cancel or retry jobs

### Logging

Logs are available in several places:
- Container logs: `docker-compose logs worker`
- Application logs: Check `/app/logs/` in containers
- Redis logs: `docker-compose logs redis`

### Health Checks

Check system health:
```bash
curl "http://localhost:8000/queue/health"
```

## Production Deployment

### Docker Compose Production

Create `docker-compose.prod.yml`:
```yaml
version: '3.8'
services:
  redis:
    volumes:
      - /data/redis:/data
    restart: always
    
  worker:
    environment:
      - WORKER_COUNT=4
      - LOG_LEVEL=WARNING
    deploy:
      replicas: 3
      resources:
        limits:
          memory: 1G
        reservations:
          memory: 512M
          
  api:
    environment:
      - LOG_LEVEL=WARNING
    deploy:
      replicas: 2
```

Deploy:
```bash
docker-compose -f docker-compose.yml -f docker-compose.prod.yml up -d
```

### Scaling Workers

Scale worker containers:
```bash
docker-compose up --scale worker=4
```

### Security Considerations

1. **Redis Security**: Use Redis AUTH and TLS in production
2. **API Authentication**: Add authentication middleware to FastAPI
3. **Input Validation**: All job payloads are validated with Pydantic
4. **Job Whitelisting**: Only predefined job functions can be executed
5. **Rate Limiting**: Configure rate limits for external requests

## Celery Migration Guide

To migrate from RQ to Celery later:

### 1. Install Celery
```bash
pip install celery[redis]
```

### 2. Create Celery App
```python
# celery_app.py
from celery import Celery

app = Celery('nexus_tasks')
app.config_from_object('celeryconfig')

@app.task(bind=True, max_retries=3)
def run_plan(self, task_id, plan, session_id=None):
    # Migrate job implementation
    pass

# Schedule task
from datetime import datetime, timedelta
run_plan.apply_async(
    args=[task_id, plan], 
    eta=datetime.utcnow() + timedelta(hours=1)
)
```

### 3. Replace Components
- Replace `queue.enqueue()` with `task.delay()` or `task.apply_async()`
- Replace RQ Scheduler with Celery Beat
- Replace RQ Worker with `celery worker`
- Replace RQ Dashboard with Celery Flower

### 4. Start Services
```bash
# Worker
celery -A celery_app worker --loglevel=info

# Scheduler  
celery -A celery_app beat --loglevel=info

# Monitoring
celery -A celery_app flower
```

### Trade-offs

**RQ Advantages:**
- Simpler setup and configuration
- Lightweight and fast for basic use cases
- Great integration with Redis
- Easy debugging and monitoring

**Celery Advantages:**
- More advanced features (workflows, canvas)
- Better monitoring with Flower
- More flexible routing and scaling
- Built-in beat scheduler

**Migration Timeline:**
- Phase 1: Use RQ for initial development and testing
- Phase 2: Migrate to Celery when advanced features needed
- Phase 3: Implement complex workflows with Celery canvas

## Testing

Run tests:
```bash
# Unit tests
python -m pytest tasks/tests/

# Integration tests with Docker
docker-compose -f docker-compose.yml -f docker-compose.test.yml up --abort-on-container-exit
```

## Troubleshooting

### Common Issues

1. **Redis Connection Failed**
   - Check Redis is running: `docker ps | grep redis`
   - Verify Redis URL in config
   - Test connection: `redis-cli ping`

2. **Jobs Not Processing**
   - Check worker is running: `docker-compose ps worker`
   - Verify queue names match
   - Check worker logs: `docker-compose logs worker`

3. **Scheduler Not Working**
   - Ensure `SCHEDULER_ENABLED=true`
   - Check scheduler logs: `docker-compose logs scheduler`
   - Verify rq_scheduler is installed for advanced features

4. **API Errors**
   - Check job names are in whitelist (config.py)
   - Verify payload format matches Pydantic models
   - Check API logs: `docker-compose logs api`

### Performance Tuning

1. **Redis Memory**: Configure Redis `maxmemory` and eviction policy
2. **Worker Count**: Scale based on CPU cores and job types
3. **Job Timeout**: Adjust timeouts for long-running jobs
4. **Result TTL**: Configure TTL to balance storage vs. history needs

For more help, check the logs or create an issue in the repository.