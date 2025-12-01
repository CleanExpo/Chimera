"""Test script for LangGraph orchestration workflow."""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.graphs import (
    create_orchestration_workflow,
    FAST_CONFIG,
    BALANCED_CONFIG,
)
from src.utils import get_logger

logger = get_logger(__name__)


async def test_workflow():
    """Test the orchestration workflow."""
    print("\n" + "=" * 80)
    print("Testing LangGraph Orchestration Workflow")
    print("=" * 80 + "\n")

    # Test brief
    brief = """Create a simple counter component with increment and decrement buttons.
The counter should display the current count and have two buttons:
- One to increment the count
- One to decrement the count
Use a clean, modern design with Tailwind CSS."""

    # Test with FAST config (no review)
    print("Testing with FAST_CONFIG (no review, parallel generation)...")
    print("-" * 80)

    try:
        workflow = create_orchestration_workflow(config=FAST_CONFIG)
        result = await workflow.run(
            brief=brief,
            framework="react",
        )

        print(f"\nWorkflow Status: {result['status']}")
        print(f"Job ID: {result['job_id']}")
        print(f"Current Phase: {result['current_phase']}")
        print(f"Refinement Iterations: {result['refinement_iteration']}")
        print(f"\nTotal Thoughts: {len(result['thoughts'])}")

        if result["plan"]:
            print(f"\nPlan created: {len(result['plan'])} characters")

        if result["anthropic_output"]:
            print(f"\nAnthropic Output:")
            print(f"  - Code length: {len(result['anthropic_output']['code'])} characters")
            print(f"  - Token count: {result['anthropic_output']['token_count']}")
            print(f"  - Error: {result['anthropic_output']['error']}")

        if result["google_output"]:
            print(f"\nGoogle Output:")
            print(f"  - Code length: {len(result['google_output']['code'])} characters")
            print(f"  - Token count: {result['google_output']['token_count']}")
            print(f"  - Error: {result['google_output']['error']}")

        if result["error_message"]:
            print(f"\nError: {result['error_message']}")

        print("\n" + "=" * 80)
        print("FAST_CONFIG Test: PASS" if result["status"] != "error" else "FAST_CONFIG Test: FAIL")
        print("=" * 80 + "\n")

        # Show thought stream
        print("\nThought Stream:")
        print("-" * 80)
        for thought in result["thoughts"]:
            print(f"[{thought['source'].upper()}] {thought['text']}")

        return result["status"] != "error"

    except Exception as e:
        print(f"\nTest FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


async def test_workflow_with_review():
    """Test the workflow with review enabled."""
    print("\n\n" + "=" * 80)
    print("Testing LangGraph Orchestration Workflow with Review")
    print("=" * 80 + "\n")

    # Test brief
    brief = """Create a simple todo list component.
It should allow users to:
- Add new todos
- Mark todos as complete
- Delete todos
Use TypeScript and Tailwind CSS."""

    print("Testing with BALANCED_CONFIG (review enabled, 1 refinement iteration)...")
    print("-" * 80)

    try:
        workflow = create_orchestration_workflow(config=BALANCED_CONFIG)
        result = await workflow.run(
            brief=brief,
            framework="react",
        )

        print(f"\nWorkflow Status: {result['status']}")
        print(f"Job ID: {result['job_id']}")
        print(f"Current Phase: {result['current_phase']}")
        print(f"Refinement Iterations: {result['refinement_iteration']}")
        print(f"Needs Refinement: {result['needs_refinement']}")

        if result["anthropic_review"]:
            print(f"\nAnthropic Review:")
            print(f"  - Has issues: {result['anthropic_review']['has_issues']}")
            print(f"  - Issues: {len(result['anthropic_review']['issues'])}")
            print(f"  - Suggestions: {len(result['anthropic_review']['suggestions'])}")
            print(f"  - Confidence: {result['anthropic_review']['confidence']}")

        if result["google_review"]:
            print(f"\nGoogle Review:")
            print(f"  - Has issues: {result['google_review']['has_issues']}")
            print(f"  - Issues: {len(result['google_review']['issues'])}")
            print(f"  - Suggestions: {len(result['google_review']['suggestions'])}")
            print(f"  - Confidence: {result['google_review']['confidence']}")

        print("\n" + "=" * 80)
        print("BALANCED_CONFIG Test: PASS" if result["status"] != "error" else "BALANCED_CONFIG Test: FAIL")
        print("=" * 80 + "\n")

        return result["status"] != "error"

    except Exception as e:
        print(f"\nTest FAILED with exception: {e}")
        import traceback
        traceback.print_exc()
        return False


async def main():
    """Run all tests."""
    print("\n🚀 Starting LangGraph Workflow Tests\n")

    # Test 1: Fast config (no review)
    test1_passed = await test_workflow()

    # Test 2: Balanced config (with review)
    test2_passed = await test_workflow_with_review()

    # Summary
    print("\n\n" + "=" * 80)
    print("TEST SUMMARY")
    print("=" * 80)
    print(f"Test 1 (FAST_CONFIG): {'✅ PASS' if test1_passed else '❌ FAIL'}")
    print(f"Test 2 (BALANCED_CONFIG): {'✅ PASS' if test2_passed else '❌ FAIL'}")
    print("=" * 80 + "\n")

    if test1_passed and test2_passed:
        print("✅ All tests passed!")
        return 0
    else:
        print("❌ Some tests failed")
        return 1


if __name__ == "__main__":
    exit_code = asyncio.run(main())
    sys.exit(exit_code)
