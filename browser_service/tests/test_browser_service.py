"""
Tests for NexusAI Browser Service.
"""

import asyncio
import os
import pytest
import tempfile
import time
from unittest.mock import patch, MagicMock, AsyncMock
from pathlib import Path

# Import our modules
from browser_service.service import BrowserService, SyncBrowserService
from browser_service.tools import (
    tool_search, tool_open, tool_extract, tool_screenshot,
    BrowserSession, quick_search_and_extract
)
from browser_service.config import load_config, validate_config
from browser_service.session_manager import SessionManager, SessionEncryption


class TestConfiguration:
    """Test configuration loading and validation."""
    
    def test_load_default_config(self):
        """Test loading default configuration."""
        config = load_config()
        
        assert isinstance(config, dict)
        assert "headless" in config
        assert "browser_type" in config
        assert "browser_timeout" in config
        assert config["browser_type"] in ["chromium", "firefox", "webkit"]
    
    def test_config_validation(self):
        """Test configuration validation."""
        # Valid config should pass
        valid_config = {
            "headless": True,
            "browser_type": "chromium",
            "browser_timeout": 30000,
            "page_timeout": 10000,
            "viewport_width": 1280,
            "viewport_height": 720,
            "rate_limit_delay": 1.0,
            "max_retries": 3
        }
        
        # Should not raise
        validate_config(valid_config)
        
        # Invalid browser type should fail
        invalid_config = valid_config.copy()
        invalid_config["browser_type"] = "invalid_browser"
        
        with pytest.raises(ValueError, match="Invalid browser type"):
            validate_config(invalid_config)
        
        # Invalid timeout should fail
        invalid_config = valid_config.copy()
        invalid_config["browser_timeout"] = 500
        
        with pytest.raises(ValueError, match="Browser timeout must be at least"):
            validate_config(invalid_config)
    
    @patch.dict(os.environ, {
        "PLAYWRIGHT_HEADLESS": "false",
        "PLAYWRIGHT_BROWSER": "firefox",
        "BROWSER_TIMEOUT": "60000"
    })
    def test_environment_variable_override(self):
        """Test that environment variables override defaults."""
        config = load_config()
        
        assert config["headless"] is False
        assert config["browser_type"] == "firefox"
        assert config["browser_timeout"] == 60000


class TestSessionEncryption:
    """Test session state encryption."""
    
    def test_encryption_disabled(self):
        """Test encryption when no key is provided."""
        encryptor = SessionEncryption(None)
        
        data = "test data"
        encrypted = encryptor.encrypt_data(data)
        decrypted = encryptor.decrypt_data(encrypted)
        
        assert encrypted == data  # No encryption
        assert decrypted == data
    
    def test_encryption_enabled(self):
        """Test encryption with valid key."""
        key = SessionEncryption.generate_key()
        encryptor = SessionEncryption(key)
        
        data = "sensitive session data"
        encrypted = encryptor.encrypt_data(data)
        decrypted = encryptor.decrypt_data(encrypted)
        
        assert encrypted != data  # Data should be encrypted
        assert decrypted == data   # Should decrypt back to original
    
    def test_invalid_encryption_key(self):
        """Test handling of invalid encryption key."""
        encryptor = SessionEncryption("invalid_key")
        
        # Should fall back to no encryption
        data = "test data"
        encrypted = encryptor.encrypt_data(data)
        assert encrypted == data


class TestSessionManager:
    """Test session management functionality."""
    
    @pytest.fixture
    def temp_sessions_dir(self):
        """Create temporary directory for session tests."""
        with tempfile.TemporaryDirectory() as temp_dir:
            yield temp_dir
    
    @pytest.fixture
    def session_manager(self, temp_sessions_dir):
        """Create session manager for testing."""
        return SessionManager(temp_sessions_dir)
    
    def test_session_manager_init(self, session_manager):
        """Test session manager initialization."""
        assert session_manager.sessions == {}
        assert session_manager.browser is None
        assert Path(session_manager.sessions_dir).exists()
    
    def test_session_info_tracking(self):
        """Test session information tracking."""
        from browser_service.session_manager import SessionInfo
        
        mock_context = MagicMock()
        session_info = SessionInfo("test_session", mock_context)
        
        assert session_info.session_id == "test_session"
        assert session_info.context == mock_context
        assert session_info.page_count == 0
        
        # Test age and idle time
        initial_time = session_info.created_at
        time.sleep(0.1)
        
        assert session_info.get_age() > 0
        assert session_info.get_idle_time() > 0
        
        session_info.update_last_used()
        assert session_info.last_used > initial_time


class TestBrowserServiceBasics:
    """Test basic browser service functionality."""
    
    @pytest.fixture
    def service_config(self):
        """Create test configuration."""
        return {
            "headless": True,
            "browser_type": "chromium",
            "browser_timeout": 30000,
            "page_timeout": 10000,
            "navigation_timeout": 30000,
            "video_dir": "./test_videos",
            "sessions_dir": "./test_sessions",
            "screenshots_dir": "./test_screenshots",
            "logs_dir": "./test_logs",
            "respect_robots_txt": False,  # Disable for testing
            "rate_limit_delay": 0.1,
            "max_retries": 2,
            "session_encryption_key": None,
            "allow_external_network": True,
            "viewport_width": 1280,
            "viewport_height": 720,
            "user_agent": "NexusAI-Test-Browser/1.0",
            "video_size": {"width": 1280, "height": 720},
            "video_fps": 25,
            "debug_mode": False,
            "skip_ci_tests": os.getenv("PLAYWRIGHT_SKIP_CI", "false").lower() == "true",
            "slow_mo": 0,
            "default_search_engine": "duckduckgo",
            "search_results_limit": 10
        }
    
    def test_browser_service_init(self, service_config):
        """Test browser service initialization."""
        service = BrowserService(service_config)
        
        assert service.config == service_config
        assert service.playwright is None
        assert service.browser is None
        assert service.session_manager is None
        assert not service.is_running
    
    def test_sync_wrapper_init(self, service_config):
        """Test synchronous wrapper initialization."""
        sync_service = SyncBrowserService(service_config)
        assert isinstance(sync_service.async_service, BrowserService)
    
    def test_extract_method(self, service_config):
        """Test HTML content extraction."""
        service = BrowserService(service_config)
        
        html = """
        <html>
            <body>
                <h1>Title 1</h1>
                <h1>Title 2</h1>
                <p class="content">Paragraph 1</p>
                <p class="content">Paragraph 2</p>
                <div id="special">Special content</div>
            </body>
        </html>
        """
        
        # Test CSS selector extraction
        titles = service.extract(html, "h1")
        assert len(titles) == 2
        assert "Title 1" in titles
        assert "Title 2" in titles
        
        # Test class selector
        paragraphs = service.extract(html, ".content")
        assert len(paragraphs) == 2
        
        # Test ID selector
        special = service.extract(html, "#special")
        assert len(special) == 1
        assert "Special content" in special
        
        # Test non-existent selector
        empty = service.extract(html, ".nonexistent")
        assert len(empty) == 0
    
    def test_captcha_detection(self, service_config):
        """Test CAPTCHA detection in page content."""
        service = BrowserService(service_config)
        
        # Test various CAPTCHA indicators
        captcha_html = "<div>Please complete the reCAPTCHA verification</div>"
        assert service._detect_captcha(captcha_html) is True
        
        normal_html = "<div>Welcome to our website</div>"
        assert service._detect_captcha(normal_html) is False
        
        hcaptcha_html = "<div>hCaptcha security check required</div>"
        assert service._detect_captcha(hcaptcha_html) is True


@pytest.mark.skipif(
    os.getenv("PLAYWRIGHT_SKIP_CI", "false").lower() == "true",
    reason="Skipping browser tests in CI environment"
)
class TestBrowserIntegration:
    """Integration tests that require actual browser automation."""
    
    @pytest.fixture(scope="class")
    async def browser_service(self):
        """Create and start browser service for integration tests."""
        config = load_config()
        config["headless"] = True  # Force headless for tests
        config["respect_robots_txt"] = False
        config["rate_limit_delay"] = 0.1
        
        service = BrowserService(config)
        await service.start()
        
        yield service
        
        await service.stop()
    
    @pytest.mark.asyncio
    async def test_service_start_stop(self):
        """Test starting and stopping the browser service."""
        config = load_config()
        config["headless"] = True
        
        service = BrowserService(config)
        
        # Initially not running
        assert not service.is_running
        
        # Start service
        await service.start()
        assert service.is_running
        assert service.playwright is not None
        assert service.browser is not None
        assert service.session_manager is not None
        
        # Stop service
        await service.stop()
        assert not service.is_running
        assert service.playwright is None
        assert service.browser is None
    
    @pytest.mark.asyncio 
    async def test_open_simple_page(self, browser_service):
        """Test opening a simple webpage."""
        # Test with data URL (no network required)
        test_html = "data:text/html,<html><body><h1>Test Page</h1><p>Hello World</p></body></html>"
        
        html = await browser_service.open_url("test_session", test_html)
        
        assert "Test Page" in html
        assert "Hello World" in html
        assert "<html>" in html
    
    @pytest.mark.asyncio
    async def test_screenshot_data_url(self, browser_service):
        """Test taking screenshot of a data URL."""
        test_html = "data:text/html,<html><body style='background:red;'><h1>Screenshot Test</h1></body></html>"
        
        with tempfile.NamedTemporaryFile(suffix=".png", delete=False) as tmp_file:
            screenshot_path = await browser_service.screenshot("test_session", test_html, tmp_file.name)
            
            assert os.path.exists(screenshot_path)
            assert screenshot_path.endswith(".png")
            
            # Clean up
            os.unlink(screenshot_path)
    
    @pytest.mark.asyncio
    async def test_session_management(self, browser_service):
        """Test browser session management."""
        session_id = "test_session_management"
        
        # Open page in session
        test_html = "data:text/html,<html><body><h1>Session Test</h1></body></html>"
        html = await browser_service.open_url(session_id, test_html)
        
        assert "Session Test" in html
        
        # Check session exists
        session_info = browser_service.session_manager.get_session_info(session_id)
        assert session_info is not None
        assert session_info["session_id"] == session_id
        
        # Close session
        await browser_service.session_manager.close_session(session_id)
        
        # Session should be gone
        session_info = browser_service.session_manager.get_session_info(session_id)
        assert session_info is None


class TestToolWrappers:
    """Test tool wrapper functions."""
    
    def test_tool_extract_with_html(self):
        """Test tool_extract with HTML content."""
        html = "<div><h1>Title 1</h1><h1>Title 2</h1></div>"
        
        # Mock the browser service to avoid actual startup
        with patch('browser_service.tools.get_browser_service') as mock_service:
            mock_service_instance = MagicMock()
            mock_service_instance.extract.return_value = ["Title 1", "Title 2"]
            mock_service.return_value = mock_service_instance
            
            results = tool_extract(html, "h1")
            
            assert len(results) == 2
            assert "Title 1" in results
            assert "Title 2" in results
            
            # Verify the service extract method was called
            mock_service_instance.extract.assert_called_once_with(html, "h1")
    
    def test_browser_session_context_manager(self):
        """Test BrowserSession context manager."""
        with patch('browser_service.tools.get_browser_service') as mock_service:
            mock_service_instance = MagicMock()
            mock_service.return_value = mock_service_instance
            
            with BrowserSession("test_context") as session:
                assert session.session_id == "test_context"
    
    def test_quick_search_and_extract_workflow(self):
        """Test the quick search and extract workflow."""
        with patch('browser_service.tools.tool_search') as mock_search, \
             patch('browser_service.tools.tool_extract') as mock_extract:
            
            # Mock search results
            mock_search.return_value = [
                {"title": "Result 1", "url": "http://example1.com", "snippet": "Snippet 1"},
                {"title": "Result 2", "url": "http://example2.com", "snippet": "Snippet 2"}
            ]
            
            # Mock extraction results
            mock_extract.side_effect = [
                ["Extracted 1"],
                ["Extracted 2"]
            ]
            
            results = quick_search_and_extract("test query", "h1", top_k=2)
            
            assert len(results) == 2
            assert results[0]["extracted_data"] == ["Extracted 1"]
            assert results[1]["extracted_data"] == ["Extracted 2"]
            
            # Verify calls
            mock_search.assert_called_once_with("test query", "duckduckgo", 2)
            assert mock_extract.call_count == 2


class TestMockedNetworkOperations:
    """Test network operations with mocked responses."""
    
    @patch('browser_service.service.requests.get')
    def test_robots_txt_checking(self, mock_get):
        """Test robots.txt checking functionality."""
        # Mock robots.txt response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = """
User-agent: *
Disallow: /private/
Allow: /
"""
        mock_get.return_value = mock_response
        
        config = load_config()
        config["respect_robots_txt"] = True
        service = BrowserService(config)
        
        # Test allowed URL
        allowed_url = "https://example.com/public/page"
        result = asyncio.run(service._check_robots_txt(allowed_url))
        assert result is True
        
        # Test disallowed URL
        disallowed_url = "https://example.com/private/secret"
        with pytest.raises(Exception):  # Should raise RobotsTxtBlockedError
            asyncio.run(service._check_robots_txt(disallowed_url))
    
    def test_rate_limiting(self):
        """Test rate limiting functionality."""
        config = load_config()
        config["rate_limit_delay"] = 0.5  # 500ms delay
        service = BrowserService(config)
        
        domain = "example.com"
        
        # First request should be immediate
        start_time = time.time()
        service._apply_rate_limit(domain)
        first_duration = time.time() - start_time
        assert first_duration < 0.1  # Should be almost immediate
        
        # Second request should be delayed
        start_time = time.time()
        service._apply_rate_limit(domain)
        second_duration = time.time() - start_time
        # Should be close to the rate limit delay
        assert 0.4 <= second_duration <= 0.6


if __name__ == "__main__":
    # Run tests
    pytest.main([__file__, "-v"])