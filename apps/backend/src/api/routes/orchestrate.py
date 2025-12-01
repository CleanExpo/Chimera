"""AI Orchestration routes for the Backend Brain."""

from typing import Literal, Optional
from fastapi import APIRouter, HTTPException
from pydantic import BaseModel, Field
from src.config import get_settings
from src.utils import get_logger

router = APIRouter(prefix="/orchestrate")
settings = get_settings()
logger = get_logger(__name__)


# Request/Response Models
class BriefPayload(BaseModel):
    """Brief payload from the Visionary Dashboard."""

    brief: str = Field(..., description="Natural language description of what to build")
    target_framework: Literal["react", "vue", "svelte", "vanilla"] = Field(
        default="react",
        description="Target framework for code generation"
    )
    style_preferences: Optional[dict] = Field(
        default=None,
        description="Optional style preferences (colors, fonts, etc.)"
    )
    include_teams: list[Literal["anthropic", "google"]] = Field(
        default=["anthropic", "google"],
        description="Which AI teams to dispatch"
    )


class ThoughtStreamItem(BaseModel):
    """A single thought in the agent's reasoning stream."""

    id: str
    text: str
    timestamp: str
    team: Literal["anthropic", "google"]


class TeamOutput(BaseModel):
    """Output from a single AI team."""

    team: Literal["anthropic", "google"]
    status: Literal["pending", "thinking", "generating", "complete", "error"]
    thoughts: list[ThoughtStreamItem] = []
    generated_code: Optional[str] = None
    model_used: str
    token_count: int = 0
    error_message: Optional[str] = None


class OrchestrationResponse(BaseModel):
    """Response from the orchestration endpoint."""

    job_id: str
    status: Literal["received", "planning", "dispatching", "awaiting", "complete", "error"]
    brief_summary: str
    teams: dict[str, TeamOutput]
    total_tokens: int = 0
    estimated_cost: float = 0.0


class OrchestrationStatus(BaseModel):
    """Status of an orchestration job."""

    job_id: str
    status: str
    progress: int  # 0-100
    teams: dict[str, TeamOutput]


# In-memory job storage (replace with Redis/DB in production)
jobs: dict[str, OrchestrationResponse] = {}


@router.post("/brief", response_model=OrchestrationResponse)
async def submit_brief(payload: BriefPayload) -> OrchestrationResponse:
    """
    Submit a brief to the Backend Brain for processing.

    This endpoint:
    1. Receives the natural language brief from the Visionary Dashboard
    2. Plans the generation strategy
    3. Dispatches to the specified AI teams (Anthropic/Google)
    4. Returns job ID for status polling
    """
    import uuid
    from datetime import datetime

    job_id = str(uuid.uuid4())

    logger.info(
        "Received brief",
        job_id=job_id,
        brief_length=len(payload.brief),
        teams=payload.include_teams
    )

    # Initialize team outputs
    teams = {}
    for team in payload.include_teams:
        model = "claude-sonnet-4-5-20250929" if team == "anthropic" else "gemini-2.0-flash-001"
        teams[team] = TeamOutput(
            team=team,
            status="pending",
            thoughts=[],
            model_used=model,
        )

    # Create initial response
    response = OrchestrationResponse(
        job_id=job_id,
        status="received",
        brief_summary=payload.brief[:100] + ("..." if len(payload.brief) > 100 else ""),
        teams=teams,
    )

    # Store job
    jobs[job_id] = response

    # TODO: Trigger async orchestration workflow
    # In production, this would:
    # 1. Queue the job for processing
    # 2. Use LangGraph to coordinate agents
    # 3. Stream updates via WebSocket

    return response


@router.get("/status/{job_id}", response_model=OrchestrationStatus)
async def get_job_status(job_id: str) -> OrchestrationStatus:
    """Get the status of an orchestration job."""

    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    # Calculate progress based on team statuses
    progress = 0
    for team_output in job.teams.values():
        if team_output.status == "complete":
            progress += 50
        elif team_output.status in ["thinking", "generating"]:
            progress += 25

    return OrchestrationStatus(
        job_id=job_id,
        status=job.status,
        progress=min(progress, 100),
        teams=job.teams,
    )


@router.post("/generate/{job_id}")
async def trigger_generation(job_id: str) -> dict:
    """
    Manually trigger code generation for a job.

    In production, this would be called automatically by the orchestrator.
    This endpoint is useful for testing and manual intervention.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    # Update status
    job.status = "dispatching"

    # TODO: Implement actual AI generation
    # This is where we'd call the AI models

    return {"message": "Generation triggered", "job_id": job_id}


@router.delete("/job/{job_id}")
async def cancel_job(job_id: str) -> dict:
    """Cancel an orchestration job."""

    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    del jobs[job_id]
    logger.info("Job cancelled", job_id=job_id)

    return {"message": "Job cancelled", "job_id": job_id}


@router.get("/models")
async def get_available_models() -> dict:
    """Get list of available AI models."""

    return {
        "anthropic": {
            "models": [
                {"id": "claude-opus-4-5-20251101", "name": "Claude Opus 4.5", "tier": "premium"},
                {"id": "claude-sonnet-4-5-20250929", "name": "Claude Sonnet 4.5", "tier": "standard"},
                {"id": "claude-haiku-4-5-20251001", "name": "Claude Haiku 4.5", "tier": "fast"},
            ],
            "default": "claude-sonnet-4-5-20250929"
        },
        "google": {
            "models": [
                {"id": "gemini-2.0-pro-001", "name": "Gemini 2.0 Pro", "tier": "premium"},
                {"id": "gemini-2.0-flash-001", "name": "Gemini 2.0 Flash", "tier": "standard"},
                {"id": "gemini-2.0-flash-lite-001", "name": "Gemini 2.0 Flash-Lite", "tier": "fast"},
            ],
            "default": "gemini-2.0-flash-001"
        }
    }
