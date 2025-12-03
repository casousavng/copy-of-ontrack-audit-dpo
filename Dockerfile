# Build stage
FROM node:20-alpine AS builder

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Accept build arg for API URL (empty = use relative URLs)
ARG VITE_API_URL
ENV VITE_API_URL=${VITE_API_URL}

# Build frontend in production mode
RUN npm run build -- --mode production

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# Copy built frontend from builder
COPY --from=builder /app/dist ./dist

# Copy server code
COPY server ./server

# Expose port
EXPOSE 3001

# Set environment to production
ENV NODE_ENV=production

# Start server
CMD ["node", "server/index.js"]
