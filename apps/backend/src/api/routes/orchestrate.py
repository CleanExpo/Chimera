"""AI Orchestration routes for the Backend Brain."""

import asyncio
from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from src.config import get_settings
from src.utils import get_logger
from src.orchestrator import OrchestrationService
from .websocket import get_connection_manager

router = APIRouter(prefix="/orchestrate")
settings = get_settings()
logger = get_logger(__name__)

# Initialize orchestration service
orchestration_service = OrchestrationService()


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


async def _run_orchestration(
    job_id: str,
    brief: str,
    target_framework: Literal["react", "vue", "svelte", "vanilla"],
    include_teams: list[Literal["anthropic", "google"]],
) -> None:
    """Background task to run orchestration."""
    try:
        job = jobs[job_id]
        job.status = "dispatching"

        logger.info("Starting async orchestration", job_id=job_id)

        # Get WebSocket connection manager
        ws_manager = get_connection_manager()

        # Create event callback for WebSocket broadcasting
        async def broadcast_event(event_type: str, team: str, data: dict) -> None:
            """Broadcast event to all WebSocket clients for this job."""
            message = {
                "type": event_type,
                "team": team,
                "data": data,
                "timestamp": datetime.utcnow().isoformat(),
            }
            await ws_manager.broadcast_to_job(job_id, message)

        # Run orchestration with WebSocket callback
        team_outputs = await orchestration_service.orchestrate(
            brief=brief,
            target_framework=target_framework,
            include_teams=include_teams,
            event_callback=broadcast_event,
        )

        # Update job with results
        for team_name, team_output in team_outputs.items():
            job.teams[team_name] = TeamOutput(
                team=team_output.team,
                status=team_output.status,
                thoughts=[
                    ThoughtStreamItem(
                        id=t.id,
                        text=t.text,
                        timestamp=t.timestamp,
                        team=t.team,
                    )
                    for t in team_output.thoughts
                ],
                generated_code=team_output.generated_code,
                model_used=team_output.model_used,
                token_count=team_output.token_count,
                error_message=team_output.error_message,
            )

        # Calculate total tokens
        job.total_tokens = sum(t.token_count for t in job.teams.values())

        # Estimate cost (rough estimates)
        # Claude Sonnet: ~$3/M input, ~$15/M output tokens
        # Gemini Flash: ~$0.075/M input, ~$0.30/M output tokens
        job.estimated_cost = (job.total_tokens / 1000000) * 10  # Rough average

        # Set final status
        all_complete = all(t.status == "complete" for t in job.teams.values())
        any_error = any(t.status == "error" for t in job.teams.values())

        if any_error:
            job.status = "error"
        elif all_complete:
            job.status = "complete"
        else:
            job.status = "awaiting"

        logger.info(
            "Orchestration complete",
            job_id=job_id,
            status=job.status,
            total_tokens=job.total_tokens,
        )

    except Exception as e:
        logger.error("Orchestration failed", job_id=job_id, error=str(e))
        if job_id in jobs:
            jobs[job_id].status = "error"


@router.post("/brief", response_model=OrchestrationResponse)
async def submit_brief(
    payload: BriefPayload,
    background_tasks: BackgroundTasks,
) -> OrchestrationResponse:
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
        model = "claude-sonnet-4-5-20250929" if team == "anthropic" else "gemini-2.0-flash-exp"
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

    # Trigger async orchestration workflow in background
    background_tasks.add_task(
        _run_orchestration,
        job_id=job_id,
        brief=payload.brief,
        target_framework=payload.target_framework,
        include_teams=payload.include_teams,
    )

    logger.info("Background orchestration task queued", job_id=job_id)

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
async def trigger_generation(
    job_id: str,
    background_tasks: BackgroundTasks,
) -> dict:
    """
    Manually trigger code generation for a job.

    This endpoint allows re-running or manually triggering generation
    for an existing job. Useful for testing and manual intervention.
    """
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    # Extract original brief from job (we need to store it)
    # For now, use the brief_summary as a fallback
    brief = job.brief_summary

    # Get target framework from first team's model (infer)
    target_framework = "react"  # Default

    # Get teams to include
    include_teams = list(job.teams.keys())

    # Trigger async orchestration
    background_tasks.add_task(
        _run_orchestration,
        job_id=job_id,
        brief=brief,
        target_framework=target_framework,
        include_teams=include_teams,
    )

    logger.info("Manual generation triggered", job_id=job_id)

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
