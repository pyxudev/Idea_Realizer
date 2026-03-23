FROM node:20-alpine AS deps
WORKDIR /app
# Copy package files
COPY package.json ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/api/package.json ./apps/api/
RUN npm install --workspace=packages/shared --workspace=apps/api

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY apps/api ./apps/api
COPY package.json ./

# 1. Build shared first
WORKDIR /app/packages/shared
RUN npx tsc

# 2. Build API
WORKDIR /app/apps/api
RUN npx tsc

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist
COPY --from=builder /app/packages/shared/package.json ./packages/shared/package.json
COPY --from=builder /app/apps/api/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
RUN mkdir -p /app/outputs
EXPOSE 3001
CMD ["node", "dist/index.js"]
