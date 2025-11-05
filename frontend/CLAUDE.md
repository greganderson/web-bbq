# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is the frontend for Web-BBQ, a real-time classroom feedback and Q&A system. Built with React, TypeScript, and Vite, it provides separate student and teacher interfaces connected via WebSocket for live bidirectional communication with the FastAPI backend.

## Development Commands

**Package Manager:** This project uses **Yarn 1.22.22**. Always use `yarn` commands, not npm.

**Development:**
- `yarn dev` - Start Vite dev server in development mode
- `yarn prod` - Start Vite dev server in production mode (uses production env vars)
- `yarn build` - TypeScript compilation + production build
- `yarn preview` - Preview production build locally
- `yarn lint` - Run ESLint

## Architecture

### Application Entry Point

**main.tsx** - Application root:
- Wraps app with Redux Provider, React Router, and MantineProvider
- Implements theme toggling with localStorage persistence via `useLocalStorage` hook
- Theme state managed locally, passed to App via `toggleTheme` prop

**App.tsx** - Main component:
- Defines tab-based navigation between Student and Teacher views
- Renders Settings modal for theme/configuration changes
- Includes 3D background component (`MemoBackground`) and notification system
- Routes defined: `/` (redirect to `/student`), `/student`, `/teacher`

### State Management

**Redux Store (Store.ts)**:
- Single `appSlice` manages:
  - `baseUrl` - HTTP API base URL from `VITE_API_URL` env var
  - `baseWS` - WebSocket URL from `VITE_WS_URL` env var
  - `name` - Student name for identification
- Minimal global state; most UI state is component-local

### WebSocket Communication Pattern

**Student View (pages/Student.tsx)**:
- Connects to `${baseWS}/ws/student` (no authentication)
- Uses `react-use-websocket` hook with `sendMessage` and `readyState`
- Connection status indicator with GSAP shake animation when disconnected
- Student name input stored in Redux
- Renders `Feedback` and `Questions` components with message sending callback

**Teacher View (pages/Teacher.tsx)**:
- Connects to `${baseWS}/ws/teacher?password=xxx` with authentication
- Login component captures password before connecting
- WebSocket URL set dynamically after authentication (`setWsUrl`)
- `lastJsonMessage` updates trigger state updates for feedback/questions
- Auto-reconnect only when `loggedIn` is true
- On connection error, resets login state and forces re-authentication
- Renders `Responses` and `QuestionWindow` components

**Message Protocol** (see backend CLAUDE.md for full spec):
- All messages are JSON with `type`, `resource`, `id`, `data` fields
- Student sends: `{type: "new", resource: "feedback"|"question", data: {...}}`
- Teacher receives: `{type: "update", data: [Response[], Question[]]}`
- Teacher sends: `{type: "delete", resource: "feedback"|"question", id: "..."}`

### Component Structure

**Pages (route-level components):**
- `Student.tsx` - Student feedback/question submission interface
- `Teacher.tsx` - Teacher dashboard with all student responses

**Components (reusable UI):**
- `Feedback.tsx` - Textarea for lecture feedback submission
- `Questions.tsx` - Textarea for question submission
- `Responses.tsx` - Teacher view of student feedback (grid of cards)
- `QuestionWindow.tsx` - Teacher view of student questions (list with timestamps)
- `Settings.tsx` - Theme toggle and configuration modal
- `Notification.tsx` - Toast notification wrapper using `react-toastify`
- `teacher/Login.tsx` - Password input modal for teacher authentication
- `bbq/ThreeCanvas.tsx` - Three.js 3D background scene (currently disabled via `isVisible={false}`)

**Component Communication Pattern:**
- Pages own WebSocket connection and pass `onSendMessage` callback to child components
- Child components call callback with message object, parent handles serialization and sending
- Teacher components receive data as props and call `onSendMessage` for actions (delete, clear)

### Styling and UI

**Mantine UI v7:**
- Component library used throughout (`@mantine/core`, `@mantine/hooks`)
- Theme defined in `theme.ts` with custom `webTheme` (dark) and `lightMode`
- Theme toggle persists to localStorage
- Icons from `@tabler/icons-react`

**CSS:**
- Global styles in `index.css`
- `.blurred` class used on main containers for background effects
- Tailwind CSS NOT used (despite being mentioned in parent CLAUDE.md)

**Animations:**
- GSAP library with `@gsap/react` for declarative animations
- Connection status icon shake animation in Student view
- 3D animations in BBQ background component (Three.js + GSAP)

### TypeScript Types

Defined in `types.ts`:

```typescript
interface Question {
  id: number;
  student: string;
  question: string;
  timestamp: string;
}

interface Response {  // "feedback" in backend terminology
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

**Note:** Backend calls it "feedback", frontend calls it "Response" - they're the same thing.

### Environment Variables

Required in `.env.development` or `.env.production` (Vite format with `VITE_` prefix):

```
VITE_API_URL=<backend-http-url>
VITE_WS_URL=<backend-websocket-url>
```

**Mode Selection:**
- `yarn dev` uses `.env.development`
- `yarn prod` and `yarn build` use `.env.production`

## Key Considerations

### WebSocket Connection Management
- Student connections are persistent and auto-reconnect by default
- Teacher connections only reconnect when `loggedIn` state is true
- Connection errors in teacher view trigger logout and require re-authentication
- Visual connection status indicators prevent user confusion

### Authentication Flow
1. Teacher clicks Login button → modal opens
2. Teacher enters password → sets WebSocket URL with password query param
3. WebSocket connects → on success, shows connected UI
4. On error → resets login state, clears WebSocket URL, shows error toast

### Error Handling
- `notifyError()` helper from `Notification.tsx` shows toast messages
- WebSocket errors caught in `onError` callback
- Student view checks `isConnected` before sending messages

### Student Name Handling
- Stored in Redux so it persists across component remounts
- Required for both feedback and questions
- Not validated on frontend (backend associates data with provided name)

### Firebase Configuration
- `firebase.ts` file exists but appears unused (legacy from another project?)
- No Firebase functionality currently active in the application

### 3D Background
- Three.js scene with `@react-three/fiber` and `@react-three/drei`
- Currently disabled in App.tsx via `isVisible={false}` prop
- When enabled, renders animated 3D meat model with GSAP animations
- Performance-intensive, kept as optional feature

## Development Workflow

1. Start backend server first (see `../backend/CLAUDE.md`)
2. Create `.env.development` with backend URLs
3. Run `yarn dev` to start frontend development server
4. Test student view at `/student` (no auth needed)
5. Test teacher view at `/teacher` (default password: "classroom123")
