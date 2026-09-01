FROM node:22-bookworm-slim AS build

# libssl is required for Prisma engine detection on Debian slim
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Copy schema and config before npm ci for Prisma client generation
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

RUN npm ci

COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Copy node_modules and Prisma schema for runtime migration execution
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY prisma7.config.ts package.json ./

USER node

EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
