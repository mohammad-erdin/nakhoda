FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY wheel-fe/package.json ./
COPY shared/package.json ../shared/

# Install dependencies
RUN pnpm install

# Copy shared types
COPY shared ../shared

# Copy source and config files
COPY wheel-fe/src ./src
COPY wheel-fe/tsconfig.json ./
COPY wheel-fe/tsconfig.node.json ./
COPY wheel-fe/vite.config.ts ./
COPY wheel-fe/index.html ./

# Expose port
EXPOSE 5173

# Start development server with host binding
CMD ["pnpm", "run", "dev", "--", "--host", "0.0.0.0"]
