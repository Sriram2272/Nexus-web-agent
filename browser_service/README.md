# NexusAI Browser Service

A comprehensive browser automation package for NexusAI using Playwright. Provides hands-on web interaction capabilities including search, extraction, screenshots, video recording, and session management.

## 🚀 Features

- **Multi-Browser Support**: Chromium, Firefox, and WebKit
- **Session Management**: Isolated contexts with persistent storage
- **Search Integration**: Built-in support for DuckDuckGo, Google, and Bing
- **Content Extraction**: CSS selector-based data extraction
- **Media Capture**: Screenshots and video recording
- **Security Features**: Robots.txt compliance, CAPTCHA detection, rate limiting
- **Docker Support**: Containerized deployment with all dependencies
- **Async & Sync APIs**: Flexible programming interfaces
- **Encryption**: Optional session state encryption

## 📦 Installation

### Basic Installation

```bash
# Install Python dependencies
pip install -r browser_service/requirements.txt

# Install Playwright browsers
playwright install

# For Ubuntu/Debian, install system dependencies
playwright install-deps
```

### Docker Installation

```bash
# Build the Docker image
cd browser_service
docker build -t nexusai-browser -f docker/Dockerfile .

# Run the container
docker run -d \
  --name nexusai-browser \
  -v $(pwd)/screenshots:/app/screenshots \
  -v $(pwd)/sessions:/app/sessions \
  -e PLAYWRIGHT_HEADLESS=true \
  nexusai-browser
```

## 🎯 Quick Start

### Basic Usage

```python
from browser_service.service import BrowserService
import asyncio

async def main():
    # Initialize and start service
    service = BrowserService()
    await service.start()
    
    try:
        # Open a webpage
        html = await service.open_url("demo", "https://example.com")
        print(f"Page loaded: {len(html)} characters")
        
        # Search for information
        results = await service.search("demo", "duckduckgo", "python tutorial", top_k=5)
        for result in results:
            print(f"- {result['title']}: {result['url']}")
        
        # Take a screenshot
        screenshot_path = await service.screenshot("demo", "https://example.com")
        print(f"Screenshot saved: {screenshot_path}")
        
        # Extract content
        extracted = service.extract(html, "h1, h2")
        print(f"Extracted headings: {extracted}")
        
    finally:
        await service.stop()

# Run the example
asyncio.run(main())
```

### Synchronous API

```python
from browser_service.service import SyncBrowserService

# Synchronous wrapper for easier integration
service = SyncBrowserService()
service.start()

try:
    # All the same methods, but synchronous
    html = service.open_url("session1", "https://example.com")
    results = service.search("session1", "duckduckgo", "machine learning")
    screenshot = service.screenshot("session1", "https://example.com")
finally:
    service.stop()
```

### Tool Wrappers (Simplest API)

```python
from browser_service.tools import *

# Simple function calls (handles service lifecycle automatically)
results = tool_search("python programming tutorial", top_k=3)
html = tool_open("https://example.com")
extracted = tool_extract(html, ".main-content")
screenshot = tool_screenshot("https://example.com")

# Context manager for session isolation
with BrowserSession("my_session") as session:
    html = session.open("https://example.com")
    results = session.search("machine learning")
    extracted = session.extract(html, "h1")
```

## 🔧 Configuration

Configure via environment variables:

```bash
# Browser settings
export PLAYWRIGHT_HEADLESS=true          # Run headlessly
export PLAYWRIGHT_BROWSER=chromium       # Browser type (chromium|firefox|webkit)
export BROWSER_TIMEOUT=30000            # Page timeout (ms)

# Storage directories
export VIDEO_DIR=./browser_videos       # Video recordings
export SESSIONS_DIR=./sessions          # Session storage
export SCREENSHOTS_DIR=./screenshots   # Screenshots
export LOGS_DIR=./logs                  # Log files

# Security and rate limiting
export RESPECT_ROBOTS_TXT=true          # Honor robots.txt
export RATE_LIMIT_DELAY=1.0            # Delay between requests (seconds)
export SESSION_ENCRYPTION_KEY=<key>    # Encrypt session storage

# Performance
export VIEWPORT_WIDTH=1280              # Browser viewport width
export VIEWPORT_HEIGHT=720             # Browser viewport height
export MAX_RETRIES=3                   # Retry attempts
```

## 📚 API Reference

### BrowserService Class

#### Core Methods

```python
# Service lifecycle
await service.start()
await service.stop()

# Page operations
html = await service.open_url(session_id, url, wait_for=selector)
results = await service.search(session_id, engine, query, top_k=5)
extracted = service.extract(html, css_selector)

# Media capture
screenshot_path = await service.screenshot(session_id, url, path=None, clip=None)
video_path = await service.record_video(session_id, url, duration=10)

# Interactions
await service.click(session_id, url, selector)
await service.type(session_id, url, selector, text)

# Health and monitoring
health = await service.healthcheck()
```

#### Session Management

```python
# Sessions are created automatically, but you can manage them:
session_info = service.session_manager.get_session_info(session_id)
await service.session_manager.save_storage_state(session_id)
await service.session_manager.close_session(session_id)
```

### Tool Functions

```python
# Search engines
results = tool_search(query, engine="duckduckgo", top_k=5)

# Page operations
html = tool_open(url, wait_for=None)
extracted = tool_extract(url_or_html, selector)

# Media capture
screenshot_path = tool_screenshot(url, path=None, clip=None)
video_path = tool_record_video(url, duration=10)

# Interactions
success = tool_click(url, selector)
success = tool_type(url, selector, text)

# Utilities
health = tool_healthcheck()
cleanup_browser_service()  # Call on app shutdown
```

### Advanced Workflows

```python
# Quick search and extract from results
results = quick_search_and_extract(
    query="best laptops 2024",
    extract_selector=".product-name, .price",
    top_k=5
)

# Batch screenshots
urls = ["https://site1.com", "https://site2.com", "https://site3.com"]
screenshots = batch_screenshot(urls, output_dir="./batch_shots")
```

## 🐳 Docker Usage

### Build and Run

```bash
# Build image
docker build -t nexusai-browser -f docker/Dockerfile .

# Run with default settings
docker run --rm nexusai-browser

# Run with custom configuration
docker run --rm \
  -e PLAYWRIGHT_HEADLESS=false \
  -e DEBUG_MODE=true \
  -v $(pwd)/output:/app/screenshots \
  nexusai-browser

# Run demo
docker run --rm nexusai-browser demo

# Run tests
docker run --rm nexusai-browser test
```

### Docker Compose

```yaml
version: '3.8'
services:
  browser-service:
    build:
      context: ./browser_service
      dockerfile: docker/Dockerfile
    environment:
      - PLAYWRIGHT_HEADLESS=true
      - BROWSER_TIMEOUT=30000
      - DEBUG_MODE=false
    volumes:
      - ./screenshots:/app/screenshots
      - ./videos:/app/browser_videos
      - ./sessions:/app/sessions
    healthcheck:
      test: ["CMD", "python", "-c", "from browser_service.tools import tool_healthcheck; import sys; sys.exit(0 if tool_healthcheck()['status'] == 'healthy' else 1)"]
      interval: 30s
      timeout: 10s
      retries: 3
```

## 🔒 Security Features

### Robots.txt Compliance

```python
# Automatically checks robots.txt before scraping
service = BrowserService()
service.config["respect_robots_txt"] = True  # Default

# Override for specific cases
service.config["respect_robots_txt"] = False
```

### CAPTCHA Detection

```python
try:
    html = await service.open_url("session", "https://protected-site.com")
except CaptchaDetectedError:
    print("CAPTCHA detected - manual intervention required")
```

### Rate Limiting

```python
# Automatic rate limiting per domain
service.config["rate_limit_delay"] = 2.0  # 2 seconds between requests
```

### Session Encryption

```bash
# Generate encryption key
python -c "from browser_service.session_manager import SessionEncryption; print(SessionEncryption.generate_key())"

# Use in environment
export SESSION_ENCRYPTION_KEY="your-generated-key-here"
```

## 🧪 Testing

### Run Tests

```bash
# Run all tests
python -m pytest browser_service/tests/ -v

# Run specific test categories
python -m pytest browser_service/tests/test_browser_service.py::TestConfiguration -v

# Skip browser integration tests (for CI)
export PLAYWRIGHT_SKIP_CI=true
python -m pytest browser_service/tests/ -v

# Run with coverage
python -m pytest browser_service/tests/ --cov=browser_service --cov-report=html
```

### Test in Docker

```bash
# Run tests in container
docker run --rm nexusai-browser test

# Run specific tests
docker run --rm nexusai-browser python -m pytest tests/test_browser_service.py::TestConfiguration -v
```

## 🔧 Integration with NexusAI Orchestrator

The browser service integrates seamlessly with the NexusAI orchestrator:

```python
# In your orchestrator tools
from browser_service.tools import tool_search, tool_open, tool_extract, tool_screenshot

def search_tool(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """Search tool for orchestrator."""
    return tool_search(query, top_k=max_results)

def open_tool(url: str, timeout: int = 30) -> str:
    """Open URL tool for orchestrator."""
    return tool_open(url)

def extract_tool(selector: str, html: Optional[str] = None, url: Optional[str] = None) -> List[str]:
    """Extract content tool for orchestrator."""
    if html:
        return tool_extract(html, selector)
    elif url:
        return tool_extract(url, selector)
    else:
        raise ValueError("Either html or url must be provided")

def screenshot_tool(url: str, path: Optional[str] = None, full_page: bool = True) -> str:
    """Screenshot tool for orchestrator."""
    return tool_screenshot(url, path)
```

## 📊 Monitoring and Health Checks

### Health Check Endpoint

```python
from browser_service.tools import tool_healthcheck

health = tool_healthcheck()
print(f"Status: {health['status']}")
print(f"Active sessions: {health['active_sessions']}")
print(f"Browser version: {health['version']}")
```

### Logging

```python
import logging

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("browser_service")

# Logs are automatically written to configured log directory
# Check LOGS_DIR for session-specific log files
```

## 🛠️ Troubleshooting

### Common Issues

**"playwright executable doesn't exist"**
```bash
# Install browsers
playwright install

# For system dependencies
playwright install-deps
```

**"Browser launch failed"**
```bash
# Check if running in Docker without proper setup
docker run --cap-add=SYS_ADMIN nexusai-browser

# Or use rootless mode
export PLAYWRIGHT_BROWSERS_PATH=/tmp/browsers
```

**"Permission denied" in Docker**
```bash
# Fix file permissions
docker run --user $(id -u):$(id -g) -v $(pwd):/app/output nexusai-browser
```

**"Session not found" errors**
```python
# Sessions auto-expire after 30 minutes idle
# Extend session lifetime
service.session_manager.max_idle_time = 3600  # 1 hour
```

### Performance Optimization

```bash
# Use RAM disk for temporary files
export PLAYWRIGHT_BROWSERS_PATH=/dev/shm/browsers

# Reduce resource usage
export VIEWPORT_WIDTH=800
export VIEWPORT_HEIGHT=600
export PLAYWRIGHT_HEADLESS=true

# Limit concurrent sessions
export MAX_SESSIONS=5
```

### Debug Mode

```bash
# Enable debug logging
export DEBUG_MODE=true

# Run with visible browser (helpful for debugging)
export PLAYWRIGHT_HEADLESS=false

# Slow down operations for debugging
export SLOW_MO=1000  # 1 second delay between actions
```

## 📝 Examples

### E-commerce Scraping

```python
from browser_service.tools import BrowserSession

with BrowserSession("shopping") as session:
    # Search for products
    results = session.search("laptop under $1000")
    
    for result in results[:3]:
        # Visit each product page
        html = session.open(result['url'])
        
        # Extract product details
        prices = session.extract(html, ".price, .cost")
        names = session.extract(html, ".product-title, h1")
        
        print(f"Product: {names[0] if names else 'Unknown'}")
        print(f"Price: {prices[0] if prices else 'N/A'}")
        
        # Take screenshot for records
        screenshot_path = session.screenshot(result['url'])
        print(f"Screenshot: {screenshot_path}")
```

### Social Media Monitoring

```python
from browser_service.tools import *

# Monitor mentions across platforms
keywords = ["your brand", "your product"]
platforms = [
    "https://twitter.com/search?q={}",
    "https://reddit.com/search/?q={}",
]

for keyword in keywords:
    for platform_url in platforms:
        url = platform_url.format(keyword.replace(" ", "+"))
        
        try:
            html = tool_open(url)
            mentions = tool_extract(html, ".tweet-text, .Post")
            
            print(f"Found {len(mentions)} mentions of '{keyword}'")
            for mention in mentions[:5]:
                print(f"- {mention[:100]}...")
                
        except Exception as e:
            print(f"Error monitoring {url}: {e}")
```

### Automated Testing

```python
from browser_service.service import SyncBrowserService

def test_website_functionality():
    service = SyncBrowserService()
    service.start()
    
    try:
        # Test login flow
        service.open_url("test", "https://your-app.com/login")
        service.type("test", "https://your-app.com/login", "#username", "testuser")
        service.type("test", "https://your-app.com/login", "#password", "testpass")
        service.click("test", "https://your-app.com/login", "#submit")
        
        # Verify login success
        html = service.open_url("test", "https://your-app.com/dashboard")
        assert "Welcome" in html
        
        # Take screenshot of dashboard
        service.screenshot("test", "https://your-app.com/dashboard", "./test_dashboard.png")
        
        print("Website test passed!")
        
    finally:
        service.stop()

test_website_functionality()
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Add tests for new functionality
4. Run the test suite
5. Submit a pull request

## 📄 License

This browser service is part of the NexusAI project and follows the same licensing terms.

## 🔗 Related Projects

- [NexusAI Orchestrator](../orchestrator/) - Plan execution engine
- [NexusAI Brain](../brain/) - Local LLM integration
- [Playwright](https://playwright.dev/) - Browser automation framework