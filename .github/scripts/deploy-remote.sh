#!/usr/bin/env bash
# Runs ON THE VPS (piped over SSH by .github/workflows/deploy.yml, via
# `bash -s -- "$DEPLOY_PATH" "$SHA"`) — not part of the GitHub Actions
# runner's own filesystem. Kept as a real, shellcheck-able script rather
# than an inline heredoc in the workflow YAML.
set -euo pipefail

DEPLOY_PATH="$1"
SHA="$2"

cd "$DEPLOY_PATH"

echo "==> Fetching $SHA"
git fetch --quiet origin main
git checkout --quiet "$SHA"

echo "==> Building images"
docker compose -f docker-compose.prod.yml --env-file .env.production build

echo "==> Applying database migrations (against the new image, before cutover)"
docker compose -f docker-compose.prod.yml --env-file .env.production run --rm backend npx prisma migrate deploy

echo "==> Recreating containers"
docker compose -f docker-compose.prod.yml --env-file .env.production up -d

echo "==> Waiting for backend health check"
backend_healthy=false
for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:3000/health >/dev/null 2>&1; then
    backend_healthy=true
    break
  fi
  sleep 2
done
if [ "$backend_healthy" != "true" ]; then
  echo "Backend failed its post-deploy health check." >&2
  docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 backend >&2
  exit 1
fi

echo "==> Smoke-checking frontend"
if ! curl -fsS http://127.0.0.1:3001/ >/dev/null 2>&1; then
  echo "Frontend failed its post-deploy smoke check." >&2
  docker compose -f docker-compose.prod.yml --env-file .env.production logs --tail=100 frontend >&2
  exit 1
fi

echo "==> Deployment successful ($SHA)"
