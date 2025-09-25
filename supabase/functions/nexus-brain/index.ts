import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

interface PlanStep {
  step_id: number
  tool: "search" | "open" | "extract" | "screenshot" | "download"
  args: Record<string, any>
  reason: string
  confidence: number
}

interface Plan {
  steps: PlanStep[]
}

// Simple instruction sanitization
function sanitizeInstruction(instruction: string): string {
  // Remove obvious PII patterns
  let sanitized = instruction
    .replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
    .replace(/\b\d{3}[-.]?\d{3}[-.]?\d{4}\b/g, '[PHONE]')
    .replace(/\b\d{4}[-\s]?\d{4}[-\s]?\d{4}[-\s]?\d{4}\b/g, '[CARD]')
  
  return sanitized.slice(0, 500) // Limit length
}

// Build planning prompt for local LLM simulation
function buildPlanningPrompt(instruction: string): string {
  return `You are an AI web automation planner. Convert user instructions into precise JSON action plans.

INSTRUCTION: "${instruction}"

You must return ONLY a valid JSON array of steps. Each step must have this exact format:
{"step_id": <number>, "tool": "<tool_name>", "args": {<arguments>}, "reason": "<explanation>", "confidence": <0.0-1.0>}

AVAILABLE TOOLS:
1. "search" - Search for information on web
   - args: {"query": "search terms"}
   - Use for finding products, information, or websites

2. "open" - Open a specific URL  
   - args: {"url": "https://example.com"}
   - Use when you know exact URL to visit

3. "extract" - Extract data from current page
   - args: {"selector": "CSS selector"} OR {"pattern": "regex pattern"}
   - Use to get specific information from opened pages

4. "screenshot" - Take screenshot of page
   - args: {"element": "CSS selector"} OR {"full_page": true}
   - Use for visual confirmation or capturing results

5. "download" - Download a file
   - args: {"url": "file_url", "filename": "local_name.ext"}
   - Use for downloading files or documents

RULES:
- step_id starts at 1 and increments sequentially
- confidence should be 0.8-1.0 for clear tasks, 0.5-0.7 for complex/ambiguous ones
- reason must explain WHY this step is needed
- Keep plans focused and efficient (max 10 steps)
- Always start with search unless given a specific URL

Return ONLY the JSON array - no explanations, no markdown, no additional text:`
}

// Simulate local LLM response (in production, this would call Ollama/llama-cpp)
function simulateLocalLLM(instruction: string): Plan {
  console.log(`Processing instruction: ${instruction}`)
  
  // For demo purposes, generate a reasonable plan based on instruction patterns
  const steps: PlanStep[] = []
  let stepId = 1
  
  // Determine search query from instruction
  const searchQuery = instruction.toLowerCase().includes('laptop') 
    ? `${instruction} site:flipkart.com OR site:amazon.in`
    : instruction
  
  // Always start with search
  steps.push({
    step_id: stepId++,
    tool: "search",
    args: { query: searchQuery },
    reason: "Search for relevant information based on user request",
    confidence: 0.9
  })
  
  // Add specific steps based on instruction content
  if (instruction.toLowerCase().includes('price') || instruction.toLowerCase().includes('under')) {
    steps.push({
      step_id: stepId++,
      tool: "extract",
      args: { selector: ".price, .cost, [data-price]" },
      reason: "Extract price information from search results",
      confidence: 0.8
    })
  }
  
  if (instruction.toLowerCase().includes('screenshot') || instruction.toLowerCase().includes('capture')) {
    steps.push({
      step_id: stepId++,
      tool: "screenshot",
      args: { full_page: true },
      reason: "Capture visual confirmation of results",
      confidence: 0.7
    })
  }
  
  // If looking for multiple items, add comparison step
  if (instruction.toLowerCase().includes('top') || instruction.toLowerCase().includes('best') || instruction.toLowerCase().includes('compare')) {
    steps.push({
      step_id: stepId++,
      tool: "extract",
      args: { selector: ".product-title, .product-name, h3, h4" },
      reason: "Extract product names and details for comparison",
      confidence: 0.8
    })
  }
  
  return { steps }
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    const { instruction } = await req.json()
    
    if (!instruction || typeof instruction !== 'string') {
      throw new Error('Instruction is required and must be a string')
    }

    console.log('Received instruction:', instruction)
    
    // Sanitize the instruction
    const sanitizedInstruction = sanitizeInstruction(instruction)
    console.log('Sanitized instruction:', sanitizedInstruction)
    
    // Generate plan using simulated local LLM
    const plan = simulateLocalLLM(sanitizedInstruction)
    
    console.log('Generated plan:', JSON.stringify(plan, null, 2))
    
    return new Response(
      JSON.stringify({
        success: true,
        plan,
        instruction: sanitizedInstruction,
        timestamp: new Date().toISOString()
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
    
  } catch (error) {
    console.error('Error in nexus-brain function:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : 'Internal server error',
        timestamp: new Date().toISOString()
      }),
      { 
        status: 400,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    )
  }
})