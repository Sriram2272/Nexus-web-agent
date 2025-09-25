"""
Session management for NexusAI Browser Service.
Handles browser contexts, storage state persistence, and session isolation.
"""

import json
import logging
import os
import time
from typing import Dict, Optional, Any
from pathlib import Path
from playwright.async_api import BrowserContext, Browser
from cryptography.fernet import Fernet
import base64

logger = logging.getLogger(__name__)


class SessionEncryption:
    """Handle encryption/decryption of session storage states."""
    
    def __init__(self, encryption_key: Optional[str] = None):
        """
        Initialize encryption handler.
        
        Args:
            encryption_key: Base64 encoded encryption key, or None to disable encryption
        """
        self.fernet = None
        if encryption_key:
            try:
                self.fernet = Fernet(encryption_key.encode())
            except Exception as e:
                logger.warning(f"Invalid encryption key provided: {e}")
    
    def encrypt_data(self, data: str) -> str:
        """Encrypt data if encryption is enabled."""
        if not self.fernet:
            return data
        return self.fernet.encrypt(data.encode()).decode()
    
    def decrypt_data(self, encrypted_data: str) -> str:
        """Decrypt data if encryption is enabled."""
        if not self.fernet:
            return encrypted_data
        try:
            return self.fernet.decrypt(encrypted_data.encode()).decode()
        except Exception as e:
            logger.error(f"Failed to decrypt session data: {e}")
            return "{}"  # Return empty state on decryption failure
    
    @staticmethod
    def generate_key() -> str:
        """Generate a new encryption key."""
        return Fernet.generate_key().decode()


class SessionInfo:
    """Information about a browser session."""
    
    def __init__(self, session_id: str, context: BrowserContext):
        self.session_id = session_id
        self.context = context
        self.created_at = time.time()
        self.last_used = time.time()
        self.page_count = 0
        self.storage_file = None
    
    def update_last_used(self):
        """Update the last used timestamp."""
        self.last_used = time.time()
    
    def get_age(self) -> float:
        """Get session age in seconds."""
        return time.time() - self.created_at
    
    def get_idle_time(self) -> float:
        """Get idle time in seconds."""
        return time.time() - self.last_used


class SessionManager:
    """
    Manages browser contexts per session with storage state persistence.
    """
    
    def __init__(self, sessions_dir: str, encryption_key: Optional[str] = None):
        """
        Initialize session manager.
        
        Args:
            sessions_dir: Directory to store session files
            encryption_key: Optional encryption key for session storage
        """
        self.sessions_dir = Path(sessions_dir)
        self.sessions_dir.mkdir(parents=True, exist_ok=True)
        
        self.sessions: Dict[str, SessionInfo] = {}
        self.browser: Optional[Browser] = None
        self.encryption = SessionEncryption(encryption_key)
        
        # Session cleanup settings
        self.max_session_age = 3600  # 1 hour
        self.max_idle_time = 1800    # 30 minutes
        
        logger.info(f"SessionManager initialized with directory: {sessions_dir}")
    
    def set_browser(self, browser: Browser):
        """Set the browser instance for creating contexts."""
        self.browser = browser
    
    async def create_session(self, session_id: str, **context_options) -> BrowserContext:
        """
        Create a new browser context for the session.
        
        Args:
            session_id: Unique session identifier
            **context_options: Additional context options
            
        Returns:
            BrowserContext instance
            
        Raises:
            RuntimeError: If browser is not set or session already exists
        """
        if not self.browser:
            raise RuntimeError("Browser not set. Call set_browser() first.")
        
        if session_id in self.sessions:
            logger.warning(f"Session {session_id} already exists, returning existing context")
            return self.sessions[session_id].context
        
        # Load storage state if exists
        storage_file = self.sessions_dir / f"{session_id}.json"
        storage_state = None
        
        if storage_file.exists():
            try:
                storage_state = self._load_storage_state(storage_file)
                logger.info(f"Loaded storage state for session {session_id}")
            except Exception as e:
                logger.warning(f"Failed to load storage state for {session_id}: {e}")
        
        # Create context with storage state
        context_opts = context_options.copy()
        if storage_state:
            context_opts["storage_state"] = storage_state
        
        context = await self.browser.new_context(**context_opts)
        
        # Store session info
        session_info = SessionInfo(session_id, context)
        session_info.storage_file = storage_file
        self.sessions[session_id] = session_info
        
        logger.info(f"Created new session: {session_id}")
        return context
    
    def get_session(self, session_id: str) -> Optional[BrowserContext]:
        """
        Get existing session context.
        
        Args:
            session_id: Session identifier
            
        Returns:
            BrowserContext if exists, None otherwise
        """
        if session_id not in self.sessions:
            return None
        
        session_info = self.sessions[session_id]
        session_info.update_last_used()
        return session_info.context
    
    async def save_storage_state(self, session_id: str, path: Optional[str] = None) -> str:
        """
        Save storage state for a session.
        
        Args:
            session_id: Session identifier
            path: Optional custom path to save to
            
        Returns:
            Path where state was saved
            
        Raises:
            ValueError: If session doesn't exist
        """
        if session_id not in self.sessions:
            raise ValueError(f"Session {session_id} not found")
        
        context = self.sessions[session_id].context
        
        if path is None:
            path = str(self.sessions_dir / f"{session_id}.json")
        
        # Get storage state from context
        storage_state = await context.storage_state()
        
        # Encrypt and save
        encrypted_data = self.encryption.encrypt_data(json.dumps(storage_state))
        
        with open(path, 'w') as f:
            f.write(encrypted_data)
        
        logger.info(f"Saved storage state for session {session_id} to {path}")
        return path
    
    def load_storage_state(self, session_id: str, path: str) -> Dict[str, Any]:
        """
        Load storage state from file.
        
        Args:
            session_id: Session identifier
            path: Path to storage state file
            
        Returns:
            Storage state dictionary
        """
        return self._load_storage_state(Path(path))
    
    def _load_storage_state(self, file_path: Path) -> Dict[str, Any]:
        """Internal method to load and decrypt storage state."""
        with open(file_path, 'r') as f:
            encrypted_data = f.read()
        
        decrypted_data = self.encryption.decrypt_data(encrypted_data)
        return json.loads(decrypted_data)
    
    async def close_session(self, session_id: str, save_state: bool = True):
        """
        Close a browser session.
        
        Args:
            session_id: Session identifier
            save_state: Whether to save storage state before closing
        """
        if session_id not in self.sessions:
            logger.warning(f"Attempted to close non-existent session: {session_id}")
            return
        
        session_info = self.sessions[session_id]
        
        # Save storage state if requested
        if save_state:
            try:
                await self.save_storage_state(session_id)
            except Exception as e:
                logger.error(f"Failed to save storage state for {session_id}: {e}")
        
        # Close context
        try:
            await session_info.context.close()
        except Exception as e:
            logger.error(f"Error closing context for {session_id}: {e}")
        
        # Remove from sessions
        del self.sessions[session_id]
        
        logger.info(f"Closed session: {session_id}")
    
    async def cleanup_expired_sessions(self):
        """Clean up expired or idle sessions."""
        expired_sessions = []
        
        for session_id, session_info in self.sessions.items():
            if (session_info.get_age() > self.max_session_age or 
                session_info.get_idle_time() > self.max_idle_time):
                expired_sessions.append(session_id)
        
        for session_id in expired_sessions:
            logger.info(f"Cleaning up expired session: {session_id}")
            await self.close_session(session_id)
    
    async def close_all_sessions(self, save_states: bool = True):
        """
        Close all active sessions.
        
        Args:
            save_states: Whether to save storage states before closing
        """
        session_ids = list(self.sessions.keys())
        
        for session_id in session_ids:
            await self.close_session(session_id, save_state=save_states)
        
        logger.info(f"Closed {len(session_ids)} sessions")
    
    def get_session_info(self, session_id: str) -> Optional[Dict[str, Any]]:
        """
        Get information about a session.
        
        Args:
            session_id: Session identifier
            
        Returns:
            Session information dictionary or None
        """
        if session_id not in self.sessions:
            return None
        
        session_info = self.sessions[session_id]
        return {
            "session_id": session_id,
            "created_at": session_info.created_at,
            "last_used": session_info.last_used,
            "age": session_info.get_age(),
            "idle_time": session_info.get_idle_time(),
            "page_count": session_info.page_count,
            "has_storage_file": session_info.storage_file and session_info.storage_file.exists()
        }
    
    def list_sessions(self) -> Dict[str, Dict[str, Any]]:
        """
        List all active sessions.
        
        Returns:
            Dictionary mapping session IDs to session info
        """
        return {
            session_id: self.get_session_info(session_id)
            for session_id in self.sessions.keys()
        }
    
    def get_storage_files(self) -> list:
        """Get list of stored session files."""
        return list(self.sessions_dir.glob("*.json"))