#!/usr/bin/env bash
# Deploy pealmeida.com — Cloudflare Worker w/ static assets.
# Builds a clean staging dir from tracked site content, then wrangler deploy.

set -euo pipefail

cd "$(dirname "$0")"

echo "Staging .deploy/ ..."
rm -rf .deploy
mkdir -p .deploy
cp -R index.html robots.txt projects .deploy/

echo "Deploying via wrangler ..."
wrangler deploy --keep-vars

echo "Done. Verify: https://pealmeida.com/"
