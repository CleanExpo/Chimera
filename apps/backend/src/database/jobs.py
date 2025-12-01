"""Database operations for orchestration jobs."""

from datetime import datetime
from typing import Any, Literal, Optional
from uuid import UUID

from supabase import Client
from src.utils import get_logger

logger = get_logger(__name__)


class JobsRepository:
    """Repository for orchestration jobs CRUD operations."""

    def __init__(self, client: Client) -> None:
        """Initialize the repository with a Supabase client.

        Args:
            client: Supabase client instance
        """
        self.client = client
        self.table = "orchestration_jobs"

    async def create_job(
        self,
        job_id: str,
        brief: str,
        brief_summary: str,
        target_framework: Literal["react", "vue", "svelte", "vanilla"],
        teams: dict[str, Any],
        user_id: Optional[str] = None,
    ) -> dict[str, Any]:
        """Create a new orchestration job.

        Args:
            job_id: Unique job identifier
            brief: Full brief text
            brief_summary: Truncated summary
            target_framework: Target framework for code generation
            teams: Initial team outputs structure
            user_id: Optional user ID (for multi-tenancy)

        Returns:
            Created job record

        Raises:
            Exception: If database operation fails
        """
        try:
            data = {
                "id": job_id,
                "brief": brief,
                "brief_summary": brief_summary,
                "target_framework": target_framework,
                "status": "received",
                "teams": teams,
                "total_tokens": 0,
                "estimated_cost": 0,
            }

            if user_id:
                data["user_id"] = user_id

            result = self.client.table(self.table).insert(data).execute()

            logger.info(
                "Job created in database",
                job_id=job_id,
                user_id=user_id,
            )

            return result.data[0] if result.data else data

        except Exception as e:
            logger.error(
                "Failed to create job in database",
                job_id=job_id,
                error=str(e),
            )
            raise

    async def get_job(self, job_id: str) -> Optional[dict[str, Any]]:
        """Get a job by ID.

        Args:
            job_id: Job identifier

        Returns:
            Job record or None if not found
        """
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("id", job_id)
                .execute()
            )

            if result.data:
                logger.debug("Job retrieved from database", job_id=job_id)
                return result.data[0]

            logger.warning("Job not found in database", job_id=job_id)
            return None

        except Exception as e:
            logger.error(
                "Failed to retrieve job from database",
                job_id=job_id,
                error=str(e),
            )
            raise

    async def update_job_status(
        self,
        job_id: str,
        status: Literal["received", "planning", "dispatching", "awaiting", "complete", "error"],
    ) -> dict[str, Any]:
        """Update job status.

        Args:
            job_id: Job identifier
            status: New status

        Returns:
            Updated job record

        Raises:
            Exception: If database operation fails
        """
        try:
            result = (
                self.client.table(self.table)
                .update({"status": status})
                .eq("id", job_id)
                .execute()
            )

            logger.info(
                "Job status updated",
                job_id=job_id,
                status=status,
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            logger.error(
                "Failed to update job status",
                job_id=job_id,
                status=status,
                error=str(e),
            )
            raise

    async def update_job_teams(
        self,
        job_id: str,
        teams: dict[str, Any],
    ) -> dict[str, Any]:
        """Update job teams data.

        Args:
            job_id: Job identifier
            teams: Updated teams structure

        Returns:
            Updated job record

        Raises:
            Exception: If database operation fails
        """
        try:
            result = (
                self.client.table(self.table)
                .update({"teams": teams})
                .eq("id", job_id)
                .execute()
            )

            logger.debug(
                "Job teams updated",
                job_id=job_id,
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            logger.error(
                "Failed to update job teams",
                job_id=job_id,
                error=str(e),
            )
            raise

    async def update_job_cost(
        self,
        job_id: str,
        total_tokens: int,
        estimated_cost: float,
    ) -> dict[str, Any]:
        """Update job cost tracking.

        Args:
            job_id: Job identifier
            total_tokens: Total tokens used
            estimated_cost: Estimated cost in USD

        Returns:
            Updated job record

        Raises:
            Exception: If database operation fails
        """
        try:
            result = (
                self.client.table(self.table)
                .update({
                    "total_tokens": total_tokens,
                    "estimated_cost": estimated_cost,
                })
                .eq("id", job_id)
                .execute()
            )

            logger.info(
                "Job cost updated",
                job_id=job_id,
                total_tokens=total_tokens,
                estimated_cost=estimated_cost,
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            logger.error(
                "Failed to update job cost",
                job_id=job_id,
                error=str(e),
            )
            raise

    async def update_job(
        self,
        job_id: str,
        **updates: Any,
    ) -> dict[str, Any]:
        """Update job with arbitrary fields.

        Args:
            job_id: Job identifier
            **updates: Fields to update

        Returns:
            Updated job record

        Raises:
            Exception: If database operation fails
        """
        try:
            result = (
                self.client.table(self.table)
                .update(updates)
                .eq("id", job_id)
                .execute()
            )

            logger.debug(
                "Job updated",
                job_id=job_id,
                fields=list(updates.keys()),
            )

            return result.data[0] if result.data else {}

        except Exception as e:
            logger.error(
                "Failed to update job",
                job_id=job_id,
                error=str(e),
            )
            raise

    async def delete_job(self, job_id: str) -> bool:
        """Delete a job.

        Args:
            job_id: Job identifier

        Returns:
            True if deleted successfully

        Raises:
            Exception: If database operation fails
        """
        try:
            self.client.table(self.table).delete().eq("id", job_id).execute()

            logger.info("Job deleted from database", job_id=job_id)
            return True

        except Exception as e:
            logger.error(
                "Failed to delete job from database",
                job_id=job_id,
                error=str(e),
            )
            raise

    async def get_user_jobs(
        self,
        user_id: str,
        limit: int = 50,
        offset: int = 0,
    ) -> list[dict[str, Any]]:
        """Get all jobs for a user.

        Args:
            user_id: User identifier
            limit: Maximum number of jobs to return
            offset: Number of jobs to skip

        Returns:
            List of job records
        """
        try:
            result = (
                self.client.table(self.table)
                .select("*")
                .eq("user_id", user_id)
                .order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )

            logger.debug(
                "User jobs retrieved",
                user_id=user_id,
                count=len(result.data) if result.data else 0,
            )

            return result.data if result.data else []

        except Exception as e:
            logger.error(
                "Failed to retrieve user jobs",
                user_id=user_id,
                error=str(e),
            )
            raise

    async def get_all_jobs(
        self,
        limit: int = 50,
        offset: int = 0,
        status: Optional[str] = None,
    ) -> list[dict[str, Any]]:
        """Get all jobs (admin/service use).

        Args:
            limit: Maximum number of jobs to return
            offset: Number of jobs to skip
            status: Optional status filter

        Returns:
            List of job records
        """
        try:
            query = self.client.table(self.table).select("*")

            if status:
                query = query.eq("status", status)

            result = (
                query.order("created_at", desc=True)
                .limit(limit)
                .offset(offset)
                .execute()
            )

            logger.debug(
                "All jobs retrieved",
                count=len(result.data) if result.data else 0,
                status_filter=status,
            )

            return result.data if result.data else []

        except Exception as e:
            logger.error(
                "Failed to retrieve all jobs",
                error=str(e),
            )
            raise
