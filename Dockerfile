# Multi-stage Dockerfile for NeonHub
# Stage 1: Base Node.js dependencies
FROM node:18-alpine AS base
WORKDIR /app
ENV NODE_ENV=production

# Install dependencies needed for native modules
RUN apk add --no-cache python3 make g++ curl

# Stage 2: Builder for backend
FROM base AS backend-builder
WORKDIR /app/backend
COPY backend/package*.json ./
COPY backend/prisma ./prisma/
RUN npm ci
COPY backend/ .
RUN npx prisma generate
RUN npm run build

# Stage 3: Builder for frontend
FROM base AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm ci
COPY frontend/ .
RUN npm run build

# Stage 4: Production runtime
FROM node:18-alpine AS runtime
WORKDIR /app

# Install security updates
RUN apk update && apk upgrade

# Create non-root user
RUN addgroup -g 1001 -S nodejs
RUN adduser -S neonhub -u 1001

# Backend setup
WORKDIR /app/backend
COPY --from=backend-builder --chown=neonhub:nodejs /app/backend/dist ./dist
COPY --from=backend-builder --chown=neonhub:nodejs /app/backend/node_modules ./node_modules
COPY --from=backend-builder --chown=neonhub:nodejs /app/backend/package.json ./package.json
COPY --from=backend-builder --chown=neonhub:nodejs /app/backend/prisma ./prisma

# Frontend setup
WORKDIR /app/frontend
COPY --from=frontend-builder --chown=neonhub:nodejs /app/frontend/.next ./.next
COPY --from=frontend-builder --chown=neonhub:nodejs /app/frontend/node_modules ./node_modules
COPY --from=frontend-builder --chown=neonhub:nodejs /app/frontend/package.json ./package.json
COPY --from=frontend-builder --chown=neonhub:nodejs /app/frontend/public ./public

# Create uploads directory with proper permissions
RUN mkdir -p /app/backend/uploads && chown neonhub:nodejs /app/backend/uploads

# Copy shared scripts and configuration
WORKDIR /app
COPY --chown=neonhub:nodejs package.json ./
COPY --chown=neonhub:nodejs launch.sh ./
RUN chmod +x launch.sh

# Switch to non-root user
USER neonhub

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD curl -f http://localhost:8000/api/health || exit 1

# Expose ports
EXPOSE 3000 8000

# Start the application using the launch script
CMD ["./launch.sh"] 