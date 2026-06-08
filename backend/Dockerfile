# Build stage
FROM golang:1.26-alpine AS builder
WORKDIR /app

# Install git/build-base if needed (usually alpine needs this for some packages)
RUN apk add --no-cache git

# Copy dependencies
COPY go.mod go.sum ./
RUN go mod download

# Copy source code
COPY . .

# Build the binary
RUN CGO_ENABLED=0 GOOS=linux go build -o server ./cmd/server

# Runner stage
FROM alpine:3.19
WORKDIR /app

# Install ca-certificates and wget for healthchecks
RUN apk add --no-cache ca-certificates wget

# Copy the binary and migrations
COPY --from=builder /app/server .
COPY --from=builder /app/migrations ./migrations
COPY --from=builder /app/.env* ./

# Expose port
EXPOSE 8080

# Run migrations and start server
CMD ["sh", "-c", "./server migrate && ./server"]
