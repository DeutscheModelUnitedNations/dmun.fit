# Stage 1: Builder
FROM node:22-alpine AS builder
WORKDIR /app
# Copy dependency definitions
COPY package.json ./
COPY yarn.lock* ./
RUN yarn install
# Copy remaining source code
COPY . ./
# Set environment variables for production
ENV NEXT_PUBLIC_API_URL="https://api-fit.dmun.de"
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
