"""
Tool wrappers for NexusAI Browser Service.
Provides convenient high-level functions for common browser automation tasks.
"""

import logging
from typing import Dict, List, Optional, Any, Union
from pathlib import Path

from .service import SyncBrowserService
from .config import get_validated_config

logger = logging.getLogger(__name__)

# Global service instance
_browser_service: Optional[SyncBrowserService] = None


def get_browser_service() -> SyncBrowserService:
    """
    Get or create the global browser service instance.
    
    Returns:
        SyncBrowserService instance
    """
    global _browser_service
    
    if _browser_service is None:
        _browser_service = SyncBrowserService()
        _browser_service.start()
        logger.info("Started global browser service")
    
    return _browser_service


def tool_search(query: str, engine: str = "duckduckgo", top_k: int = 5, 
                session_id: str = "default") -> List[Dict[str, Any]]:
    """
    Search for information using a search engine.
    
    Args:
        query: Search query string
        engine: Search engine to use ('duckduckgo', 'google', 'bing')
        top_k: Maximum number of results to return
        session_id: Browser session identifier
        
    Returns:
        List of search result dictionaries with title, url, snippet
        
    Example:
        results = tool_search("python programming tutorial", top_k=3)
        for result in results:
            print(f"{result['title']}: {result['url']}")
    """
    logger.info(f"Searching {engine} for: '{query}'")
    
    try:
        service = get_browser_service()
        results = service.search(session_id, engine, query, top_k)
        
        logger.info(f"Found {len(results)} search results")
        return results
        
    except Exception as e:
        logger.error(f"Search failed: {e}")
        return [{
            "title": f"Search Error: {query}",
            "url": "",
            "snippet": f"Search failed: {str(e)}",
            "engine": engine,
            "error": True
        }]


def tool_open(url: str, wait_for: Optional[str] = None, 
              session_id: str = "default") -> str:
    """
    Open a URL and return the HTML content.
    
    Args:
        url: URL to open
        wait_for: Optional CSS selector to wait for before returning
        session_id: Browser session identifier
        
    Returns:
        HTML content as string
        
    Example:
        html = tool_open("https://example.com", wait_for="h1")
        print(f"Page loaded: {len(html)} characters")
    """
    logger.info(f"Opening URL: {url}")
    
    try:
        service = get_browser_service()
        html = service.open_url(session_id, url, wait_for)
        
        logger.info(f"Successfully opened {url} ({len(html)} characters)")
        return html
        
    except Exception as e:
        logger.error(f"Failed to open {url}: {e}")
        return f"<html><body><h1>Error</h1><p>Failed to load {url}: {str(e)}</p></body></html>"


def tool_extract(url_or_html: str, selector: str, 
                 session_id: str = "default") -> List[str]:
    """
    Extract text content from a URL or HTML using CSS selector.
    
    Args:
        url_or_html: URL to fetch or HTML content string
        selector: CSS selector to extract elements
        session_id: Browser session identifier (only used if url_or_html is a URL)
        
    Returns:  
        List of extracted text strings
        
    Example:
        # Extract from URL
        titles = tool_extract("https://news.ycombinator.com", "a.storylink")
        
        # Extract from HTML
        html = "<div><h1>Title 1</h1><h1>Title 2</h1></div>"
        titles = tool_extract(html, "h1")
    """
    logger.info(f"Extracting with selector: '{selector}'")
    
    try:
        service = get_browser_service()
        
        # Check if input is a URL or HTML content
        if url_or_html.startswith(('http://', 'https://')):
            # It's a URL, fetch HTML first
            html = service.open_url(session_id, url_or_html)
        else:
            # It's HTML content
            html = url_or_html
        
        # Extract using the service
        results = service.extract(html, selector)
        
        logger.info(f"Extracted {len(results)} elements")
        return results
        
    except Exception as e:
        logger.error(f"Extraction failed: {e}")
        return [f"Extraction error: {str(e)}"]


def tool_screenshot(url: str, path: Optional[str] = None, 
                   clip: Optional[Dict[str, int]] = None,
                   session_id: str = "default") -> str:
    """
    Take a screenshot of a webpage.
    
    Args:
        url: URL to screenshot
        path: Optional file path to save screenshot
        clip: Optional clipping rectangle {"x": int, "y": int, "width": int, "height": int}
        session_id: Browser session identifier
        
    Returns:
        Path to saved screenshot file
        
    Example:
        # Full page screenshot
        path = tool_screenshot("https://example.com")
        
        # Cropped screenshot
        path = tool_screenshot("https://example.com", 
                              clip={"x": 0, "y": 0, "width": 800, "height": 600})
    """
    logger.info(f"Taking screenshot of: {url}")
    
    try:
        service = get_browser_service()
        screenshot_path = service.screenshot(session_id, url, path, clip)
        
        logger.info(f"Screenshot saved: {screenshot_path}")
        return screenshot_path
        
    except Exception as e:
        logger.error(f"Screenshot failed: {e}")
        # Return a placeholder path to indicate failure
        return f"screenshot_error_{session_id}.txt"


def tool_record_video(url: str, duration: int = 10, path: Optional[str] = None,
                     session_id: str = "default") -> str:
    """
    Record a video of browser interaction with a webpage.
    
    Args:
        url: URL to record
        duration: Recording duration in seconds
        path: Optional file path to save video
        session_id: Browser session identifier
        
    Returns:
        Path to saved video file
        
    Example:
        video_path = tool_record_video("https://example.com", duration=15)
        print(f"Video saved: {video_path}")
    """
    logger.info(f"Recording video of {url} for {duration} seconds")
    
    try:
        service = get_browser_service()
        video_path = service.record_video(session_id, url, duration, path)
        
        logger.info(f"Video recorded: {video_path}")
        return video_path
        
    except Exception as e:
        logger.error(f"Video recording failed: {e}")
        # Return a placeholder path to indicate failure
        return f"video_error_{session_id}.txt"


def tool_click(url: str, selector: str, session_id: str = "default") -> bool:
    """
    Click an element on a webpage.
    
    Args:
        url: URL to navigate to
        selector: CSS selector of element to click
        session_id: Browser session identifier
        
    Returns:
        True if successful, False otherwise
        
    Example:
        success = tool_click("https://example.com", "button.submit")
    """
    logger.info(f"Clicking '{selector}' on {url}")
    
    try:
        service = get_browser_service()
        service.click(session_id, url, selector)
        
        logger.info(f"Successfully clicked '{selector}'")
        return True
        
    except Exception as e:
        logger.error(f"Click failed: {e}")
        return False


def tool_type(url: str, selector: str, text: str, session_id: str = "default") -> bool:
    """
    Type text into an input element on a webpage.
    
    Args:
        url: URL to navigate to
        selector: CSS selector of input element
        text: Text to type
        session_id: Browser session identifier
        
    Returns:
        True if successful, False otherwise
        
    Example:
        success = tool_type("https://example.com", "input[name='query']", "search term")
    """
    logger.info(f"Typing into '{selector}' on {url}")
    
    try:
        service = get_browser_service()
        service.type(session_id, url, selector, text)
        
        logger.info(f"Successfully typed text into '{selector}'")
        return True
        
    except Exception as e:
        logger.error(f"Type failed: {e}")
        return False


def tool_healthcheck() -> Dict[str, Any]:
    """
    Check the health status of the browser service.
    
    Returns:
        Health check results dictionary
        
    Example:
        health = tool_healthcheck()
        print(f"Service status: {health['status']}")
        print(f"Active sessions: {health['active_sessions']}")
    """
    try:
        service = get_browser_service()
        return service.healthcheck()
        
    except Exception as e:
        return {
            "status": "error",
            "error": str(e),
            "is_running": False
        }


def cleanup_browser_service():
    """
    Clean up the global browser service instance.
    Call this when shutting down your application.
    """
    global _browser_service
    
    if _browser_service:
        try:
            _browser_service.stop()
            _browser_service = None
            logger.info("Browser service cleaned up")
        except Exception as e:
            logger.error(f"Error cleaning up browser service: {e}")


# Context manager for temporary browser sessions
class BrowserSession:
    """
    Context manager for temporary browser sessions.
    
    Example:
        with BrowserSession("temp_session") as session:
            html = session.open("https://example.com")
            results = session.search("python tutorial")
    """
    
    def __init__(self, session_id: str = "temp"):
        self.session_id = session_id
        self.service = None
    
    def __enter__(self):
        self.service = get_browser_service()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        # Session cleanup is handled by SessionManager
        pass
    
    def open(self, url: str, wait_for: Optional[str] = None) -> str:
        """Open URL and return HTML."""
        return tool_open(url, wait_for, self.session_id)
    
    def search(self, query: str, engine: str = "duckduckgo", top_k: int = 5) -> List[Dict[str, Any]]:
        """Search and return results."""
        return tool_search(query, engine, top_k, self.session_id)
    
    def extract(self, url_or_html: str, selector: str) -> List[str]:
        """Extract content using CSS selector."""
        return tool_extract(url_or_html, selector, self.session_id)
    
    def screenshot(self, url: str, path: Optional[str] = None, 
                  clip: Optional[Dict[str, int]] = None) -> str:
        """Take screenshot."""
        return tool_screenshot(url, path, clip, self.session_id)
    
    def click(self, url: str, selector: str) -> bool:
        """Click element."""
        return tool_click(url, selector, self.session_id)
    
    def type(self, url: str, selector: str, text: str) -> bool:
        """Type text."""
        return tool_type(url, selector, text, self.session_id)


# Convenience functions for common workflows
def quick_search_and_extract(query: str, extract_selector: str, 
                           engine: str = "duckduckgo", top_k: int = 3) -> List[Dict[str, Any]]:
    """
    Quick workflow: search for something and extract data from top results.
    
    Args:
        query: Search query
        extract_selector: CSS selector to extract from each result page
        engine: Search engine to use
        top_k: Number of search results to process
        
    Returns:
        List of dictionaries with search result info and extracted data
    """
    logger.info(f"Quick search and extract workflow for: '{query}'")
    
    # Perform search
    results = tool_search(query, engine, top_k)
    
    enhanced_results = []
    for result in results:
        if result.get("error"):
            enhanced_results.append(result)
            continue
        
        try:
            # Extract data from the result URL
            extracted_data = tool_extract(result["url"], extract_selector)
            
            enhanced_result = result.copy()
            enhanced_result["extracted_data"] = extracted_data
            enhanced_results.append(enhanced_result)
            
        except Exception as e:
            logger.warning(f"Failed to extract from {result['url']}: {e}")
            result["extraction_error"] = str(e)
            enhanced_results.append(result)
    
    return enhanced_results


def batch_screenshot(urls: List[str], output_dir: str = "./screenshots") -> List[str]:
    """
    Take screenshots of multiple URLs.
    
    Args:
        urls: List of URLs to screenshot
        output_dir: Directory to save screenshots
        
    Returns:
        List of screenshot file paths
    """
    logger.info(f"Taking batch screenshots of {len(urls)} URLs")
    
    Path(output_dir).mkdir(parents=True, exist_ok=True)
    screenshot_paths = []
    
    for i, url in enumerate(urls):
        try:
            filename = f"batch_screenshot_{i+1:03d}.png"
            path = str(Path(output_dir) / filename)
            
            screenshot_path = tool_screenshot(url, path)
            screenshot_paths.append(screenshot_path)
            
        except Exception as e:
            logger.error(f"Failed to screenshot {url}: {e}")
            screenshot_paths.append(f"error_{i+1}.txt")
    
    return screenshot_paths