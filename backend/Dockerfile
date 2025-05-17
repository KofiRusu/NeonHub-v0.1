FROM node:18-alpine

# Set working directory
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./

# Install dependencies
RUN npm ci

# Copy required files only
COPY tsconfig.json ./
COPY prisma/ ./prisma/
COPY src/ ./src/
COPY controllers/ ./controllers/
COPY services/ ./services/
COPY routes/ ./routes/
COPY utils/ ./utils/
COPY middleware/ ./middleware/
COPY config/ ./config/

# Generate Prisma client
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# Remove development dependencies
RUN npm prune --production

# Expose API port
EXPOSE 3001

# Set production environment
ENV NODE_ENV=production

# Start the application
CMD ["node", "dist/src/server.js"] 