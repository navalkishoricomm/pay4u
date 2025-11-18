#!/usr/bin/env bash
set -euo pipefail

echo "== Pay4U: Unified Server Update Script =="
echo "Date: $(date)"

# Detect environment
command_exists() { command -v "$1" >/dev/null 2>&1; }

ROOT_DIR="$(cd "$(dirname "$0")" && pwd)"
cd "$ROOT_DIR"

echo "Repo directory: $ROOT_DIR"

# Choose update strategy
USE_DOCKER=false
if [ -f "$ROOT_DIR/docker-compose.yml" ] && (command_exists docker || command_exists docker-compose); then
  USE_DOCKER=true
fi

if [ "$USE_DOCKER" = true ]; then
  echo "Detected Docker deployment. Running update-docker.sh"
  if [ ! -x "$ROOT_DIR/update-docker.sh" ]; then
    echo "update-docker.sh not found or not executable. Aborting." >&2
    exit 1
  fi
  bash "$ROOT_DIR/update-docker.sh"
else
  echo "Detected PM2/Systemd deployment. Running update-production.sh"
  if [ ! -x "$ROOT_DIR/update-production.sh" ]; then
    echo "update-production.sh not found or not executable. Aborting." >&2
    exit 1
  fi
  bash "$ROOT_DIR/update-production.sh"
fi

echo "✅ Update completed."