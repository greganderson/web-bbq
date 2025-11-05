# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a FastAPI-based WebSocket server for a classroom feedback and Q&A system. It enables real-time bidirectional communication between teachers and students, managing lecture feedback and student questions through WebSocket connections.

## Development Commands

### Local Development
- `uvicorn main:app --reload` - Start development server with hot reload
- `python -m uvicorn main:app --host 0.0.0.0 --port 8000` - Start server accessible on network

### Production (AWS Elastic Beanstalk)
- Procfile defines production server: `gunicorn main:app --workers=4 --worker-class=uvicorn.workers.UvicornWorker`
- Deploy via EB CLI (configured in .ebextensions/)

### Virtual Environment
- Project uses Python virtual environment in `.venv/`
- Activate: `source .venv/bin/activate`
- Install dependencies: `pip install -r requirements.txt`

## Architecture

### Application Structure

```
backend/
├── main.py                     # FastAPI app, routes, Firebase auth
├── ConnectionManager.py        # WebSocket connection and state management
├── firebase-admin.json         # Firebase Admin SDK credentials (gitignored)
├── .ebextensions/              # AWS Elastic Beanstalk configuration
└── requirements.txt            # Python dependencies
```

### Core Components

**main.py** - FastAPI application entry point:
- Loads teacher password from environment variable
- Configures CORS middleware for cross-origin WebSocket connections
- Defines three WebSocket endpoints: `/ws/student`, `/ws/teacher`, `/ws/test`
- Teacher connections require password authentication via query params

**ConnectionManager.py** - Centralized WebSocket state management:
- Maintains separate dictionaries for teacher and student connections
- Manages two shared data stores: `feedback` (lecture feedback) and `questions` (student questions)
- Handles connection lifecycle (connect, disconnect, message processing)
- Broadcasts updates to all connected teachers

### Authentication Flow

1. **Students**: No authentication required, connect directly to `/ws/student`
2. **Teachers**: Must provide password as query param (`/ws/teacher?password=xxx`)
   - Password validated against `TEACHER_PASSWORD` environment variable (defaults to "classroom123")
   - Invalid/missing passwords result in 401 HTTPException
3. **Test endpoint**: `/ws/test` bypasses auth for development (connects as teacher)

### WebSocket Message Protocol

All messages follow JSON format with structured fields:

```python
{
    "type": "init" | "delete" | "new" | "update",
    "resource": "feedback" | "question" | None,
    "id": str | None,  # Used for delete operations
    "data": dict | list | None
}
```

**Message Types**:
- `init` - Sent to teachers on connection with all current feedback/questions
- `new` - Create new feedback or question
- `delete` - Remove specific question or clear all feedback
- `update` - Broadcast to teachers when state changes

**Resources**:
- `feedback` - Lecture feedback from students (per-student updates, not duplicated)
- `question` - Student questions with auto-generated ID and timestamp

### Data Models

**Feedback** (dict):
```python
{
    "student": str,   # Student identifier
    "feedback": str   # Feedback content
}
```

**Question** (dict):
```python
{
    "id": str,         # UUID (first 8 chars), server-generated
    "student": str,    # Student identifier
    "question": str,   # Question content
    "timestamp": str   # ISO format, America/Denver timezone
}
```

### State Management

**ConnectionManager** maintains global state:
- `teachers: dict[str, WebSocket]` - Active teacher connections by client_id
- `students: dict[str, WebSocket]` - Active student connections by client_id
- `feedback: list[dict]` - Current lecture feedback (one per student)
- `questions: list[dict]` - All active questions

**Key behaviors**:
- Feedback is updated per student (not appended), preventing duplicates
- Questions are appended with server-generated ID and timestamp
- All state changes trigger `update_teachers()` broadcast
- Disconnections are handled gracefully in `finally` blocks

### Connection Lifecycle

1. **Connect**:
   - Accept WebSocket, generate 8-char UUID client_id
   - For teachers: send full state via `update_teachers(websocket)`
   - Store connection in appropriate dict

2. **Message Loop**:
   - Receive JSON messages, parse and route to `process_message()`
   - `WebSocketDisconnect` caught but suppressed (cleanup in finally)

3. **Disconnect**:
   - Remove from connection dict
   - No cleanup of feedback/questions (persists across connections)

## Environment Variables

Optional authentication configuration:
- `TEACHER_PASSWORD` - Password for teacher authentication (defaults to "classroom123" if not set)

## Key Considerations

- **No persistence**: All feedback and questions stored in-memory only
- **No student authentication**: Students can connect without credentials
- **Simple teacher authentication**: Teachers authenticate with a hardcoded password
- **Timezone**: Timestamps use America/Denver (Mountain Time)
- **CORS**: Configured for all origins (`*`) - restrict for production
- **Concurrency**: Uses asyncio for WebSocket handling, single-threaded event loop
- **Error handling**: WebSocketDisconnect exceptions are caught to prevent bubbling
