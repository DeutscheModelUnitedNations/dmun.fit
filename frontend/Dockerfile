# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
# Copy dependency definitions
COPY package.json ./
# If using lockfiles, uncomment below lines:
COPY yarn.lock* ./
RUN yarn install
# Copy remaining source code
COPY . ./
# Build the Next.js application
RUN yarn run build

# Stage 2: Runner
FROM node:22-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
# Copy built files and necessary folders from builder
COPY --from=builder /app ./
EXPOSE 3000
CMD ["yarn", "start"]
