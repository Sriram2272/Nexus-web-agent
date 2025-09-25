"""
Simple integration test for the demo runner.
"""

import json
import subprocess
import sys
from pathlib import Path
import os

# Add brain module to path
brain_dir = Path(__file__).parent.parent
sys.path.insert(0, str(brain_dir))

from schema import Plan, PlanStep


def test_demo_run():
    """Test that demo_run.py produces valid output."""
    
    # Test instruction
    test_instruction = "Find budget smartphones under 20000 on e-commerce sites"
    
    # Run demo script
    demo_script = brain_dir / "demo_run.py"
    
    try:
        # Execute demo runner
        result = subprocess.run([
            sys.executable, str(demo_script), test_instruction
        ], 
        capture_output=True, 
        text=True, 
        timeout=60,  # 60 second timeout
        cwd=str(brain_dir)
        )
        
        print(f"Demo runner exit code: {result.returncode}")
        print(f"STDOUT:\n{result.stdout}")
        
        if result.stderr:
            print(f"STDERR:\n{result.stderr}")
        
        # Check if demo completed successfully
        if result.returncode != 0:
            if "No LLM adapters available" in result.stderr:
                print("❌ SKIPPED: No LLM adapters available for testing")
                print("   To run this test:")
                print("   - Install Ollama and run 'ollama serve' and 'ollama pull llama2'")
                print("   - Or set LLAMACPP_MODEL_PATH to a .gguf model file")
                return True  # Skip test, don't fail
            else:
                print(f"❌ Demo runner failed with exit code {result.returncode}")
                return False
        
        # Check if output file was created
        output_file = brain_dir / "demo_plan.json"
        
        if not output_file.exists():
            print("❌ Output file demo_plan.json was not created")
            return False
        
        # Load and validate the generated plan
        with open(output_file) as f:
            plan_data = json.load(f)
        
        # Validate it's a list
        if not isinstance(plan_data, list):
            print(f"❌ Plan should be a list, got {type(plan_data)}")
            return False
        
        if not plan_data:
            print("❌ Plan should not be empty")
            return False
        
        # Validate each step conforms to schema
        try:
            steps = []
            for step_data in plan_data:
                step = PlanStep(**step_data)
                steps.append(step)
            
            # Create full plan object to validate sequence
            plan = Plan(steps=steps)
            
            print(f"✅ Generated valid plan with {len(plan)} steps")
            
            # Print plan summary
            for i, step in enumerate(plan.steps):
                print(f"   Step {i+1}: {step.tool} - {step.reason[:50]}...")
            
        except Exception as e:
            print(f"❌ Plan validation failed: {str(e)}")
            print(f"Plan data: {json.dumps(plan_data, indent=2)}")
            return False
        
        # Clean up
        try:
            output_file.unlink()
        except:
            pass
        
        print("✅ Test passed!")
        return True
        
    except subprocess.TimeoutExpired:
        print("❌ Demo runner timed out after 60 seconds")
        return False
        
    except Exception as e:
        print(f"❌ Test failed with exception: {str(e)}")
        return False


def test_schema_validation():
    """Test the Plan schema validation."""
    
    print("Testing Plan schema validation...")
    
    # Valid plan
    valid_plan_data = [
        {
            "step_id": 1,
            "tool": "search", 
            "args": {"query": "test query"},
            "reason": "This is a test step for validation",
            "confidence": 0.8
        },
        {
            "step_id": 2,
            "tool": "open",
            "args": {"url": "https://example.com"},
            "reason": "Open the example website",
            "confidence": 0.9
        }
    ]
    
    try:
        steps = [PlanStep(**step_data) for step_data in valid_plan_data]
        plan = Plan(steps=steps)
        print(f"✅ Valid plan created with {len(plan)} steps")
    except Exception as e:
        print(f"❌ Valid plan failed validation: {str(e)}")
        return False
    
    # Invalid plan - missing required field
    invalid_plan_data = [
        {
            "step_id": 1,
            "tool": "search",
            # Missing 'args' field
            "reason": "This should fail",
            "confidence": 0.8
        }
    ]
    
    try:
        steps = [PlanStep(**step_data) for step_data in invalid_plan_data]
        plan = Plan(steps=steps)
        print("❌ Invalid plan should have failed validation")
        return False
    except Exception:
        print("✅ Invalid plan correctly rejected")
    
    print("✅ Schema validation test passed!")
    return True


if __name__ == "__main__":
    print("🧪 Running NexusAI Brain Tests")
    print("=" * 40)
    
    # Run schema test
    schema_ok = test_schema_validation()
    print()
    
    # Run demo test
    demo_ok = test_demo_run()
    print()
    
    if schema_ok and demo_ok:
        print("🎉 All tests passed!")
        sys.exit(0)
    else:
        print("❌ Some tests failed")
        sys.exit(1)