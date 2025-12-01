"""WebSocket routes for real-time orchestration updates."""

import asyncio
from typing import Dict, Set
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from src.utils import get_logger

router = APIRouter()
logger = get_logger(__name__)

# Connection manager for WebSocket clients
class ConnectionManager:
    """Manages WebSocket connections for job updates."""

    def __init__(self) -> None:
        # Map job_id -> set of connected WebSocket clients
        self.active_connections: Dict[str, Set[WebSocket]] = {}

    async def connect(self, websocket: WebSocket, job_id: str) -> None:
        """Accept a new WebSocket connection for a job."""
        await websocket.accept()

        if job_id not in self.active_connections:
            self.active_connections[job_id] = set()

        self.active_connections[job_id].add(websocket)
        logger.info(
            "WebSocket connected",
            job_id=job_id,
            total_connections=len(self.active_connections[job_id])
        )

    def disconnect(self, websocket: WebSocket, job_id: str) -> None:
        """Remove a WebSocket connection."""
        if job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)

            # Clean up empty job entries
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]

            logger.info(
                "WebSocket disconnected",
                job_id=job_id,
                remaining_connections=len(self.active_connections.get(job_id, set()))
            )

    async def broadcast_to_job(self, job_id: str, message: dict) -> None:
        """Broadcast a message to all clients connected to a specific job."""
        if job_id not in self.active_connections:
            return

        # Get all connections for this job
        connections = list(self.active_connections[job_id])

        # Send message to all connections
        disconnected = []
        for connection in connections:
            try:
                await connection.send_json(message)
            except Exception as e:
                logger.error(
                    "Failed to send WebSocket message",
                    job_id=job_id,
                    error=str(e)
                )
                disconnected.append(connection)

        # Clean up disconnected clients
        for connection in disconnected:
            self.disconnect(connection, job_id)

    async def send_to_client(self, websocket: WebSocket, message: dict) -> None:
        """Send a message to a specific WebSocket client."""
        try:
            await websocket.send_json(message)
        except Exception as e:
            logger.error("Failed to send WebSocket message", error=str(e))


# Global connection manager instance
manager = ConnectionManager()


@router.websocket("/ws/orchestrate/{job_id}")
async def websocket_orchestrate(websocket: WebSocket, job_id: str) -> None:
    """
    WebSocket endpoint for real-time orchestration updates.

    Clients connect to this endpoint to receive live updates for a specific job.

    Message format:
    {
        "type": "status_change" | "thought_added" | "code_generated" | "error",
        "team": "anthropic" | "google" | null,
        "data": any,
        "timestamp": ISO8601 string
    }
    """
    await manager.connect(websocket, job_id)

    try:
        # Send initial connection confirmation
        from datetime import datetime
        await manager.send_to_client(websocket, {
            "type": "connected",
            "job_id": job_id,
            "timestamp": datetime.utcnow().isoformat(),
        })

        # Keep connection alive and handle incoming messages
        while True:
            try:
                # Receive messages from client (e.g., ping/pong for keepalive)
                data = await websocket.receive_text()

                # Handle ping messages
                if data == "ping":
                    await manager.send_to_client(websocket, {
                        "type": "pong",
                        "timestamp": datetime.utcnow().isoformat(),
                    })

            except WebSocketDisconnect:
                logger.info("WebSocket client disconnected", job_id=job_id)
                break
            except Exception as e:
                logger.error("WebSocket error", job_id=job_id, error=str(e))
                break

    finally:
        manager.disconnect(websocket, job_id)


def get_connection_manager() -> ConnectionManager:
    """Get the global WebSocket connection manager."""
    return manager
