"""State schema for orchestration workflow."""

from typing import Literal, TypedDict


class ThoughtItem(TypedDict):
    """A single thought in the reasoning stream."""

    id: str
    text: str
    timestamp: str
    source: Literal["planner", "anthropic", "google", "reviewer", "refiner"]


class CodeOutput(TypedDict):
    """Code generation output from a model."""

    code: str
    model_used: str
    token_count: int
    thoughts: list[ThoughtItem]
    error: str | None


class ReviewResult(TypedDict):
    """Result from code review."""

    has_issues: bool
    issues: list[str]
    suggestions: list[str]
    confidence: float


class OrchestrationState(TypedDict):
    """State for the orchestration workflow.

    This state flows through the entire workflow:
    START -> PLAN -> GENERATE -> REVIEW -> REFINE (conditional) -> COMPLETE
    """

    # Job metadata
    job_id: str
    brief: str
    framework: Literal["react", "vue", "svelte", "vanilla"]

    # Planning phase
    plan: str | None
    implementation_strategy: str | None

    # Generation phase
    anthropic_output: CodeOutput | None
    google_output: CodeOutput | None

    # Review phase
    anthropic_review: ReviewResult | None
    google_review: ReviewResult | None

    # Refinement phase
    needs_refinement: bool
    refinement_iteration: int
    max_refinement_iterations: int
    refinement_notes: str | None

    # Workflow control
    status: Literal[
        "initialized",
        "planning",
        "generating",
        "reviewing",
        "refining",
        "complete",
        "error",
    ]
    current_phase: str
    error_message: str | None

    # Streaming thoughts
    thoughts: list[ThoughtItem]

    # Configuration
    enable_review: bool
    review_strictness: Literal["low", "medium", "high"]
    parallel_generation: bool


class OrchestrationConfig(TypedDict):
    """Configuration for orchestration workflow."""

    max_refinement_iterations: int  # Default: 2
    enable_review: bool  # Default: True
    review_strictness: Literal["low", "medium", "high"]  # Default: "medium"
    parallel_generation: bool  # Default: True
    enable_checkpointing: bool  # Default: True
    checkpoint_interval: int  # Seconds between checkpoints, Default: 30
