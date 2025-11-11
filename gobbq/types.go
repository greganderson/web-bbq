package main

// Message represents the base websocket message structure
type Message struct {
	Type     string      `json:"type"`
	Resource string      `json:"resource,omitempty"`
	ID       interface{} `json:"id"`
	Data     interface{} `json:"data"`
}

// FeedbackData represents student feedback data
type FeedbackData struct {
	Student  string `json:"student"`
	Feedback string `json:"feedback"`
}

// QuestionData represents student question data
type QuestionData struct {
	Student  string `json:"student"`
	Question string `json:"question"`
}

// Question represents a question in the teacher's queue
type Question struct {
	ID        string `json:"id"`
	Student   string `json:"student"`
	Question  string `json:"question"`
	Client    string `json:"client,omitempty"`
	Timestamp string `json:"timestamp"`
}

// Response represents student feedback in the teacher's view
type Response struct {
	Student  string `json:"student"`
	Feedback string `json:"feedback"`
}

// TeacherUpdate represents the data structure sent to teachers
type TeacherUpdate struct {
	Type     string        `json:"type"`
	Resource interface{}   `json:"resource"`
	ID       interface{}   `json:"id"`
	Data     []interface{} `json:"data"`
}

// Feedback options
const (
	FeedbackOnTrack    = "I'm on track"
	FeedbackSlowDown   = "Please slow down"
	FeedbackLost       = "I'm lost"
	FeedbackGoFaster   = "Please go faster"
)
