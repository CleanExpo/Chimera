"""Configuration presets for orchestration workflows."""

from .orchestration_state import OrchestrationConfig


# Preset configurations for different use cases

FAST_CONFIG: OrchestrationConfig = {
    "max_refinement_iterations": 0,
    "enable_review": False,
    "review_strictness": "low",
    "parallel_generation": True,
    "enable_checkpointing": False,
    "checkpoint_interval": 30,
}
"""Fast configuration: No review, no refinement, parallel generation.
Best for: Quick prototypes, simple components, when speed is priority.
"""

BALANCED_CONFIG: OrchestrationConfig = {
    "max_refinement_iterations": 1,
    "enable_review": True,
    "review_strictness": "medium",
    "parallel_generation": True,
    "enable_checkpointing": True,
    "checkpoint_interval": 30,
}
"""Balanced configuration: Review with one refinement iteration.
Best for: Production code, general use, balanced quality and speed.
"""

THOROUGH_CONFIG: OrchestrationConfig = {
    "max_refinement_iterations": 2,
    "enable_review": True,
    "review_strictness": "high",
    "parallel_generation": True,
    "enable_checkpointing": True,
    "checkpoint_interval": 20,
}
"""Thorough configuration: Strict review with up to 2 refinement iterations.
Best for: Critical components, complex logic, when quality is priority.
"""

SEQUENTIAL_CONFIG: OrchestrationConfig = {
    "max_refinement_iterations": 1,
    "enable_review": True,
    "review_strictness": "medium",
    "parallel_generation": False,
    "enable_checkpointing": True,
    "checkpoint_interval": 30,
}
"""Sequential configuration: Review enabled, but sequential generation.
Best for: Debugging, when you want to see one model's output before the other.
"""

DEBUG_CONFIG: OrchestrationConfig = {
    "max_refinement_iterations": 0,
    "enable_review": False,
    "review_strictness": "low",
    "parallel_generation": False,
    "enable_checkpointing": True,
    "checkpoint_interval": 10,
}
"""Debug configuration: Frequent checkpoints, sequential execution, no review.
Best for: Development, debugging workflow issues, inspecting state changes.
"""


def get_config_by_name(name: str) -> OrchestrationConfig:
    """Get a configuration preset by name.

    Args:
        name: Name of the configuration preset
              Options: "fast", "balanced", "thorough", "sequential", "debug"

    Returns:
        OrchestrationConfig for the requested preset

    Raises:
        ValueError: If the configuration name is not recognized
    """
    configs = {
        "fast": FAST_CONFIG,
        "balanced": BALANCED_CONFIG,
        "thorough": THOROUGH_CONFIG,
        "sequential": SEQUENTIAL_CONFIG,
        "debug": DEBUG_CONFIG,
    }

    if name not in configs:
        raise ValueError(
            f"Unknown configuration: {name}. "
            f"Available: {', '.join(configs.keys())}"
        )

    return configs[name]


def create_custom_config(
    max_refinement_iterations: int = 2,
    enable_review: bool = True,
    review_strictness: str = "medium",
    parallel_generation: bool = True,
    enable_checkpointing: bool = True,
    checkpoint_interval: int = 30,
) -> OrchestrationConfig:
    """Create a custom configuration.

    Args:
        max_refinement_iterations: Maximum number of refinement iterations (0-5)
        enable_review: Whether to enable code review
        review_strictness: Review strictness level ("low", "medium", "high")
        parallel_generation: Whether to generate code in parallel
        enable_checkpointing: Whether to enable workflow checkpointing
        checkpoint_interval: Seconds between checkpoints

    Returns:
        Custom OrchestrationConfig

    Raises:
        ValueError: If parameters are out of valid range
    """
    if max_refinement_iterations < 0 or max_refinement_iterations > 5:
        raise ValueError("max_refinement_iterations must be between 0 and 5")

    if review_strictness not in ("low", "medium", "high"):
        raise ValueError('review_strictness must be "low", "medium", or "high"')

    if checkpoint_interval < 1 or checkpoint_interval > 300:
        raise ValueError("checkpoint_interval must be between 1 and 300 seconds")

    return OrchestrationConfig(
        max_refinement_iterations=max_refinement_iterations,
        enable_review=enable_review,
        review_strictness=review_strictness,  # type: ignore
        parallel_generation=parallel_generation,
        enable_checkpointing=enable_checkpointing,
        checkpoint_interval=checkpoint_interval,
    )
