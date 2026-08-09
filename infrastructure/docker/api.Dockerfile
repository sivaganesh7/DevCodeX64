# --- Build Stage ---------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/api/package.json ./apps/api/
RUN npm install -g pnpm && pnpm install --filter @DevCodeX64/api
COPY apps/api ./apps/api
COPY database ./database
RUN pnpm --filter @DevCodeX64/api build

# --- Production Stage ---------------------------------------------------------
FROM node:20-alpine AS production
WORKDIR /app
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
EXPOSE 3001
CMD ["node", "dist/main.js"]
