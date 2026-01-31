FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY wheel-be/package.json ./
COPY shared/package.json ../shared/

# Install dependencies
RUN pnpm install

# Copy shared types
COPY shared ../shared

# Copy source code
COPY wheel-be/src ./src
COPY wheel-be/tsconfig.json ./

# Expose ports
EXPOSE 3000 8080

# Start development server
CMD ["pnpm", "run", "dev"]
