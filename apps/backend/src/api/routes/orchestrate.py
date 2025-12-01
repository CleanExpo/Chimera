"""AI Orchestration routes for the Backend Brain."""

import asyncio
from datetime import datetime
from typing import Literal, Optional
from fastapi import APIRouter, BackgroundTasks, HTTPException
from pydantic import BaseModel, Field
from src.config import get_settings
from src.utils import get_logger
from src.orchestrator import OrchestrationService
from src.database import get_supabase, JobsRepository
from .websocket import get_connection_manager

router = APIRouter(prefix="/orchestrate")
settings = get_settings()
logger = get_logger(__name__)

# Initialize orchestration service
orchestration_service = OrchestrationService()

# Initialize database repository
try:
    db_client = get_supabase()
    jobs_repo = JobsRepository(db_client)
    logger.info("Database repository initialized successfully")
except Exception as e:
    logger.error("Failed to initialize database repository", error=str(e))
    # Fallback to in-memory storage if DB not available
    jobs_repo = None


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


# In-memory job storage (fallback if DB unavailable)
jobs: dict[str, OrchestrationResponse] = {}


async def _run_orchestration(
    job_id: str,
    brief: str,
    target_framework: Literal["react", "vue", "svelte", "vanilla"],
    include_teams: list[Literal["anthropic", "google"]],
) -> None:
    """Background task to run orchestration."""
    try:
        # Update status to dispatching
        if jobs_repo:
            await jobs_repo.update_job_status(job_id, "dispatching")

        job = jobs.get(job_id)
        if job:
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
        teams_data = {}
        for team_name, team_output in team_outputs.items():
            team_output_model = TeamOutput(
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

            if job:
                job.teams[team_name] = team_output_model

            # Convert to dict for DB storage
            teams_data[team_name] = {
                "team": team_output.team,
                "status": team_output.status,
                "thoughts": [t.to_dict() for t in team_output.thoughts],
                "generated_code": team_output.generated_code,
                "model_used": team_output.model_used,
                "token_count": team_output.token_count,
                "error_message": team_output.error_message,
            }

        # Calculate total tokens
        total_tokens = sum(t["token_count"] for t in teams_data.values())
        estimated_cost = (total_tokens / 1000000) * 10  # Rough average

        if job:
            job.total_tokens = total_tokens
            job.estimated_cost = estimated_cost

        # Set final status
        all_complete = all(t["status"] == "complete" for t in teams_data.values())
        any_error = any(t["status"] == "error" for t in teams_data.values())

        if any_error:
            final_status = "error"
        elif all_complete:
            final_status = "complete"
        else:
            final_status = "awaiting"

        if job:
            job.status = final_status

        # Persist to database
        if jobs_repo:
            await jobs_repo.update_job(
                job_id,
                status=final_status,
                teams=teams_data,
                total_tokens=total_tokens,
                estimated_cost=float(estimated_cost),
            )

        logger.info(
            "Orchestration complete",
            job_id=job_id,
            status=final_status,
            total_tokens=total_tokens,
        )

    except Exception as e:
        logger.error("Orchestration failed", job_id=job_id, error=str(e))

        # Update in-memory
        if job_id in jobs:
            jobs[job_id].status = "error"

        # Update database
        if jobs_repo:
            try:
                await jobs_repo.update_job_status(job_id, "error")
            except Exception as db_error:
                logger.error("Failed to update job error status in DB", error=str(db_error))


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

    # Create brief summary
    brief_summary = payload.brief[:100] + ("..." if len(payload.brief) > 100 else "")

    # Create initial response
    response = OrchestrationResponse(
        job_id=job_id,
        status="received",
        brief_summary=brief_summary,
        teams=teams,
    )

    # Store job in memory
    jobs[job_id] = response

    # Store job in database
    if jobs_repo:
        try:
            teams_dict = {
                team_name: {
                    "team": team_data.team,
                    "status": team_data.status,
                    "thoughts": [],
                    "generated_code": None,
                    "model_used": team_data.model_used,
                    "token_count": 0,
                    "error_message": None,
                }
                for team_name, team_data in teams.items()
            }

            await jobs_repo.create_job(
                job_id=job_id,
                brief=payload.brief,
                brief_summary=brief_summary,
                target_framework=payload.target_framework,
                teams=teams_dict,
                user_id=None,  # TODO: Extract from auth token when auth is implemented
            )
            logger.info("Job persisted to database", job_id=job_id)
        except Exception as e:
            logger.error("Failed to persist job to database", job_id=job_id, error=str(e))
            # Continue with in-memory storage

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

    # Try to get from database first
    if jobs_repo:
        try:
            job_data = await jobs_repo.get_job(job_id)
            if job_data:
                # Reconstruct teams from database
                teams = {}
                for team_name, team_data in job_data.get("teams", {}).items():
                    teams[team_name] = TeamOutput(
                        team=team_data["team"],
                        status=team_data["status"],
                        thoughts=[
                            ThoughtStreamItem(**t) for t in team_data.get("thoughts", [])
                        ],
                        generated_code=team_data.get("generated_code"),
                        model_used=team_data["model_used"],
                        token_count=team_data.get("token_count", 0),
                        error_message=team_data.get("error_message"),
                    )

                # Calculate progress
                progress = 0
                for team_output in teams.values():
                    if team_output.status == "complete":
                        progress += 50
                    elif team_output.status in ["thinking", "generating"]:
                        progress += 25

                return OrchestrationStatus(
                    job_id=job_id,
                    status=job_data["status"],
                    progress=min(progress, 100),
                    teams=teams,
                )
        except Exception as e:
            logger.error("Failed to get job from database", job_id=job_id, error=str(e))

    # Fallback to in-memory storage
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

    # Delete from database
    if jobs_repo:
        try:
            await jobs_repo.delete_job(job_id)
            logger.info("Job deleted from database", job_id=job_id)
        except Exception as e:
            logger.error("Failed to delete job from database", job_id=job_id, error=str(e))
            # Continue to delete from memory anyway

    # Delete from memory
    if job_id in jobs:
        del jobs[job_id]
        logger.info("Job deleted from memory", job_id=job_id)
    else:
        # If not in memory but might be in DB, that's okay
        if not jobs_repo:
            raise HTTPException(status_code=404, detail="Job not found")

    return {"message": "Job cancelled", "job_id": job_id}


@router.get("/history")
async def get_job_history(
    limit: int = 50,
    offset: int = 0,
    status: Optional[str] = None,
) -> dict:
    """Get job history (all jobs or filtered by status).

    This endpoint returns all jobs for now.
    TODO: Add user authentication and filter by user_id.

    Args:
        limit: Maximum number of jobs to return (default: 50)
        offset: Number of jobs to skip (default: 0)
        status: Optional status filter

    Returns:
        Dictionary with jobs list and pagination info
    """
    if not jobs_repo:
        # Fallback to in-memory if DB not available
        job_list = [
            {
                "job_id": job.job_id,
                "status": job.status,
                "brief_summary": job.brief_summary,
                "total_tokens": job.total_tokens,
                "estimated_cost": job.estimated_cost,
            }
            for job in jobs.values()
        ]

        if status:
            job_list = [j for j in job_list if j["status"] == status]

        # Apply pagination
        paginated_jobs = job_list[offset : offset + limit]

        return {
            "jobs": paginated_jobs,
            "total": len(job_list),
            "limit": limit,
            "offset": offset,
        }

    try:
        # Get from database
        all_jobs = await jobs_repo.get_all_jobs(limit=limit, offset=offset, status=status)

        # Simplify the response (exclude large fields like teams)
        job_list = [
            {
                "job_id": job["id"],
                "status": job["status"],
                "brief_summary": job["brief_summary"],
                "target_framework": job["target_framework"],
                "total_tokens": job["total_tokens"],
                "estimated_cost": float(job["estimated_cost"]) if job["estimated_cost"] else 0,
                "created_at": job["created_at"],
                "completed_at": job.get("completed_at"),
            }
            for job in all_jobs
        ]

        return {
            "jobs": job_list,
            "limit": limit,
            "offset": offset,
        }

    except Exception as e:
        logger.error("Failed to get job history", error=str(e))
        raise HTTPException(status_code=500, detail="Failed to retrieve job history")


@router.get("/job/{job_id}")
async def get_job_details(job_id: str) -> dict:
    """Get full details of a specific job including teams, thoughts, and generated code.

    Args:
        job_id: Job identifier

    Returns:
        Full job details
    """
    # Try database first
    if jobs_repo:
        try:
            job_data = await jobs_repo.get_job(job_id)
            if job_data:
                return {
                    "job_id": job_data["id"],
                    "status": job_data["status"],
                    "brief": job_data["brief"],
                    "brief_summary": job_data["brief_summary"],
                    "target_framework": job_data["target_framework"],
                    "teams": job_data["teams"],
                    "total_tokens": job_data["total_tokens"],
                    "estimated_cost": float(job_data["estimated_cost"]) if job_data["estimated_cost"] else 0,
                    "created_at": job_data["created_at"],
                    "updated_at": job_data["updated_at"],
                    "completed_at": job_data.get("completed_at"),
                }
        except Exception as e:
            logger.error("Failed to get job from database", job_id=job_id, error=str(e))

    # Fallback to in-memory
    if job_id not in jobs:
        raise HTTPException(status_code=404, detail="Job not found")

    job = jobs[job_id]

    return {
        "job_id": job.job_id,
        "status": job.status,
        "brief_summary": job.brief_summary,
        "teams": {
            team_name: {
                "team": team.team,
                "status": team.status,
                "thoughts": [
                    {"id": t.id, "text": t.text, "timestamp": t.timestamp, "team": t.team}
                    for t in team.thoughts
                ],
                "generated_code": team.generated_code,
                "model_used": team.model_used,
                "token_count": team.token_count,
                "error_message": team.error_message,
            }
            for team_name, team in job.teams.items()
        },
        "total_tokens": job.total_tokens,
        "estimated_cost": job.estimated_cost,
    }


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
