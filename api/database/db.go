package database

import (
	"database/sql"
	"fmt"
	"os"
	"time"

	_ "github.com/go-sql-driver/mysql"
)

func InitDB() (*sql.DB, error) {
	dbUser := getEnv("DB_USER", "root")
	dbPassword := getEnv("DB_PASSWORD", "password")
	dbHost := getEnv("DB_HOST", "db")
	dbPort := getEnv("DB_PORT", "3306")
	dbName := getEnv("DB_NAME", "todo_app")

	dsn := fmt.Sprintf("%s:%s@tcp(%s:%s)/%s?parseTime=true", 
		dbUser, dbPassword, dbHost, dbPort, dbName)

	db, err := sql.Open("mysql", dsn)
	if err != nil {
		return nil, err
	}

	db.SetMaxOpenConns(25)
	db.SetMaxIdleConns(5)
	db.SetConnMaxLifetime(5 * time.Minute)

	err = db.Ping()
	if err != nil {
		return nil, err
	}

	return db, nil
}

func getEnv(key, defaultValue string) string {
	value := os.Getenv(key)
	if value == "" {
		return defaultValue
	}
	return value
}
