FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
COPY packages/shared/package.json ./packages/shared/
COPY apps/web/package.json ./apps/web/
RUN npm install --workspace=packages/shared --workspace=apps/web

FROM node:20-alpine AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY packages/shared ./packages/shared
COPY apps/web ./apps/web
COPY package.json ./

# 1. Build shared
WORKDIR /app/packages/shared
RUN npx tsc

# 2. Build Next.js
WORKDIR /app/apps/web
ENV NEXT_TELEMETRY_DISABLED=1
RUN npx next build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
ENV PORT=3000
ENV HOSTNAME=0.0.0.0

# 必要なファイルをすべてコピー
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/packages/shared ./packages/shared
COPY --from=builder /app/apps/web/.next ./.next
COPY --from=builder /app/apps/web/package.json ./package.json
COPY --from=builder /app/apps/web/next.config.js ./next.config.js

EXPOSE 3000
CMD ["node_modules/.bin/next", "start", "-p", "3000"]
