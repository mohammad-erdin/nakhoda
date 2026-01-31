FROM node:20-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./

# Install dependencies
RUN npm ci --only=production

# Copy built application
COPY dist/ ./dist/

# Copy environment file (optional, can be overridden)
COPY .env.example .env

# Set default environment variables
ENV NODE_ENV=production

# Run the application
CMD ["node", "dist/index.js"]
