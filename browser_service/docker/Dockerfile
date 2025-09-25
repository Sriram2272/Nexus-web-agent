# NexusAI Browser Service Docker Image
# Based on official Playwright Python image with Chrome dependencies

FROM mcr.microsoft.com/playwright/python:v1.40.0-focal

# Set working directory
WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    # Additional fonts for better rendering
    fonts-noto-color-emoji \
    fonts-noto-cjk \
    fonts-liberation \
    fonts-roboto \
    # Security and networking tools
    ca-certificates \
    curl \
    wget \
    # Process management
    supervisor \
    # Cleanup
    && rm -rf /var/lib/apt/lists/*

# Copy requirements and install Python dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Playwright browsers (already included in base image, but ensure latest)
RUN playwright install --with-deps chromium firefox webkit

# Create directories for browser service
RUN mkdir -p /app/browser_videos \
    /app/screenshots \
    /app/sessions \
    /app/logs \
    /tmp/browser_cache

# Copy browser service code
COPY . /app/browser_service/

# Set environment variables for containerized operation
ENV PLAYWRIGHT_HEADLESS=true
ENV PLAYWRIGHT_BROWSER=chromium
ENV BROWSER_TIMEOUT=30000
ENV VIDEO_DIR=/app/browser_videos
ENV SESSIONS_DIR=/app/sessions
ENV SCREENSHOTS_DIR=/app/screenshots
ENV LOGS_DIR=/app/logs
ENV ALLOW_EXTERNAL_NETWORK=true
ENV DEBUG_MODE=false

# Security: Create non-root user for browser operations
RUN groupadd -r browser && useradd -r -g browser -G audio,video browser \
    && chown -R browser:browser /app \
    && chmod -R 755 /app

# Copy entrypoint script
COPY docker/entrypoint.sh /entrypoint.sh
RUN chmod +x /entrypoint.sh

# Expose port for health checks (optional)
EXPOSE 8080

# Use non-root user
USER browser

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=60s --retries=3 \
    CMD python -c "from browser_service.tools import tool_healthcheck; import sys; sys.exit(0 if tool_healthcheck()['status'] == 'healthy' else 1)"

# Default command
ENTRYPOINT ["/entrypoint.sh"]
CMD ["python", "-m", "browser_service.service"]