"""
NexusAI Agent Orchestrator

Executes structured plans by mapping steps to concrete tools.
Supports both LangChain-based and custom runner implementations.
"""

from .executor import execute_plan, ExecutionResult
from .schema import PlanStep, ExecutionStepResult, ExecutionResult

__version__ = "1.0.0"
__all__ = ["execute_plan", "ExecutionResult", "PlanStep", "ExecutionStepResult"]