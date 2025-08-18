# Build stage
FROM node:20-alpine as build

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci

# Copy source code
COPY . .

# Build the application
RUN npm run build

# Production stage
FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install production dependencies only
RUN npm ci --only=production

# DON'T create data directory here - let Coolify handle it
# RUN mkdir -p /app/data && chown -R node:node /app

# Copy built files from build stage
COPY --from=build /app/dist ./dist

# Set user
USER node

# Expose port 3000
EXPOSE 3000

# Start the application
CMD ["npm", "run", "start:prod"]