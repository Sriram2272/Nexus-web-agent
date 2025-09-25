"""
Main planning module that converts natural language instructions into structured JSON action plans.
"""

import json
from typing import Optional
from .adapter import get_adapter, LLMAdapter
from .schema import Plan, PlanStep
from .utils import sanitize, safe_json_load, validate_instruction


class InstructionPlanner:
    """
    Planner that converts natural language instructions into structured action plans.
    """
    
    def __init__(self, adapter: Optional[LLMAdapter] = None):
        """
        Initialize planner with an LLM adapter.
        
        Args:
            adapter: LLM adapter to use. If None, will auto-select best available.
        """
        self.adapter = adapter or get_adapter()
        
    def _build_planning_prompt(self, instruction: str) -> str:
        """
        Build a comprehensive prompt for the LLM to generate action plans.
        
        Args:
            instruction: Sanitized user instruction
            
        Returns:
            Formatted prompt for the LLM
        """
        
        # Create detailed prompt with examples and strict JSON requirements
        prompt = f"""You are an AI web automation planner. Convert user instructions into precise JSON action plans.

INSTRUCTION: "{instruction}"

You must return ONLY a valid JSON array of steps. Each step must have this exact format:
{{"step_id": <number>, "tool": "<tool_name>", "args": {{<arguments>}}, "reason": "<explanation>", "confidence": <0.0-1.0>}}

AVAILABLE TOOLS:
1. "search" - Search for information on web
   - args: {{"query": "search terms"}}
   - Use for finding products, information, or websites

2. "open" - Open a specific URL  
   - args: {{"url": "https://example.com"}}
   - Use when you know exact URL to visit

3. "extract" - Extract data from current page
   - args: {{"selector": "CSS selector"}} OR {{"pattern": "regex pattern"}}
   - Use to get specific information from opened pages

4. "screenshot" - Take screenshot of page
   - args: {{"element": "CSS selector"}} OR {{"full_page": true}}
   - Use for visual confirmation or capturing results

5. "download" - Download a file
   - args: {{"url": "file_url", "filename": "local_name.ext"}}
   - Use for downloading files or documents

RULES:
- step_id starts at 1 and increments sequentially
- confidence should be 0.8-1.0 for clear tasks, 0.5-0.7 for complex/ambiguous ones
- reason must explain WHY this step is needed
- Keep plans focused and efficient (max 10 steps)
- Always start with search unless given a specific URL

EXAMPLE for "Find cheap laptops under 40k":
[
  {{"step_id": 1, "tool": "search", "args": {{"query": "laptops under 40000 price"}}, "reason": "Search for affordable laptops in the specified budget range", "confidence": 0.9}},
  {{"step_id": 2, "tool": "open", "args": {{"url": "https://flipkart.com"}}, "reason": "Open major e-commerce site to browse laptop listings", "confidence": 0.8}},
  {{"step_id": 3, "tool": "extract", "args": {{"selector": ".product-card .price"}}, "reason": "Extract laptop prices to compare with budget", "confidence": 0.7}}
]

Return ONLY the JSON array - no explanations, no markdown, no additional text:"""

        return prompt
    
    def _retry_plan_generation(self, instruction: str, max_attempts: int = 2) -> Plan:
        """
        Generate plan with retry logic for failed JSON parsing.
        
        Args:
            instruction: User instruction
            max_attempts: Maximum generation attempts
            
        Returns:
            Validated Plan object
            
        Raises:
            Exception: If plan generation fails after all attempts
        """
        last_error = None
        
        for attempt in range(max_attempts):
            try:
                # Build appropriate prompt for this attempt
                if attempt == 0:
                    prompt = self._build_planning_prompt(instruction)
                else:
                    # More explicit prompt for retry
                    prompt = f"""Your previous response was invalid JSON. 

INSTRUCTION: "{instruction}"

Return ONLY a valid JSON array with this exact schema:
[
  {{"step_id": 1, "tool": "search|open|extract|screenshot|download", "args": {{}}, "reason": "string", "confidence": 0.0-1.0}}
]

Available tools: search, open, extract, screenshot, download
No markdown, no explanations, just the JSON array:"""
                
                # Generate response
                response = self.adapter.generate(
                    prompt=prompt,
                    max_tokens=1024,
                    temperature=0.1  # Low temperature for consistent JSON
                )
                
                if not response:
                    raise ValueError("LLM returned empty response")
                
                # Parse JSON response
                plan_data = safe_json_load(response)
                
                # Validate it's a list
                if not isinstance(plan_data, list):
                    raise ValueError(f"Expected JSON array, got {type(plan_data)}")
                
                if not plan_data:
                    raise ValueError("Plan cannot be empty")
                
                # Convert to Plan object (this will validate schema)
                plan_steps = []
                for step_data in plan_data:
                    if not isinstance(step_data, dict):
                        raise ValueError(f"Each step must be a JSON object, got {type(step_data)}")
                    
                    # Create PlanStep (pydantic will validate)
                    step = PlanStep(**step_data)
                    plan_steps.append(step)
                
                # Create and validate full plan
                plan = Plan(steps=plan_steps)
                
                print(f"✅ Generated valid plan with {len(plan)} steps")
                return plan
                
            except Exception as e:
                last_error = e
                print(f"❌ Attempt {attempt + 1} failed: {str(e)}")
                
                if attempt < max_attempts - 1:
                    print(f"🔄 Retrying... ({max_attempts - attempt - 1} attempts left)")
                continue
        
        # All attempts failed
        raise Exception(
            f"Failed to generate valid plan after {max_attempts} attempts. "
            f"Last error: {str(last_error)}"
        )
    
    def plan_instruction(self, instruction: str) -> Plan:
        """
        Convert natural language instruction into a structured action plan.
        
        Args:
            instruction: Natural language instruction from user
            
        Returns:
            Validated Plan object containing action steps
            
        Raises:
            ValueError: If instruction is invalid
            Exception: If plan generation fails
        """
        
        # Validate and sanitize input
        cleaned_instruction = validate_instruction(instruction)
        print(f"📝 Planning instruction: '{cleaned_instruction}'")
        
        # Sanitize for PII
        sanitized_instruction = sanitize(cleaned_instruction)
        if sanitized_instruction != cleaned_instruction:
            print(f"🛡️  Sanitized instruction: '{sanitized_instruction}'")
        
        # Generate plan with retries
        plan = self._retry_plan_generation(sanitized_instruction)
        
        # Log plan summary
        print(f"📋 Generated plan:")
        for i, step in enumerate(plan.steps, 1):
            print(f"   {i}. {step.tool}: {step.reason} (confidence: {step.confidence:.1f})")
        
        return plan


# Convenience function for direct usage
def plan_instruction(instruction: str, adapter: Optional[LLMAdapter] = None) -> Plan:
    """
    Convenience function to plan an instruction using the default planner.
    
    Args:
        instruction: Natural language instruction
        adapter: Optional LLM adapter to use
        
    Returns:
        Validated Plan object
    """
    planner = InstructionPlanner(adapter=adapter)
    return planner.plan_instruction(instruction)