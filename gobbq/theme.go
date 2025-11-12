package main

import (
	"fmt"
	"os"
	"path/filepath"

	"gopkg.in/yaml.v3"
)

// Theme contains all customizable colors for the TUI
type Theme struct {
	// Window and border colors
	BorderColor       string `yaml:"border_color"`        // Default border color
	ActiveBorderColor string `yaml:"active_border_color"` // Border color when focused

	// Text colors
	TitleColor     string `yaml:"title_color"`     // Section titles
	HelpTextColor  string `yaml:"help_text_color"` // Muted help/instruction text
	TimestampColor string `yaml:"timestamp_color"` // Question timestamps

	// Status colors
	ConnectedColor    string `yaml:"connected_color"`    // Connected status indicator
	DisconnectedColor string `yaml:"disconnected_color"` // Disconnected/error status

	// Feedback option colors
	OnTrackColor   string `yaml:"on_track_color"`   // "I'm on track" feedback
	SlowDownColor  string `yaml:"slow_down_color"`  // "Please slow down" feedback
	LostColor      string `yaml:"lost_color"`       // "I'm lost" feedback
	GoFasterColor  string `yaml:"go_faster_color"`  // "Please go faster" feedback
}

// DefaultTheme returns the BBQ-themed color palette
func DefaultTheme() Theme {
	return Theme{
		// Window and border colors
		BorderColor:       "#666",
		ActiveBorderColor: "#FFE66D", // Yellow for active window

		// Text colors
		TitleColor:     "#FF6B6B", // Red for titles
		HelpTextColor:  "#666",    // Gray for help text
		TimestampColor: "#666",    // Gray for timestamps

		// Status colors
		ConnectedColor:    "#4ECDC4", // Teal for connected
		DisconnectedColor: "#FF6B6B", // Red for disconnected

		// Feedback option colors
		OnTrackColor:  "#4ECDC4", // Teal
		SlowDownColor: "#FFE66D", // Yellow
		LostColor:     "#FF6B6B", // Red
		GoFasterColor: "#95E1D3", // Mint
	}
}

// LoadTheme loads theme from ~/.config/gobbq/theme.yaml, falling back to defaults
func LoadTheme() Theme {
	theme := DefaultTheme()

	configDir, err := GetConfigDir()
	if err != nil {
		// If we can't get config dir, just return defaults
		return theme
	}

	themeFile := filepath.Join(configDir, "theme.yaml")

	data, err := os.ReadFile(themeFile)
	if err != nil {
		// File doesn't exist or can't be read - return defaults
		return theme
	}

	var customTheme Theme
	if err := yaml.Unmarshal(data, &customTheme); err != nil {
		fmt.Fprintf(os.Stderr, "Warning: Failed to parse theme.yaml, using defaults: %v\n", err)
		return theme
	}

	// Merge custom theme with defaults (only override non-empty values)
	if customTheme.BorderColor != "" {
		theme.BorderColor = customTheme.BorderColor
	}
	if customTheme.ActiveBorderColor != "" {
		theme.ActiveBorderColor = customTheme.ActiveBorderColor
	}
	if customTheme.TitleColor != "" {
		theme.TitleColor = customTheme.TitleColor
	}
	if customTheme.HelpTextColor != "" {
		theme.HelpTextColor = customTheme.HelpTextColor
	}
	if customTheme.TimestampColor != "" {
		theme.TimestampColor = customTheme.TimestampColor
	}
	if customTheme.ConnectedColor != "" {
		theme.ConnectedColor = customTheme.ConnectedColor
	}
	if customTheme.DisconnectedColor != "" {
		theme.DisconnectedColor = customTheme.DisconnectedColor
	}
	if customTheme.OnTrackColor != "" {
		theme.OnTrackColor = customTheme.OnTrackColor
	}
	if customTheme.SlowDownColor != "" {
		theme.SlowDownColor = customTheme.SlowDownColor
	}
	if customTheme.LostColor != "" {
		theme.LostColor = customTheme.LostColor
	}
	if customTheme.GoFasterColor != "" {
		theme.GoFasterColor = customTheme.GoFasterColor
	}

	return theme
}
