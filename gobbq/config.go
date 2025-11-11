package main

import (
	"fmt"
	"os"
	"path/filepath"
	"strings"
)

const (
	configDir   = ".config/gobbq"
	teacherFile = ".gobbqteacher"
)

// GetConfigDir returns the path to the config directory
func GetConfigDir() (string, error) {
	home, err := os.UserHomeDir()
	if err != nil {
		return "", fmt.Errorf("failed to get home directory: %w", err)
	}
	return filepath.Join(home, configDir), nil
}

// GetTeacherFilePath returns the full path to the teacher marker file
func GetTeacherFilePath() (string, error) {
	configPath, err := GetConfigDir()
	if err != nil {
		return "", err
	}
	return filepath.Join(configPath, teacherFile), nil
}

// GetTeacherPassword reads the password from the .gobbqteacher file
// Returns the password and true if the file exists and contains a password
// Returns empty string and false if the file doesn't exist or is empty
func GetTeacherPassword() (string, bool) {
	teacherPath, err := GetTeacherFilePath()
	if err != nil {
		return "", false
	}

	// Check if file exists
	if _, err := os.Stat(teacherPath); os.IsNotExist(err) {
		return "", false
	}

	// Read the password from the file
	content, err := os.ReadFile(teacherPath)
	if err != nil {
		fmt.Fprintf(os.Stderr, "Warning: Failed to read teacher password file: %v\n", err)
		return "", false
	}

	// Trim whitespace and check if password exists
	password := strings.TrimSpace(string(content))
	if password == "" {
		fmt.Fprintf(os.Stderr, "Warning: Teacher password file is empty\n")
		return "", false
	}

	return password, true
}

// IsTeacherMode checks if the teacher marker file exists and contains a password
func IsTeacherMode() bool {
	_, exists := GetTeacherPassword()
	return exists
}
