"""Conditional edges for orchestration workflow routing."""

from src.utils import get_logger

from .orchestration_state import OrchestrationState

logger = get_logger(__name__)


def should_proceed_after_plan(state: OrchestrationState) -> str:
    """Determine next step after planning.

    Routes:
    - "generate": Planning succeeded, proceed to generation
    - "error": Planning failed, go to error state
    """
    if state["status"] == "error":
        logger.info("Planning failed, routing to error", job_id=state["job_id"])
        return "error"

    if not state["plan"]:
        logger.warning("No plan generated, routing to error", job_id=state["job_id"])
        state["status"] = "error"
        state["error_message"] = "Planning phase did not produce a plan"
        return "error"

    logger.info("Planning succeeded, routing to generation", job_id=state["job_id"])
    return "generate"


def should_proceed_after_generate(state: OrchestrationState) -> str:
    """Determine next step after generation.

    Routes:
    - "review": Generation succeeded and review is enabled
    - "complete": Generation succeeded but review is disabled
    - "error": Generation failed completely
    """
    if state["status"] == "error":
        logger.info("Generation failed, routing to error", job_id=state["job_id"])
        return "error"

    # Check if at least one output succeeded
    anthropic_ok = (
        state["anthropic_output"]
        and state["anthropic_output"]["code"]
        and not state["anthropic_output"]["error"]
    )
    google_ok = (
        state["google_output"]
        and state["google_output"]["code"]
        and not state["google_output"]["error"]
    )

    if not anthropic_ok and not google_ok:
        logger.warning("All generations failed, routing to error", job_id=state["job_id"])
        state["status"] = "error"
        state["error_message"] = "All code generation attempts failed"
        return "error"

    # Route based on review configuration
    if state["enable_review"]:
        logger.info("Generation succeeded, routing to review", job_id=state["job_id"])
        return "review"
    else:
        logger.info("Generation succeeded, review disabled, routing to complete", job_id=state["job_id"])
        return "complete"


def should_proceed_after_review(state: OrchestrationState) -> str:
    """Determine next step after review.

    Routes:
    - "refine": Issues found and haven't exceeded max iterations
    - "complete": No issues or max iterations reached
    - "error": Review failed
    """
    if state["status"] == "error":
        logger.info("Review failed, routing to error", job_id=state["job_id"])
        return "error"

    # Check if we need refinement
    if not state["needs_refinement"]:
        logger.info("No refinement needed, routing to complete", job_id=state["job_id"])
        return "complete"

    # Check if we've exceeded max iterations
    if state["refinement_iteration"] >= state["max_refinement_iterations"]:
        logger.info(
            "Max refinement iterations reached, routing to complete",
            job_id=state["job_id"],
            iteration=state["refinement_iteration"],
            max_iterations=state["max_refinement_iterations"],
        )
        return "complete"

    logger.info(
        "Refinement needed, routing to refine",
        job_id=state["job_id"],
        iteration=state["refinement_iteration"],
    )
    return "refine"


def should_proceed_after_refine(state: OrchestrationState) -> str:
    """Determine next step after refinement.

    Routes:
    - "review": Re-review the refined code
    - "complete": Max iterations reached
    - "error": Refinement failed
    """
    if state["status"] == "error":
        logger.info("Refinement failed, routing to error", job_id=state["job_id"])
        return "error"

    # Check if we've reached max iterations
    if state["refinement_iteration"] >= state["max_refinement_iterations"]:
        logger.info(
            "Max refinement iterations reached after refine, routing to complete",
            job_id=state["job_id"],
            iteration=state["refinement_iteration"],
        )
        return "complete"

    # Otherwise, re-review the refined code
    logger.info(
        "Refinement complete, routing back to review",
        job_id=state["job_id"],
        iteration=state["refinement_iteration"],
    )
    return "review"
