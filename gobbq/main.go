package main

import (
	"fmt"
	"log"

	tea "github.com/charmbracelet/bubbletea"
	flag "github.com/spf13/pflag"
)

const (
	defaultWSURL = "wss://webbbq-backend-production.up.railway.app"
)

func main() {
	wsURL := flag.StringP("url", "u", defaultWSURL, "WebSocket server URL")
	flag.Parse()

	// Load theme configuration
	theme := LoadTheme()

	password, teacherMode := GetTeacherPassword()

	var endpoint string
	if teacherMode {
		endpoint = fmt.Sprintf("%s/ws/teacher?password=%s", *wsURL, password)
		fmt.Printf("Starting in teacher mode...\n")
		fmt.Printf("Connecting to: %s/ws/teacher\n", *wsURL)
	} else {
		endpoint = fmt.Sprintf("%s/ws/student", *wsURL)
		fmt.Printf("Starting in student mode...\n")
		fmt.Printf("Connecting to: %s\n", endpoint)
	}

	ws, err := NewWSClient(endpoint)
	if err != nil {
		log.Fatalf("Failed to connect to server: %v\nURL: %s", err, endpoint)
	}
	defer ws.Close()

	var model tea.Model
	if teacherMode {
		model = newTeacherModel(ws, theme)
	} else {
		model = newStudentModel(ws, theme)
	}

	p := tea.NewProgram(model, tea.WithAltScreen())
	if _, err := p.Run(); err != nil {
		log.Fatalf("Error running program: %v", err)
	}
}
