#!/usr/bin/env bash
# Publish Passiar to https://github.com/Passiar/App
#
# Prerequisites:
# 1. Create an empty repo at https://github.com/Passiar/App (no README)
# 2. Export a GitHub PAT with repo scope for the Passiar org:
#      export GITHUB_TOKEN=ghp_your_token_here
#
# Usage:
#   ./scripts/publish-to-passiar.sh

set -euo pipefail

TARGET_REPO="${TARGET_REPO:-https://github.com/Passiar/App.git}"
SOURCE_BRANCH="${SOURCE_BRANCH:-passiar-app-standalone}"
SOURCE_REPO="${SOURCE_REPO:-https://github.com/EricksonAtHome/ethereum-org.git}"

if [[ -z "${GITHUB_TOKEN:-}" ]]; then
  echo "Error: Set GITHUB_TOKEN to a GitHub PAT with access to Passiar/App"
  exit 1
fi

WORKDIR=$(mktemp -d)
trap 'rm -rf "$WORKDIR"' EXIT

AUTH_URL=$(echo "$TARGET_REPO" | sed "s|https://|https://x-access-token:${GITHUB_TOKEN}@|")

echo "Cloning source branch..."
git clone --branch "$SOURCE_BRANCH" --single-branch "$SOURCE_REPO" "$WORKDIR/source"
cd "$WORKDIR/source"

echo "Pushing to Passiar/App..."
git remote add passiar "$AUTH_URL"
git push -u passiar HEAD:main --force

echo "Done! https://github.com/Passiar/App"
