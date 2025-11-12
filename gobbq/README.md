# 🍖 GoBBQ - Terminal UI for Web-BBQ

A terminal user interface (TUI) version of the Web-BBQ classroom feedback system, built with Go and Bubbletea.

## Features

### Student Mode (Default)
- Enter your name to begin
- Provide real-time feedback with 4 options:
  - **[1] ▶ On Track** - Understanding concepts
  - **[2] ⏸ Slow Down** - Having trouble following
  - **[3] ⏹ I'm Lost** - Need clarification
  - **[4] ⏩ Go Faster** - Moving too slowly
- Submit questions to the teacher
- Real-time connection status indicator

### Teacher Mode
- View live student feedback with color coding
- Monitor question queue with timestamps
- Delete individual questions
- Clear all feedback at once
- Real-time updates from all students

## Installation

```bash
# Install dependencies
go mod tidy

# Build the program
go build -o gobbq
```

## Usage

### Student Mode

Start the program in student mode (default):

```bash
./gobbq
```

Or specify the WebSocket server URL:

```bash
./gobbq -url ws://localhost:8000
```

**Student Controls:**
- Enter your name and press `Enter`
- Press `1-4` to send feedback
- Press `Tab` to focus the question input
- Press `Enter` to submit a question
- Press `Ctrl+C` or `Esc` to quit

### Teacher Mode

To enable teacher mode, create a file containing your teacher password in your config directory:

```bash
mkdir -p ~/.config/gobbq
echo "your_password_here" > ~/.config/gobbq/.gobbqteacher
```

Replace `your_password_here` with the actual teacher password configured on the backend server.

Once this file exists with a password, simply run:

```bash
./gobbq
```

The app will automatically detect the teacher password file and start in teacher mode with authentication.

**To disable teacher mode:**

```bash
rm ~/.config/gobbq/.gobbqteacher
```

**Teacher Controls:**
- Press `Tab` to switch focus between feedback and questions
- Press `C` to clear all feedback (when focused on feedback panel)
- Press `D` to delete the selected question (when focused on questions panel)
- Press `E`, `Enter`, or `Space` to expand/collapse questions
- Press `↑`/`↓` or `K`/`J` to navigate questions
- Press `Q`, `Esc`, or `Ctrl+C` to quit

## Command Line Flags

- `-url` or `-u` - WebSocket server URL (default: `wss://webbbq-backend-production.up.railway.app`)

## Examples

```bash
# Start as a student (default)
./gobbq

# Start as a student connecting to a custom server
./gobbq --url wss://example.com:8000

# Start as a teacher (after creating the password file)
./gobbq

# Disable teacher mode
rm ~/.config/gobbq/.gobbqteacher
```

## Architecture

- **main.go** - Entry point and CLI flag parsing
- **config.go** - Configuration file management and teacher authentication
- **types.go** - WebSocket message types and data structures
- **websocket.go** - WebSocket client implementation
- **student.go** - Student TUI interface using Bubbletea
- **teacher.go** - Teacher TUI interface using Bubbletea

## WebSocket Protocol

The TUI communicates with the Web-BBQ backend using JSON messages:

### Student Messages

**Send Feedback:**
```json
{
  "type": "new",
  "resource": "feedback",
  "id": null,
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
  "id": null,
  "data": {
    "student": "Student Name",
    "question": "What is recursion?"
  }
}
```

### Teacher Messages

**Clear Feedback:**
```json
{
  "type": "delete",
  "resource": "feedback",
  "id": null,
  "data": null
}
```

**Delete Question:**
```json
{
  "type": "delete",
  "resource": "question",
  "id": "question_id_here",
  "data": null
}
```

**Receive Updates:**
```json
{
  "type": "update",
  "resource": null,
  "id": null,
  "data": [
    [/* feedback array */],
    [/* questions array */]
  ]
}
```

## Dependencies

- [gorilla/websocket](https://github.com/gorilla/websocket) - WebSocket client
- [charmbracelet/bubbletea](https://github.com/charmbracelet/bubbletea) - TUI framework
- [charmbracelet/bubbles](https://github.com/charmbracelet/bubbles) - TUI components
- [charmbracelet/lipgloss](https://github.com/charmbracelet/lipgloss) - Terminal styling

## Running the Backend

Make sure the Web-BBQ backend server is running:

```bash
cd ~/work/web-bbq/backend
python -m uvicorn main:app --reload
```

The server will start on `http://localhost:8000` by default.

## Color Scheme

The TUI uses a BBQ-themed color palette:
- **Red (#FF6B6B)** - Titles, alerts, "I'm lost" feedback
- **Teal (#4ECDC4)** - Connected status, "On track" feedback
- **Yellow (#FFE66D)** - "Slow down" feedback, section headers
- **Mint (#95E1D3)** - "Go faster" feedback, status messages
- **Gray (#666)** - Help text, timestamps

It can be customized by creating a theme.yaml inside `~/.config/gobbq/`.
Any values not set will fall back to the default theme.

Example config:
```yaml
# Window and border colors
border_color: "#666"              # Default border color for all windows
active_border_color: "#FFE66D"    # Border color when a window/panel is focused

# Text colors
title_color: "#FF6B6B"            # Section titles and headers
help_text_color: "#666"           # Muted help text and instructions
timestamp_color: "#666"           # Question timestamps in teacher view

# Status colors
connected_color: "#4ECDC4"        # Connected/positive status indicator
disconnected_color: "#FF6B6B"     # Disconnected/error status indicator

# Student feedback option colors
on_track_color: "#4ECDC4"         # "I'm on track" feedback (teal)
slow_down_color: "#FFE66D"        # "Please slow down" feedback (yellow)
lost_color: "#FF6B6B"             # "I'm lost" feedback (red)
go_faster_color: "#95E1D3"        # "Please go faster" feedback (mint)
```

## License

This is a companion TUI for the Web-BBQ project.
