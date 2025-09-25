"""
LangChain-based orchestrator implementation for NexusAI.
Uses LangChain Tools and AgentExecutor for plan execution.
"""

import logging
from typing import List, Dict, Any, Optional, Callable

logger = logging.getLogger(__name__)

# Check if LangChain is available
try:
    from langchain.tools import Tool
    from langchain.agents import AgentExecutor, create_react_agent
    from langchain.prompts import PromptTemplate
    from langchain_core.language_models.base import BaseLanguageModel
    LANGCHAIN_AVAILABLE = True
except ImportError:
    LANGCHAIN_AVAILABLE = False
    logger.warning("LangChain not available. Install with: pip install langchain")

from .schema import PlanStep, ExecutionStepResult, ExecutionResult
from .tools import tool_registry
from .config import load_orchestrator_config


class LocalLLMWrapper:
    """Wrapper to make brain adapter compatible with LangChain."""
    
    def __init__(self):
        try:
            from brain.adapter import generate as brain_generate
            self.generate_func = brain_generate
        except ImportError:
            logger.error("Brain adapter not available")
            self.generate_func = None
    
    def __call__(self, prompt: str, **kwargs) -> str:
        """Call the local LLM via brain adapter."""
        if not self.generate_func:
            raise RuntimeError("Brain adapter not available")
        
        max_tokens = kwargs.get('max_tokens', 512)
        temperature = kwargs.get('temperature', 0.1)
        
        return self.generate_func(prompt, max_tokens=max_tokens, temperature=temperature)


class LangChainRunner:
    """LangChain-based orchestrator."""
    
    def __init__(self):
        if not LANGCHAIN_AVAILABLE:
            raise ImportError("LangChain is required for LangChain runner")
        
        self.config = load_orchestrator_config()
        self.tools = self._create_langchain_tools()
        self.llm = LocalLLMWrapper()
    
    def _create_langchain_tools(self) -> List[Tool]:
        """Create LangChain Tool objects from our tool registry."""
        langchain_tools = []
        
        tool_descriptions = tool_registry.get_tool_descriptions()
        
        for tool_name in tool_registry.list_tools():
            tool_func = tool_registry.get_tool(tool_name)
            description = tool_descriptions[tool_name]
            
            # Create LangChain tool with proper description and schema
            lc_tool = Tool.from_function(
                func=tool_func,
                name=tool_name,
                description=f"{description}. Use JSON format for arguments."
            )
            
            langchain_tools.append(lc_tool)
        
        return langchain_tools
    
    def execute_plan(
        self, 
        plan_steps: List[Dict[str, Any]], 
        task_id: str,
        session_id: Optional[str] = None,
        on_update: Optional[Callable[[int, str, Any], None]] = None
    ) -> ExecutionResult:
        """
        Execute a plan using LangChain agent.
        
        Args:
            plan_steps: List of plan step dictionaries
            task_id: Unique task identifier
            session_id: Optional session identifier
            on_update: Optional callback for progress updates
            
        Returns:
            ExecutionResult with step results
        """
        logger.info(f"Starting plan execution with LangChain runner (task_id: {task_id})")
        
        # Create execution result
        result = ExecutionResult(
            task_id=task_id,
            status="running",
            session_id=session_id
        )
        
        # Validate plan steps
        try:
            validated_steps = [PlanStep(**step) for step in plan_steps]
        except Exception as e:
            error_msg = f"Invalid plan format: {e}"
            logger.error(error_msg)
            result.mark_finished("error", error_msg)
            return result
        
        # Create agent prompt template
        prompt_template = PromptTemplate.from_template(
            """
            You are an AI assistant that executes structured plans step by step.
            
            Available tools: {tools}
            Tool names: {tool_names}
            
            Execute this plan step by step:
            {plan_text}
            
            Current step: {current_step}
            
            {agent_scratchpad}
            """
        )
        
        try:
            # Create ReAct agent
            agent = create_react_agent(
                llm=self.llm,
                tools=self.tools,
                prompt=prompt_template
            )
            
            # Create agent executor
            agent_executor = AgentExecutor(
                agent=agent,
                tools=self.tools,
                verbose=self.config.get("debug_mode", False),
                max_iterations=len(validated_steps) * 2,  # Allow some flexibility
                handle_parsing_errors=True
            )
            
            # Execute each step through the agent
            plan_text = self._format_plan_for_agent(validated_steps)
            
            for step in validated_steps:
                step_result = ExecutionStepResult(
                    step_id=step.step_id,
                    status="running"
                )
                result.steps.append(step_result)
                
                if on_update:
                    on_update(step.step_id, "running", None)
                
                try:
                    # Format step for agent execution
                    step_instruction = self._format_step_for_agent(step)
                    
                    # Execute through agent
                    agent_result = agent_executor.invoke({
                        "input": step_instruction,
                        "plan_text": plan_text,
                        "current_step": f"Step {step.step_id}: {step.reason or step.tool}"
                    })
                    
                    output = agent_result.get("output", "No output")
                    step_result.mark_finished("ok", output)
                    
                    logger.info(f"LangChain step {step.step_id} completed")
                    
                    if on_update:
                        on_update(step.step_id, "ok", output)
                
                except Exception as e:
                    error_msg = f"LangChain execution failed: {e}"
                    logger.error(error_msg)
                    
                    if step.requires_human:
                        step_result.mark_finished("paused", None, error_msg)
                        result.mark_finished("paused", f"Step {step.step_id} requires human intervention")
                        return result
                    
                    step_result.mark_finished("error", None, error_msg)
                    result.mark_finished("error", f"Step {step.step_id} failed: {error_msg}")
                    return result
            
            # All steps completed
            result.mark_finished("ok")
            logger.info(f"LangChain plan execution completed (task_id: {task_id})")
            
            return result
            
        except Exception as e:
            error_msg = f"LangChain agent setup failed: {e}"
            logger.error(error_msg)
            result.mark_finished("error", error_msg)
            return result
    
    def _format_plan_for_agent(self, steps: List[PlanStep]) -> str:
        """Format plan steps for agent context."""
        plan_lines = []
        for step in steps:
            plan_lines.append(f"{step.step_id}. {step.tool}: {step.args} ({step.reason})")
        return "\n".join(plan_lines)
    
    def _format_step_for_agent(self, step: PlanStep) -> str:
        """Format a single step for agent execution."""
        args_str = ", ".join([f"{k}={v}" for k, v in step.args.items()])
        return f"Execute {step.tool} with arguments: {args_str}. Reason: {step.reason}"