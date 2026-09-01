#!/usr/bin/env bash
# Deploy pealmeida.com — Cloudflare Worker with static assets.
#
# One-step production publish (from repo root):
#   ./deploy.sh
#
# Stage only (Workers Builds / wrangler custom build — no upload):
#   ./deploy.sh --stage
#   npm run build
#
# Workers Builds: wrangler.jsonc assets.directory is ./.deploy (gitignored).
# The Vite app lives in projects/reporting-midia/ and MUST be built into
# .deploy/projects/reporting-midia/ before wrangler deploy. An empty dashboard
# Build command previously made CF CI run `npx wrangler deploy` against a
# missing .deploy/ and fail immediately.

set -euo pipefail

cd "$(dirname "$0")"

STAGE_ONLY=0
if [[ "${1:-}" == "--stage" ]]; then
  STAGE_ONLY=1
fi

stage() {
  echo "Staging .deploy/ ..."
  rm -rf .deploy
  mkdir -p .deploy/projects
  cp index.html robots.txt .deploy/

  # Static projects copy as-is. The Reporting Mídia Vite app is overlaid from dist/.
  for dir in projects/*; do
    [[ -d "$dir" ]] || continue
    name="$(basename "$dir")"
    if [[ "$name" == "reporting-midia" ]]; then
      continue
    fi
    cp -R "$dir" .deploy/projects/
  done

  REPORTING_MIDIA="projects/reporting-midia"
  if [[ -f "$REPORTING_MIDIA/package.json" ]]; then
    echo "Building Reporting Mídia ..."
    (
      cd "$REPORTING_MIDIA"
      if [[ -f package-lock.json ]]; then
        npm ci
      else
        npm install
      fi
      npm run build
    )
    mkdir -p .deploy/projects/reporting-midia
    cp -R "$REPORTING_MIDIA/dist/." .deploy/projects/reporting-midia/
  fi
}

if [[ "$STAGE_ONLY" -eq 1 ]]; then
  stage
  echo "Staged .deploy/ (no wrangler deploy)."
  echo "Next: npx wrangler deploy --keep-vars"
  exit 0
fi

# wrangler.jsonc build.command runs `./deploy.sh --stage` before upload.
TOKEN_FILE="$HOME/.config/cloudflare/pealmeida-token"
if [[ -r "$TOKEN_FILE" ]]; then
  export CLOUDFLARE_API_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
  export CLOUDFLARE_ACCOUNT_ID="469f814c7e8bc68027bda7c6247a9f39"
  echo "Using API token from $TOKEN_FILE"
else
  echo "No token at $TOKEN_FILE — falling back to wrangler OAuth login"
fi

echo "Deploying via wrangler ..."
wrangler deploy --keep-vars

ZONE_ID="d3e213a87fdf0cd6f7e300be6a07caad"
echo ""
echo "Purging Cloudflare cache for pealmeida.com ..."
if [[ -n "${CLOUDFLARE_API_TOKEN:-}" ]]; then
  PURGE_RESP=$(curl -s -X POST "https://api.cloudflare.com/client/v4/zones/$ZONE_ID/purge_cache" \
    -H "Authorization: Bearer $CLOUDFLARE_API_TOKEN" \
    -H "Content-Type: application/json" \
    --data '{"purge_everything":true}')
  if echo "$PURGE_RESP" | grep -q '"success":true'; then
    echo "  Cache purged."
  else
    echo "  Cache purge via API failed (token likely missing Zone:Cache Purge:Purge scope)."
    echo "  Purge manually: https://dash.cloudflare.com/469f814c7e8bc68027bda7c6247a9f39/pealmeida.com/caching/configuration"
    echo "  Response: $PURGE_RESP"
  fi
else
  echo "  No CLOUDFLARE_API_TOKEN — skipping API purge."
  echo "  Purge manually: https://dash.cloudflare.com/469f814c7e8bc68027bda7c6247a9f39/pealmeida.com/caching/configuration"
fi

echo ""
echo "Done. Verify: https://pealmeida.com/"
echo "Reporting Mídia: https://pealmeida.com/projects/reporting-midia/"
echo "If you see stale content, hard-refresh (Cmd+Shift+R) or wait ~30s for edge cache to settle."
