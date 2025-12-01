"""Supabase client initialization and management."""

from typing import Optional
from supabase import Client, create_client
from src.config import get_settings
from src.utils import get_logger

logger = get_logger(__name__)


class SupabaseClient:
    """Singleton Supabase client manager."""

    _instance: Optional[Client] = None
    _initialized: bool = False

    @classmethod
    def get_client(cls) -> Client:
        """Get or create Supabase client instance.

        Returns:
            Supabase client instance

        Raises:
            ValueError: If Supabase credentials are not configured
        """
        if cls._instance is None:
            settings = get_settings()

            if not settings.SUPABASE_URL or not settings.SUPABASE_SERVICE_ROLE_KEY:
                logger.error("Supabase credentials not configured")
                raise ValueError(
                    "SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY must be set in environment"
                )

            try:
                cls._instance = create_client(
                    supabase_url=settings.SUPABASE_URL,
                    supabase_key=settings.SUPABASE_SERVICE_ROLE_KEY,
                )
                cls._initialized = True
                logger.info(
                    "Supabase client initialized",
                    url=settings.SUPABASE_URL,
                )
            except Exception as e:
                logger.error("Failed to initialize Supabase client", error=str(e))
                raise

        return cls._instance

    @classmethod
    def is_initialized(cls) -> bool:
        """Check if Supabase client is initialized."""
        return cls._initialized

    @classmethod
    def reset(cls) -> None:
        """Reset the client instance (useful for testing)."""
        cls._instance = None
        cls._initialized = False


def get_supabase() -> Client:
    """Get Supabase client instance.

    Returns:
        Supabase client instance
    """
    return SupabaseClient.get_client()
