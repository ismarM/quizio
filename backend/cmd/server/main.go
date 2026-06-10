// @title Quizio API
// @version 0.1.0
// @description REST API for Quizio.
//
// @security XUserEmail && XUserId && XUserIsAdmin
//
// @securityDefinitions.apikey XUserEmail
// @in header
// @name X-User-Email
//
// @securityDefinitions.apikey XUserId
// @in header
// @name X-User-Id
//
// @securityDefinitions.apikey XUserIsAdmin
// @in header
// @name X-User-IsAdmin
// @BasePath /
package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"time"

	"github.com/ismarM/quizio/internal/config"
	"github.com/ismarM/quizio/internal/db"
	"github.com/ismarM/quizio/internal/httpapi"
)

func main() {
	cfg, err := config.Load()
	if err != nil {
		log.Fatal(err)
	}

	ctx := context.Background()
	database, err := db.Open(ctx, cfg.DatabaseURL())
	if err != nil {
		log.Fatal(err)
	}
	defer database.Close()

	if len(os.Args) > 1 && os.Args[1] == "migrate" {
		migrateCtx, cancel := context.WithTimeout(ctx, 30*time.Second)
		defer cancel()

		if err := db.Migrate(migrateCtx, database, "migrations"); err != nil {
			log.Fatal(err)
		}
		log.Println("migrations applied")
		return
	}

	server := &http.Server{
		Addr:         cfg.ServerAddress(),
		Handler:      httpapi.NewRouter(database, cfg.HMACSecret, cfg.EnableSwagger),
		ReadTimeout:  5 * time.Second,
		WriteTimeout: 10 * time.Second,
		IdleTimeout:  60 * time.Second,
	}

	certFile := "certs/cert.pem"
	keyFile := "certs/key.pem"

	_, errCert := os.Stat(certFile)
	_, errKey := os.Stat(keyFile)

	if errCert == nil && errKey == nil {
		log.Printf("listening on %s (HTTPS)", server.Addr)
		if err := server.ListenAndServeTLS(certFile, keyFile); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	} else {
		if errCert != nil {
			log.Printf("Cert file check error: %v", errCert)
		}
		if errKey != nil {
			log.Printf("Key file check error: %v", errKey)
		}
		log.Printf("listening on %s (HTTP)", server.Addr)
		if err := server.ListenAndServe(); err != nil && !errors.Is(err, http.ErrServerClosed) {
			log.Fatal(err)
		}
	}
}
