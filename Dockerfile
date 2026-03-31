# Use node:alpine for a small, optimized image (Arm64 compatible)
FROM --platform=$BUILDPLATFORM node:20-alpine AS builder

WORKDIR /usr/src/app

# Install dependencies
COPY package*.json ./
RUN npm ci --only=production

# Final stage
FROM --platform=$TARGETPLATFORM node:20-alpine

WORKDIR /usr/src/app

# Copy from builder
COPY --from=builder /usr/src/app/node_modules ./node_modules
COPY . .

# Set production environment
ENV NODE_ENV=production

# Start the bot
CMD ["node", "src/index.js"]
