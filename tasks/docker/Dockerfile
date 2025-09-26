# NexusAI Task Queue Docker Image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    gcc \
    g++ \
    make \
    curl \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first for better caching
COPY tasks/requirements.txt ./requirements.txt

# Install Python dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy task queue code
COPY tasks/ ./tasks/

# Create necessary directories
RUN mkdir -p logs exports sessions

# Copy main application file for API service
COPY main.py ./

# Set environment variables
ENV PYTHONPATH=/app
ENV PYTHONUNBUFFERED=1

# Create non-root user for security
RUN groupadd -r nexus && useradd -r -g nexus nexus \
    && chown -R nexus:nexus /app

USER nexus

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
    CMD python -c "from tasks.config import get_config; import redis; redis.from_url(get_config().redis_url).ping()" || exit 1

# Default command (can be overridden)
CMD ["python", "-m", "tasks.worker"]

# Multi-stage build for smaller production image
# FROM python:3.11-slim as production
# 
# WORKDIR /app
# 
# # Copy only necessary files from build stage
# COPY --from=0 /app/tasks ./tasks
# COPY --from=0 /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
# COPY --from=0 /usr/local/bin /usr/local/bin
# 
# # Create directories and user
# RUN mkdir -p logs exports sessions \
#     && groupadd -r nexus && useradd -r -g nexus nexus \
#     && chown -R nexus:nexus /app
# 
# USER nexus
# 
# ENV PYTHONPATH=/app
# ENV PYTHONUNBUFFERED=1
# 
# CMD ["python", "-m", "tasks.worker"]