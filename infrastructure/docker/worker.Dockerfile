FROM node:20-alpine
WORKDIR /app
COPY package.json pnpm-workspace.yaml ./
COPY workers/*/package.json ./workers/
RUN npm install -g pnpm && pnpm install --filter '@DevCodeX64/*-worker'
COPY workers ./workers
CMD ["node", "dist/index.js"]
