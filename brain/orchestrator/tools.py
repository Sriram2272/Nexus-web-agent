"""
Tool implementations for NexusAI orchestrator.
"""

import logging
import os
import time
from typing import Dict, Any, List, Optional, Union
import requests
from requests.exceptions import RequestException, Timeout

logger = logging.getLogger(__name__)


class ToolRegistry:
    """Registry for available tools."""
    
    def __init__(self):
        self._tools = {}
        self._register_default_tools()
    
    def register(self, name: str, func, description: str = None):
        """Register a tool function."""
        self._tools[name] = {
            "function": func,
            "description": description or f"Tool: {name}",
        }
        logger.debug(f"Registered tool: {name}")
    
    def get_tool(self, name: str):
        """Get a tool by name."""
        if name not in self._tools:
            raise ValueError(f"Tool '{name}' not found. Available tools: {list(self._tools.keys())}")
        return self._tools[name]["function"]
    
    def list_tools(self) -> List[str]:
        """List all available tool names."""
        return list(self._tools.keys())
    
    def get_tool_descriptions(self) -> Dict[str, str]:
        """Get descriptions of all tools."""
        return {name: info["description"] for name, info in self._tools.items()}
    
    def _register_default_tools(self):
        """Register default tool implementations."""
        self.register("search", search_tool, "Search for information online")
        self.register("open", open_tool, "Open and fetch content from a URL") 
        self.register("extract", extract_tool, "Extract data from HTML using CSS selectors")
        self.register("screenshot", screenshot_tool, "Take a screenshot of a webpage")
        self.register("download", download_tool, "Download a file from a URL")


# Global tool registry instance
tool_registry = ToolRegistry()


def search_tool(query: str, max_results: int = 10) -> List[Dict[str, Any]]:
    """
    Search for information online.
    
    Args:
        query: Search query string
        max_results: Maximum number of results to return
        
    Returns:
        List of search results with title, url, and snippet
    """
    logger.info(f"Searching for: {query}")
    
    try:
        # Use DuckDuckGo Instant Answer API (simple, no API key required)
        params = {
            "q": query,
            "format": "json",
            "no_html": "1",
            "skip_disambig": "1"
        }
        
        response = requests.get(
            "https://api.duckduckgo.com/",
            params=params,
            timeout=10,
            headers={"User-Agent": "NexusAI-SearchBot/1.0"}
        )
        
        if response.status_code == 200:
            data = response.json()
            
            results = []
            
            # Add instant answer if available
            if data.get("Answer"):
                results.append({
                    "title": "Instant Answer",
                    "url": data.get("AnswerURL", ""),
                    "snippet": data["Answer"],
                    "type": "instant_answer"
                })
            
            # Add related topics
            for topic in data.get("RelatedTopics", [])[:max_results-len(results)]:
                if isinstance(topic, dict) and "Text" in topic:
                    results.append({
                        "title": topic.get("FirstURL", "").split("/")[-1].replace("_", " ").title(),
                        "url": topic.get("FirstURL", ""),
                        "snippet": topic["Text"],
                        "type": "related_topic"
                    })
            
            # If no results, create a simulated response
            if not results:
                results = [
                    {
                        "title": f"Search Results for: {query}",
                        "url": f"https://duckduckgo.com/?q={query.replace(' ', '+')}",
                        "snippet": f"Found information related to: {query}",
                        "type": "simulated"
                    }
                ]
            
            logger.info(f"Found {len(results)} search results")
            return results[:max_results]
            
        else:
            logger.warning(f"Search API returned {response.status_code}")
            # Return simulated results
            return [
                {
                    "title": f"Search: {query}",
                    "url": f"https://duckduckgo.com/?q={query.replace(' ', '+')}",
                    "snippet": f"Simulated search result for: {query}",
                    "type": "simulated"
                }
            ]
            
    except RequestException as e:
        logger.error(f"Search request failed: {e}")
        # Return fallback result
        return [
            {
                "title": f"Search Failed: {query}",
                "url": "",
                "snippet": f"Unable to search for: {query}. Error: {str(e)}",
                "type": "error"
            }
        ]


def open_tool(url: str, timeout: int = 30) -> str:
    """
    Open and fetch content from a URL.
    
    Args:
        url: URL to fetch
        timeout: Request timeout in seconds
        
    Returns:
        HTML content as string
    """
    logger.info(f"Opening URL: {url}")
    
    try:
        headers = {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36"
        }
        
        response = requests.get(url, timeout=timeout, headers=headers)
        response.raise_for_status()
        
        content = response.text
        logger.info(f"Fetched {len(content)} characters from {url}")
        
        return content
        
    except RequestException as e:
        error_msg = f"Failed to open {url}: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


def extract_tool(selector: str, html: Optional[str] = None, url: Optional[str] = None) -> List[str]:
    """
    Extract data from HTML using CSS selectors.
    
    Args:
        selector: CSS selector to extract elements
        html: HTML content (optional if url provided)
        url: URL to fetch HTML from (optional if html provided)
        
    Returns:
        List of extracted text content
    """
    try:
        from bs4 import BeautifulSoup
    except ImportError:
        raise ImportError("BeautifulSoup4 is required for extract tool. Install: pip install beautifulsoup4")
    
    logger.info(f"Extracting with selector: {selector}")
    
    # Get HTML content
    if html is None and url is None:
        raise ValueError("Either 'html' or 'url' must be provided")
    
    if html is None:
        html = open_tool(url)
    
    try:
        soup = BeautifulSoup(html, 'html.parser')
        elements = soup.select(selector)
        
        extracted = []
        for element in elements:
            text = element.get_text(strip=True)
            if text:  # Only add non-empty text
                extracted.append(text)
        
        logger.info(f"Extracted {len(extracted)} elements")
        return extracted
        
    except Exception as e:
        error_msg = f"Failed to extract with selector '{selector}': {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


def screenshot_tool(url: str, path: Optional[str] = None, full_page: bool = True) -> str:
    """
    Take a screenshot of a webpage.
    
    Args:
        url: URL to screenshot
        path: Optional file path to save screenshot
        full_page: Whether to capture full page or just viewport
        
    Returns:
        Path to saved screenshot file
    """
    logger.info(f"Taking screenshot of: {url}")
    
    # Try to use Playwright if available
    try:
        from playwright.sync_api import sync_playwright
        
        if path is None:
            timestamp = int(time.time())
            path = f"screenshot_{timestamp}.png"
        
        with sync_playwright() as p:
            browser = p.chromium.launch(headless=True)
            page = browser.new_page()
            page.goto(url, timeout=30000)
            
            # Wait for page to load
            page.wait_for_load_state("networkidle", timeout=10000)
            
            # Take screenshot
            page.screenshot(path=path, full_page=full_page)
            browser.close()
            
            logger.info(f"Screenshot saved to: {path}")
            return os.path.abspath(path)
            
    except ImportError:
        logger.warning("Playwright not available, simulating screenshot")
        # Simulate screenshot by creating a placeholder
        if path is None:
            timestamp = int(time.time())
            path = f"screenshot_placeholder_{timestamp}.txt"
        
        with open(path, 'w') as f:
            f.write(f"SIMULATED SCREENSHOT\n")
            f.write(f"URL: {url}\n")
            f.write(f"Full page: {full_page}\n")
            f.write(f"Timestamp: {time.strftime('%Y-%m-%d %H:%M:%S')}\n")
        
        logger.info(f"Placeholder screenshot created: {path}")
        return os.path.abspath(path)
        
    except Exception as e:
        error_msg = f"Failed to take screenshot of {url}: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


def download_tool(url: str, filename: str, chunk_size: int = 8192) -> str:
    """
    Download a file from a URL.
    
    Args:
        url: URL to download from
        filename: Local filename to save as
        chunk_size: Download chunk size in bytes
        
    Returns:
        Path to downloaded file
    """
    logger.info(f"Downloading {url} to {filename}")
    
    try:
        response = requests.get(url, stream=True, timeout=30)
        response.raise_for_status()
        
        # Create directory if needed
        os.makedirs(os.path.dirname(filename) if os.path.dirname(filename) else ".", exist_ok=True)
        
        with open(filename, 'wb') as f:
            for chunk in response.iter_content(chunk_size=chunk_size):
                if chunk:
                    f.write(chunk)
        
        file_size = os.path.getsize(filename)
        logger.info(f"Downloaded {file_size} bytes to {filename}")
        
        return os.path.abspath(filename)
        
    except RequestException as e:
        error_msg = f"Failed to download {url}: {e}"
        logger.error(error_msg)
        raise RuntimeError(error_msg)


def get_tool_function(tool_name: str):
    """Get tool function by name."""
    return tool_registry.get_tool(tool_name)


def list_available_tools() -> List[str]:
    """List all available tools."""
    return tool_registry.list_tools()


def get_tool_descriptions() -> Dict[str, str]:
    """Get descriptions of all tools."""
    return tool_registry.get_tool_descriptions()