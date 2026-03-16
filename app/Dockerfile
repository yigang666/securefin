# ── Stage 1: dependency install ───────────────────────────────────────────────
# Use the official Node.js 20 Alpine image as base.
# Alpine keeps the image small (~5 MB OS layer).
FROM node:20-alpine AS deps

WORKDIR /app

# Copy only the package manifests first so Docker can cache this layer
# and skip re-running npm ci whenever only source files change.
COPY package.json package-lock.json* ./

# Install production dependencies only.
RUN npm ci --omit=dev

# ── Stage 2: runtime image ────────────────────────────────────────────────────
FROM node:20-alpine AS runtime

# Set NODE_ENV so Express disables development-only features.
ENV NODE_ENV=production

WORKDIR /app

# Copy installed node_modules from the deps stage.
COPY --from=deps /app/node_modules ./node_modules

# Copy application source.
COPY . .

# Run as a non-root user for security best practice.
RUN addgroup -S appgroup && adduser -S appuser -G appgroup
USER appuser

# Expose the port the app listens on (configurable via PORT env var).
EXPOSE 3000

# Start the Node.js server.
CMD ["node", "server.js"]
