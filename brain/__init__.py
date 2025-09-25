"""
NexusAI Brain Module

A modular AI planning system that converts natural language instructions
into structured JSON action plans using local LLMs.
"""

from .planner import plan_instruction
from .schema import Plan, PlanStep, ToolArgs
from .adapter import get_adapter, OllamaAdapter, LlamaCppAdapter

__version__ = "1.0.0"
__all__ = ["plan_instruction", "Plan", "PlanStep", "ToolArgs", "get_adapter"]