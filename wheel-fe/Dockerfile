FROM node:20-alpine

WORKDIR /app

# Install pnpm
RUN npm install -g pnpm
COPY wheel-fe/package.json ./
RUN pnpm install
COPY shared ../shared
COPY wheel-fe/src ./src
COPY wheel-fe/tsconfig.json ./
COPY wheel-fe/tsconfig.node.json ./
COPY wheel-fe/vite.config.ts ./
COPY wheel-fe/postcss.config.cjs ./
COPY wheel-fe/tailwind.config.cjs ./
COPY wheel-fe/index.html ./
EXPOSE 5173

# Start development server with host binding
CMD ["pnpm", "run", "dev"]
