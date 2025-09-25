"""
Prompt templates for NexusAI orchestrator and planner.
"""

# Main planning prompt template
PLANNING_PROMPT_TEMPLATE = """
You are an AI planning assistant that converts natural language instructions into structured JSON action plans.

AVAILABLE TOOLS:
- search: Search for information online {"query": "search terms"}
- open: Open a specific URL {"url": "https://example.com"}
- extract: Extract data from HTML using CSS selector {"selector": ".product-name", "html": "optional_html_content"}
- screenshot: Take a screenshot of a webpage {"url": "https://example.com", "full_page": true}
- download: Download a file {"url": "https://example.com/file.pdf", "filename": "document.pdf"}

RULES:
1. Return ONLY a valid JSON array of steps, no other text
2. Each step must have: step_id (sequential starting from 1), tool, args, reason, confidence
3. Keep confidence between 0.0 and 1.0
4. Make steps logical and sequential
5. Use specific, actionable arguments

EXAMPLE INSTRUCTION: "Find laptops under 50000 INR on Flipkart and get top 5 product names"

EXAMPLE OUTPUT:
[
  {
    "step_id": 1,
    "tool": "search",
    "args": {"query": "laptops under 50000 INR site:flipkart.com"},
    "reason": "Search for laptops in budget range on Flipkart",
    "confidence": 0.9
  },
  {
    "step_id": 2,
    "tool": "open",
    "args": {"url": "https://www.flipkart.com/search?q=laptops%20under%2050000"},
    "reason": "Open Flipkart laptop search results page",
    "confidence": 0.8
  },
  {
    "step_id": 3,
    "tool": "extract",
    "args": {"selector": "._4rR01T, .s1Q9rs"},
    "reason": "Extract product names from search results",
    "confidence": 0.85
  }
]

INSTRUCTION: {instruction}

Return only the JSON array:
"""

# Error correction prompt for invalid JSON
JSON_CORRECTION_PROMPT = """
Your previous response was not valid JSON. Please return ONLY a valid JSON array matching this schema:

[
  {
    "step_id": <number>,
    "tool": "<search|open|extract|screenshot|download>",
    "args": {<tool_specific_arguments>},
    "reason": "<explanation>",
    "confidence": <0.0-1.0>
  }
]

No additional text, explanations, or markdown. Just the JSON array.

Original instruction: {instruction}
Your previous response: {previous_response}

Corrected JSON array:
"""

# Sample plans for testing
SAMPLE_PLANS = {
    "laptop_search": [
        {
            "step_id": 1,
            "tool": "search", 
            "args": {"query": "laptops under 50000 INR"},
            "reason": "Search for affordable laptops",
            "confidence": 0.9
        },
        {
            "step_id": 2,
            "tool": "open",
            "args": {"url": "https://www.flipkart.com/"},
            "reason": "Open e-commerce site",
            "confidence": 0.8
        }
    ],
    
    "web_research": [
        {
            "step_id": 1,
            "tool": "open",
            "args": {"url": "https://example.com"},
            "reason": "Open target website",
            "confidence": 0.9
        },
        {
            "step_id": 2,
            "tool": "extract",
            "args": {"selector": "h1, h2, .main-content"},
            "reason": "Extract main content from page",
            "confidence": 0.85
        },
        {
            "step_id": 3,
            "tool": "screenshot",
            "args": {"url": "https://example.com", "full_page": True},
            "reason": "Take screenshot for reference",
            "confidence": 0.7
        }
    ],
    
    "simple_test": [
        {
            "step_id": 1,
            "tool": "search",
            "args": {"query": "python programming tutorial"},
            "reason": "Find programming resources",
            "confidence": 0.95
        }
    ]
}


def get_planning_prompt(instruction: str) -> str:
    """Get formatted planning prompt for given instruction."""
    return PLANNING_PROMPT_TEMPLATE.format(instruction=instruction)


def get_correction_prompt(instruction: str, previous_response: str) -> str:
    """Get formatted JSON correction prompt."""
    return JSON_CORRECTION_PROMPT.format(
        instruction=instruction,
        previous_response=previous_response
    )


def get_sample_plan(plan_name: str) -> list:
    """Get a sample plan by name."""
    return SAMPLE_PLANS.get(plan_name, SAMPLE_PLANS["simple_test"])