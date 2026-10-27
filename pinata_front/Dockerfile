# syntax=docker/dockerfile:1

# Node 24 ships npm 11, the version that wrote package-lock.json.
ARG NODE_VERSION=24-alpine

# Dependencies; dev and builder start from this stage so node_modules is never copied
FROM node:${NODE_VERSION} AS deps
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1
COPY package.json package-lock.json ./
RUN --mount=type=cache,target=/root/.npm npm ci

# Development server with hot reload (compose watch syncs source changes in)
FROM deps AS dev
COPY . .
EXPOSE 3000
CMD ["npm", "run", "dev", "--", "--hostname", "0.0.0.0"]

# Production build (output: "standalone")
FROM deps AS builder
COPY . .
RUN npm run build

# Production runtime: only the standalone server, static assets and public files
FROM node:${NODE_VERSION} AS runner
WORKDIR /app
ENV NODE_ENV=production \
    NEXT_TELEMETRY_DISABLED=1 \
    PORT=3000 \
    HOSTNAME=0.0.0.0
COPY --from=builder --chown=node:node /app/public ./public
COPY --from=builder --chown=node:node /app/.next/standalone ./
COPY --from=builder --chown=node:node /app/.next/static ./.next/static
USER node
EXPOSE 3000
CMD ["node", "server.js"]
