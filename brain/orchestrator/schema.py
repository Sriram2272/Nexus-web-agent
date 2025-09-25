"""
Pydantic models for NexusAI orchestrator.
"""

from datetime import datetime
from typing import Dict, Any, List, Optional, Literal
from pydantic import BaseModel, Field, validator


class PlanStep(BaseModel):
    """Represents a single step in an execution plan."""
    
    step_id: int = Field(..., description="Unique identifier for the step")
    tool: Literal["search", "open", "extract", "screenshot", "download"] = Field(
        ..., description="Tool to execute"
    )
    args: Dict[str, Any] = Field(..., description="Arguments for the tool")
    reason: Optional[str] = Field(None, description="Reason for this step")
    confidence: Optional[float] = Field(None, ge=0.0, le=1.0, description="Confidence score")
    retry: Optional[int] = Field(0, ge=0, description="Number of retries allowed")
    requires_human: Optional[bool] = Field(False, description="Whether human intervention is required")
    
    @validator('args')
    def validate_tool_args(cls, v, values):
        """Validate that args match the expected format for each tool."""
        if 'tool' not in values:
            return v
            
        tool = values['tool']
        required_args = {
            'search': ['query'],
            'open': ['url'],
            'extract': ['selector'],  # html can come from previous step
            'screenshot': ['url'],
            'download': ['url', 'filename'],
        }
        
        if tool in required_args:
            for arg in required_args[tool]:
                if arg not in v and arg != 'html':  # html can be passed from previous step
                    raise ValueError(f"Missing required argument '{arg}' for tool '{tool}'")
        
        return v


class ExecutionStepResult(BaseModel):
    """Result of executing a single plan step."""
    
    step_id: int = Field(..., description="Step identifier")
    status: Literal["ok", "error", "paused", "running"] = Field(..., description="Execution status")
    output: Optional[Any] = Field(None, description="Step output data")
    error_message: Optional[str] = Field(None, description="Error message if failed")
    started_at: datetime = Field(default_factory=datetime.now, description="Step start time")
    finished_at: Optional[datetime] = Field(None, description="Step completion time")
    retry_count: int = Field(0, description="Number of retries attempted")
    
    def mark_finished(self, status: str, output: Any = None, error_message: str = None):
        """Mark the step as finished with given status."""
        self.finished_at = datetime.now()
        self.status = status
        if output is not None:
            self.output = output
        if error_message:
            self.error_message = error_message


class ExecutionResult(BaseModel):
    """Complete result of plan execution."""
    
    task_id: str = Field(..., description="Unique task identifier")
    status: Literal["ok", "error", "paused", "running"] = Field(..., description="Overall status")
    steps: List[ExecutionStepResult] = Field(default_factory=list, description="Step results")
    created_at: datetime = Field(default_factory=datetime.now, description="Execution start time")
    finished_at: Optional[datetime] = Field(None, description="Execution completion time")
    error_message: Optional[str] = Field(None, description="Overall error message")
    session_id: Optional[str] = Field(None, description="Session identifier")
    
    def mark_finished(self, status: str, error_message: str = None):
        """Mark the execution as finished."""
        self.finished_at = datetime.now()
        self.status = status
        if error_message:
            self.error_message = error_message
    
    def get_step_outputs(self) -> Dict[int, Any]:
        """Get a mapping of step_id to output for successful steps."""
        return {
            step.step_id: step.output 
            for step in self.steps 
            if step.status == "ok" and step.output is not None
        }
    
    def get_final_output(self) -> Any:
        """Get the output of the last successful step."""
        successful_steps = [s for s in self.steps if s.status == "ok"]
        if successful_steps:
            return successful_steps[-1].output
        return None
    
    def to_dict(self) -> Dict[str, Any]:
        """Convert to dictionary for JSON serialization."""
        return {
            "task_id": self.task_id,
            "status": self.status,
            "steps": [
                {
                    "step_id": step.step_id,
                    "status": step.status,
                    "output": step.output,
                    "error_message": step.error_message,
                    "started_at": step.started_at.isoformat() if step.started_at else None,
                    "finished_at": step.finished_at.isoformat() if step.finished_at else None,
                    "retry_count": step.retry_count,
                }
                for step in self.steps
            ],
            "created_at": self.created_at.isoformat(),
            "finished_at": self.finished_at.isoformat() if self.finished_at else None,
            "error_message": self.error_message,
            "session_id": self.session_id,
        }