package models

import (
	"time"
)

type Task struct {
	ID        string    `json:"id"`
	Title     string    `json:"title"`
	DueDate   time.Time `json:"dueDate"`
	Completed bool      `json:"completed"`
	CreatedAt time.Time `json:"createdAt,omitempty"`
	UpdatedAt time.Time `json:"updatedAt,omitempty"`
}

type TaskRequest struct {
	Title     string    `json:"title" binding:"required"`
	DueDate   time.Time `json:"dueDate" binding:"required"`
	Completed bool      `json:"completed"`
}
