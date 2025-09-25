"""
Main browser service implementation for NexusAI.
Provides high-level browser automation capabilities using Playwright.
"""

import asyncio
import logging
import time
import urllib.robotparser
from typing import Dict, List, Optional, Any, Union
from pathlib import Path
from urllib.parse import urljoin, urlparse
import re

from playwright.async_api import async_playwright, Playwright, Browser, Page
from bs4 import BeautifulSoup
import requests

from .config import get_validated_config, get_browser_launch_options, get_context_options
from .session_manager import SessionManager

logger = logging.getLogger(__name__)


class CaptchaDetectedError(Exception):
    """Raised when a CAPTCHA is detected on a page."""
    pass


class RobotsTxtBlockedError(Exception):
    """Raised when robots.txt blocks access to a URL."""
    pass


class BrowserService:
    """
    Main browser automation service using Playwright.
    Provides session management, web scraping, and interaction capabilities.
    """
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        """
        Initialize the browser service.
        
        Args:
            config: Optional configuration dictionary. If None, loads from environment.
        """
        self.config = config or get_validated_config()
        self.playwright: Optional[Playwright] = None
        self.browser: Optional[Browser] = None
        self.session_manager: Optional[SessionManager] = None
        self.is_running = False
        
        # Rate limiting
        self._last_request_times: Dict[str, float] = {}
        
        # Robots.txt cache
        self._robots_cache: Dict[str, urllib.robotparser.RobotFileParser] = {}
        
        self._setup_logging()
        logger.info("BrowserService initialized")
    
    def _setup_logging(self):
        """Set up logging configuration."""
        log_level = logging.DEBUG if self.config["debug_mode"] else logging.INFO
        
        # Configure logger
        handler = logging.StreamHandler()
        formatter = logging.Formatter(
            '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
        )
        handler.setFormatter(formatter)
        
        logger.setLevel(log_level)
        if not logger.handlers:
            logger.addHandler(handler)
    
    async def start(self):
        """Start the browser service and initialize Playwright."""
        if self.is_running:
            logger.warning("Browser service is already running")
            return
        
        try:
            logger.info("Starting Playwright browser service")
            
            # Start Playwright
            self.playwright = await async_playwright().start()
            
            # Launch browser
            browser_type = getattr(self.playwright, self.config["browser_type"])
            launch_options = get_browser_launch_options(self.config)
            
            self.browser = await browser_type.launch(**launch_options)
            
            # Initialize session manager
            self.session_manager = SessionManager(
                sessions_dir=self.config["sessions_dir"],
                encryption_key=self.config["session_encryption_key"]
            )
            self.session_manager.set_browser(self.browser)
            
            self.is_running = True
            logger.info(f"Browser service started with {self.config['browser_type']}")
            
        except Exception as e:
            logger.error(f"Failed to start browser service: {e}")
            await self.stop()
            raise
    
    async def stop(self):
        """Stop the browser service and clean up resources."""
        if not self.is_running:
            return
        
        logger.info("Stopping browser service")
        
        try:
            # Close all sessions
            if self.session_manager:
                await self.session_manager.close_all_sessions()
            
            # Close browser
            if self.browser:
                await self.browser.close()
            
            # Stop Playwright
            if self.playwright:
                await self.playwright.stop()
            
        except Exception as e:
            logger.error(f"Error during browser service shutdown: {e}")
        
        finally:
            self.playwright = None
            self.browser = None
            self.session_manager = None
            self.is_running = False
            logger.info("Browser service stopped")
    
    def _check_running(self):
        """Check if service is running and raise error if not."""
        if not self.is_running:
            raise RuntimeError("Browser service is not running. Call start() first.")
    
    async def _get_or_create_session(self, session_id: str) -> Page:
        """
        Get or create a browser session and return a new page.
        
        Args:
            session_id: Session identifier
            
        Returns:
            New page instance
        """
        self._check_running()
        
        # Get or create session context
        context = self.session_manager.get_session(session_id)
        if context is None:
            context_options = get_context_options(self.config)
            context = await self.session_manager.create_session(session_id, **context_options)
        
        # Create new page
        page = await context.new_page()
        
        # Set timeouts
        page.set_default_timeout(self.config["page_timeout"])
        page.set_default_navigation_timeout(self.config["navigation_timeout"])
        
        return page
    
    def _apply_rate_limit(self, domain: str):
        """Apply rate limiting for a domain."""
        if domain in self._last_request_times:
            elapsed = time.time() - self._last_request_times[domain]
            delay_needed = self.config["rate_limit_delay"] - elapsed
            
            if delay_needed > 0:
                logger.debug(f"Rate limiting: waiting {delay_needed:.2f}s for {domain}")
                time.sleep(delay_needed)
        
        self._last_request_times[domain] = time.time()
    
    async def _check_robots_txt(self, url: str) -> bool:
        """
        Check if URL is allowed by robots.txt.
        
        Args:
            url: URL to check
            
        Returns:
            True if allowed, False if blocked
            
        Raises:
            RobotsTxtBlockedError: If robots.txt blocks access
        """
        if not self.config["respect_robots_txt"]:
            return True
        
        parsed_url = urlparse(url)
        domain = f"{parsed_url.scheme}://{parsed_url.netloc}"
        
        # Check cache first
        if domain not in self._robots_cache:
            robots_url = urljoin(domain, "/robots.txt")
            
            try:
                rp = urllib.robotparser.RobotFileParser()
                rp.set_url(robots_url)
                
                # Use requests for robots.txt to avoid Playwright overhead
                response = requests.get(robots_url, timeout=5)
                if response.status_code == 200:
                    rp.set_url(robots_url)
                    rp.read()
                
                self._robots_cache[domain] = rp
                
            except Exception as e:
                logger.debug(f"Could not fetch robots.txt for {domain}: {e}")
                # If we can't fetch robots.txt, assume allowed
                return True
        
        rp = self._robots_cache[domain]
        user_agent = self.config["user_agent"]
        
        if not rp.can_fetch(user_agent, url):
            raise RobotsTxtBlockedError(f"Access to {url} blocked by robots.txt")
        
        return True
    
    def _detect_captcha(self, content: str) -> bool:
        """
        Detect CAPTCHA presence in page content.
        
        Args:
            content: Page HTML content
            
        Returns:
            True if CAPTCHA detected
        """
        captcha_indicators = [
            "recaptcha",
            "hcaptcha", 
            "captcha",
            "verify you are human",
            "please complete the security check",
            "prove you're not a robot",
            "security verification",
            "cloudflare ray id"
        ]
        
        content_lower = content.lower()
        
        for indicator in captcha_indicators:
            if indicator in content_lower:
                return True
        
        return False
    
    async def open_url(self, session_id: str, url: str, wait_for: Optional[str] = None) -> str:
        """
        Open a URL and return the page HTML content.
        
        Args:
            session_id: Session identifier
            url: URL to open
            wait_for: Optional selector to wait for before returning
            
        Returns:  
            Page HTML content
            
        Raises:
            RobotsTxtBlockedError: If robots.txt blocks access
            CaptchaDetectedError: If CAPTCHA is detected
            RuntimeError: If navigation fails
        """
        self._check_running()
        
        # Check robots.txt
        await self._check_robots_txt(url)
        
        # Apply rate limiting
        domain = urlparse(url).netloc
        self._apply_rate_limit(domain)
        
        page = None
        try:
            page = await self._get_or_create_session(session_id)
            
            logger.info(f"Opening URL: {url}")
            
            # Navigate to URL
            response = await page.goto(url, wait_until="domcontentloaded")
            
            if not response or not response.ok:
                raise RuntimeError(f"Failed to load {url}: {response.status if response else 'No response'}")
            
            # Wait for specific selector if provided
            if wait_for:
                try:
                    await page.wait_for_selector(wait_for, timeout=5000)
                except Exception as e:
                    logger.warning(f"Wait for selector '{wait_for}' failed: {e}")
            
            # Get page content
            content = await page.content()
            
            # Check for CAPTCHA
            if self._detect_captcha(content):
                raise CaptchaDetectedError(f"CAPTCHA detected on {url}")
            
            logger.info(f"Successfully loaded {url} ({len(content)} characters)")
            return content
            
        except Exception as e:
            logger.error(f"Error opening {url}: {e}")
            raise
        
        finally:
            if page:
                await page.close()
    
    async def search(self, session_id: str, engine: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """
        Perform a search using the specified search engine.
        
        Args:
            session_id: Session identifier
            engine: Search engine ('duckduckgo', 'google', 'bing')
            query: Search query
            top_k: Maximum number of results to return
            
        Returns:
            List of search result dictionaries with title, url, snippet
        """
        self._check_running()
        
        logger.info(f"Searching {engine} for: {query}")
        
        # Build search URL based on engine
        search_urls = {
            "duckduckgo": f"https://duckduckgo.com/?q={query}",
            "google": f"https://www.google.com/search?q={query}",
            "bing": f"https://www.bing.com/search?q={query}"
        }
        
        if engine not in search_urls:
            raise ValueError(f"Unsupported search engine: {engine}")
        
        search_url = search_urls[engine]
        
        page = None
        try:
            page = await self._get_or_create_session(session_id)
            
            # Navigate to search page
            await page.goto(search_url, wait_until="domcontentloaded")
            
            # Wait for results to load
            await asyncio.sleep(2)
            
            content = await page.content()
            
            # Check for CAPTCHA
            if self._detect_captcha(content):
                raise CaptchaDetectedError(f"CAPTCHA detected on {engine}")
            
            # Parse results based on engine
            results = self._parse_search_results(content, engine, top_k)
            
            logger.info(f"Found {len(results)} search results")
            return results
            
        except Exception as e:
            logger.error(f"Search failed: {e}")
            raise
        
        finally:
            if page:
                await page.close()
    
    def _parse_search_results(self, html: str, engine: str, top_k: int) -> List[Dict[str, Any]]:
        """Parse search results from HTML based on search engine."""
        soup = BeautifulSoup(html, 'html.parser')
        results = []
        
        if engine == "duckduckgo":
            # DuckDuckGo result selectors
            result_elements = soup.select('[data-testid="result"]')[:top_k]
            
            for element in result_elements:
                title_elem = element.select_one('h2 a, [data-testid="result-title-a"]')
                snippet_elem = element.select_one('[data-result="snippet"]')
                
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    url = title_elem.get('href', '')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                        "engine": engine
                    })
        
        elif engine == "google":
            # Google result selectors
            result_elements = soup.select('.g')[:top_k]
            
            for element in result_elements:
                title_elem = element.select_one('h3')
                link_elem = element.select_one('a[href]')
                snippet_elem = element.select_one('.VwiC3b, .s3v9rd')
                
                if title_elem and link_elem:
                    title = title_elem.get_text(strip=True)
                    url = link_elem.get('href', '')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                        "engine": engine
                    })
        
        elif engine == "bing":
            # Bing result selectors
            result_elements = soup.select('.b_algo')[:top_k]
            
            for element in result_elements:
                title_elem = element.select_one('h2 a')
                snippet_elem = element.select_one('.b_caption p')
                
                if title_elem:
                    title = title_elem.get_text(strip=True)
                    url = title_elem.get('href', '')
                    snippet = snippet_elem.get_text(strip=True) if snippet_elem else ""
                    
                    results.append({
                        "title": title,
                        "url": url,
                        "snippet": snippet,
                        "engine": engine
                    })
        
        return results
    
    def extract(self, html: str, selector: str) -> List[str]:
        """
        Extract text content from HTML using CSS selector.
        
        Args:
            html: HTML content to parse
            selector: CSS selector
            
        Returns:
            List of extracted text strings
        """
        try:
            soup = BeautifulSoup(html, 'html.parser')
            elements = soup.select(selector)
            
            results = []
            for element in elements:
                text = element.get_text(strip=True)
                if text:  # Only add non-empty text
                    results.append(text)
            
            logger.info(f"Extracted {len(results)} elements with selector '{selector}'")
            return results
            
        except Exception as e:
            logger.error(f"Extraction failed with selector '{selector}': {e}")
            raise RuntimeError(f"Failed to extract with selector '{selector}': {e}")
    
    async def screenshot(self, session_id: str, url: str, path: Optional[str] = None, 
                        clip: Optional[Dict[str, int]] = None) -> str:
        """
        Take a screenshot of a webpage.
        
        Args:
            session_id: Session identifier
            url: URL to screenshot
            path: Optional file path (auto-generated if None)
            clip: Optional clipping rectangle {"x": int, "y": int, "width": int, "height": int}
            
        Returns:
            Path to saved screenshot file
        """
        self._check_running()
        
        # Generate path if not provided
        if path is None:
            timestamp = int(time.time())
            filename = f"screenshot_{session_id}_{timestamp}.png"
            path = str(Path(self.config["screenshots_dir"]) / filename)
        
        # Ensure directory exists
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        page = None
        try:
            page = await self._get_or_create_session(session_id)
            
            # Navigate to URL
            await page.goto(url, wait_until="domcontentloaded")
            
            # Wait for page to stabilize
            await asyncio.sleep(1)
            
            # Take screenshot
            screenshot_options = {"path": path, "full_page": True}
            if clip:
                screenshot_options["clip"] = clip
                screenshot_options["full_page"] = False
            
            await page.screenshot(**screenshot_options)
            
            logger.info(f"Screenshot saved: {path}")
            return str(Path(path).resolve())
            
        except Exception as e:
            logger.error(f"Screenshot failed for {url}: {e}")
            raise
        
        finally:
            if page:
                await page.close()
    
    async def record_video(self, session_id: str, url: str, duration: int = 10, 
                          path: Optional[str] = None) -> str:
        """
        Record a video of browser session.
        
        Args:
            session_id: Session identifier
            url: URL to record
            duration: Recording duration in seconds
            path: Optional file path (auto-generated if None)
            
        Returns:
            Path to saved video file
        """
        self._check_running()
        
        if self.config["headless"]:
            logger.warning("Video recording in headless mode may not work properly")
        
        # Generate path if not provided
        if path is None:
            timestamp = int(time.time())
            filename = f"recording_{session_id}_{timestamp}.webm"
            path = str(Path(self.config["video_dir"]) / filename)
        
        # Ensure directory exists
        Path(path).parent.mkdir(parents=True, exist_ok=True)
        
        # Create new context with video recording
        context_options = get_context_options(self.config)
        context_options["record_video_dir"] = str(Path(path).parent)
        context_options["record_video_size"] = self.config["video_size"]
        
        context = await self.browser.new_context(**context_options)
        page = None
        
        try:
            page = await context.new_page()
            
            # Navigate and interact
            await page.goto(url, wait_until="domcontentloaded")
            
            # Record for specified duration
            await asyncio.sleep(duration)
            
            # Close page to finalize video
            await page.close()
            await context.close()
            
            # Find the video file (Playwright generates with UUID)
            video_files = list(Path(path).parent.glob("*.webm"))
            if video_files:
                # Move/rename the video file
                latest_video = max(video_files, key=lambda p: p.stat().st_mtime)
                latest_video.rename(path)
                logger.info(f"Video recorded: {path}")
                return str(Path(path).resolve())
            else:
                raise RuntimeError("Video file not found after recording")
            
        except Exception as e:
            logger.error(f"Video recording failed for {url}: {e}")
            raise
        
        finally:
            if page and not page.is_closed():
                await page.close()
            if context:
                await context.close()
    
    async def click(self, session_id: str, url: str, selector: str):
        """
        Click an element on a webpage.
        
        Args:
            session_id: Session identifier
            url: URL to navigate to
            selector: CSS selector of element to click
        """
        self._check_running()
        
        page = None
        try:
            page = await self._get_or_create_session(session_id)
            
            # Navigate to URL
            await page.goto(url, wait_until="domcontentloaded")
            
            # Wait for element and click
            await page.wait_for_selector(selector)
            await page.click(selector)
            
            logger.info(f"Clicked element '{selector}' on {url}")
            
        except Exception as e:
            logger.error(f"Click failed for '{selector}' on {url}: {e}")
            raise
        
        finally:
            if page:
                await page.close()
    
    async def type(self, session_id: str, url: str, selector: str, text: str):
        """
        Type text into an element on a webpage.
        
        Args:
            session_id: Session identifier
            url: URL to navigate to
            selector: CSS selector of input element
            text: Text to type
        """
        self._check_running()
        
        page = None
        try:
            page = await self._get_or_create_session(session_id)
            
            # Navigate to URL
            await page.goto(url, wait_until="domcontentloaded")
            
            # Wait for element and type
            await page.wait_for_selector(selector)
            await page.fill(selector, text)
            
            logger.info(f"Typed text into '{selector}' on {url}")
            
        except Exception as e:
            logger.error(f"Type failed for '{selector}' on {url}: {e}")
            raise
        
        finally:
            if page:
                await page.close()
    
    async def healthcheck(self) -> Dict[str, Any]:
        """
        Perform a health check of the browser service.
        
        Returns:
            Health check results
        """
        health = {
            "status": "healthy",
            "is_running": self.is_running,
            "browser_type": self.config["browser_type"],
            "headless": self.config["headless"],
            "active_sessions": 0,
            "version": None,
            "errors": []
        }
        
        try:
            if self.is_running and self.browser:
                health["version"] = self.browser.version
                
                if self.session_manager:
                    health["active_sessions"] = len(self.session_manager.sessions)
                
                # Test basic functionality
                test_page = await self.browser.new_page()
                await test_page.goto("data:text/html,<h1>Health Check</h1>")
                content = await test_page.content()
                await test_page.close()
                
                if "Health Check" not in content:
                    health["errors"].append("Basic page navigation test failed")
            
            else:
                health["status"] = "stopped"
                
        except Exception as e:
            health["status"] = "unhealthy"
            health["errors"].append(str(e))
        
        return health


# Sync wrapper functions for convenience
def run_async(coro):
    """Run async function in event loop."""
    try:
        loop = asyncio.get_event_loop()
        return loop.run_until_complete(coro)
    except RuntimeError:
        return asyncio.run(coro)


class SyncBrowserService:
    """Synchronous wrapper for BrowserService."""
    
    def __init__(self, config: Optional[Dict[str, Any]] = None):
        self.async_service = BrowserService(config)
    
    def start(self):
        """Start the browser service."""
        return run_async(self.async_service.start())
    
    def stop(self):
        """Stop the browser service."""
        return run_async(self.async_service.stop())
    
    def open_url(self, session_id: str, url: str, wait_for: Optional[str] = None) -> str:
        """Open URL and return HTML content."""
        return run_async(self.async_service.open_url(session_id, url, wait_for))
    
    def search(self, session_id: str, engine: str, query: str, top_k: int = 5) -> List[Dict[str, Any]]:
        """Perform search and return results."""
        return run_async(self.async_service.search(session_id, engine, query, top_k))
    
    def extract(self, html: str, selector: str) -> List[str]:
        """Extract content from HTML."""
        return self.async_service.extract(html, selector)
    
    def screenshot(self, session_id: str, url: str, path: Optional[str] = None, 
                  clip: Optional[Dict[str, int]] = None) -> str:
        """Take screenshot and return file path."""
        return run_async(self.async_service.screenshot(session_id, url, path, clip))
    
    def record_video(self, session_id: str, url: str, duration: int = 10, 
                    path: Optional[str] = None) -> str:
        """Record video and return file path."""
        return run_async(self.async_service.record_video(session_id, url, duration, path))
    
    def click(self, session_id: str, url: str, selector: str):
        """Click element on webpage."""
        return run_async(self.async_service.click(session_id, url, selector))
    
    def type(self, session_id: str, url: str, selector: str, text: str):
        """Type text into element."""
        return run_async(self.async_service.type(session_id, url, selector, text))
    
    def healthcheck(self) -> Dict[str, Any]:
        """Perform health check."""
        return run_async(self.async_service.healthcheck())