#!/bin/bash

# NexusAI Browser Service Docker Entrypoint
# Handles initialization and graceful shutdown

set -e

# Function to handle shutdown signals
cleanup() {
    echo "Received shutdown signal, cleaning up..."
    
    # Kill any running browser processes
    pkill -f "chromium\|firefox\|webkit" || true
    
    # Clean up temporary files
    rm -rf /tmp/browser_cache/* || true
    
    echo "Cleanup completed"
    exit 0
}

# Set up signal handlers
trap cleanup SIGTERM SIGINT

# Create required directories with proper permissions
mkdir -p "$VIDEO_DIR" "$SESSIONS_DIR" "$SCREENSHOTS_DIR" "$LOGS_DIR"

# Set up browser cache directory
export PLAYWRIGHT_BROWSERS_PATH="/tmp/browser_cache"
mkdir -p "$PLAYWRIGHT_BROWSERS_PATH"

# Configure logging
export PYTHONUNBUFFERED=1

# Print configuration
echo "=== NexusAI Browser Service Starting ==="
echo "Browser: $PLAYWRIGHT_BROWSER"
echo "Headless: $PLAYWRIGHT_HEADLESS"
echo "Timeout: $BROWSER_TIMEOUT ms"
echo "Video Dir: $VIDEO_DIR"
echo "Sessions Dir: $SESSIONS_DIR"
echo "Screenshots Dir: $SCREENSHOTS_DIR"
echo "Logs Dir: $LOGS_DIR"
echo "Debug Mode: $DEBUG_MODE"
echo "========================================="

# Check if browsers are properly installed
echo "Checking browser installations..."
python -c "
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
    browser_type = '$PLAYWRIGHT_BROWSER'
    if browser_type == 'chromium':
        browser = p.chromium
    elif browser_type == 'firefox':
        browser = p.firefox
    elif browser_type == 'webkit':
        browser = p.webkit
    else:
        browser = p.chromium
    
    try:
        b = browser.launch(headless=True)
        print(f'{browser_type.title()} browser: OK')
        b.close()
    except Exception as e:
        print(f'{browser_type.title()} browser: ERROR - {e}')
        exit(1)
"

echo "Browser check completed successfully"

# Start the service based on command
if [ "$1" = "python" ] && [ "$2" = "-m" ] && [ "$3" = "browser_service.service" ]; then
    echo "Starting browser service in daemon mode..."
    
    # Create a simple health check server if needed
    if [ "$ENABLE_HEALTH_SERVER" = "true" ]; then
        echo "Starting health check server on port 8080..."
        python -c "
import asyncio
import json
from aiohttp import web
from browser_service.tools import tool_healthcheck

async def health_handler(request):
    health = tool_healthcheck()
    return web.json_response(health)

async def init_app():
    app = web.Application()
    app.router.add_get('/health', health_handler)
    app.router.add_get('/healthz', health_handler)
    return app

if __name__ == '__main__':
    web.run_app(init_app(), host='0.0.0.0', port=8080)
" &
    fi
    
    # Start the main service
    python -c "
import asyncio
import signal
import sys
from browser_service.service import BrowserService

async def main():
    service = BrowserService()
    
    # Set up signal handlers
    def signal_handler():
        print('Received shutdown signal')
        asyncio.create_task(service.stop())
    
    for sig in [signal.SIGTERM, signal.SIGINT]:
        signal.signal(sig, lambda s, f: signal_handler())
    
    try:
        await service.start()
        print('Browser service started successfully')
        
        # Keep the service running
        while True:
            await asyncio.sleep(10)
            
            # Periodic cleanup
            if service.session_manager:
                await service.session_manager.cleanup_expired_sessions()
                
    except KeyboardInterrupt:
        print('Service interrupted')
    finally:
        await service.stop()
        print('Service stopped')

if __name__ == '__main__':
    asyncio.run(main())
"

elif [ "$1" = "test" ]; then
    echo "Running browser service tests..."
    cd /app
    python -m pytest browser_service/tests/ -v
    
elif [ "$1" = "demo" ]; then
    echo "Running browser service demo..."
    python -c "
from browser_service.tools import *
import time

print('=== Browser Service Demo ===')

# Health check
print('Health check:', tool_healthcheck())

# Search demo
print('\\nSearching for Python tutorials...')
results = tool_search('python programming tutorial', top_k=3)
for i, result in enumerate(results, 1):
    print(f'{i}. {result[\"title\"]}')
    print(f'   {result[\"url\"]}')

# Screenshot demo
print('\\nTaking screenshot...')
screenshot_path = tool_screenshot('https://example.com')
print(f'Screenshot saved: {screenshot_path}')

# Extract demo
print('\\nExtracting content...')
extracted = tool_extract('https://example.com', 'h1')
print(f'Extracted: {extracted}')

print('\\nDemo completed successfully!')
"

else
    # Execute the provided command
    exec "$@"
fi

# Keep the container running if we reach here
wait