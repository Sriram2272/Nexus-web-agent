"""
Main FastAPI application for NexusAI Task Queue

This serves as the entry point for the API service in Docker.
"""
import logging
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import uvicorn

from tasks.queue_api import router as queue_router
from tasks.config import get_config

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Create FastAPI app
app = FastAPI(
    title="NexusAI Task Queue API",
    description="Redis-based task queue and scheduler for NexusAI",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include task queue router
app.include_router(queue_router)

# Global exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Global exception handler caught: {str(exc)}")
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error", "error": str(exc)}
    )

# Root endpoint
@app.get("/")
async def root():
    """Root endpoint with API information"""
    config = get_config()
    
    return {
        "name": "NexusAI Task Queue API",
        "version": "1.0.0",
        "status": "running",
        "redis_url": config.redis_url.split('@')[-1] if '@' in config.redis_url else config.redis_url,  # Hide credentials
        "scheduler_enabled": config.scheduler_enabled,
        "endpoints": {
            "docs": "/docs",
            "queue_management": "/queue/*",
            "health": "/queue/health",
            "stats": "/queue/stats"
        }
    }

# Startup event
@app.on_event("startup")
async def startup_event():
    logger.info("Starting NexusAI Task Queue API")
    config = get_config()
    logger.info(f"Redis URL: {config.redis_url}")
    logger.info(f"Default Queue: {config.default_queue}")
    logger.info(f"Scheduler Enabled: {config.scheduler_enabled}")

# Shutdown event  
@app.on_event("shutdown")
async def shutdown_event():
    logger.info("Shutting down NexusAI Task Queue API")

if __name__ == "__main__":
    config = get_config()
    
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        log_level=config.log_level.lower(),
        reload=False  # Set to True for development
    )