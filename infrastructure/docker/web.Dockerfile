# --- Build Stage ---------------------------------------------------------------
FROM node:20-alpine AS builder
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY apps/web/package.json ./apps/web/
RUN npm install -g pnpm && pnpm install --filter @DevCodeX64/web
COPY apps/web ./apps/web
RUN pnpm --filter @DevCodeX64/web build

# --- Production Stage ---------------------------------------------------------
FROM nginx:alpine AS production
COPY --from=builder /app/apps/web/dist /usr/share/nginx/html
COPY infrastructure/nginx/nginx.conf /etc/nginx/conf.d/default.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
