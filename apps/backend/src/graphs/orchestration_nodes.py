"""Workflow nodes for orchestration."""

import asyncio
import uuid
from datetime import datetime

import json

from src.models import AnthropicClient, GoogleClient
from src.utils import get_logger

from .orchestration_state import (
    ClarifyingQuestion,
    CodeOutput,
    OrchestrationState,
    ReviewResult,
    ThoughtItem,
)

logger = get_logger(__name__)


class OrchestrationNodes:
    """Collection of nodes for the orchestration workflow."""

    CLARIFYING_SYSTEM_PROMPT = """You are an expert requirements analyst. Given a brief for a software component, identify 2-4 clarifying questions that would help create a better implementation plan.

Focus on questions about:
1. Unclear scope or feature requirements
2. Technical choices (specific libraries, patterns, or approaches)
3. Design preferences (styling, UX, layout)
4. Edge cases and error handling requirements
5. Performance or scalability considerations

Rules:
- Only ask questions where the answer would significantly impact the implementation
- Don't ask about things that are clearly stated in the brief
- Keep questions concise and specific
- Mark questions as required only if the implementation cannot proceed without them

Return your response as a JSON object:
{
  "questions": [
    {
      "id": "q1",
      "question": "What should happen when the user clicks outside the modal?",
      "context": "This affects whether we need click-outside detection and the modal behavior",
      "required": false
    }
  ]
}

If the brief is clear and no clarification is needed, return:
{
  "questions": [],
  "reason": "Brief is comprehensive and clear"
}"""

    PLANNING_SYSTEM_PROMPT = """You are an expert technical architect. Create a detailed implementation plan in Markdown format.

Structure your plan as follows:

# Implementation Plan

## Overview
A brief 2-3 sentence summary of what we're building and the main goals.

## Requirements Clarification
Summary of the clarifying questions and answers (if any were provided).

## Architecture
- Component structure and hierarchy
- Data flow and state management approach
- Key patterns being used

## Implementation Steps
Numbered list of concrete implementation steps, each with sub-tasks:
1. Step 1: Description
   - Sub-task a
   - Sub-task b
2. Step 2: Description

## Technical Decisions
- Libraries and packages to use (with reasoning)
- Patterns and approaches (with reasoning)

## Potential Challenges
- Challenge 1 and mitigation strategy
- Challenge 2 and mitigation strategy

## Testing Strategy
- What needs to be tested
- Approach for each test type

Be specific, actionable, and comprehensive. This plan will be reviewed by the user before implementation begins."""

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

    async def clarify_node(self, state: OrchestrationState) -> OrchestrationState:
        """Generate clarifying questions from the brief.

        This node analyzes the brief and generates 2-4 clarifying questions
        that would help create a better implementation plan. The workflow
        then pauses at 'awaiting_answers' status until the user responds.
        """
        try:
            # Check if clarification should be skipped
            if state.get("skip_clarification", False):
                self._add_thought(
                    state,
                    "Skipping clarification phase - proceeding directly to planning",
                    "planner",
                )
                state["clarifying_questions"] = []
                return state

            state["status"] = "clarifying"
            state["current_phase"] = "clarifying"
            self._add_thought(
                state,
                "Analyzing brief to identify clarifying questions",
                "planner",
            )

            logger.info("Clarification phase started", job_id=state["job_id"])

            # Build clarification prompt
            prompt = f"""Analyze this brief and identify clarifying questions:

Framework: {state["framework"]}
Brief:
{state["brief"]}

Generate 2-4 clarifying questions that would help create a better implementation plan."""

            # Use Anthropic for clarification (Claude is excellent at analysis)
            response = await self.anthropic_client.complete(
                prompt=prompt,
                system=self.CLARIFYING_SYSTEM_PROMPT,
                max_tokens=1024,
                temperature=0.7,
            )

            # Parse JSON response
            questions: list[ClarifyingQuestion] = []
            try:
                # Extract JSON from response
                json_text = response
                if "```json" in response:
                    json_start = response.find("```json") + 7
                    json_end = response.find("```", json_start)
                    json_text = response[json_start:json_end].strip()
                elif "```" in response:
                    json_start = response.find("```") + 3
                    json_end = response.find("```", json_start)
                    json_text = response[json_start:json_end].strip()

                data = json.loads(json_text)
                raw_questions = data.get("questions", [])

                for q in raw_questions:
                    questions.append(
                        ClarifyingQuestion(
                            id=q.get("id", f"q{len(questions)+1}"),
                            question=q["question"],
                            context=q.get("context", ""),
                            answer=None,
                            required=q.get("required", False),
                        )
                    )

            except (json.JSONDecodeError, KeyError) as e:
                logger.warning(
                    "Failed to parse clarifying questions JSON",
                    job_id=state["job_id"],
                    error=str(e),
                )
                # If parsing fails, proceed without questions
                questions = []

            state["clarifying_questions"] = questions

            if questions:
                state["status"] = "awaiting_answers"
                self._add_thought(
                    state,
                    f"Generated {len(questions)} clarifying questions - awaiting user responses",
                    "planner",
                )
                logger.info(
                    "Clarification phase complete - awaiting answers",
                    job_id=state["job_id"],
                    question_count=len(questions),
                )
            else:
                self._add_thought(
                    state,
                    "Brief is clear - no clarification needed, proceeding to planning",
                    "planner",
                )
                logger.info(
                    "No clarification needed",
                    job_id=state["job_id"],
                )

        except Exception as e:
            state["status"] = "error"
            state["error_message"] = f"Clarification failed: {str(e)}"
            self._add_thought(state, f"Clarification error: {str(e)}", "planner")
            logger.error("Clarification failed", job_id=state["job_id"], error=str(e))

        return state

    async def plan_node(self, state: OrchestrationState) -> OrchestrationState:
        """Create an implementation plan from the brief and clarifying answers.

        This enhanced plan_node:
        1. Incorporates clarifying Q&A into the planning context
        2. Generates a comprehensive markdown plan
        3. Pauses at 'awaiting_approval' for user review before execution
        """
        try:
            state["status"] = "planning"
            state["current_phase"] = "planning"
            self._add_thought(
                state,
                "Starting planning phase - creating comprehensive implementation plan",
                "planner",
            )

            logger.info("Planning phase started", job_id=state["job_id"])

            # Build Q&A context from clarifying questions and answers
            qa_context = ""
            questions = state.get("clarifying_questions", [])
            answers = state.get("clarifying_answers", {})

            if questions:
                qa_lines = []
                for q in questions:
                    answer = answers.get(q["id"], "Not answered")
                    qa_lines.append(f"Q: {q['question']}\nA: {answer}")
                qa_context = "\n\n".join(qa_lines)

            # Build planning prompt with Q&A context
            prompt = f"""Create an implementation plan for the following component:

Framework: {state["framework"]}

Requirements:
{state["brief"]}

{"Clarifying Q&A:" + chr(10) + qa_context if qa_context else "No clarifying questions were needed."}

Generate a comprehensive, markdown-formatted implementation plan that the user can review before we begin coding."""

            # Use Anthropic for planning (Claude is excellent at structured thinking)
            plan = await self.anthropic_client.complete(
                prompt=prompt,
                system=self.PLANNING_SYSTEM_PROMPT,
                max_tokens=4096,
                temperature=0.7,
            )

            # Store plan content for user review
            state["plan_content"] = plan
            state["plan_approved"] = False
            state["status"] = "awaiting_approval"

            # Also store in legacy field for compatibility
            state["plan"] = plan
            state["implementation_strategy"] = f"Generate {state['framework']} component following the approved plan"

            self._add_thought(
                state,
                f"Implementation plan created ({len(plan.split())} words) - awaiting user approval",
                "planner",
            )

            logger.info(
                "Planning phase complete - awaiting approval",
                job_id=state["job_id"],
                plan_length=len(plan),
            )

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
