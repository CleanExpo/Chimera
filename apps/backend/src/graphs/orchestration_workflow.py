"""Main orchestration workflow using LangGraph."""

import uuid
from typing import Any

from langgraph.checkpoint.memory import MemorySaver
from langgraph.graph import StateGraph, END

from src.utils import get_logger

from .orchestration_edges import (
    should_proceed_after_generate,
    should_proceed_after_plan,
    should_proceed_after_refine,
    should_proceed_after_review,
)
from .orchestration_nodes import OrchestrationNodes
from .orchestration_state import OrchestrationConfig, OrchestrationState

logger = get_logger(__name__)


class OrchestrationWorkflow:
    """LangGraph workflow for sophisticated multi-step agent orchestration.

    Workflow steps:
    1. PLAN: Analyze brief and create implementation plan
    2. GENERATE: Claude + Gemini generate code in parallel
    3. REVIEW: Self-review generated code for issues
    4. REFINE (conditional): Fix issues if found
    5. COMPLETE: Finalize and return results

    Features:
    - Checkpointing for resumability
    - Event streaming for real-time updates
    - Configurable review strictness
    - Max iteration limits
    - Graceful error handling
    """

    def __init__(self, config: OrchestrationConfig | None = None) -> None:
        """Initialize the orchestration workflow.

        Args:
            config: Optional workflow configuration
        """
        self.config = config or self._default_config()
        self.nodes = OrchestrationNodes()
        self.checkpointer = MemorySaver() if self.config["enable_checkpointing"] else None
        self.graph = self._build_graph()

    def _default_config(self) -> OrchestrationConfig:
        """Get default workflow configuration."""
        return OrchestrationConfig(
            max_refinement_iterations=2,
            enable_review=True,
            review_strictness="medium",
            parallel_generation=True,
            enable_checkpointing=True,
            checkpoint_interval=30,
        )

    def _build_graph(self) -> StateGraph:
        """Build the LangGraph workflow."""
        # Create graph with state schema
        workflow = StateGraph(OrchestrationState)

        # Add nodes
        workflow.add_node("plan", self.nodes.plan_node)
        workflow.add_node("generate", self.nodes.generate_node)
        workflow.add_node("review", self.nodes.review_node)
        workflow.add_node("refine", self.nodes.refine_node)
        workflow.add_node("complete", self.nodes.complete_node)
        workflow.add_node("error", self._error_node)

        # Set entry point
        workflow.set_entry_point("plan")

        # Add conditional edges
        workflow.add_conditional_edges(
            "plan",
            should_proceed_after_plan,
            {
                "generate": "generate",
                "error": "error",
            },
        )

        workflow.add_conditional_edges(
            "generate",
            should_proceed_after_generate,
            {
                "review": "review",
                "complete": "complete",
                "error": "error",
            },
        )

        workflow.add_conditional_edges(
            "review",
            should_proceed_after_review,
            {
                "refine": "refine",
                "complete": "complete",
                "error": "error",
            },
        )

        workflow.add_conditional_edges(
            "refine",
            should_proceed_after_refine,
            {
                "review": "review",
                "complete": "complete",
                "error": "error",
            },
        )

        # Terminal nodes
        workflow.add_edge("complete", END)
        workflow.add_edge("error", END)

        # Compile with checkpointing if enabled
        if self.checkpointer:
            return workflow.compile(checkpointer=self.checkpointer)
        else:
            return workflow.compile()

    async def _error_node(self, state: OrchestrationState) -> OrchestrationState:
        """Handle workflow errors."""
        logger.error(
            "Workflow error",
            job_id=state["job_id"],
            error=state.get("error_message"),
            phase=state.get("current_phase"),
        )

        state["status"] = "error"
        state["current_phase"] = "error"

        return state

    def _create_initial_state(
        self,
        brief: str,
        framework: str,
        job_id: str | None = None,
    ) -> OrchestrationState:
        """Create initial state for the workflow."""
        return OrchestrationState(
            job_id=job_id or str(uuid.uuid4()),
            brief=brief,
            framework=framework,  # type: ignore
            plan=None,
            implementation_strategy=None,
            anthropic_output=None,
            google_output=None,
            anthropic_review=None,
            google_review=None,
            needs_refinement=False,
            refinement_iteration=0,
            max_refinement_iterations=self.config["max_refinement_iterations"],
            refinement_notes=None,
            status="initialized",
            current_phase="initialized",
            error_message=None,
            thoughts=[],
            enable_review=self.config["enable_review"],
            review_strictness=self.config["review_strictness"],
            parallel_generation=self.config["parallel_generation"],
        )

    async def run(
        self,
        brief: str,
        framework: str = "react",
        job_id: str | None = None,
    ) -> OrchestrationState:
        """Run the orchestration workflow.

        Args:
            brief: Natural language description of what to build
            framework: Target framework (react, vue, svelte, vanilla)
            job_id: Optional job ID for tracking

        Returns:
            Final workflow state with generated code
        """
        initial_state = self._create_initial_state(brief, framework, job_id)

        logger.info(
            "Starting orchestration workflow",
            job_id=initial_state["job_id"],
            framework=framework,
            brief_length=len(brief),
        )

        # Run the workflow
        config_dict: dict[str, Any] = {"configurable": {"thread_id": initial_state["job_id"]}}
        final_state = await self.graph.ainvoke(initial_state, config=config_dict)

        logger.info(
            "Orchestration workflow complete",
            job_id=final_state["job_id"],
            status=final_state["status"],
            iterations=final_state["refinement_iteration"],
        )

        return final_state

    async def stream(
        self,
        brief: str,
        framework: str = "react",
        job_id: str | None = None,
    ):
        """Stream the orchestration workflow with real-time updates.

        Args:
            brief: Natural language description of what to build
            framework: Target framework (react, vue, svelte, vanilla)
            job_id: Optional job ID for tracking

        Yields:
            State updates as the workflow progresses
        """
        initial_state = self._create_initial_state(brief, framework, job_id)

        logger.info(
            "Starting orchestration workflow stream",
            job_id=initial_state["job_id"],
            framework=framework,
        )

        config_dict: dict[str, Any] = {"configurable": {"thread_id": initial_state["job_id"]}}

        # Stream the workflow
        async for event in self.graph.astream(initial_state, config=config_dict):
            yield event

        logger.info(
            "Orchestration workflow stream complete",
            job_id=initial_state["job_id"],
        )

    def get_state(self, job_id: str) -> OrchestrationState | None:
        """Get the current state of a workflow by job ID.

        Args:
            job_id: Job ID to retrieve state for

        Returns:
            Current workflow state or None if not found
        """
        if not self.checkpointer:
            logger.warning("Checkpointing not enabled, cannot retrieve state")
            return None

        try:
            config_dict: dict[str, Any] = {"configurable": {"thread_id": job_id}}
            checkpoint = self.checkpointer.get(config_dict)
            if checkpoint and checkpoint.get("values"):
                return checkpoint["values"]
            return None
        except Exception as e:
            logger.error("Failed to retrieve state", job_id=job_id, error=str(e))
            return None


def create_orchestration_workflow(
    config: OrchestrationConfig | None = None,
) -> OrchestrationWorkflow:
    """Factory function to create an orchestration workflow.

    Args:
        config: Optional workflow configuration

    Returns:
        Configured OrchestrationWorkflow instance
    """
    return OrchestrationWorkflow(config=config)
