package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"

	"github.com/charmbracelet/bubbles/textarea"
	"github.com/charmbracelet/bubbles/textinput"
	tea "github.com/charmbracelet/bubbletea"
	"github.com/charmbracelet/lipgloss"
	"gopkg.in/yaml.v3"
)

type focusArea int

const (
	focusName focusArea = iota
	focusFeedback
	focusQuestion
	activeColor = "#FF6B6B"
	borderColor = "#4ECDC4"
)

type studentModel struct {
	ws               *WSClient
	nameInput        textinput.Model
	questionInput    textarea.Model
	studentName      string
	selectedFeedback int
	focus            focusArea
	width            int
	height           int
	err              error
	statusMsg        string
}

type wsMessage []byte
type wsError error
type questionSentMsg struct{}

type StudentConfig struct {
	Name string `yaml:"name"`
}

func readStudentConfig() (string, error) {
	homeDir, err := os.UserHomeDir()
	if err != nil {
		return "", err
	}

	configPath := filepath.Join(homeDir, ".config", "gobbq", "config.yaml")
	data, err := os.ReadFile(configPath)
	if err != nil {
		return "", nil
	}

	var config StudentConfig
	err = yaml.Unmarshal(data, &config)
	if err != nil {
		return "", fmt.Errorf("failed to parse config file: %w", err)
	}

	return config.Name, nil
}

func newStudentModel(ws *WSClient) studentModel {
	ti := textinput.New()
	ti.Placeholder = "Enter your name"
	ti.Focus()
	ti.CharLimit = 50
	ti.Width = 40

	ta := textarea.New()
	ta.Placeholder = "Type your question here..."
	ta.CharLimit = 500
	ta.SetWidth(60)
	ta.SetHeight(5)

	configName, err := readStudentConfig()
	var studentName string
	var focus focusArea
	var statusMsg string

	if err != nil {
		statusMsg = fmt.Sprintf("Warning: %v", err)
		focus = focusName
	} else if configName != "" {
		studentName = configName
		focus = focusFeedback
		statusMsg = fmt.Sprintf("Welcome back, %s! (from config)", configName)
	} else {
		focus = focusName
	}

	return studentModel{
		ws:            ws,
		nameInput:     ti,
		questionInput: ta,
		studentName:   studentName,
		focus:         focus,
		width:         80,
		height:        24,
		statusMsg:     statusMsg,
	}
}

func (m studentModel) Init() tea.Cmd {
	return tea.Batch(
		textinput.Blink,
		waitForWSMessage(m.ws),
	)
}

func waitForWSMessage(ws *WSClient) tea.Cmd {
	return func() tea.Msg {
		select {
		case msg := <-ws.msgChan:
			return wsMessage(msg)
		case err := <-ws.errChan:
			return wsError(err)
		}
	}
}

func (m studentModel) Update(msg tea.Msg) (tea.Model, tea.Cmd) {
	var cmd tea.Cmd
	var cmds []tea.Cmd

	updateQuestionInput := true

	switch msg := msg.(type) {
	case tea.KeyMsg:
		switch msg.String() {
		case "ctrl+c", "esc":
			return m, tea.Quit

		case "ctrl+s":
			// Ctrl+S sends the message because ctl+enter was being weird
			if m.focus == focusQuestion && m.questionInput.Value() != "" && m.studentName != "" {
				cmds = append(cmds, m.sendQuestion())
				updateQuestionInput = false
			}

		case "tab":
			if m.studentName == "" {
				m.focus = focusName
			} else {
				switch m.focus {
				case focusName:
					m.focus = focusFeedback
				case focusFeedback:
					m.focus = focusQuestion
					m.questionInput.Focus()
				case focusQuestion:
					m.focus = focusFeedback
					m.questionInput.Blur()
				}
			}

		case "enter":
			if m.focus == focusName && m.nameInput.Value() != "" {
				m.studentName = m.nameInput.Value()
				m.focus = focusFeedback
				m.statusMsg = fmt.Sprintf("Welcome, %s!", m.studentName)
			}

		case "1", "2", "3", "4":
			if m.focus == focusFeedback && m.studentName != "" {
				m.selectedFeedback = int(msg.String()[0] - '0')
				cmds = append(cmds, m.sendFeedback())
			}
		}

	case questionSentMsg:
		m.questionInput.SetValue("")
		m.statusMsg = "✓ Question sent!"

	case wsMessage:
		m.statusMsg = "Message received"
		cmds = append(cmds, waitForWSMessage(m.ws))

	case wsError:
		m.err = msg
		m.statusMsg = fmt.Sprintf("Connection error: %v", msg)
		cmds = append(cmds, waitForWSMessage(m.ws))

	case tea.WindowSizeMsg:
		m.width = msg.Width
		m.height = msg.Height
	}

	switch m.focus {
	case focusName:
		m.nameInput, cmd = m.nameInput.Update(msg)
		cmds = append(cmds, cmd)
	case focusQuestion:
		if updateQuestionInput {
			m.questionInput, cmd = m.questionInput.Update(msg)
			cmds = append(cmds, cmd)
		}
	}

	return m, tea.Batch(cmds...)
}

func (m studentModel) sendFeedback() tea.Cmd {
	return func() tea.Msg {
		var feedback string
		switch m.selectedFeedback {
		case 1:
			feedback = FeedbackOnTrack
		case 2:
			feedback = FeedbackSlowDown
		case 3:
			feedback = FeedbackLost
		case 4:
			feedback = FeedbackGoFaster
		}

		msg := Message{
			Type:     "new",
			Resource: "feedback",
			ID:       nil,
			Data: FeedbackData{
				Student:  m.studentName,
				Feedback: feedback,
			},
		}

		err := m.ws.SendMessage(msg)
		if err != nil {
			return wsError(err)
		}
		return nil
	}
}

func (m studentModel) sendQuestion() tea.Cmd {
	question := m.questionInput.Value()
	return func() tea.Msg {
		msg := Message{
			Type:     "new",
			Resource: "question",
			ID:       nil,
			Data: QuestionData{
				Student:  m.studentName,
				Question: question,
			},
		}

		err := m.ws.SendMessage(msg)
		if err != nil {
			return wsError(err)
		}

		return questionSentMsg{}
	}
}

func (m studentModel) View() string {
	mainWindow := lipgloss.NewStyle().
		Border(lipgloss.DoubleBorder()).
		BorderForeground(lipgloss.Color(borderColor)).
		Padding(1, 2)

	var content strings.Builder

	content.WriteString(m.renderHeader())
	content.WriteString("\n\n")

	if m.studentName == "" {
		content.WriteString(m.renderNamePanel())
	} else {
		content.WriteString(m.renderFeedbackPanel())
		content.WriteString("\n\n")
		content.WriteString(m.renderQuestionPanel())
	}

	content.WriteString("\n")
	content.WriteString(m.renderFooter())

	return mainWindow.Render(content.String())
}

func (m studentModel) renderHeader() string {
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color(borderColor))

	title := titleStyle.Render("┃ 🍖 WEB-BBQ STUDENT ┃")

	var connStatus string
	if m.ws.IsConnected() {
		connStatus = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#4ECDC4")).
			Render("● Connected")
	} else {
		connStatus = lipgloss.NewStyle().
			Foreground(lipgloss.Color(borderColor)).
			Render("● Disconnected")
	}

	// Student name (if logged in)
	var nameInfo string
	if m.studentName != "" {
		nameInfo = lipgloss.NewStyle().
			Foreground(lipgloss.Color("#FFE66D")).
			Render(" │ Student: " + m.studentName)
	}

	header := title + "  " + connStatus + nameInfo

	// Separator line
	separator := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#666")).
		Render(strings.Repeat("─", m.width-8))

	return header + "\n" + separator
}

func (m studentModel) renderNamePanel() string {
	panelStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("#4ECDC4")).
		Padding(2, 4).
		Width(50).
		Align(lipgloss.Center)

	var content strings.Builder

	labelStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FFE66D")).
		Align(lipgloss.Center)

	content.WriteString(labelStyle.Render("── Enter Your Name ──"))
	content.WriteString("\n\n")
	content.WriteString(m.nameInput.View())
	content.WriteString("\n\n")

	helpStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#95E1D3")).
		Italic(true).
		Align(lipgloss.Center)
	content.WriteString(helpStyle.Render("→ Press ENTER to continue"))

	panel := panelStyle.Render(content.String())

	// Center the panel
	return lipgloss.Place(m.width-8, m.height-12, lipgloss.Center, lipgloss.Center, panel)
}

func (m studentModel) renderFooter() string {
	var statusText string
	if m.statusMsg != "" {
		statusStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#95E1D3")).
			Bold(true)
		statusText = statusStyle.Render("► " + m.statusMsg)
	}

	helpStyle := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#666")).
		Italic(true)

	var helpText string
	if m.studentName == "" {
		helpText = "ESC: Quit"
	} else if m.focus == focusQuestion {
		helpText = "1-4: Send Feedback  │  TAB: Switch Focus  │  CTRL+S: Send  │  ENTER: New Line  │  ESC: Quit"
	} else {
		helpText = "1-4: Send Feedback  │  TAB: Switch Focus  │  ENTER: Submit  │  ESC: Quit"
	}

	separator := lipgloss.NewStyle().
		Foreground(lipgloss.Color("#666")).
		Render(strings.Repeat("─", m.width-8))

	footer := separator + "\n"
	if statusText != "" {
		footer += statusText + "\n"
	}
	footer += helpStyle.Render(helpText)

	return footer
}

func (m studentModel) renderFeedbackPanel() string {
	// Panel container
	panelBorder := lipgloss.NormalBorder()
	if m.focus == focusFeedback {
		panelBorder = lipgloss.ThickBorder()
	}

	panelStyle := lipgloss.NewStyle().
		Border(panelBorder).
		BorderForeground(lipgloss.Color(borderColor)).
		Padding(1, 2)

	if m.focus == focusFeedback {
		panelStyle = panelStyle.BorderForeground(lipgloss.Color(activeColor))
	}

	var content strings.Builder

	// Panel title
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FFE66D"))
	content.WriteString(titleStyle.Render("── Feedback Controls ──"))
	content.WriteString("\n\n")

	// Button definitions
	buttons := []struct {
		num      int
		icon     string
		text     string
		color    string
		feedback string
	}{
		{1, "▶", "I'm On Track", "#4ECDC4", FeedbackOnTrack},
		{2, "⏸", "Please Slow Down", "#FFE66D", FeedbackSlowDown},
		{3, "⏹", "I'm Lost", "#FF6B6B", FeedbackLost},
		{4, "⏩", "Please Go Faster", "#95E1D3", FeedbackGoFaster},
	}

	// Render buttons as list items
	for _, btn := range buttons {
		// Determine if button is selected
		isSelected := m.selectedFeedback == btn.num

		// Build button text
		var buttonLine strings.Builder

		// Number and icon
		numStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color(btn.color)).
			Bold(true)

		if isSelected {
			buttonLine.WriteString(numStyle.Render(fmt.Sprintf(" [%d] %s ", btn.num, btn.icon)))
		} else {
			buttonLine.WriteString(numStyle.Render(fmt.Sprintf("  %d  %s ", btn.num, btn.icon)))
		}

		// Button text
		textStyle := lipgloss.NewStyle().Foreground(lipgloss.Color("#FFF"))
		if m.focus == focusFeedback && m.selectedFeedback != 0 && !isSelected {
			textStyle = textStyle.Faint(true)
		}
		if isSelected {
			textStyle = textStyle.Bold(true).Underline(true)
		}
		buttonLine.WriteString(textStyle.Render(btn.text))

		// Add selection indicator
		if isSelected {
			buttonLine.WriteString(lipgloss.NewStyle().
				Foreground(lipgloss.Color(btn.color)).
				Bold(true).
				Render(" ◄"))
		}

		content.WriteString(buttonLine.String())
		content.WriteString("\n")
	}

	return panelStyle.Render(content.String())
}

func (m studentModel) renderQuestionPanel() string {
	// Panel container
	panelBorder := lipgloss.NormalBorder()
	if m.focus == focusQuestion {
		panelBorder = lipgloss.ThickBorder()
	}

	panelStyle := lipgloss.NewStyle().
		Border(panelBorder).
		BorderForeground(lipgloss.Color(borderColor)).
		Padding(1, 2)

	if m.focus == focusQuestion {
		panelStyle = panelStyle.BorderForeground(lipgloss.Color(activeColor))
	}

	var content strings.Builder

	// Panel title
	titleStyle := lipgloss.NewStyle().
		Bold(true).
		Foreground(lipgloss.Color("#FFE66D"))
	content.WriteString(titleStyle.Render("── Ask a Question ──"))
	content.WriteString("\n\n")

	// Question input box
	inputBoxStyle := lipgloss.NewStyle().
		Border(lipgloss.RoundedBorder()).
		BorderForeground(lipgloss.Color("#666")).
		Padding(1, 2)

	if m.focus == focusQuestion {
		inputBoxStyle = inputBoxStyle.BorderForeground(lipgloss.Color("#FFE66D"))
	}

	content.WriteString(inputBoxStyle.Render(m.questionInput.View()))
	content.WriteString("\n\n")

	// Submit instructions
	if m.focus == focusQuestion {
		hintStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#4ECDC4")).
			Italic(true)
		content.WriteString(hintStyle.Render("→ Press CTRL+S to send  │  ENTER for new line"))
	} else {
		hintStyle := lipgloss.NewStyle().
			Foreground(lipgloss.Color("#666")).
			Italic(true)
		content.WriteString(hintStyle.Render("→ Press TAB to focus this field"))
	}

	return panelStyle.Render(content.String())
}
