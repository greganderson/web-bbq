package main

import (
	"encoding/json"
	"fmt"
	"sync"

	"github.com/gorilla/websocket"
)

// WSClient manages the websocket connection
type WSClient struct {
	conn      *websocket.Conn
	mu        sync.Mutex
	connected bool
	msgChan   chan []byte
	errChan   chan error
}

// NewWSClient creates a new websocket client
func NewWSClient(url string) (*WSClient, error) {
	conn, resp, err := websocket.DefaultDialer.Dial(url, nil)
	if err != nil {
		// Try to get more details from the response
		if resp != nil {
			return nil, fmt.Errorf("failed to connect to websocket: %w (HTTP %d: %s)", err, resp.StatusCode, resp.Status)
		}
		return nil, fmt.Errorf("failed to connect to websocket: %w", err)
	}

	client := &WSClient{
		conn:      conn,
		connected: true,
		msgChan:   make(chan []byte, 100),
		errChan:   make(chan error, 10),
	}

	// Start reading messages in a goroutine
	go client.readMessages()

	return client, nil
}

// readMessages continuously reads from the websocket
func (c *WSClient) readMessages() {
	defer func() {
		c.mu.Lock()
		c.connected = false
		c.mu.Unlock()
	}()

	for {
		_, message, err := c.conn.ReadMessage()
		if err != nil {
			c.errChan <- err
			return
		}
		c.msgChan <- message
	}
}

// SendMessage sends a message through the websocket
func (c *WSClient) SendMessage(msg Message) error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if !c.connected {
		return fmt.Errorf("websocket not connected")
	}

	data, err := json.Marshal(msg)
	if err != nil {
		return fmt.Errorf("failed to marshal message: %w", err)
	}

	err = c.conn.WriteMessage(websocket.TextMessage, data)
	if err != nil {
		c.connected = false
		return fmt.Errorf("failed to send message: %w", err)
	}

	return nil
}

// IsConnected returns the connection status
func (c *WSClient) IsConnected() bool {
	c.mu.Lock()
	defer c.mu.Unlock()
	return c.connected
}

// Close closes the websocket connection
func (c *WSClient) Close() error {
	c.mu.Lock()
	defer c.mu.Unlock()

	if c.conn != nil {
		return c.conn.Close()
	}
	return nil
}
