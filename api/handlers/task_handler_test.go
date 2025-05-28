package handlers

import (
	"bytes"
	"database/sql"
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
	"github.com/k-satosi/todo-app-webui/api/models"
	"github.com/stretchr/testify/assert"
	"github.com/stretchr/testify/mock"
)

type DBInterface interface {
	Exec(query string, args ...interface{}) (sql.Result, error)
	Query(query string, args ...interface{}) (*sql.Rows, error)
	QueryRow(query string, args ...interface{}) *sql.Row
	Close() error
	Ping() error
}

type MockDB struct {
	mock.Mock
}

func (m *MockDB) Exec(query string, args ...interface{}) (sql.Result, error) {
	args = append([]interface{}{query}, args...)
	called := m.Called(args...)
	return called.Get(0).(sql.Result), called.Error(1)
}

func (m *MockDB) Query(query string, args ...interface{}) (*sql.Rows, error) {
	args = append([]interface{}{query}, args...)
	called := m.Called(args...)
	return called.Get(0).(*sql.Rows), called.Error(1)
}

func (m *MockDB) QueryRow(query string, args ...interface{}) *sql.Row {
	args = append([]interface{}{query}, args...)
	called := m.Called(args...)
	return called.Get(0).(*sql.Row)
}

func (m *MockDB) Close() error {
	called := m.Called()
	return called.Error(0)
}

func (m *MockDB) Ping() error {
	called := m.Called()
	return called.Error(0)
}

type MockResult struct {
	AffectedRows int64
	InsertID     int64
}

func (m MockResult) LastInsertId() (int64, error) {
	return m.InsertID, nil
}

func (m MockResult) RowsAffected() (int64, error) {
	return m.AffectedRows, nil
}

type MockRows struct {
	mock.Mock
	Rows [][]interface{}
	Pos  int
}

func (m *MockRows) Next() bool {
	return m.Pos < len(m.Rows)
}

func (m *MockRows) Scan(dest ...interface{}) error {
	for i, d := range dest {
		switch v := d.(type) {
		case *string:
			*v = m.Rows[m.Pos][i].(string)
		case *time.Time:
			*v = m.Rows[m.Pos][i].(time.Time)
		case *bool:
			*v = m.Rows[m.Pos][i].(bool)
		}
	}
	m.Pos++
	return nil
}

func (m *MockRows) Close() error {
	return nil
}

func (m *MockRows) Err() error {
	return nil
}

func (m *MockRows) Columns() ([]string, error) {
	return []string{"id", "title", "due_date", "completed", "created_at", "updated_at"}, nil
}

func TestGetTasks(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.Default()
	
	mockDB := new(MockDB)
	
	now := time.Now()
	mockRows := &MockRows{
		Rows: [][]interface{}{
			{"1", "Task 1", now, false, now, now},
			{"2", "Task 2", now.Add(24 * time.Hour), true, now, now},
		},
	}
	
	mockDB.On("Query", mock.Anything).Return(mockRows, nil)
	
	handler := &TaskHandler{DB: mockDB}
	
	r.GET("/tasks", handler.GetTasks)
	
	req, _ := http.NewRequest("GET", "/tasks", nil)
	w := httptest.NewRecorder()
	
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var tasks []models.Task
	err := json.Unmarshal(w.Body.Bytes(), &tasks)
	assert.NoError(t, err)
	assert.Len(t, tasks, 2)
	assert.Equal(t, "Task 1", tasks[0].Title)
	assert.Equal(t, "Task 2", tasks[1].Title)
	
	mockDB.AssertExpectations(t)
}

func TestGetTask(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.Default()
	
	mockDB := new(MockDB)
	
	now := time.Now()
	mockRow := &sql.Row{}
	
	mockDB.On("QueryRow", mock.Anything, mock.Anything).Return(mockRow)
	
	handler := &TaskHandler{DB: mockDB}
	
	r.GET("/tasks/:id", handler.GetTask)
	
	req, _ := http.NewRequest("GET", "/tasks/123", nil)
	w := httptest.NewRecorder()
	
	r.ServeHTTP(w, req)
	
	mockDB.AssertExpectations(t)
}

func TestCreateTask(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.Default()
	
	mockDB := new(MockDB)
	
	mockResult := MockResult{AffectedRows: 1, InsertID: 1}
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(mockResult, nil)
	
	handler := &TaskHandler{DB: mockDB}
	
	r.POST("/tasks", handler.CreateTask)
	
	task := models.TaskRequest{
		Title:     "Test Task",
		DueDate:   time.Now().Add(24 * time.Hour),
		Completed: false,
	}
	
	taskJSON, _ := json.Marshal(task)
	req, _ := http.NewRequest("POST", "/tasks", bytes.NewBuffer(taskJSON))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusCreated, w.Code)
	
	var createdTask models.Task
	err := json.Unmarshal(w.Body.Bytes(), &createdTask)
	assert.NoError(t, err)
	assert.Equal(t, task.Title, createdTask.Title)
	assert.Equal(t, task.Completed, createdTask.Completed)
	
	mockDB.AssertExpectations(t)
}

func TestUpdateTask(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.Default()
	
	mockDB := new(MockDB)
	
	mockResult := MockResult{AffectedRows: 1, InsertID: 0}
	mockDB.On("Exec", mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything, mock.Anything).Return(mockResult, nil)
	
	handler := &TaskHandler{DB: mockDB}
	
	r.PUT("/tasks/:id", handler.UpdateTask)
	
	task := models.TaskRequest{
		Title:     "Updated Task",
		DueDate:   time.Now().Add(24 * time.Hour),
		Completed: true,
	}
	
	taskJSON, _ := json.Marshal(task)
	req, _ := http.NewRequest("PUT", "/tasks/123", bytes.NewBuffer(taskJSON))
	req.Header.Set("Content-Type", "application/json")
	w := httptest.NewRecorder()
	
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var updatedTask models.Task
	err := json.Unmarshal(w.Body.Bytes(), &updatedTask)
	assert.NoError(t, err)
	assert.Equal(t, task.Title, updatedTask.Title)
	assert.Equal(t, task.Completed, updatedTask.Completed)
	assert.Equal(t, "123", updatedTask.ID)
	
	mockDB.AssertExpectations(t)
}

func TestDeleteTask(t *testing.T) {
	gin.SetMode(gin.TestMode)
	
	r := gin.Default()
	
	mockDB := new(MockDB)
	
	mockResult := MockResult{AffectedRows: 1, InsertID: 0}
	mockDB.On("Exec", mock.Anything, mock.Anything).Return(mockResult, nil)
	
	handler := &TaskHandler{DB: mockDB}
	
	r.DELETE("/tasks/:id", handler.DeleteTask)
	
	req, _ := http.NewRequest("DELETE", "/tasks/123", nil)
	w := httptest.NewRecorder()
	
	r.ServeHTTP(w, req)
	
	assert.Equal(t, http.StatusOK, w.Code)
	
	var response map[string]string
	err := json.Unmarshal(w.Body.Bytes(), &response)
	assert.NoError(t, err)
	assert.Equal(t, "Task deleted successfully", response["message"])
	
	mockDB.AssertExpectations(t)
}
