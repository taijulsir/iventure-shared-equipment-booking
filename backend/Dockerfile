# Production image for the NestJS backend.
#
# Debian-slim (not Alpine): two native/prebuilt-binary dependencies —
# bcrypt and Tailwind's oxide engine on the frontend side — are most
# reliably prebuilt against glibc. Alpine's musl libc occasionally lacks a
# matching prebuild and falls back to a source compile, which is slower and
# less deterministic in CI. Slim keeps the same multi-stage size discipline
# without that risk (see docs/decisions.md).
FROM node:22-bookworm-slim AS build

# Prisma's engine-detection step needs libssl to identify which query-engine
# build to use; bookworm-slim doesn't include it by default.
RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Schema and tsconfig copied before `npm ci` because `npm ci` triggers this
# package's `postinstall` (`prisma generate`), which (a) needs
# prisma/schema.prisma to already be present, and (b) reads tsconfig.json's
# `moduleResolution` to decide whether to emit `.js`- or `.ts`-suffixed
# relative imports in the generated client — with no tsconfig.json visible
# yet, it silently emits `.ts`-suffixed imports, which then fail to resolve
# at runtime once compiled (Node's ESM loader has no `.ts` file to find).
COPY package.json package-lock.json ./
COPY prisma ./prisma
COPY prisma7.config.ts ./
COPY tsconfig.json tsconfig.build.json nest-cli.json ./

# Installed with dev dependencies included: the Prisma CLI (needed by the
# postinstall step above) and TypeScript (needed to compile) are both
# devDependencies. package-lock.json is required so this is a reproducible
# `npm ci`, not a floating `npm install`.
RUN npm ci

COPY src ./src
RUN npm run build

# ---------------------------------------------------------------------------

FROM node:22-bookworm-slim AS runtime

RUN apt-get update && apt-get install -y --no-install-recommends openssl \
    && rm -rf /var/lib/apt/lists/*

ENV NODE_ENV=production
WORKDIR /app

# Full node_modules (including the Prisma CLI) is carried into the runtime
# image deliberately: the deployment workflow runs `prisma migrate deploy`
# inside this same image via `docker compose run`, so the CLI and the
# `prisma/` directory need to be present at runtime, not just at build time.
COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY --from=build /app/prisma ./prisma
COPY prisma7.config.ts package.json ./

# Runs as the image's built-in non-root `node` user rather than root.
USER node

EXPOSE 3000

# curl isn't installed in this image; Node's own http client avoids adding
# it just for this.
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD node -e "require('http').get('http://127.0.0.1:3000/health',r=>process.exit(r.statusCode===200?0:1)).on('error',()=>process.exit(1))"

CMD ["node", "dist/main.js"]
