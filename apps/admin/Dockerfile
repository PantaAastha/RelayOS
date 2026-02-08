# Next.js Admin Dockerfile
# Multi-stage build for optimized production image

# Stage 1: Dependencies
FROM node:20-alpine AS deps
RUN apk add --no-cache libc6-compat
WORKDIR /app

# Copy package files
COPY package.json package-lock.json ./
COPY apps/admin/package.json ./apps/admin/
COPY packages/types/package.json ./packages/types/
COPY packages/ui/package.json ./packages/ui/

# Install dependencies
RUN npm ci --workspace=@relayos/admin --include-workspace-root

# Stage 2: Builder
FROM node:20-alpine AS builder
WORKDIR /app

# Copy dependencies
COPY --from=deps /app/node_modules ./node_modules

# Copy source
COPY apps/admin ./apps/admin
COPY packages ./packages

# Set environment for build
ENV NEXT_TELEMETRY_DISABLED=1

# Build Next.js with Webpack (--webpack for Docker stability in monorepos)
WORKDIR /app/apps/admin
RUN npm run build:docker

# Stage 3: Production runner
FROM node:20-alpine AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/apps/admin/public ./public

# Copy the standalone output - In monorepo, files are nested at apps/admin/ within standalone
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone/apps/admin/server.js ./
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone/apps/admin/package.json ./

# Copy .next folder from standalone (also nested)
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/standalone/apps/admin/.next ./.next

# Copy static files
COPY --from=builder --chown=nextjs:nodejs /app/apps/admin/.next/static ./.next/static

# Copy node_modules from standalone (at root level, contains workspace deps)
COPY --from=deps --chown=nextjs:nodejs /app/node_modules ./node_modules

USER nextjs

EXPOSE 3000
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

CMD ["node", "server.js"]
