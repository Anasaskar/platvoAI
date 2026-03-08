# ---- Base ----
FROM node:20-slim AS base
RUN apt-get update -y && apt-get install -y openssl ca-certificates && rm -rf /var/lib/apt/lists/*
WORKDIR /app

# ---- Dependencies ----
FROM base AS deps
COPY package.json package-lock.json .npmrc ./
COPY prisma ./prisma/
RUN npm ci --legacy-peer-deps

# ---- Build ----
FROM base AS builder
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY . .

# Build-time environment variables (needed for Next.js static generation)
ARG DATABASE_URL
ARG DIRECT_URL
ARG BETTER_AUTH_SECRET
ARG BETTER_AUTH_URL
ARG NEXT_PUBLIC_APP_URL
ARG OPENROUTER_API_KEY
ARG OPENAI_API_KEY
ARG STRIPE_SECRET_KEY
ARG STRIPE_WEBHOOK_SECRET
ARG STRIPE_PRO_PLAN_PRICE_ID
ARG GOOGLE_CLIENT_ID
ARG GOOGLE_CLIENT_SECRET
ARG IMAGEKIT_PUBLIC_KEY
ARG IMAGEKIT_PRIVATE_KEY
ARG IMAGEKIT_URL_ENDPOINT
ARG REPLICATE_API_TOKEN
ARG TAVILY_API_KEY

ENV DATABASE_URL=$DATABASE_URL
ENV DIRECT_URL=$DIRECT_URL
ENV BETTER_AUTH_SECRET=$BETTER_AUTH_SECRET
ENV BETTER_AUTH_URL=$BETTER_AUTH_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
ENV OPENROUTER_API_KEY=$OPENROUTER_API_KEY
ENV OPENAI_API_KEY=$OPENAI_API_KEY
ENV STRIPE_SECRET_KEY=$STRIPE_SECRET_KEY
ENV STRIPE_WEBHOOK_SECRET=$STRIPE_WEBHOOK_SECRET
ENV STRIPE_PRO_PLAN_PRICE_ID=$STRIPE_PRO_PLAN_PRICE_ID
ENV GOOGLE_CLIENT_ID=$GOOGLE_CLIENT_ID
ENV GOOGLE_CLIENT_SECRET=$GOOGLE_CLIENT_SECRET
ENV IMAGEKIT_PUBLIC_KEY=$IMAGEKIT_PUBLIC_KEY
ENV IMAGEKIT_PRIVATE_KEY=$IMAGEKIT_PRIVATE_KEY
ENV IMAGEKIT_URL_ENDPOINT=$IMAGEKIT_URL_ENDPOINT
ENV REPLICATE_API_TOKEN=$REPLICATE_API_TOKEN
ENV TAVILY_API_KEY=$TAVILY_API_KEY

# Generate Prisma client
RUN npx prisma generate

# Build Next.js (prebuild runs ensure-prisma + generate-models)
RUN npm run build

# ---- Production ----
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production
ENV PORT=3000
ENV HOSTNAME="0.0.0.0"

RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 nextjs

# Copy public assets
COPY --from=builder /app/public ./public

# Copy standalone build output
COPY --from=builder --chown=nextjs:nodejs /app/.next/standalone ./
COPY --from=builder --chown=nextjs:nodejs /app/.next/static ./.next/static

# Copy Prisma schema + generated client (needed at runtime)
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/generated ./generated

USER nextjs

EXPOSE 3000

CMD ["node", "server.js"]
