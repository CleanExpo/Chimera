# WebSocket Streaming Test Guide

## Overview
Real-time WebSocket streaming has been implemented for the Chimera orchestration system. This allows the frontend to receive live updates from the backend during AI code generation.

## What Was Implemented

### Backend (FastAPI)

1. **WebSocket Endpoint** (`apps/backend/src/api/routes/websocket.py`)
   - Endpoint: `ws://localhost:8888/ws/orchestrate/{job_id}`
   - Manages WebSocket connections per job
   - Broadcasts events to all connected clients for a specific job
   - Handles connection/disconnection gracefully
   - Supports ping/pong for keepalive

2. **Orchestrator Service** (`apps/backend/src/orchestrator/service.py`)
   - Added event callback support to `orchestrate()`, `generate_with_anthropic()`, and `generate_with_google()`
   - Emits events for:
     - Status changes (thinking, generating, complete, error)
     - New thoughts added to the stream
     - Code generation completion
     - Errors during generation

3. **Orchestrate Routes** (`apps/backend/src/api/routes/orchestrate.py`)
   - Updated `_run_orchestration()` to use WebSocket broadcasting
   - Events are sent in real-time as the orchestration progresses

4. **Main App** (`apps/backend/src/api/main.py`)
   - WebSocket router included in the main FastAPI app

### Frontend (Next.js)

1. **WebSocket Hook** (`apps/web/hooks/useOrchestrationSocket.ts`)
   - Custom React hook for managing WebSocket connections
   - Automatic reconnection logic (5 attempts, 2s interval)
   - Ping/pong for keepalive (every 30s)
   - Clean disconnect on unmount
   - Fallback support

2. **CommandCenter Component** (`apps/web/components/dashboard/CommandCenter.tsx`)
   - Integrated WebSocket hook for real-time updates
   - Falls back to polling if WebSocket fails
   - Feature flag to toggle between WebSocket and polling
   - Updates UI in real-time as messages arrive

## Message Format

```typescript
interface WSMessage {
  type: 'connected' | 'status_change' | 'thought_added' | 'code_generated' | 'error' | 'pong';
  team?: 'anthropic' | 'google';
  data: any;
  timestamp: string; // ISO 8601 format
  job_id?: string;
}
```

### Message Types

1. **connected** - Initial connection confirmation
   ```json
   {
     "type": "connected",
     "job_id": "uuid-here",
     "timestamp": "2025-12-01T10:00:00.000Z"
   }
   ```

2. **status_change** - Team status changed
   ```json
   {
     "type": "status_change",
     "team": "anthropic",
     "data": { "status": "thinking" },
     "timestamp": "2025-12-01T10:00:01.000Z"
   }
   ```

3. **thought_added** - New thought in the reasoning stream
   ```json
   {
     "type": "thought_added",
     "team": "anthropic",
     "data": {
       "id": "thought-uuid",
       "text": "Analyzing the brief...",
       "timestamp": "2025-12-01T10:00:02.000Z",
       "team": "anthropic"
     },
     "timestamp": "2025-12-01T10:00:02.000Z"
   }
   ```

4. **code_generated** - Code generation complete
   ```json
   {
     "type": "code_generated",
     "team": "anthropic",
     "data": {
       "code": "export function MyComponent() {...}",
       "token_count": 1500
     },
     "timestamp": "2025-12-01T10:00:30.000Z"
   }
   ```

5. **error** - Error occurred
   ```json
   {
     "type": "error",
     "team": "anthropic",
     "data": {
       "error": "API rate limit exceeded",
       "status": "error"
     },
     "timestamp": "2025-12-01T10:00:15.000Z"
   }
   ```

## How to Test

### 1. Start the Backend

```bash
cd apps/backend
python -m uvicorn src.api.main:app --reload --port 8888
```

### 2. Start the Frontend

```bash
cd apps/web
pnpm dev
```

### 3. Test WebSocket Connection

Open your browser's developer console and navigate to `http://localhost:3030`.

1. Go to the Command Center dashboard
2. Submit a brief (e.g., "Create a login form with email and password")
3. Watch the browser console for WebSocket messages:
   ```
   [WebSocket] Connecting to ws://localhost:8888/ws/orchestrate/{job_id}
   [WebSocket] Connected to job {job_id}
   [CommandCenter] WebSocket message: { type: 'connected', ... }
   [CommandCenter] WebSocket message: { type: 'status_change', team: 'anthropic', ... }
   [CommandCenter] WebSocket message: { type: 'thought_added', team: 'anthropic', ... }
   ```

4. Verify real-time updates in the UI:
   - Team status changes (idle → thinking → generating → complete)
   - Thoughts appear in real-time
   - Code appears when generation completes

### 4. Test Fallback to Polling

To test the fallback mechanism:

1. Stop the backend while a job is running
2. The frontend should automatically fall back to polling
3. Console should show:
   ```
   [CommandCenter] WebSocket disconnected, falling back to polling
   ```

### 5. Manual WebSocket Test (Optional)

You can test the WebSocket endpoint directly using a tool like `wscat`:

```bash
# Install wscat
npm install -g wscat

# Connect to WebSocket
wscat -c "ws://localhost:8888/ws/orchestrate/test-job-id"

# You'll receive a connection confirmation
# Then you can send ping messages
> ping

# You'll receive pong responses
< {"type":"pong","timestamp":"2025-12-01T10:00:00.000Z"}
```

## Environment Configuration

Make sure you have the correct environment variable set in `apps/web/.env.local`:

```env
NEXT_PUBLIC_BACKEND_URL=http://localhost:8888
```

For production with HTTPS:
```env
NEXT_PUBLIC_BACKEND_URL=https://api.yourchimera.com
```

The WebSocket hook will automatically use `wss://` for HTTPS backends.

## Troubleshooting

### WebSocket Connection Fails

1. **Check CORS**: Ensure the backend allows WebSocket connections from your frontend origin
2. **Check Firewall**: Port 8888 must be accessible
3. **Check Browser Console**: Look for connection errors or blocked requests

### No Real-Time Updates

1. **Check Feature Flag**: In `CommandCenter.tsx`, verify `useWebSocket` is `true`
2. **Check Backend Logs**: Look for WebSocket broadcast events
3. **Check Job ID**: Ensure the job_id is correctly passed to the WebSocket hook

### Fallback Not Working

1. Verify polling logic is still intact in `CommandCenter.tsx`
2. Check that `pollJobStatus()` function is still present and working

## Performance Notes

- **WebSocket** uses minimal bandwidth (only sends updates, ~100-500 bytes per message)
- **Polling** queries the entire job status every 1-2 seconds (1-5KB per request)
- WebSocket is 10-50x more efficient for real-time updates
- Polling is kept as a fallback for environments where WebSocket is blocked

## Next Steps

1. Add authentication to WebSocket connections (JWT token validation)
2. Implement Redis pub/sub for horizontal scaling
3. Add WebSocket connection status indicator in UI
4. Add retry logic for failed broadcasts
5. Add metrics for WebSocket performance monitoring
