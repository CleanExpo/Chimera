"""Quick integration test for AI orchestration."""

import asyncio
import sys
from pathlib import Path

# Add src to path
sys.path.insert(0, str(Path(__file__).parent / "src"))

from src.orchestrator import OrchestrationService


async def test_orchestration():
    """Test the orchestration service."""
    print("🔧 Testing AI Orchestration Integration\n")

    service = OrchestrationService()

    brief = "Create a simple button component that changes color when clicked"
    framework = "react"
    teams = ["anthropic", "google"]

    print(f"📝 Brief: {brief}")
    print(f"🎯 Framework: {framework}")
    print(f"👥 Teams: {', '.join(teams)}")
    print("\n" + "="*60 + "\n")

    try:
        # Run orchestration
        print("🚀 Starting orchestration...\n")

        results = await service.orchestrate(
            brief=brief,
            target_framework=framework,
            include_teams=teams,
        )

        # Display results
        for team_name, team_output in results.items():
            print(f"\n{'='*60}")
            print(f"🤖 Team: {team_name.upper()}")
            print(f"📊 Status: {team_output.status}")
            print(f"🔢 Model: {team_output.model_used}")
            print(f"💭 Tokens: ~{team_output.token_count}")

            if team_output.thoughts:
                print(f"\n💡 Thoughts:")
                for thought in team_output.thoughts:
                    print(f"   • {thought.text}")

            if team_output.generated_code:
                print(f"\n📄 Generated Code Preview:")
                code_preview = team_output.generated_code[:500]
                print(f"   {code_preview}...")
                print(f"\n   (Total length: {len(team_output.generated_code)} characters)")

            if team_output.error_message:
                print(f"\n❌ Error: {team_output.error_message}")

        print("\n" + "="*60)
        print("\n✅ Integration test complete!")

    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()


if __name__ == "__main__":
    asyncio.run(test_orchestration())
