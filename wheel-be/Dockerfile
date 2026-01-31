FROM node:20-alpine

WORKDIR /app

# Install build tools required for native modules (bcrypt, pg, etc)
RUN apk add --no-cache python3 make g++ cairo-dev jpeg-dev pango-dev giflib-dev

# Install pnpm
RUN npm install -g pnpm

# Copy package files
COPY wheel-be/package.json ./
COPY shared/package.json ../shared/

# Install dependencies with build scripts enabled
RUN pnpm install --prod=false && npm rebuild bcrypt

# Copy shared types
COPY shared ../shared

# Copy source code
COPY wheel-be/src ./src
COPY wheel-be/tsconfig.json ./

# Expose ports
EXPOSE 3000 8080

# Start development server
CMD ["pnpm", "run", "dev"]# Start development server
CMD ["pnpm", "run", "dev"]
