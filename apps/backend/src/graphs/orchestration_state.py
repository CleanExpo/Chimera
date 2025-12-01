"""State schema for orchestration workflow."""

from typing import Literal, TypedDict


class ClarifyingQuestion(TypedDict):
    """A clarifying question to ask the user before planning."""

    id: str
    question: str
    context: str  # Why we need this clarification
    answer: str | None
    required: bool


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
    START -> CLARIFY -> PLAN (with approval) -> GENERATE -> REVIEW -> REFINE -> COMPLETE

    Plan Mode Flow:
    1. CLARIFY: Generate clarifying questions from brief
    2. AWAITING_ANSWERS: Wait for user to answer questions
    3. PLANNING: Generate detailed plan.md from brief + answers
    4. AWAITING_APPROVAL: Wait for user to approve/modify plan
    5. GENERATE -> REVIEW -> REFINE -> COMPLETE (existing flow)
    """

    # Job metadata
    job_id: str
    brief: str
    framework: Literal["react", "vue", "svelte", "vanilla"]

    # Plan Mode: Clarifying Questions Phase
    clarifying_questions: list[ClarifyingQuestion]
    clarifying_answers: dict[str, str]  # question_id -> answer
    skip_clarification: bool  # Allow skipping for simple tasks

    # Plan Mode: Plan Content
    plan_content: str | None  # Full markdown plan
    plan_approved: bool
    plan_modified_at: str | None

    # Planning phase (legacy, kept for compatibility)
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
        "clarifying",         # Generating clarifying questions
        "awaiting_answers",   # Waiting for user to answer questions
        "planning",
        "awaiting_approval",  # Waiting for user to approve/modify plan
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

    # Plan Mode Configuration
    enable_plan_mode: bool  # Default: True - Enable clarification + plan approval
    skip_clarification: bool  # Default: False - Skip clarifying questions phase
    max_clarifying_questions: int  # Default: 4 - Max questions to generate
    plan_approval_timeout: int  # Default: 3600 - Seconds before plan approval times out

    # Generation Configuration
    max_refinement_iterations: int  # Default: 2
    enable_review: bool  # Default: True
    review_strictness: Literal["low", "medium", "high"]  # Default: "medium"
    parallel_generation: bool  # Default: True

    # Checkpointing
    enable_checkpointing: bool  # Default: True
    checkpoint_interval: int  # Seconds between checkpoints, Default: 30
