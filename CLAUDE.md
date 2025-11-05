# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Web-BBQ is a real-time classroom feedback and Q&A system consisting of:
- **Frontend**: React + TypeScript + Vite application with student and teacher views
- **Backend**: FastAPI WebSocket server for real-time bidirectional communication

The system enables teachers to receive live lecture feedback and student questions through WebSocket connections, with password authentication for teacher access.

## Repository Structure

```
web-bbq/
├── frontend/          # React + TypeScript + Vite application
│   ├── src/
│   │   ├── pages/            # Student and Teacher page components
│   │   ├── Components/       # Reusable UI components
│   │   │   └── bbq/          # 3D Three.js background components
│   │   ├── Store.ts          # Redux store configuration
│   │   ├── firebase.ts       # Firebase client initialization
│   │   └── types.ts          # TypeScript interfaces
│   └── package.json          # Uses Yarn 1.22.22
│
└── backend/           # FastAPI WebSocket server
    ├── main.py               # FastAPI app, routes, Firebase auth
    ├── ConnectionManager.py  # WebSocket state management
    └── CLAUDE.md             # Backend-specific documentation
```

## Development Commands

### Frontend (from `frontend/` directory)

**Development:**
- `yarn dev` - Start Vite dev server in development mode
- `yarn prod` - Start Vite dev server in production mode
- `yarn build` - TypeScript compilation + production build
- `yarn preview` - Preview production build locally
- `yarn lint` - Run ESLint

**Package Manager:** This project uses **Yarn 1.22.22**. Always use `yarn` commands, not npm.

### Backend (from `backend/` directory)

**Local Development:**
- `source .venv/bin/activate` - Activate Python virtual environment
- `uvicorn main:app --reload` - Start server with hot reload (default port 8000)
- `python -m uvicorn main:app --host 0.0.0.0 --port 8000` - Network-accessible server

**Production:**
- Configured for AWS Elastic Beanstalk (see Procfile and .ebextensions/)
- Uses Gunicorn with Uvicorn workers: `gunicorn main:app --workers=4 --worker-class=uvicorn.workers.UvicornWorker`

**Dependencies:**
- `pip install -r requirements.txt` - Install Python dependencies

## Architecture

### Frontend Architecture

**State Management:**
- Redux Toolkit store (`Store.ts`) manages global state:
  - `baseUrl` - API base URL from environment variables
  - `baseWS` - WebSocket URL from environment variables
  - `name` - Student name for identification

**Routing:**
- React Router with two main routes:
  - `/` - Redirects to `/student`
  - `/student` - Student view (feedback submission, question asking)
  - `/teacher` - Teacher view (displays all feedback and questions)

**Component Structure:**
- `pages/` - Top-level route components (Student.tsx, Teacher.tsx)
- `Components/` - Reusable UI components:
  - `Feedback.tsx` - Feedback submission interface
  - `Questions.tsx` - Question submission interface
  - `Responses.tsx` - Teacher view of student feedback
  - `QuestionWindow.tsx` - Teacher view of student questions
  - `bbq/` - Three.js 3D background using @react-three/fiber and GSAP animations

**WebSocket Communication:**
- Uses `react-use-websocket` library for WebSocket connections
- Student endpoint: `${baseWS}/ws/student` (no authentication)
- Teacher endpoint: `${baseWS}/ws/teacher?password=xxx` (requires password)
- Messages follow JSON protocol defined in backend CLAUDE.md

**Styling:**
- Mantine UI component library v7
- Theme toggling (light/dark mode) with localStorage persistence
- Custom themes defined in `theme.ts`
- Uses CSS modules for component-specific styles

**Authentication:**
- Teacher authentication via password-protected WebSocket connection
- Password stored on server side (environment variable or hardcoded default)
- Simple login modal component in `Components/teacher/Login.tsx`

### Backend Architecture

The backend is thoroughly documented in `backend/CLAUDE.md`. Key points:

**FastAPI Application:**
- Three WebSocket endpoints: `/ws/student`, `/ws/teacher`, `/ws/test`
- Password-based authentication for teachers
- CORS middleware configured for all origins

**Connection Management:**
- `ConnectionManager` class handles all WebSocket state
- Separate dictionaries for teacher and student connections
- In-memory storage for feedback and questions (no persistence)
- Broadcasts updates to all connected teachers

**Message Protocol:**
- JSON messages with `type`, `resource`, `id`, and `data` fields
- Resources: `feedback` (lecture feedback), `question` (student questions)
- Message types: `init`, `new`, `delete`, `update`

### Data Flow

1. **Student Feedback:**
   - Student enters name and feedback → sends via WebSocket
   - Backend updates feedback list (one per student, no duplicates)
   - Broadcast to all connected teachers

2. **Student Questions:**
   - Student submits question → WebSocket message
   - Backend generates UUID + timestamp, appends to questions list
   - Broadcast to all connected teachers

3. **Teacher View:**
   - Teacher authenticates with password → connects to `/ws/teacher?password=xxx`
   - Receives full state initialization on connection
   - Real-time updates as students submit feedback/questions
   - Can delete individual questions or clear all feedback

## Environment Variables

### Frontend (`frontend/.env.development` or `frontend/.env.production`)

```
VITE_API_URL=<backend-http-url>
VITE_WS_URL=<backend-websocket-url>
```

### Backend (loaded from `.env` or environment)

```
TEACHER_PASSWORD=<teacher-password>
```

If `TEACHER_PASSWORD` is not set, backend defaults to "classroom123".

## Key Considerations

### Frontend
- **WebSocket reconnection**: Uses `react-use-websocket` which handles reconnection automatically
- **Connection status**: Visual indicator (plug icon) shows connection state with GSAP animation
- **Error handling**: Toast notifications via `react-toastify` for connection errors
- **3D Background**: Three.js scene with animated 3D meat model (can be toggled)
- **Theme persistence**: Color scheme saved to localStorage

### Backend
- **No persistence**: All feedback and questions stored in-memory only
- **No student authentication**: Students can connect without credentials
- **Simple teacher authentication**: Password-based authentication (configurable via environment variable)
- **Timezone**: Question timestamps use America/Denver (Mountain Time)
- **Concurrency**: Single-threaded asyncio event loop for WebSocket handling

### Development Workflow
1. Backend must be running before frontend can connect
2. Teacher password defaults to "classroom123" (change via TEACHER_PASSWORD env var)
3. Test endpoint (`/ws/test`) available for development without auth
4. Frontend uses different environment files for dev vs production modes

## Type Definitions

Core TypeScript interfaces in `frontend/src/types.ts`:

```typescript
interface Question {
  id: number;
  student: string;
  question: string;
  timestamp: string;
}

interface Response {  // Called "feedback" in backend
  student: string;
  feedback: string;
}

interface WebsocketResponse {
  type: string;
  resource: string;
  id: number | null;
  data: [Response[], Question[]];
}
```
