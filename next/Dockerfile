# Build stage
FROM node:24-alpine AS builder
WORKDIR /app

COPY package*.json ./
RUN npm ci

COPY . .

# Copy .env.local so NEXT_PUBLIC_ vars are available during build
COPY .env.local ./.env.local

ENV NEXT_TELEMETRY_DISABLED=1

RUN npm run build

# Runner stage
FROM node:24-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

COPY --from=builder /app/package*.json ./
RUN npm ci --omit=dev

COPY --from=builder /app/.next ./.next
COPY --from=builder /app/public ./public
COPY --from=builder /app/.env.local ./.env.local

EXPOSE 3000

CMD ["npm", "run", "start"]