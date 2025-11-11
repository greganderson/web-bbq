# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**GoBBQ** is a Terminal User Interface (TUI) application for the Web-BBQ classroom feedback system. It provides a dual-mode client (student/teacher) that connects to a WebSocket backend, allowing real-time classroom engagement and feedback.

**Type**: Terminal-based client application
**Language**: Go 1.25.3
**Framework**: Charm's Bubbletea (The Elm Architecture pattern)

## Development Commands

### Prerequisites
```bash
# Verify Go installation (requires 1.25.3)
go version
```

### Build and Run
```bash
# Install/update dependencies
go mod tidy

# Build the application (creates ./gobbq binary)
go build -o gobbq

# Run in student mode (default)
./gobbq

# Run with custom WebSocket URL
./gobbq -url ws://localhost:8000
./gobbq -u wss://custom-server.com
```

### Teacher Mode Setup
```bash
# Enable teacher mode (one-time setup)
mkdir -p ~/.config/gobbq
echo "classroom123" > ~/.config/gobbq/.gobbqteacher
./gobbq

# Disable teacher mode
rm ~/.config/gobbq/.gobbqteacher
```

**Note**: The password in `.gobbqteacher` must match the `TEACHER_PASSWORD` environment variable on the backend server (default: `classroom123`).

### Testing
- No test files currently exist
- Manual testing required when making changes
- Use `go fmt` and `go vet` for code quality

### Running the Backend
```bash
cd ~/work/web-bbq/backend
python -m uvicorn main:app --reload
```

## Architecture

### Application Structure

This is a **single-package application** (all code in `main` package) with clear separation of concerns:

```
gobbq/
├── main.go         # Entry point, CLI flags, mode detection
├── config.go       # Config directory management, teacher mode detection
├── types.go        # WebSocket message structures and data models
├── websocket.go    # WebSocket client with goroutine-based message handling
├── student.go      # Student TUI model (~546 lines)
├── teacher.go      # Teacher TUI model (~544 lines)
└── go.mod          # Module definition (Go 1.25.3)
```

### Core Components

1. **WebSocket Client** (`websocket.go`)
   - Manages bidirectional WebSocket communication
   - Concurrent goroutine reads messages continuously
   - Channels for message passing: `msgChan` (data) and `errChan` (errors)
   - Mutex-protected connection state

2. **Student Interface** (`student.go`)
   - Interactive TUI for feedback submission
   - Three focus areas: name input, feedback buttons, question textarea
   - Progressive UI reveal (name → feedback → questions)
   - Persists student name to `~/.config/gobbq/config.yaml`

3. **Teacher Interface** (`teacher.go`)
   - Dashboard TUI for monitoring student responses
   - Split-screen: feedback (left) and questions (right)
   - Two focus areas with Tab switching
   - Real-time updates via WebSocket push

4. **Configuration Manager** (`config.go`)
   - Teacher mode: Password file at `~/.config/gobbq/.gobbqteacher` containing the teacher password
   - Student config: YAML file with `name: "Student Name"`
   - Config directory: `~/.config/gobbq/`
   - Password authentication: Reads password from file and appends as query parameter to WebSocket URL

### Architectural Pattern: The Elm Architecture (Bubbletea)

All TUI models follow this pattern:
```go
type Model struct { /* state */ }
func (m Model) Init() tea.Cmd              // Initialize
func (m Model) Update(msg tea.Msg) (Model, tea.Cmd)  // Handle events
func (m Model) View() string               // Render UI
```

## WebSocket Protocol

### Connection Endpoints
- **Default Server**: `wss://webbbq-backend-production.up.railway.app`
- **Student**: `{base_url}/ws/student` (no authentication)
- **Teacher**: `{base_url}/ws/teacher?password={password}` (password-based authentication)

### Message Structure
All messages follow this JSON format:
```json
{
  "type": "new|update|delete",
  "resource": "feedback|question",
  "id": "string|null",
  "data": {...}
}
```

### Student Actions
**Send Feedback:**
```json
{
  "type": "new",
  "resource": "feedback",
  "data": {
    "student": "Student Name",
    "feedback": "I'm on track"
  }
}
```

**Send Question:**
```json
{
  "type": "new",
  "resource": "question",
  "data": {
    "student": "Student Name",
    "question": "What is recursion?"
  }
}
```

### Teacher Actions
**Clear All Feedback:**
```json
{"type": "delete", "resource": "feedback", "id": null}
```

**Delete Question:**
```json
{"type": "delete", "resource": "question", "id": "question_id"}
```

**Receive Updates:**
```json
{
  "type": "update",
  "data": [
    [/* feedback array */],
    [/* questions array */]
  ]
}
```

## Key Conventions and Patterns

### Feedback Options (Constants)
Student feedback is limited to four options:
- `"I'm on track"` (▶) - Teal color (#4ECDC4)
- `"Please slow down"` (⏸) - Yellow color (#FFE66D)
- `"I'm lost"` (⏹) - Red color (#FF6B6B)
- `"Please go faster"` (⏩) - Mint color (#95E1D3)

### Color Scheme (BBQ-Themed Palette)
```go
"#FF6B6B" // Red - Titles, alerts, "lost" feedback
"#4ECDC4" // Teal - Connected status, "on track"
"#FFE66D" // Yellow - "Slow down", section headers
"#95E1D3" // Mint - "Go faster", status messages
"#666"    // Gray - Help text, timestamps
```

**Maintain this color scheme when modifying UI elements.**

### Focus Management
- **Student**: Three focus areas (name input, feedback buttons, question textarea)
- **Teacher**: Two focus areas (feedback panel, questions panel)
- Tab key cycles through focus areas
- Visual indicators: Thick borders when focused

### Configuration Persistence
- **Teacher mode**: Password file at `~/.config/gobbq/.gobbqteacher` containing the teacher password (plain text)
- **Student name**: YAML file with simple `name: "value"` format
- **Config errors**: Non-fatal, show warnings but don't crash
- **Password validation**: Password is sent as query parameter to backend for authentication

### Concurrency Safety
- WebSocket client uses mutex for thread-safe operations
- Message channels for goroutine communication
- Connection state tracked and synchronized

## Dependencies

### Primary Dependencies (Direct)
```
github.com/charmbracelet/bubbletea v1.3.10   # TUI framework (Elm Architecture)
github.com/charmbracelet/bubbles v0.21.0     # TUI components (textarea, textinput)
github.com/charmbracelet/lipgloss v1.1.0     # Terminal styling and layout
github.com/gorilla/websocket v1.5.3          # WebSocket client
github.com/spf13/pflag v1.0.10              # POSIX-style CLI flags
gopkg.in/yaml.v3 v3.0.1                     # YAML config parsing
```

### Dependency Purposes
- **Bubbletea**: Core TUI framework using The Elm Architecture pattern
- **Bubbles**: Pre-built components (textarea for questions, textinput for name)
- **Lipgloss**: Styling engine for colors, borders, layouts, padding
- **Gorilla WebSocket**: Industry-standard WebSocket client for Go
- **pflag**: Enhanced flag parsing with POSIX conventions (`-u` and `--url`)
- **YAML v3**: Student name configuration persistence

## Keyboard Controls

### Student Mode
- `1-4`: Send feedback (immediate submission)
- `Tab`: Switch focus between feedback/questions
- `Enter`: Submit name, newline in question textarea
- `Ctrl+S`: Send question
- `Esc/Ctrl+C`: Quit

### Teacher Mode
- `Tab`: Switch between feedback/questions panel
- `C`: Clear all feedback (when focused on feedback)
- `D`: Delete selected question
- `E/Enter/Space`: Expand/collapse long questions
- `↑↓` or `J/K`: Navigate questions
- `Q/Esc/Ctrl+C`: Quit

## Important Implementation Details

1. **Mode Detection and Authentication**: Determined by password file existence and content
   - Check: `~/.config/gobbq/.gobbqteacher` exists and contains password → Teacher mode
   - No file or empty file → Student mode
   - Password is read from file, trimmed of whitespace, and appended to WebSocket URL as query parameter

2. **Message Handling**: Teacher receives updates via WebSocket push, not polling

3. **Question Display**: Long questions automatically collapsed/expandable in teacher view
   - Expanded state tracked by ID in a map
   - Persists during session for UX consistency

4. **Terminal Compatibility**: Uses Alt Screen mode (preserves terminal history)

5. **Error Handling**: Non-blocking error messages via channels, displayed in footer

6. **State Management**: Each mode has its own Model struct with distinct fields

7. **No Version Control**: This repository is not a Git repository

## Related Projects

- **Backend**: Located at `~/work/web-bbq/backend` (Python/FastAPI)
- **Web Client**: Part of the larger Web-BBQ ecosystem
