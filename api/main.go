package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"github.com/k-satosi/todo-app-webui/api/database"
	"github.com/k-satosi/todo-app-webui/api/handlers"
)

func main() {
	gin.SetMode(gin.ReleaseMode)
	if os.Getenv("GIN_MODE") == "debug" {
		gin.SetMode(gin.DebugMode)
	}

	db, err := database.InitDB()
	if err != nil {
		log.Fatalf("Failed to connect to database: %v", err)
	}
	defer db.Close()

	r := gin.Default()

	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://frontend:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "DELETE"},
		AllowHeaders:     []string{"Origin", "Content-Type"},
		ExposeHeaders:    []string{"Content-Length"},
		AllowCredentials: true,
	}))

	taskHandler := handlers.NewTaskHandler(db)
	
	v1 := r.Group("/api/v1")
	{
		tasks := v1.Group("/tasks")
		{
			tasks.GET("", taskHandler.GetTasks)
			tasks.POST("", taskHandler.CreateTask)
			tasks.GET("/:id", taskHandler.GetTask)
			tasks.PUT("/:id", taskHandler.UpdateTask)
			tasks.DELETE("/:id", taskHandler.DeleteTask)
		}
	}

	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}
	
	log.Printf("Server starting on port %s", port)
	if err := r.Run(":" + port); err != nil {
		log.Fatalf("Failed to start server: %v", err)
	}
}
