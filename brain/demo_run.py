#!/usr/bin/env python3
"""
NexusAI Brain Demo Runner

A CLI tool to test the NexusAI brain module locally.

SETUP:
1. Install dependencies: pip install -r requirements.txt
2. Set up your LLM backend:
   
   For Ollama (recommended):
   - Install Ollama: https://ollama.ai/
   - Start server: ollama serve  
   - Pull a model: ollama pull llama2
   - Set OLLAMA_URL=http://localhost:11434 (default)
   - Set OLLAMA_MODEL=llama2 (or your preferred model)
   
   For llama-cpp-python:
   - Download a GGUF model file
   - Set LLAMACPP_MODEL_PATH=/path/to/your/model.gguf
   - Set LLAMACPP_N_GPU_LAYERS=0 (or number for GPU offloading)

USAGE:
   python demo_run.py "Find laptops under 50000 INR and return top 5 links"
   python demo_run.py "Search for wireless earbuds on Amazon and screenshot the results"
   python demo_run.py "Download product catalogs from electronics websites"

OUTPUT:
   - Prints the generated plan to console
   - Saves plan as JSON to demo_plan.json
   - Shows planning statistics and adapter info

ENVIRONMENT VARIABLES:
   OLLAMA_URL           - Ollama server URL (default: http://localhost:11434)
   OLLAMA_MODEL         - Model name (default: llama2) 
   OLLAMA_TIMEOUT       - Request timeout seconds (default: 30)
   LLAMACPP_MODEL_PATH  - Path to GGUF model file
   LLAMACPP_N_CTX       - Context window size (default: 2048)
   LLAMACPP_N_GPU_LAYERS- GPU layers (default: 0)
   PREFERRED_ADAPTER    - 'ollama' or 'llamacpp' (default: ollama)
   MAX_RETRIES          - Max retry attempts (default: 2)
   TEMPERATURE          - Sampling temperature (default: 0.1)
"""

import sys
import json
import time
from pathlib import Path

# Add brain module to path  
sys.path.insert(0, str(Path(__file__).parent))

from planner import plan_instruction
from adapter import get_adapter
from utils import load_config


def main():
    """Main demo runner function."""
    
    # Check command line arguments
    if len(sys.argv) != 2:
        print("Usage: python demo_run.py \"<your instruction>\"")
        print("\nExamples:")
        print('  python demo_run.py "Find laptops under 50k INR"')
        print('  python demo_run.py "Search for gaming mice on Flipkart"')
        print('  python demo_run.py "Download product specs from tech websites"')
        sys.exit(1)
    
    instruction = sys.argv[1]
    
    print("🧠 NexusAI Brain Demo Runner")
    print("=" * 50)
    print(f"📝 Instruction: {instruction}")
    print()
    
    try:
        # Load configuration
        config = load_config()
        print("⚙️  Configuration:")
        print(f"   Preferred adapter: {config['preferred_adapter']}")
        print(f"   Max tokens: {config['max_tokens']}")
        print(f"   Temperature: {config['temperature']}")
        print(f"   Max retries: {config['max_retries']}")
        print()
        
        # Initialize adapter
        print("🔌 Initializing LLM adapter...")
        start_time = time.time()
        
        adapter = get_adapter()
        adapter_time = time.time() - start_time
        
        print(f"✅ Adapter ready in {adapter_time:.2f}s")
        print()
        
        # Generate plan
        print("🎯 Generating action plan...")
        plan_start = time.time()
        
        plan = plan_instruction(instruction, adapter=adapter)
        
        plan_time = time.time() - plan_start
        print(f"✅ Plan generated in {plan_time:.2f}s")
        print()
        
        # Display plan
        print("📋 Generated Action Plan:")
        print("=" * 50)
        
        for step in plan.steps:
            print(f"Step {step.step_id}: {step.tool.upper()}")
            print(f"  Args: {json.dumps(step.args, indent=8)}")
            print(f"  Reason: {step.reason}")
            print(f"  Confidence: {step.confidence:.1f}")
            print()
        
        # Save to file
        output_file = "demo_plan.json"
        plan_dict = plan.to_dict()
        
        with open(output_file, 'w') as f:
            json.dump(plan_dict, f, indent=2)
        
        print(f"💾 Plan saved to: {output_file}")
        print()
        
        # Statistics
        total_time = time.time() - start_time
        print("📊 Statistics:")
        print(f"   Total steps: {len(plan.steps)}")
        print(f"   Average confidence: {sum(s.confidence for s in plan.steps) / len(plan.steps):.2f}")
        print(f"   Adapter init time: {adapter_time:.2f}s")
        print(f"   Plan generation time: {plan_time:.2f}s")
        print(f"   Total time: {total_time:.2f}s")
        
        # Tool usage summary
        tools_used = {}
        for step in plan.steps:
            tools_used[step.tool] = tools_used.get(step.tool, 0) + 1
        
        print(f"   Tools used: {dict(tools_used)}")
        
        print("\n✅ Demo completed successfully!")
        
    except KeyboardInterrupt:
        print("\n❌ Demo interrupted by user")
        sys.exit(1)
        
    except Exception as e:
        print(f"\n❌ Demo failed: {str(e)}")
        
        # Provide helpful troubleshooting
        print("\n🔧 Troubleshooting:")
        
        if "No LLM adapters available" in str(e):
            print("   - Install and start Ollama: https://ollama.ai/")
            print("   - Or set up llama-cpp-python with LLAMACPP_MODEL_PATH")
            
        elif "Ollama server not available" in str(e):
            print("   - Start Ollama server: ollama serve")
            print("   - Pull a model: ollama pull llama2")
            
        elif "llama-cpp" in str(e):
            print("   - Set LLAMACPP_MODEL_PATH to your .gguf model file")
            print("   - Install llama-cpp-python: pip install llama-cpp-python")
            
        elif "timeout" in str(e).lower():
            print("   - Increase OLLAMA_TIMEOUT or wait for model to load")
            
        print(f"\n   Full error: {str(e)}")
        sys.exit(1)


if __name__ == "__main__":
    main()