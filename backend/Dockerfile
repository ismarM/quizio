# Build stage
FROM golang:1.26-alpine AS builder
WORKDIR /app
RUN apk add --no-cache git
COPY go.mod go.sum ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server
RUN go run cmd/generate_cert/main.go

# Runner stage
FROM alpine:3.19
WORKDIR /app
# za healthcheck
RUN apk add --no-cache ca-certificates wget
COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/certs ./certs
EXPOSE 8080
CMD ["sh", "-c", "./server migrate && ./server"]