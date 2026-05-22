#!/bin/bash

set -Eeuo pipefail

export PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin

APP_DIR="/home/vagrant/app"
LOG_FILE="$APP_DIR/deploy-runtime.log"
LOCK_FILE="/tmp/deploy.lock"

BACKEND_IMAGE="m4nw1thp3nt35t/devops-backend:latest"
FRONTEND_IMAGE="m4nw1thp3nt35t/devops-frontend:latest"

exec 200>$LOCK_FILE

flock -n 200 || {
  echo "[$(date)] Deploy already running" >> "$LOG_FILE"
  exit 0
}

log() {
  echo "[$(date)] $1"
}

retry_pull() {

  local image=$1

  for i in {1..5}; do

    log "Pulling $image attempt $i"

    if docker pull "$image"; then
      log "SUCCESS pull $image"
      return 0
    fi

    log "Pull failed for $image"

    if [ "$i" -lt 5 ]; then
      log "Retrying in 15s..."
      sleep 15
    fi
  done

  log "FAILED pulling $image after retries"
  return 1
}

{
  echo ""
  echo "======================================="
  log "START DEPLOY"
  echo "======================================="

  cd "$APP_DIR"

  # Pull images
  retry_pull "$BACKEND_IMAGE"
  retry_pull "$FRONTEND_IMAGE"

  # Start containers
  log "Starting containers"

  docker compose up -d --remove-orphans

  # Cleanup old images
  log "Cleaning unused images"

  docker image prune -af || true

  # Show running containers
  log "Running containers:"
  docker ps

  log "DEPLOY SUCCESS"

} >> "$LOG_FILE" 2>&1
