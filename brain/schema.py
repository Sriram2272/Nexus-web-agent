"""
Pydantic models for validating LLM-generated action plans.
"""

from typing import Dict, Any, List, Literal
from pydantic import BaseModel, Field, validator


class ToolArgs(BaseModel):
    """
    Flexible container for tool arguments.
    Allows arbitrary key-value pairs but validates basic types.
    """
    args: Dict[str, Any] = Field(default_factory=dict)
    
    @validator('args')
    def validate_args_types(cls, v):
        """Ensure all values are JSON-serializable basic types."""
        allowed_types = (str, int, float, bool, type(None))
        for key, value in v.items():
            if not isinstance(value, allowed_types):
                raise ValueError(f"Argument '{key}' has unsupported type {type(value)}. Allowed: str, int, float, bool, None")
        return v


class PlanStep(BaseModel):
    """
    A single step in an action plan.
    """
    step_id: int = Field(..., ge=1, description="Sequential step identifier starting from 1")
    tool: Literal["search", "open", "extract", "screenshot", "download"] = Field(
        ..., description="The tool/action to execute"
    )
    args: Dict[str, Any] = Field(..., description="Arguments for the tool")
    reason: str = Field(..., min_length=10, max_length=500, description="Human-readable explanation for this step")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Confidence score for this step (0.0-1.0)")
    
    @validator('args')
    def validate_tool_args(cls, v, values):
        """Validate arguments based on the selected tool."""
        tool = values.get('tool')
        
        if tool == 'search':
            if 'query' not in v:
                raise ValueError("Search tool requires 'query' argument")
            if not isinstance(v['query'], str) or len(v['query'].strip()) == 0:
                raise ValueError("Search query must be a non-empty string")
                
        elif tool == 'open':
            if 'url' not in v:
                raise ValueError("Open tool requires 'url' argument")
            if not isinstance(v['url'], str) or not v['url'].startswith(('http://', 'https://')):
                raise ValueError("URL must be a valid HTTP/HTTPS URL")
                
        elif tool == 'extract':
            if 'selector' not in v and 'pattern' not in v:
                raise ValueError("Extract tool requires 'selector' or 'pattern' argument")
                
        elif tool == 'screenshot':
            # Screenshot may have optional 'element' or 'full_page' args
            pass
            
        elif tool == 'download':
            if 'url' not in v:
                raise ValueError("Download tool requires 'url' argument")
            if 'filename' not in v:
                raise ValueError("Download tool requires 'filename' argument")
        
        return v


class Plan(BaseModel):
    """
    A complete action plan consisting of multiple steps.
    """
    steps: List[PlanStep] = Field(..., min_items=1, max_items=20)
    
    @validator('steps')
    def validate_step_sequence(cls, v):
        """Ensure steps have sequential IDs starting from 1."""
        if not v:
            raise ValueError("Plan must contain at least one step")
            
        step_ids = [step.step_id for step in v]
        expected_ids = list(range(1, len(v) + 1))
        
        if step_ids != expected_ids:
            raise ValueError(f"Step IDs must be sequential starting from 1. Got: {step_ids}, expected: {expected_ids}")
        
        return v
    
    def __iter__(self):
        """Make Plan iterable over its steps."""
        return iter(self.steps)
    
    def __len__(self):
        """Return number of steps in the plan."""
        return len(self.steps)
    
    def to_dict(self):
        """Convert plan to dictionary format."""
        return [step.dict() for step in self.steps]