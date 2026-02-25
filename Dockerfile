# --- Build stage ---
FROM node:20-alpine AS builder

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci --omit=dev

# --- Production stage ---
FROM node:20-alpine

# su-exec is needed to drop privileges in entrypoint
RUN apk add --no-cache su-exec

# Create non-root user
RUN addgroup -S appgroup && adduser -S appuser -G appgroup

WORKDIR /app

# Copy production dependencies from builder
COPY --from=builder /app/node_modules ./node_modules

# Copy application code
COPY package.json ./
COPY server.js ./
COPY public/ ./public/

# Copy entrypoint script
COPY docker-entrypoint.sh /usr/local/bin/
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

# Create uploads directory (will be overwritten by Fly volume mount)
RUN mkdir -p /app/uploads && chown -R appuser:appgroup /app/uploads

EXPOSE 3000

# Entrypoint fixes volume permissions then drops to appuser
ENTRYPOINT ["docker-entrypoint.sh"]
CMD ["npm", "start"]
