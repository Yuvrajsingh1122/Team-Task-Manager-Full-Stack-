# Build Stage 1: Frontend
FROM node:20-alpine AS frontend-builder
WORKDIR /app/frontend
COPY frontend/package*.json ./
RUN npm install
COPY frontend/ ./
RUN npm run build

# Build Stage 2: Backend
FROM node:20-alpine
WORKDIR /app

# Install build tools for better-sqlite3 native compilation
RUN apk add --no-cache python3 make g++

COPY backend/package*.json ./backend/
RUN cd backend && npm install --production

COPY backend/ ./backend/
COPY --from=frontend-builder /app/frontend/dist ./frontend/dist

EXPOSE 5000
CMD ["node", "backend/src/index.js"]
