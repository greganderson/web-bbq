package main

import (
	"encoding/json"
	"fmt"
	"strings"
	"time"

	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"github.com/gen2brain/beeep"
)

type teacherFocus int

const (
	teacherFocusFeedback teacherFocus = iota
	teacherFocusQuestions
)

type teacherModel struct {
	ws             *WSClient
	feedback       []Response
	questions      []Question
	selectedQIndex int
	focus          teacherFocus
	width          int
	height         int
	err            error
	statusMsg      string
	lastUpdate     time.Time
	expandedQs     map[string]bool // Track which questions are expanded by ID
	theme          Theme
	lastSeen       time.Time
}

func newTeacherModel(ws *WSClient, theme Theme) teacherModel {
	return teacherModel{
		ws:             ws,
		feedback:       []Response{},
		questions:      []Question{},
		selectedQIndex: 0,
		focus:          teacherFocusFeedback,
		width:          80,
		height:         24,
		expandedQs:     make(map[string]bool),
		theme:          theme,
		lastSeen:       time.Now(),
	}
}

func (m teacherModel) Init() tea.Cmd {
	return waitForWSMessage(m.ws)
}

func (m teacherModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmds []tea.Cmd

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc", "q":
			return m, tea.Quit

		case "tab":
			// Switch focus between feedback and questions
			if m.focus == teacherFocusFeedback {
				m.focus = teacherFocusQuestions
			} else {
				m.focus = teacherFocusFeedback
			}

		case "c":
			// Clear all feedback
			if m.focus == teacherFocusFeedback {
				cmds = append(cmds, m.clearFeedback())
			}

		case "d", "delete":
			// Delete selected question
			if m.focus == teacherFocusQuestions && len(m.questions) > 0 {
				cmds = append(cmds, m.deleteQuestion())
			}

		case "e", "enter", " ":
			// Toggle expand/collapse for selected question
			if m.focus == teacherFocusQuestions && len(m.questions) > 0 {
				questionID := m.questions[m.selectedQIndex].ID
				m.expandedQs[questionID] = !m.expandedQs[questionID]
			}

		case "up", "k":
			if m.focus == teacherFocusQuestions && m.selectedQIndex > 0 {
				m.selectedQIndex--
			}

		case "down", "j":
			if m.focus == teacherFocusQuestions && m.selectedQIndex < len(m.questions)-1 {
				m.selectedQIndex++
			}
		}

	case wsMessage:
		// Parse teacher update
		var update TeacherUpdate
		err := json.Unmarshal(msg, &update)
		if err != nil {
			m.err = err
			m.statusMsg = fmt.Sprintf("Failed to parse message: %v", err)
		} else if update.Type == "update" && len(update.Data) == 2 {
			// Data[0] is feedback array, Data[1] is questions array
			m.feedback = []Response{}
			m.questions = []Question{}

			// Parse feedback
			if feedbackData, ok := update.Data[0].([]any); ok {
				for _, item := range feedbackData {
					if itemMap, ok := item.(map[string]any); ok {
						resp := Response{}
						if student, ok := itemMap["student"].(string); ok {
							resp.Student = student
						}
						if feedback, ok := itemMap["feedback"].(string); ok {
							resp.Feedback = feedback
						}
						m.feedback = append(m.feedback, resp)
					}
				}
			}

			// Parse questions
			if questionsData, ok := update.Data[1].([]any); ok {
				for _, item := range questionsData {
					if itemMap, ok := item.(map[string]any); ok {
						q := Question{}
						if id, ok := itemMap["id"].(string); ok {
							q.ID = id
						}
						if student, ok := itemMap["student"].(string); ok {
							q.Student = student
						}
						if question, ok := itemMap["question"].(string); ok {
							q.Question = question
						}
						if timestamp, ok := itemMap["timestamp"].(string); ok {
							q.Timestamp = timestamp
						}
						m.questions = append(m.questions, q)

						// Check if question timestamp is before or after startup time
						m.checkTimes(q)
					}
				}
			}

			// Adjust selected index if needed
			if m.selectedQIndex >= len(m.questions) && len(m.questions) > 0 {
				m.selectedQIndex = len(m.questions) - 1
			}

			m.lastUpdate = time.Now()
			m.statusMsg = fmt.Sprintf("Updated at %s", m.lastUpdate.Format("15:04:05"))
		}

		cmds = append(cmds, waitForWSMessage(m.ws))

	case wsError:
		m.err = msg
		m.statusMsg = fmt.Sprintf("Connection error: %v", msg)
		cmds = append(cmds, waitForWSMessage(m.ws))

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	}

	return m, tea.Batch(cmds...)
}

func (m teacherModel) clearFeedback() tea.Cmd {
	return func() tea.Msg {
		msg := Message{
			Type:     "delete",
			Resource: "feedback",
			ID:       nil,
			Data:     nil,
		}

		err := m.ws.SendMessage(msg)
		if err != nil {
			return wsError(err)
		}
		return nil
	}
}

func (m teacherModel) deleteQuestion() tea.Cmd {
	if m.selectedQIndex < 0 || m.selectedQIndex >= len(m.questions) {
		return nil
	}

	questionID := m.questions[m.selectedQIndex].ID
	return func() tea.Msg {
		msg := Message{
			Type:     "delete",
			Resource: "question",
			ID:       questionID,
			Data:     nil,
		}

		err := m.ws.SendMessage(msg)
		if err != nil {
			return wsError(err)
		}
		return nil
	}
}

func (m teacherModel) View() string {
	// Main window style
	mainWindow := lipgloss.NewStyle().
		Border(lipgloss.DoubleBorder()).
		BorderForeground(lipgloss.Color(m.theme.BorderColor)).
		Padding(1, 2)

	// Build content
	var content strings.Builder

	// Header
	content.WriteString(m.renderHeader())
	content.WriteString("\n\n")

	// Split view: Feedback on left, Questions on right
	feedbackView := m.renderFeedbackPanel()
	questionsView := m.renderQuestionsPanel()

	panels := lipgloss.JoinHorizontal(lipgloss.Top, feedbackView, "  ", questionsView)
	content.WriteString(panels)

	// Footer with status and help
	content.WriteString("\n")
	content.WriteString(m.renderFooter())

	return mainWindow.Render(content.String())
}

func (m teacherModel) renderHeader() string {
	// Title with box drawing
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color(m.theme.TitleColor))

	title := titleStyle.Render("┃ 🍖 WEB-BBQ TEACHER DASHBOARD ┃")

	// Connection status
	var connStatus string
	if m.ws.IsConnected() {
		connStatus = lipgloss.NewStyle().
			Foreground(lipgloss.Color(m.theme.ConnectedColor)).
			Render("● Live")
	} else {
		connStatus = lipgloss.NewStyle().
			Foreground(lipgloss.Color(m.theme.DisconnectedColor)).
			Render("● Offline")
	}

	// Stats
	feedbackCount := lipgloss.NewStyle().
		Foreground(lipgloss.Color(m.theme.TitleColor)).
		Render(fmt.Sprintf("│ Feedback: %d", len(m.feedback)))

	questionCount := lipgloss.NewStyle().
		Foreground(lipgloss.Color(m.theme.TitleColor)).
		Render(fmt.Sprintf("│ Questions: %d", len(m.questions)))

	header := title + "  " + connStatus + "  " + feedbackCount + "  " + questionCount

	// Separator line
	separator := lipgloss.NewStyle().
		Foreground(lipgloss.Color(m.theme.BorderColor)).
		Render(strings.Repeat("─", m.width-8))

	return header + "\n" + separator
}

func (m teacherModel) renderFooter() string {
	var statusText string
	if m.statusMsg != "" {
		statusStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color(m.theme.ConnectedColor)).
			Bold(true)
		statusText = statusStyle.Render("► " + m.statusMsg)
	}

	helpStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color(m.theme.HelpTextColor)).
		Italic(true)

	helpText := "TAB: Switch Panel  │  C: Clear Feedback  │  D: Delete Question  │  E/ENTER/SPACE: Expand/Collapse  │  ↑↓/J/K: Navigate  │  Q/ESC: Quit"

	separator := lipgloss.NewStyle().
		Foreground(lipgloss.Color(m.theme.BorderColor)).
		Render(strings.Repeat("─", m.width-8))

	footer := separator + "\n"
	if statusText != "" {
		footer += statusText + "\n"
	}
	footer += helpStyle.Render(helpText)

	return footer
}

func (m teacherModel) renderFeedbackPanel() string {
	// Panel container
	panelBorder := lipgloss.NormalBorder()
	if m.focus == teacherFocusFeedback {
		panelBorder = lipgloss.ThickBorder()
	}

	// Calculate available width for each panel
	panelWidth := (m.width - 16) / 2
	if panelWidth < 30 {
		panelWidth = 30
	}

	panelStyle := lipgloss.NewStyle().
		Border(panelBorder).
		BorderForeground(lipgloss.Color(m.theme.BorderColor)).
		Padding(1, 2).
		Width(panelWidth)

	if m.focus == teacherFocusFeedback {
		panelStyle = panelStyle.BorderForeground(lipgloss.Color(m.theme.ActiveBorderColor))
	}

	var content strings.Builder

	// Panel title
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color(m.theme.TitleColor))
	content.WriteString(titleStyle.Render(fmt.Sprintf("── Student Feedback (%d) ──", len(m.feedback))))
	content.WriteString("\n\n")

	// Feedback list
	if len(m.feedback) == 0 {
		emptyStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color(m.theme.HelpTextColor)).
			Italic(true)
		content.WriteString(emptyStyle.Render("No feedback yet...\nWaiting for students to respond"))
	} else {
		// Group feedback by type
		feedbackGroups := make(map[string][]string)
		for _, resp := range m.feedback {
			feedbackGroups[resp.Feedback] = append(feedbackGroups[resp.Feedback], resp.Student)
		}

		// Display each feedback type
		feedbackTypes := []struct {
			text  string
			icon  string
			color string
		}{
			{FeedbackOnTrack, "▶", m.theme.OnTrackColor},
			{FeedbackSlowDown, "⏸", m.theme.SlowDownColor},
			{FeedbackLost, "⏹", m.theme.LostColor},
			{FeedbackGoFaster, "⏩", m.theme.GoFasterColor},
		}

		for _, ft := range feedbackTypes {
			if students, ok := feedbackGroups[ft.text]; ok && len(students) > 0 {
				// Feedback type header
				headerStyle := lipgloss.NewStyle().
					Bold(true).
					Foreground(lipgloss.Color(ft.color))
				content.WriteString(headerStyle.Render(fmt.Sprintf("%s %s (%d)", ft.icon, ft.text, len(students))))
				content.WriteString("\n")

				// Student names
				for _, student := range students {
					studentStyle := lipgloss.NewStyle().
						Foreground(lipgloss.Color("#AAA"))
					content.WriteString(studentStyle.Render("  └─ " + student))
					content.WriteString("\n")
				}
				content.WriteString("\n")
			}
		}
	}

	// Action hint
	if m.focus == teacherFocusFeedback && len(m.feedback) > 0 {
		content.WriteString("\n")
		hintStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color(m.theme.DisconnectedColor)).
			Italic(true)
		content.WriteString(hintStyle.Render("→ Press C to clear all feedback"))
	}

	return panelStyle.Render(content.String())
}

func (m teacherModel) renderQuestionsPanel() string {
	// Panel container
	panelBorder := lipgloss.NormalBorder()
	if m.focus == teacherFocusQuestions {
		panelBorder = lipgloss.ThickBorder()
	}

	// Calculate available width for each panel
	panelWidth := (m.width - 16) / 2
	if panelWidth < 30 {
		panelWidth = 30
	}

	panelStyle := lipgloss.NewStyle().
		Border(panelBorder).
		BorderForeground(lipgloss.Color(m.theme.BorderColor)).
		Padding(1, 2).
		Width(panelWidth)

	if m.focus == teacherFocusQuestions {
		panelStyle = panelStyle.BorderForeground(lipgloss.Color(m.theme.ActiveBorderColor))
	}

	var content strings.Builder

	// Panel title
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color(m.theme.TitleColor))
	content.WriteString(titleStyle.Render(fmt.Sprintf("── Question Queue (%d) ──", len(m.questions))))
	content.WriteString("\n\n")

	// Questions list
	if len(m.questions) == 0 {
		emptyStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color(m.theme.HelpTextColor)).
			Italic(true)
		content.WriteString(emptyStyle.Render("No questions yet...\nWaiting for students to ask"))
	} else {
		for i, q := range m.questions {
			// Format timestamp
			timestamp := q.Timestamp
			if t, err := time.Parse(time.RFC3339, q.Timestamp); err == nil {
				timestamp = t.Format("15:04:05")
			}

			// Check if this question is selected
			isSelected := i == m.selectedQIndex && m.focus == teacherFocusQuestions

			// Question header
			var questionLine strings.Builder

			// Selection indicator
			if isSelected {
				questionLine.WriteString(lipgloss.NewStyle().
					Foreground(lipgloss.Color(m.theme.ActiveBorderColor)).
					Bold(true).
					Render("► "))
			} else {
				questionLine.WriteString("  ")
			}

			// Time
			timeStyle := lipgloss.NewStyle().
				Foreground(lipgloss.Color(m.theme.TimestampColor))
			questionLine.WriteString(timeStyle.Render(fmt.Sprintf("[%s]", timestamp)))
			questionLine.WriteString(" ")

			// Student name
			nameStyle := lipgloss.NewStyle().
				Foreground(lipgloss.Color(m.theme.ConnectedColor)).
				Bold(true)
			if isSelected {
				nameStyle = nameStyle.Underline(true)
			}
			questionLine.WriteString(nameStyle.Render(q.Student))

			content.WriteString(questionLine.String())
			content.WriteString("\n")

			// Question text (indented)
			questionStyle := lipgloss.NewStyle().
				Foreground(lipgloss.Color("#FFF"))
			if !isSelected {
				questionStyle = questionStyle.Foreground(lipgloss.Color("#AAA"))
			}

			// Wrap and indent question text
			questionLines := strings.Split(q.Question, "\n")
			isExpanded := m.expandedQs[q.ID]
			linesToShow := questionLines
			hasMore := false

			// Show only first 5 lines if not expanded and has more than 5 lines
			if !isExpanded && len(questionLines) > 5 {
				linesToShow = questionLines[:5]
				hasMore = true
			}

			for _, line := range linesToShow {
				content.WriteString(questionStyle.Render("    " + line))
				content.WriteString("\n")
			}

			// Show "more lines" indicator
			if hasMore {
				moreStyle := lipgloss.NewStyle().
					Foreground(lipgloss.Color(m.theme.TitleColor)).
					Italic(true)
				remainingLines := len(questionLines) - 5
				if isSelected {
					content.WriteString(moreStyle.Render(fmt.Sprintf("    ... (%d more lines, press E/ENTER/SPACE to expand)", remainingLines)))
				} else {
					content.WriteString(moreStyle.Render(fmt.Sprintf("    ... (%d more lines)", remainingLines)))
				}
				content.WriteString("\n")
			} else if isExpanded && len(questionLines) > 5 {
				// Show collapse hint if expanded
				collapseStyle := lipgloss.NewStyle().
					Foreground(lipgloss.Color(m.theme.TitleColor)).
					Italic(true)
				content.WriteString(collapseStyle.Render("    → Press E/ENTER/SPACE to collapse"))
				content.WriteString("\n")
			}

			// Show delete hint for selected question
			if isSelected {
				deleteStyle := lipgloss.NewStyle().
					Foreground(lipgloss.Color(m.theme.DisconnectedColor)).
					Italic(true)
				content.WriteString(deleteStyle.Render("    → Press D to delete"))
				content.WriteString("\n")
			}

			content.WriteString("\n")
		}

		// Navigation hint
		if m.focus == teacherFocusQuestions && len(m.questions) > 1 {
			navStyle := lipgloss.NewStyle().
				Foreground(lipgloss.Color(m.theme.HelpTextColor)).
				Italic(true)
			content.WriteString(navStyle.Render("↑↓ or J/K to navigate"))
		}
	}

	return panelStyle.Render(content.String())
}

func notify() {
	beeep.AppName = "WEB-BBQ"
	_ = beeep.Notify("New Question", "There is a new question in queue", "./bbq.svg")
}

func (m *teacherModel) checkTimes(q Question) {
	timestamp, _ := time.Parse(time.RFC3339, q.Timestamp)
	if timestamp.After(m.lastSeen) {
		m.lastSeen = timestamp
		notify()
	}
}
