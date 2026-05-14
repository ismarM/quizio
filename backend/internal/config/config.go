package config

import (
	"fmt"
	"net/url"
	"os"
	"strconv"
	"strings"

	"github.com/joho/godotenv"
)

type Config struct {
	ServerPort string
	DBHost     string
	DBPort     int
	DBName     string
	DBUser     string
	DBPassword string
	DBSSLMode  string
}

func Load() (Config, error) {
	_ = godotenv.Load()

	serverPort, err := requiredEnv("SERVER_PORT")
	if err != nil {
		return Config{}, err
	}

	dbHost, err := requiredEnv("DB_HOST")
	if err != nil {
		return Config{}, err
	}

	dbPortValue, err := requiredEnv("DB_PORT")
	if err != nil {
		return Config{}, err
	}

	dbPort, err := strconv.Atoi(dbPortValue)
	if err != nil {
		return Config{}, fmt.Errorf("invalid DB_PORT: %w", err)
	}

	dbName, err := requiredEnv("DB_NAME")
	if err != nil {
		return Config{}, err
	}

	dbUser, err := requiredEnv("DB_USER")
	if err != nil {
		return Config{}, err
	}

	dbPassword, err := requiredEnv("DB_PASSWORD")
	if err != nil {
		return Config{}, err
	}

	dbSSLMode, err := requiredEnv("DB_SSLMODE")
	if err != nil {
		return Config{}, err
	}

	return Config{
		ServerPort: serverPort,
		DBHost:     dbHost,
		DBPort:     dbPort,
		DBName:     dbName,
		DBUser:     dbUser,
		DBPassword: dbPassword,
		DBSSLMode:  dbSSLMode,
	}, nil
}

func (c Config) DatabaseURL() string {
	databaseURL := &url.URL{
		Scheme: "postgres",
		User:   url.UserPassword(c.DBUser, c.DBPassword),
		Host:   fmt.Sprintf("%s:%d", c.DBHost, c.DBPort),
		Path:   c.DBName,
	}

	query := databaseURL.Query()
	query.Set("sslmode", c.DBSSLMode)
	databaseURL.RawQuery = query.Encode()

	return databaseURL.String()
}

func (c Config) ServerAddress() string {
	return ":" + c.ServerPort
}

func requiredEnv(key string) (string, error) {
	value := strings.TrimSpace(os.Getenv(key))
	if value == "" {
		return "", fmt.Errorf("missing env %s", key)
	}
	return value, nil
}
