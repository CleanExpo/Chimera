"""Workflow nodes for orchestration."""

import asyncio
import uuid
from datetime import datetime

from src.models import AnthropicClient, GoogleClient
from src.utils import get_logger

from .orchestration_state import CodeOutput, OrchestrationState, ReviewResult, ThoughtItem

logger = get_logger(__name__)


class OrchestrationNodes:
    """Collection of nodes for the orchestration workflow."""

    PLANNING_SYSTEM_PROMPT = """You are an expert technical architect. Analyze the requirements and create a detailed implementation plan.

Your plan should include:
1. Component structure and architecture
2. Key features and functionality breakdown
3. Technical approach and patterns to use
4. Potential challenges and how to address them
5. Testing considerations

Be specific and actionable. Keep the plan concise but comprehensive."""

    CODE_GENERATION_SYSTEM_PROMPT = """You are an expert frontend developer. Generate a complete, working component based on the implementation plan and requirements.

Requirements:
- Output ONLY the code, no explanations or markdown code blocks
- Use modern patterns and best practices
- Include TypeScript types
- Use Tailwind CSS for styling
- Make it production-ready with proper error handling
- Keep it clean, maintainable, and well-structured
- Follow the implementation plan provided

The component should be complete and ready to use."""

    REVIEW_SYSTEM_PROMPT = """You are an expert code reviewer. Review the generated code for:

1. **Correctness**: Does it meet the requirements? Are there any logical errors?
2. **Best Practices**: Does it follow modern patterns and conventions?
3. **Type Safety**: Are TypeScript types properly defined?
4. **Error Handling**: Are edge cases and errors handled appropriately?
5. **Code Quality**: Is it maintainable, readable, and well-structured?
6. **Performance**: Are there any obvious performance issues?

Provide your review as a JSON object:
{
  "has_issues": boolean,
  "issues": ["list", "of", "specific", "issues"],
  "suggestions": ["list", "of", "improvement", "suggestions"],
  "confidence": float (0.0 to 1.0)
}

Be thorough but fair. Minor style preferences should not count as issues."""

    REFINEMENT_SYSTEM_PROMPT = """You are an expert developer. Refine the code based on the review feedback.

Review feedback:
{review_feedback}

Original code:
{original_code}

Generate improved code that addresses all the issues mentioned in the review.
Output ONLY the refined code, no explanations or markdown."""

    def __init__(self) -> None:
        self.anthropic_client = AnthropicClient(model="claude-sonnet-4-5-20250929")
        self.google_client = GoogleClient(model="gemini-2.0-flash-exp")

    def _add_thought(
        self,
        state: OrchestrationState,
        text: str,
        source: str,
    ) -> None:
        """Add a thought to the state."""
        thought = ThoughtItem(
            id=str(uuid.uuid4()),
            text=text,
            timestamp=datetime.utcnow().isoformat(),
            source=source,  # type: ignore
        )
        state["thoughts"].append(thought)

    async def plan_node(self, state: OrchestrationState) -> OrchestrationState:
        """Create an implementation plan from the brief."""
        try:
            state["status"] = "planning"
            state["current_phase"] = "planning"
            self._add_thought(
                state,
                "Starting planning phase - analyzing requirements and creating implementation strategy",
                "planner",
            )

            logger.info("Planning phase started", job_id=state["job_id"])

            # Build planning prompt
            prompt = f"""Create an implementation plan for the following component:

Framework: {state["framework"]}
Requirements:
{state["brief"]}

Provide a detailed, actionable implementation plan."""

            # Use Anthropic for planning (Claude is excellent at structured thinking)
            plan = await self.anthropic_client.complete(
                prompt=prompt,
                system=self.PLANNING_SYSTEM_PROMPT,
                max_tokens=2048,
                temperature=0.7,
            )

            state["plan"] = plan
            state["implementation_strategy"] = f"Generate {state['framework']} component following the plan"

            self._add_thought(
                state,
                f"Implementation plan created: {len(plan.split())} words, covering architecture, features, and technical approach",
                "planner",
            )

            logger.info("Planning phase complete", job_id=state["job_id"], plan_length=len(plan))

        except Exception as e:
            state["status"] = "error"
            state["error_message"] = f"Planning failed: {str(e)}"
            self._add_thought(state, f"Planning error: {str(e)}", "planner")
            logger.error("Planning failed", job_id=state["job_id"], error=str(e))

        return state

    async def generate_node(self, state: OrchestrationState) -> OrchestrationState:
        """Generate code using both Anthropic and Google in parallel."""
        try:
            state["status"] = "generating"
            state["current_phase"] = "generating"
            self._add_thought(
                state,
                "Starting code generation phase - dispatching to Anthropic and Google teams",
                "planner",
            )

            logger.info("Generation phase started", job_id=state["job_id"])

            # Build generation prompt with plan
            prompt = f"""Implementation Plan:
{state["plan"]}

Component Requirements:
{state["brief"]}

Framework: {state["framework"]}

Generate the complete {state["framework"]} component now."""

            if state["parallel_generation"]:
                # Generate in parallel
                anthropic_task = self._generate_with_anthropic(state, prompt)
                google_task = self._generate_with_google(state, prompt)
                await asyncio.gather(anthropic_task, google_task)
            else:
                # Generate sequentially
                await self._generate_with_anthropic(state, prompt)
                await self._generate_with_google(state, prompt)

            logger.info(
                "Generation phase complete",
                job_id=state["job_id"],
                anthropic_success=state["anthropic_output"] is not None,
                google_success=state["google_output"] is not None,
            )

        except Exception as e:
            state["status"] = "error"
            state["error_message"] = f"Generation failed: {str(e)}"
            self._add_thought(state, f"Generation error: {str(e)}", "planner")
            logger.error("Generation failed", job_id=state["job_id"], error=str(e))

        return state

    async def _generate_with_anthropic(
        self,
        state: OrchestrationState,
        prompt: str,
    ) -> None:
        """Generate code with Anthropic."""
        try:
            self._add_thought(
                state,
                "Anthropic team analyzing requirements with Claude Sonnet 4.5",
                "anthropic",
            )

            code = await self.anthropic_client.complete(
                prompt=prompt,
                system=self.CODE_GENERATION_SYSTEM_PROMPT,
                max_tokens=4096,
                temperature=0.7,
            )

            state["anthropic_output"] = CodeOutput(
                code=code,
                model_used="claude-sonnet-4-5-20250929",
                token_count=len(code.split()),
                thoughts=[],
                error=None,
            )

            self._add_thought(
                state,
                f"Anthropic team generated {len(code)} characters of code",
                "anthropic",
            )

            logger.info("Anthropic generation complete", job_id=state["job_id"])

        except Exception as e:
            state["anthropic_output"] = CodeOutput(
                code="",
                model_used="claude-sonnet-4-5-20250929",
                token_count=0,
                thoughts=[],
                error=str(e),
            )
            self._add_thought(state, f"Anthropic generation error: {str(e)}", "anthropic")
            logger.error("Anthropic generation failed", job_id=state["job_id"], error=str(e))

    async def _generate_with_google(
        self,
        state: OrchestrationState,
        prompt: str,
    ) -> None:
        """Generate code with Google."""
        try:
            self._add_thought(
                state,
                "Google team analyzing requirements with Gemini 2.0 Flash",
                "google",
            )

            code = await self.google_client.complete(
                prompt=prompt,
                system=self.CODE_GENERATION_SYSTEM_PROMPT,
            )

            state["google_output"] = CodeOutput(
                code=code,
                model_used="gemini-2.0-flash-exp",
                token_count=len(code.split()),
                thoughts=[],
                error=None,
            )

            self._add_thought(
                state,
                f"Google team generated {len(code)} characters of code",
                "google",
            )

            logger.info("Google generation complete", job_id=state["job_id"])

        except Exception as e:
            state["google_output"] = CodeOutput(
                code="",
                model_used="gemini-2.0-flash-exp",
                token_count=0,
                thoughts=[],
                error=str(e),
            )
            self._add_thought(state, f"Google generation error: {str(e)}", "google")
            logger.error("Google generation failed", job_id=state["job_id"], error=str(e))

    async def review_node(self, state: OrchestrationState) -> OrchestrationState:
        """Review generated code for issues."""
        if not state["enable_review"]:
            self._add_thought(state, "Review disabled - skipping review phase", "reviewer")
            state["needs_refinement"] = False
            return state

        try:
            state["status"] = "reviewing"
            state["current_phase"] = "reviewing"
            self._add_thought(
                state,
                "Starting review phase - analyzing generated code for quality and correctness",
                "reviewer",
            )

            logger.info("Review phase started", job_id=state["job_id"])

            # Review both outputs in parallel if they exist
            tasks = []
            if state["anthropic_output"] and not state["anthropic_output"]["error"]:
                tasks.append(self._review_code(state, state["anthropic_output"]["code"], "anthropic"))
            if state["google_output"] and not state["google_output"]["error"]:
                tasks.append(self._review_code(state, state["google_output"]["code"], "google"))

            if tasks:
                reviews = await asyncio.gather(*tasks)
                if state["anthropic_output"] and not state["anthropic_output"]["error"]:
                    state["anthropic_review"] = reviews[0]
                if state["google_output"] and not state["google_output"]["error"]:
                    idx = 1 if state["anthropic_output"] and not state["anthropic_output"]["error"] else 0
                    state["google_review"] = reviews[idx]

            # Determine if refinement is needed
            anthropic_needs_work = (
                state["anthropic_review"]
                and state["anthropic_review"]["has_issues"]
            )
            google_needs_work = (
                state["google_review"]
                and state["google_review"]["has_issues"]
            )

            state["needs_refinement"] = bool(anthropic_needs_work or google_needs_work)

            if state["needs_refinement"]:
                self._add_thought(
                    state,
                    "Review found issues that need refinement - proceeding to refinement phase",
                    "reviewer",
                )
            else:
                self._add_thought(
                    state,
                    "Review complete - code meets quality standards",
                    "reviewer",
                )

            logger.info(
                "Review phase complete",
                job_id=state["job_id"],
                needs_refinement=state["needs_refinement"],
            )

        except Exception as e:
            state["status"] = "error"
            state["error_message"] = f"Review failed: {str(e)}"
            self._add_thought(state, f"Review error: {str(e)}", "reviewer")
            logger.error("Review failed", job_id=state["job_id"], error=str(e))

        return state

    async def _review_code(
        self,
        state: OrchestrationState,
        code: str,
        source: str,
    ) -> ReviewResult:
        """Review a single code output."""
        try:
            self._add_thought(
                state,
                f"Reviewing {source} output - analyzing code quality and correctness",
                "reviewer",
            )

            prompt = f"""Review this {state["framework"]} component code:

Requirements:
{state["brief"]}

Implementation Plan:
{state["plan"]}

Generated Code:
```
{code}
```

Strictness Level: {state["review_strictness"]}

Provide your review as a JSON object with has_issues, issues, suggestions, and confidence fields."""

            review_text = await self.anthropic_client.complete(
                prompt=prompt,
                system=self.REVIEW_SYSTEM_PROMPT,
                max_tokens=2048,
                temperature=0.3,
            )

            # Parse JSON from review
            import json
            # Try to extract JSON from the response
            if "```json" in review_text:
                json_start = review_text.find("```json") + 7
                json_end = review_text.find("```", json_start)
                review_text = review_text[json_start:json_end].strip()
            elif "```" in review_text:
                json_start = review_text.find("```") + 3
                json_end = review_text.find("```", json_start)
                review_text = review_text[json_start:json_end].strip()

            review_data = json.loads(review_text)

            result = ReviewResult(
                has_issues=review_data.get("has_issues", False),
                issues=review_data.get("issues", []),
                suggestions=review_data.get("suggestions", []),
                confidence=review_data.get("confidence", 0.8),
            )

            if result["has_issues"]:
                self._add_thought(
                    state,
                    f"{source} review found {len(result['issues'])} issues",
                    "reviewer",
                )
            else:
                self._add_thought(
                    state,
                    f"{source} review passed - no critical issues found",
                    "reviewer",
                )

            return result

        except Exception as e:
            logger.error(f"{source} review failed", job_id=state["job_id"], error=str(e))
            return ReviewResult(
                has_issues=False,
                issues=[],
                suggestions=[],
                confidence=0.5,
            )

    async def refine_node(self, state: OrchestrationState) -> OrchestrationState:
        """Refine code based on review feedback."""
        try:
            state["status"] = "refining"
            state["current_phase"] = "refining"
            state["refinement_iteration"] += 1

            self._add_thought(
                state,
                f"Starting refinement phase (iteration {state['refinement_iteration']})",
                "refiner",
            )

            logger.info(
                "Refinement phase started",
                job_id=state["job_id"],
                iteration=state["refinement_iteration"],
            )

            # Refine both outputs if they have issues
            tasks = []
            if (
                state["anthropic_output"]
                and state["anthropic_review"]
                and state["anthropic_review"]["has_issues"]
            ):
                tasks.append(
                    self._refine_code(
                        state,
                        state["anthropic_output"]["code"],
                        state["anthropic_review"],
                        "anthropic",
                    )
                )
            if (
                state["google_output"]
                and state["google_review"]
                and state["google_review"]["has_issues"]
            ):
                tasks.append(
                    self._refine_code(
                        state,
                        state["google_output"]["code"],
                        state["google_review"],
                        "google",
                    )
                )

            if tasks:
                await asyncio.gather(*tasks)

            self._add_thought(
                state,
                f"Refinement iteration {state['refinement_iteration']} complete",
                "refiner",
            )

            logger.info(
                "Refinement phase complete",
                job_id=state["job_id"],
                iteration=state["refinement_iteration"],
            )

        except Exception as e:
            state["status"] = "error"
            state["error_message"] = f"Refinement failed: {str(e)}"
            self._add_thought(state, f"Refinement error: {str(e)}", "refiner")
            logger.error("Refinement failed", job_id=state["job_id"], error=str(e))

        return state

    async def _refine_code(
        self,
        state: OrchestrationState,
        original_code: str,
        review: ReviewResult,
        source: str,
    ) -> None:
        """Refine a single code output."""
        try:
            self._add_thought(
                state,
                f"Refining {source} code based on review feedback",
                "refiner",
            )

            review_feedback = f"""Issues found:
{chr(10).join(f"- {issue}" for issue in review["issues"])}

Suggestions:
{chr(10).join(f"- {suggestion}" for suggestion in review["suggestions"])}"""

            prompt = self.REFINEMENT_SYSTEM_PROMPT.format(
                review_feedback=review_feedback,
                original_code=original_code,
            )

            refined_code = await self.anthropic_client.complete(
                prompt=prompt,
                system="You are an expert developer focused on code quality.",
                max_tokens=4096,
                temperature=0.5,
            )

            # Update the output
            if source == "anthropic" and state["anthropic_output"]:
                state["anthropic_output"]["code"] = refined_code
                state["anthropic_output"]["token_count"] = len(refined_code.split())
            elif source == "google" and state["google_output"]:
                state["google_output"]["code"] = refined_code
                state["google_output"]["token_count"] = len(refined_code.split())

            self._add_thought(
                state,
                f"{source} code refined successfully",
                "refiner",
            )

            logger.info(f"{source} code refined", job_id=state["job_id"])

        except Exception as e:
            self._add_thought(state, f"{source} refinement error: {str(e)}", "refiner")
            logger.error(f"{source} refinement failed", job_id=state["job_id"], error=str(e))

    async def complete_node(self, state: OrchestrationState) -> OrchestrationState:
        """Finalize the workflow."""
        state["status"] = "complete"
        state["current_phase"] = "complete"
        self._add_thought(
            state,
            "Orchestration workflow complete - all phases finished successfully",
            "planner",
        )

        logger.info(
            "Workflow complete",
            job_id=state["job_id"],
            iterations=state["refinement_iteration"],
        )

        return state
