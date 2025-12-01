"""Orchestrator service for coordinating AI teams."""

import asyncio
import uuid
from datetime import datetime
from typing import Literal, Callable, Awaitable, Optional

from src.models import AnthropicClient, GoogleClient
from src.utils import get_logger

logger = get_logger(__name__)


class ThoughtStreamItem:
    """A single thought in the agent's reasoning stream."""

    def __init__(self, text: str, team: Literal["anthropic", "google"]) -> None:
        self.id = str(uuid.uuid4())
        self.text = text
        self.timestamp = datetime.utcnow().isoformat()
        self.team = team

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "id": self.id,
            "text": self.text,
            "timestamp": self.timestamp,
            "team": self.team,
        }


class TeamOutput:
    """Output from a single AI team."""

    def __init__(
        self,
        team: Literal["anthropic", "google"],
        model_used: str,
    ) -> None:
        self.team = team
        self.status: Literal["pending", "thinking", "generating", "complete", "error"] = "pending"
        self.thoughts: list[ThoughtStreamItem] = []
        self.generated_code: str | None = None
        self.model_used = model_used
        self.token_count = 0
        self.error_message: str | None = None

    def add_thought(self, text: str, callback: Optional[Callable] = None) -> None:
        """Add a thought to the stream."""
        thought = ThoughtStreamItem(text, self.team)
        self.thoughts.append(thought)

        # Trigger callback if provided
        if callback:
            asyncio.create_task(callback("thought_added", self.team, thought.to_dict()))

    def to_dict(self) -> dict:
        """Convert to dictionary."""
        return {
            "team": self.team,
            "status": self.status,
            "thoughts": [t.to_dict() for t in self.thoughts],
            "generated_code": self.generated_code,
            "model_used": self.model_used,
            "token_count": self.token_count,
            "error_message": self.error_message,
        }


class OrchestrationService:
    """Service for orchestrating multiple AI teams."""

    CODE_GENERATION_SYSTEM_PROMPT = """You are an expert frontend developer. Generate a complete, working component based on the user's description.

Requirements:
- Output ONLY the code, no explanations or markdown
- Use modern patterns and best practices
- Include TypeScript types
- Use Tailwind CSS for styling
- Make it production-ready with proper error handling
- Keep it clean, maintainable, and well-structured

The component should be complete and ready to use."""

    def __init__(self) -> None:
        self.anthropic_client = AnthropicClient(model="claude-sonnet-4-5-20250929")
        self.google_client = GoogleClient(model="gemini-2.0-flash-exp")

    async def generate_with_anthropic(
        self,
        brief: str,
        target_framework: str,
        team_output: TeamOutput,
        event_callback: Optional[Callable[[str, str, dict], Awaitable[None]]] = None,
    ) -> None:
        """Generate code using Anthropic's Claude."""
        try:
            team_output.status = "thinking"
            if event_callback:
                await event_callback("status_change", "anthropic", {"status": "thinking"})

            team_output.add_thought("Analyzing the brief and planning the component structure...", event_callback)

            # Create framework-specific prompt
            prompt = self._build_prompt(brief, target_framework)

            team_output.status = "generating"
            if event_callback:
                await event_callback("status_change", "anthropic", {"status": "generating"})

            team_output.add_thought(f"Generating {target_framework} component with Claude Sonnet 4.5...", event_callback)

            # Generate code
            code = await self.anthropic_client.complete(
                prompt=prompt,
                system=self.CODE_GENERATION_SYSTEM_PROMPT,
                max_tokens=4096,
                temperature=0.7,
            )

            team_output.generated_code = code
            team_output.token_count = len(code.split())  # Rough estimate
            team_output.status = "complete"

            if event_callback:
                await event_callback("status_change", "anthropic", {"status": "complete"})
                await event_callback("code_generated", "anthropic", {
                    "code": code,
                    "token_count": team_output.token_count
                })

            team_output.add_thought("Code generation complete! Component is ready for review.", event_callback)

            logger.info(
                "Anthropic generation complete",
                framework=target_framework,
                code_length=len(code),
            )

        except Exception as e:
            team_output.status = "error"
            team_output.error_message = str(e)

            if event_callback:
                await event_callback("error", "anthropic", {
                    "error": str(e),
                    "status": "error"
                })

            team_output.add_thought(f"Error during generation: {str(e)}", event_callback)
            logger.error("Anthropic generation failed", error=str(e))

    async def generate_with_google(
        self,
        brief: str,
        target_framework: str,
        team_output: TeamOutput,
        event_callback: Optional[Callable[[str, str, dict], Awaitable[None]]] = None,
    ) -> None:
        """Generate code using Google's Gemini."""
        try:
            team_output.status = "thinking"
            if event_callback:
                await event_callback("status_change", "google", {"status": "thinking"})

            team_output.add_thought("Processing the brief and determining the best approach...", event_callback)

            # Create framework-specific prompt
            prompt = self._build_prompt(brief, target_framework)

            team_output.status = "generating"
            if event_callback:
                await event_callback("status_change", "google", {"status": "generating"})

            team_output.add_thought(f"Creating {target_framework} component with Gemini 2.0 Flash...", event_callback)

            # Generate code
            code = await self.google_client.complete(
                prompt=prompt,
                system=self.CODE_GENERATION_SYSTEM_PROMPT,
            )

            team_output.generated_code = code
            team_output.token_count = len(code.split())  # Rough estimate
            team_output.status = "complete"

            if event_callback:
                await event_callback("status_change", "google", {"status": "complete"})
                await event_callback("code_generated", "google", {
                    "code": code,
                    "token_count": team_output.token_count
                })

            team_output.add_thought("Generation successful! Component is ready for integration.", event_callback)

            logger.info(
                "Google generation complete",
                framework=target_framework,
                code_length=len(code),
            )

        except Exception as e:
            team_output.status = "error"
            team_output.error_message = str(e)

            if event_callback:
                await event_callback("error", "google", {
                    "error": str(e),
                    "status": "error"
                })

            team_output.add_thought(f"Error during generation: {str(e)}", event_callback)
            logger.error("Google generation failed", error=str(e))

    def _build_prompt(self, brief: str, target_framework: str) -> str:
        """Build a framework-specific prompt."""
        framework_instructions = {
            "react": "Create a React component using TypeScript and functional components with hooks.",
            "vue": "Create a Vue 3 component using the Composition API with TypeScript.",
            "svelte": "Create a Svelte component with TypeScript support.",
            "vanilla": "Create vanilla JavaScript/TypeScript code with no framework dependencies.",
        }

        instruction = framework_instructions.get(target_framework, framework_instructions["react"])

        return f"""{instruction}

Component Description:
{brief}

Generate the complete component code now."""

    async def orchestrate(
        self,
        brief: str,
        target_framework: Literal["react", "vue", "svelte", "vanilla"],
        include_teams: list[Literal["anthropic", "google"]],
        event_callback: Optional[Callable[[str, str, dict], Awaitable[None]]] = None,
    ) -> dict[str, TeamOutput]:
        """Orchestrate code generation across multiple AI teams.

        Args:
            brief: Natural language description of what to build
            target_framework: Target framework for code generation
            include_teams: Which AI teams to dispatch

        Returns:
            Dictionary mapping team names to their outputs
        """
        logger.info(
            "Starting orchestration",
            framework=target_framework,
            teams=include_teams,
            brief_length=len(brief),
        )

        # Initialize team outputs
        teams: dict[str, TeamOutput] = {}

        if "anthropic" in include_teams:
            teams["anthropic"] = TeamOutput(
                team="anthropic",
                model_used="claude-sonnet-4-5-20250929",
            )

        if "google" in include_teams:
            teams["google"] = TeamOutput(
                team="google",
                model_used="gemini-2.0-flash-exp",
            )

        # Generate code in parallel
        tasks = []

        if "anthropic" in teams:
            tasks.append(
                self.generate_with_anthropic(
                    brief,
                    target_framework,
                    teams["anthropic"],
                    event_callback,
                )
            )

        if "google" in teams:
            tasks.append(
                self.generate_with_google(
                    brief,
                    target_framework,
                    teams["google"],
                    event_callback,
                )
            )

        # Wait for all teams to complete
        await asyncio.gather(*tasks)

        logger.info("Orchestration complete", teams=list(teams.keys()))

        return teams
