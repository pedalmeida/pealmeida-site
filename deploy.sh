#!/usr/bin/env bash
# Deploy pealmeida.com — Cloudflare Worker w/ static assets.
# Builds a clean staging dir from tracked site content, then wrangler deploy.

set -euo pipefail

cd "$(dirname "$0")"

TOKEN_FILE="$HOME/.config/cloudflare/pealmeida-token"
if [[ -r "$TOKEN_FILE" ]]; then
  export CLOUDFLARE_API_TOKEN="$(tr -d '[:space:]' < "$TOKEN_FILE")"
  export CLOUDFLARE_ACCOUNT_ID="469f814c7e8bc68027bda7c6247a9f39"
  echo "Using API token from $TOKEN_FILE"
else
  echo "No token at $TOKEN_FILE — falling back to wrangler OAuth login"
fi

echo "Staging .deploy/ ..."
rm -rf .deploy
mkdir -p .deploy/projects
cp index.html robots.txt .deploy/

# Static projects copy as-is. The Reporting Mídia Vite app is overlaid from dist/.
for dir in projects/*; do
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
echo "If you see stale content, hard-refresh (Cmd+Shift+R) or wait ~30s for edge cache to settle."
