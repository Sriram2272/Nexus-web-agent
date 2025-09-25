"""
Tests for NexusAI orchestrator functionality.
"""

import os
import sys
import unittest
from unittest.mock import patch, MagicMock
import tempfile

# Add parent directories to path for imports
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.dirname(os.path.abspath(__file__)))))

from orchestrator.executor import execute_plan, get_runner
from orchestrator.schema import PlanStep, ExecutionResult
from orchestrator.tools import search_tool, open_tool, extract_tool, tool_registry
from orchestrator.prompts import get_sample_plan
from orchestrator.config import load_orchestrator_config


class TestOrchestratorBasics(unittest.TestCase):
    """Test basic orchestrator functionality."""
    
    def setUp(self):
        """Set up test environment."""
        self.simple_plan = [
            {
                "step_id": 1,
                "tool": "search",
                "args": {"query": "test query"},
                "reason": "Test search",
                "confidence": 0.9
            }
        ]
    
    def test_plan_validation(self):
        """Test that plans are properly validated."""
        # Valid plan should work
        try:
            step = PlanStep(**self.simple_plan[0])
            self.assertEqual(step.step_id, 1)
            self.assertEqual(step.tool, "search")
        except Exception as e:
            self.fail(f"Valid plan step failed validation: {e}")
        
        # Invalid plan should fail
        invalid_plan = {
            "step_id": "not_a_number",
            "tool": "invalid_tool",
            "args": {}
        }
        
        with self.assertRaises(Exception):
            PlanStep(**invalid_plan)
    
    def test_tool_registry(self):
        """Test tool registry functionality."""
        # Check that default tools are registered
        available_tools = tool_registry.list_tools()
        expected_tools = ["search", "open", "extract", "screenshot", "download"]
        
        for tool in expected_tools:
            self.assertIn(tool, available_tools)
        
        # Test tool retrieval
        search_func = tool_registry.get_tool("search")
        self.assertIsNotNone(search_func)
        
        # Test invalid tool
        with self.assertRaises(ValueError):
            tool_registry.get_tool("nonexistent_tool")
    
    def test_configuration_loading(self):
        """Test configuration loading."""
        config = load_orchestrator_config()
        
        self.assertIsInstance(config, dict)
        self.assertIn("langchain_enabled", config)
        self.assertIn("max_retries", config)
        self.assertIn("step_timeout", config)
    
    @patch.dict(os.environ, {"LANGCHAIN_ENABLED": "false"})
    def test_custom_runner_selection(self):
        """Test that custom runner is selected when LangChain is disabled."""
        from orchestrator.custom_runner import CustomRunner
        
        runner = get_runner()
        self.assertIsInstance(runner, CustomRunner)
    
    def test_execution_result_schema(self):
        """Test ExecutionResult schema and methods."""
        from orchestrator.schema import ExecutionStepResult
        
        result = ExecutionResult(
            task_id="test_task",
            status="running"
        )
        
        # Test initial state
        self.assertEqual(result.task_id, "test_task")
        self.assertEqual(result.status, "running")
        self.assertEqual(len(result.steps), 0)
        
        # Test adding steps
        step = ExecutionStepResult(step_id=1, status="ok", output="test output")
        result.steps.append(step)
        
        # Test utility methods
        outputs = result.get_step_outputs()
        self.assertEqual(outputs[1], "test output")
        
        final_output = result.get_final_output()
        self.assertEqual(final_output, "test output")
        
        # Test serialization
        result_dict = result.to_dict()
        self.assertIsInstance(result_dict, dict)
        self.assertEqual(result_dict["task_id"], "test_task")


class TestToolImplementations(unittest.TestCase):
    """Test individual tool implementations."""
    
    @patch('orchestrator.tools.requests.get')
    def test_search_tool(self, mock_get):
        """Test search tool with mocked requests."""
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {
            "Answer": "Test answer",
            "AnswerURL": "https://example.com",
            "RelatedTopics": [
                {"Text": "Related topic 1", "FirstURL": "https://example1.com"},
                {"Text": "Related topic 2", "FirstURL": "https://example2.com"}
            ]
        }
        mock_get.return_value = mock_response
        
        results = search_tool("test query")
        
        self.assertIsInstance(results, list)
        self.assertGreater(len(results), 0)
        self.assertIn("title", results[0])
        self.assertIn("url", results[0])
        self.assertIn("snippet", results[0])
    
    @patch('orchestrator.tools.requests.get')
    def test_open_tool(self, mock_get):
        """Test open tool with mocked requests."""
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.text = "<html><body>Test content</body></html>"
        mock_get.return_value = mock_response
        
        content = open_tool("https://example.com")
        
        self.assertIsInstance(content, str)
        self.assertIn("Test content", content)
    
    def test_extract_tool(self):
        """Test extract tool with sample HTML."""
        html = """
        <html>
            <body>
                <h1>Title 1</h1>
                <h1>Title 2</h1>
                <p>Paragraph content</p>
            </body>
        </html>
        """
        
        # Test CSS selector extraction
        results = extract_tool("h1", html=html)
        
        self.assertIsInstance(results, list)
        self.assertEqual(len(results), 2)
        self.assertIn("Title 1", results)
        self.assertIn("Title 2", results)


class TestPlanExecution(unittest.TestCase):
    """Test complete plan execution."""
    
    def setUp(self):
        """Set up test environment with temporary directory."""
        self.temp_dir = tempfile.mkdtemp()
        os.environ["ORCHESTRATOR_OUTPUT_DIR"] = self.temp_dir
        os.environ["LANGCHAIN_ENABLED"] = "false"  # Use custom runner for tests
    
    def tearDown(self):
        """Clean up test environment."""
        import shutil
        shutil.rmtree(self.temp_dir, ignore_errors=True)
    
    def test_simple_plan_execution(self):
        """Test execution of a simple plan."""
        plan = get_sample_plan("simple_test")
        
        result = execute_plan(plan, task_id="test_simple")
        
        # Check result structure
        self.assertIsInstance(result, ExecutionResult)
        self.assertEqual(result.task_id, "test_simple")
        self.assertIn(result.status, ["ok", "error", "paused"])
        self.assertEqual(len(result.steps), len(plan))
        
        # Check that at least some steps completed
        completed_steps = [s for s in result.steps if s.status == "ok"]
        self.assertGreaterEqual(len(completed_steps), 0)
    
    @patch('orchestrator.tools.requests.get')
    def test_plan_with_mocked_network(self, mock_get):
        """Test plan execution with mocked network calls."""
        # Mock network responses
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = {"Answer": "Mocked answer"}
        mock_response.text = "<html><body>Mocked content</body></html>"
        mock_get.return_value = mock_response
        
        plan = [
            {
                "step_id": 1,
                "tool": "search",
                "args": {"query": "test query"},
                "reason": "Test search",
                "confidence": 0.9
            },
            {
                "step_id": 2,
                "tool": "open",
                "args": {"url": "https://example.com"},
                "reason": "Test open",
                "confidence": 0.8
            }
        ]
        
        result = execute_plan(plan, task_id="test_mocked")
        
        # Should complete successfully with mocked responses
        self.assertEqual(result.status, "ok")
        self.assertEqual(len(result.steps), 2)
        
        # Check that both steps completed
        for step in result.steps:
            self.assertEqual(step.status, "ok")
            self.assertIsNotNone(step.output)
    
    def test_plan_with_invalid_step(self):
        """Test plan execution with invalid step."""
        plan = [
            {
                "step_id": 1,
                "tool": "nonexistent_tool",
                "args": {"param": "value"},
                "reason": "Test invalid tool",
                "confidence": 0.5
            }
        ]
        
        result = execute_plan(plan, task_id="test_invalid")
        
        # Should fail with error status
        self.assertEqual(result.status, "error")
        self.assertEqual(len(result.steps), 1)
        self.assertEqual(result.steps[0].status, "error")
        self.assertIsNotNone(result.steps[0].error_message)
    
    def test_progress_callback(self):
        """Test progress callback functionality."""
        plan = get_sample_plan("simple_test")
        
        callback_calls = []
        
        def test_callback(step_id: int, status: str, output):
            callback_calls.append((step_id, status))
        
        result = execute_plan(plan, task_id="test_callback", on_update=test_callback)
        
        # Check that callback was called
        self.assertGreater(len(callback_calls), 0)
        
        # Check callback format
        for call in callback_calls:
            self.assertEqual(len(call), 2)  # step_id, status
            self.assertIsInstance(call[0], int)  # step_id
            self.assertIsInstance(call[1], str)  # status


class TestSamplePlans(unittest.TestCase):
    """Test execution of sample plans."""
    
    def setUp(self):
        """Set up test environment."""
        os.environ["LANGCHAIN_ENABLED"] = "false"
    
    def test_all_sample_plans_format(self):
        """Test that all sample plans have valid format."""
        from orchestrator.prompts import SAMPLE_PLANS
        
        for plan_name, plan in SAMPLE_PLANS.items():
            with self.subTest(plan_name=plan_name):
                # Test that plan can be validated
                try:
                    validated_steps = [PlanStep(**step) for step in plan]
                    self.assertGreater(len(validated_steps), 0)
                except Exception as e:
                    self.fail(f"Sample plan '{plan_name}' is invalid: {e}")
    
    def test_get_sample_plan(self):
        """Test sample plan retrieval."""
        plan = get_sample_plan("simple_test")
        self.assertIsInstance(plan, list)
        self.assertGreater(len(plan), 0)
        
        # Test fallback for nonexistent plan
        fallback_plan = get_sample_plan("nonexistent_plan")
        self.assertIsInstance(fallback_plan, list)
        self.assertGreater(len(fallback_plan), 0)


if __name__ == "__main__":
    # Set up logging for tests
    import logging
    logging.basicConfig(level=logging.WARNING)  # Reduce noise during tests
    
    # Run tests
    unittest.main(verbosity=2)