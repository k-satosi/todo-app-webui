package handlers

import (
	"database/sql"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/k-satosi/todo-app-webui/api/models"
)

type TaskHandler struct {
	DB *sql.DB
}

func NewTaskHandler(db *sql.DB) *TaskHandler {
	return &TaskHandler{DB: db}
}

func (h *TaskHandler) GetTasks(c *gin.Context) {
	rows, err := h.DB.Query(`
		SELECT id, title, due_date, completed, created_at, updated_at 
		FROM tasks 
		ORDER BY due_date ASC
	`)
	if err != nil {
		log.Printf("Error querying tasks: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve tasks"})
		return
	}
	defer rows.Close()

	var tasks []models.Task
	for rows.Next() {
		var task models.Task
		var createdAt, updatedAt time.Time
		if err := rows.Scan(&task.ID, &task.Title, &task.DueDate, &task.Completed, &createdAt, &updatedAt); err != nil {
			log.Printf("Error scanning task row: %v", err)
			c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process tasks"})
			return
		}
		task.CreatedAt = createdAt
		task.UpdatedAt = updatedAt
		tasks = append(tasks, task)
	}

	if err := rows.Err(); err != nil {
		log.Printf("Error iterating task rows: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to process tasks"})
		return
	}

	c.JSON(http.StatusOK, tasks)
}

func (h *TaskHandler) GetTask(c *gin.Context) {
	id := c.Param("id")
	
	var task models.Task
	var createdAt, updatedAt time.Time
	
	err := h.DB.QueryRow(`
		SELECT id, title, due_date, completed, created_at, updated_at 
		FROM tasks 
		WHERE id = ?
	`, id).Scan(&task.ID, &task.Title, &task.DueDate, &task.Completed, &createdAt, &updatedAt)
	
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	} else if err != nil {
		log.Printf("Error querying task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to retrieve task"})
		return
	}
	
	task.CreatedAt = createdAt
	task.UpdatedAt = updatedAt
	
	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) CreateTask(c *gin.Context) {
	var req models.TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()
	id := uuid.New().String()

	_, err := h.DB.Exec(`
		INSERT INTO tasks (id, title, due_date, completed, created_at, updated_at) 
		VALUES (?, ?, ?, ?, ?, ?)
	`, id, req.Title, req.DueDate, req.Completed, now, now)
	
	if err != nil {
		log.Printf("Error creating task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to create task"})
		return
	}

	task := models.Task{
		ID:        id,
		Title:     req.Title,
		DueDate:   req.DueDate,
		Completed: req.Completed,
		CreatedAt: now,
		UpdatedAt: now,
	}

	c.JSON(http.StatusCreated, task)
}

func (h *TaskHandler) UpdateTask(c *gin.Context) {
	id := c.Param("id")
	
	var req models.TaskRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
		return
	}

	now := time.Now()

	result, err := h.DB.Exec(`
		UPDATE tasks 
		SET title = ?, due_date = ?, completed = ?, updated_at = ? 
		WHERE id = ?
	`, req.Title, req.DueDate, req.Completed, now, id)
	
	if err != nil {
		log.Printf("Error updating task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to update task"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	task := models.Task{
		ID:        id,
		Title:     req.Title,
		DueDate:   req.DueDate,
		Completed: req.Completed,
		UpdatedAt: now,
	}

	c.JSON(http.StatusOK, task)
}

func (h *TaskHandler) DeleteTask(c *gin.Context) {
	id := c.Param("id")

	result, err := h.DB.Exec("DELETE FROM tasks WHERE id = ?", id)
	if err != nil {
		log.Printf("Error deleting task: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	rowsAffected, err := result.RowsAffected()
	if err != nil {
		log.Printf("Error getting rows affected: %v", err)
		c.JSON(http.StatusInternalServerError, gin.H{"error": "Failed to delete task"})
		return
	}

	if rowsAffected == 0 {
		c.JSON(http.StatusNotFound, gin.H{"error": "Task not found"})
		return
	}

	c.JSON(http.StatusOK, gin.H{"message": "Task deleted successfully"})
}
