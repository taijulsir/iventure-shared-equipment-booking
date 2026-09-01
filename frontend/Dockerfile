# Production image for the Next.js frontend, using `output: "standalone"`
# (next.config.ts) to keep the runtime image to just the files actually
# needed to serve the app, rather than the full node_modules tree.
#
# Debian-slim (not Alpine): Tailwind v4's `@tailwindcss/postcss` uses a
# native (Rust) engine; slim's glibc is the safer target for its prebuilt
# binary than Alpine's musl (see backend/Dockerfile and docs/decisions.md).
FROM node:22-bookworm-slim AS build

WORKDIR /app

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Inlined into the client bundle at build time — Next.js does not read
# NEXT_PUBLIC_* variables at runtime, so this must be supplied as a build
# argument pointing at wherever the backend will actually be reachable in
# production (see docker-compose.prod.yml, which passes it from the VPS's
# .env file).
ARG NEXT_PUBLIC_API_BASE_URL
ENV NEXT_PUBLIC_API_BASE_URL=$NEXT_PUBLIC_API_BASE_URL

RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS runtime

ENV NODE_ENV=production
WORKDIR /app

# Standalone output's server.js expects the public/ and .next/static
# directories alongside it at these exact paths — this is the layout the
# Next.js docs specify for a standalone Docker deployment.
COPY --from=build /app/public ./public
COPY --from=build /app/.next/standalone ./
COPY --from=build /app/.next/static ./.next/static

USER node

EXPOSE 3001
ENV PORT=3001
ENV HOSTNAME=0.0.0.0

HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3001/',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "server.js"]
