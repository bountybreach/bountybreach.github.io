#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./deploy-ghcr-stack.sh --version <tag> [--ghcr-user <user>] [--ghcr-token <token>] [--no-cleanup] [--help]

Description:
  Pulls GHCR images for secureone and secureone_scan_agent, then deploys 4 containers:
  1) postgres:15
  2) ghcr.io/bountybreach/secureone:<tag>
  3) jenkins/jenkins:lts
  4) ghcr.io/bountybreach/secureone_scan_agent:<tag>

Examples:
  ./deploy-ghcr-stack.sh --version latest
  ./deploy-ghcr-stack.sh --version v3.0.6
  ./deploy-ghcr-stack.sh --version v3.0.7
  ./deploy-ghcr-stack.sh --version v3.0.7 --ghcr-user bountybreach --ghcr-token <token>

Notes:
  - Uses shared network: ci-network
  - Uses shared volumes: jenkins_home, secureone_scan_agents_secureone_scans
  - If GHCR is private, use --ghcr-user/--ghcr-token or run docker login ghcr.io first.
EOF
}

VERSION=""
GHCR_USER=""
GHCR_TOKEN=""
CLEANUP_EXISTING="true"

if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
  export MSYS_NO_PATHCONV=1
  export MSYS2_ARG_CONV_EXCL="*"
fi

while [[ $# -gt 0 ]]; do
  case "$1" in
    --version)
      VERSION="$2"
      shift 2
      ;;
    --ghcr-user)
      GHCR_USER="$2"
      shift 2
      ;;
    --ghcr-token)
      GHCR_TOKEN="$2"
      shift 2
      ;;
    --no-cleanup)
      CLEANUP_EXISTING="false"
      shift
      ;;
    --help|-h)
      usage
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      usage
      exit 1
      ;;
  esac
done

if [[ -z "$VERSION" ]]; then
  read -r -p "Enter version tag (example: latest, v3.0.6, v3.0.7): " VERSION
fi

if [[ -z "$VERSION" ]]; then
  echo "Version is required. Use --version <tag>."
  exit 1
fi

NETWORK="ci-network"
JENKINS_HOME_VOLUME="jenkins_home"
SCAN_WORKSPACE_VOLUME="secureone_scan_agents_secureone_scans"
POSTGRES_VOLUME="postgres_data"
BB_AI_FOUNDATION_POSTGRES_VOLUME="bb_ai_foundation_postgres_data"
DOCKER_SOCK_SOURCE="${DOCKER_SOCK_SOURCE:-/var/run/docker.sock}"

if [[ "${OSTYPE:-}" == msys* || "${OSTYPE:-}" == cygwin* ]]; then
  if [[ "$DOCKER_SOCK_SOURCE" == "/var/run/docker.sock" ]]; then
    DOCKER_SOCK_SOURCE="//var/run/docker.sock"
  fi
fi

DB_CONTAINER="secureone-db"
BB_AI_DB_FOUNDATION_CONTAINER="bountybreach-ai-foundation-db"
APP_CONTAINER="secureone"
BB_AI_APP_FOUNDATION_CONTAINER="bountybreach-ai-foundation"
JENKINS_CONTAINER="jenkins"
SCAN_AGENT_CONTAINER="secureone-scan-agent"

SECUREONE_IMAGE="ghcr.io/bountybreach/secureone:${VERSION}"
SCAN_AGENT_IMAGE="ghcr.io/bountybreach/secureone_scan_agent:${VERSION}"
BOUNTYBREACH_AI_FOUNDATION_IMAGE="ghcr.io/bountybreach/bountybreach-ai-foundation:${VERSION}"
JENKINS_IMAGE="jenkins/jenkins:lts"
POSTGRES_IMAGE="postgres:15"
BB_AI_FOUNDATION_POSTGRES_IMAGE="pgvector/pgvector:pg16"

ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"
LICENSE_DIR="${LICENSE_DIR:-$ROOT_DIR/secureone_scan_agents/data/license}"

printf "\n[1/9] Ensuring network and shared volumes...\n"
docker network inspect "$NETWORK" >/dev/null 2>&1 || docker network create "$NETWORK"
docker volume inspect "$JENKINS_HOME_VOLUME" >/dev/null 2>&1 || docker volume create "$JENKINS_HOME_VOLUME" >/dev/null
docker volume inspect "$SCAN_WORKSPACE_VOLUME" >/dev/null 2>&1 || docker volume create "$SCAN_WORKSPACE_VOLUME" >/dev/null
docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1 || docker volume create "$POSTGRES_VOLUME" >/dev/null
docker volume inspect "$BB_AI_FOUNDATION_POSTGRES_VOLUME" >/dev/null 2>&1 || docker volume create "$BB_AI_FOUNDATION_POSTGRES_VOLUME" >/dev/null

if [[ -n "$GHCR_USER" && -n "$GHCR_TOKEN" ]]; then
  printf "\n[2/9] Logging into GHCR...\n"
  echo "$GHCR_TOKEN" | docker login ghcr.io -u "$GHCR_USER" --password-stdin >/dev/null
else
  printf "\n[2/9] Skipping GHCR login (using existing docker credentials).\n"
fi

printf "\n[3/9] Pulling images...\n"
docker pull "$SECUREONE_IMAGE"
docker pull "$SCAN_AGENT_IMAGE"
docker pull "$BOUNTYBREACH_AI_FOUNDATION_IMAGE"
docker pull "$JENKINS_IMAGE"
docker pull "$POSTGRES_IMAGE"
docker pull "$BB_AI_FOUNDATION_POSTGRES_IMAGE"

if [[ "$CLEANUP_EXISTING" == "true" ]]; then
  printf "\n[4/9] Cleaning existing containers (if any)...\n"
  for container in "$SCAN_AGENT_CONTAINER" "$APP_CONTAINER" "$DB_CONTAINER" "$JENKINS_CONTAINER"; do
    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      docker rm -f "$container" >/dev/null
    fi
  done
else
  printf "\n[4/9] Skipping cleanup (--no-cleanup set).\n"
fi

printf "\n[5/9] Starting PostgreSQL...\n"
docker run -d \
  --name "$DB_CONTAINER" \
  --network "$NETWORK" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=appsecdb \
  -p 5432:5432 \
  -v "$POSTGRES_VOLUME":/var/lib/postgresql/data \
  --health-cmd='pg_isready -U postgres' \
  --health-interval=5s \
  --health-timeout=3s \
  --health-retries=10 \
  --restart unless-stopped \
  "$POSTGRES_IMAGE" >/dev/null

printf "\nWaiting for PostgreSQL health...\n"
for _ in {1..30}; do
  db_health="$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || true)"
  if [[ "$db_health" == "healthy" ]]; then
    break
  fi
  sleep 2
done

if [[ "$(docker inspect -f '{{.State.Health.Status}}' "$DB_CONTAINER" 2>/dev/null || true)" != "healthy" ]]; then
  echo "PostgreSQL did not become healthy in time."
  exit 1
fi

printf "\n[6/9] Starting SecureOne app...\n"
docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  -p 9000:9000 \
  -e DATABASE_URL='postgresql+psycopg2://postgres:password@secureone-db:5432/appsecdb' \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  "$SECUREONE_IMAGE" >/dev/null


printf "\n[5/9] Starting BB AI Foundation PostgreSQL...\n"
docker run -d \
  --name "$BB_AI_DB_FOUNDATION_CONTAINER" \
  --network "$NETWORK" \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=bountybreachaidb \
  -p 5433:5432 \
  -v "$BB_AI_FOUNDATION_POSTGRES_VOLUME":/var/lib/postgresql/data \
  --health-cmd='pg_isready -U postgres' \
  --health-interval=5s \
  --health-timeout=3s \
  --health-retries=10 \
  --restart unless-stopped \
  "$BB_AI_FOUNDATION_POSTGRES_IMAGE" >/dev/null

printf "\nWaiting for BB AI Foundation PostgreSQL health...\n"
for _ in {1..30}; do
  db_health="$(docker inspect -f '{{.State.Health.Status}}' "$BB_AI_DB_FOUNDATION_CONTAINER" 2>/dev/null || true)"
  if [[ "$db_health" == "healthy" ]]; then
    break
  fi
  sleep 2
done

if [[ "$(docker inspect -f '{{.State.Health.Status}}' "$BB_AI_DB_FOUNDATION_CONTAINER" 2>/dev/null || true)" != "healthy" ]]; then
  echo "BB AI Foundation PostgreSQL did not become healthy in time."
  exit 1
fi

printf "\n[6/9] Starting BB AI Foundation app...\n"
docker run -d \
  --name "$BB_AI_APP_FOUNDATION_CONTAINER" \
  --network "$NETWORK" \
  -p 8100:8100 \
  -e DATABASE_URL='postgresql+psycopg2://postgres:password@secureone-db:5433/bountybreachaidb' \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  "$BOUNTYBREACH_AI_FOUNDATION_IMAGE" >/dev/null



printf "\n[7/9] Starting Jenkins...\n"
docker run -d \
  --name "$JENKINS_CONTAINER" \
  --network "$NETWORK" \
  -p 9090:8080 \
  -p 50000:50000 \
  -v "$JENKINS_HOME_VOLUME":/var/jenkins_home \
  -v "$SCAN_WORKSPACE_VOLUME":/workspace \
  -v "$DOCKER_SOCK_SOURCE":/var/run/docker.sock \
  --restart unless-stopped \
  "$JENKINS_IMAGE" >/dev/null

printf "\n[8/9] Starting SecureOne Scan Agent...\n"
scan_agent_run_args=(
  -d
  --name "$SCAN_AGENT_CONTAINER"
  --network "$NETWORK"
  -p 9101:9101
  -p 9100:9100
  -p 9001:9001
  -e FASTAPI_URL=http://secureone:9000
  -e SECUREONE_AGENT_MODE=config-manager
  -e SECUREONE_WORKSPACE_VOLUME="$SCAN_WORKSPACE_VOLUME"
  -e SECUREONE_JENKINS_HOME_VOLUME="$JENKINS_HOME_VOLUME"
  -e SECUREONE_JENKINS_HOME_PATH=/var/jenkins_home
  -e SECUREONE_AGENT_JENKINS_HOME_PATH=/var/jenkins_home
  -e SECUREONE_SCAN_CONTAINER_JENKINS_HOME_PATH=/var/jenkins_home
  -e SECUREONE_SCAN_DOCKER_NETWORK="$NETWORK"
  -v "$SCAN_WORKSPACE_VOLUME":/tmp/secureone_scans
  -v "$JENKINS_HOME_VOLUME":/var/jenkins_home:ro
  -v "$DOCKER_SOCK_SOURCE":/var/run/docker.sock
  --restart unless-stopped
)

if [[ -d "$LICENSE_DIR" ]]; then
  scan_agent_run_args+=(
    -v "$LICENSE_DIR":/app/data/license
    -e SECUREONE_LICENSE_FILE=/app/data/license/license.json
    -e SECUREONE_LICENSE_PUBLIC_KEY_PATH=/app/data/license/license_public.pem
  )
else
  echo "Warning: license directory not found at $LICENSE_DIR"
  echo "Scan agent will start without mounted local license files."
fi

docker run "${scan_agent_run_args[@]}" "$SCAN_AGENT_IMAGE" >/dev/null

printf "\n[9/9] Deployment summary...\n"
docker ps --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' | grep -E "^${DB_CONTAINER}|^${APP_CONTAINER}|^${JENKINS_CONTAINER}|^${SCAN_AGENT_CONTAINER}" || true

echo
echo "Done. Stack deployed with shared network and volumes:"
echo "  Network: $NETWORK"
echo "  Volumes: $JENKINS_HOME_VOLUME, $SCAN_WORKSPACE_VOLUME, $POSTGRES_VOLUME"
echo
echo "Endpoints:"
echo "  SecureOne: http://localhost:9000"
echo "  Jenkins:   http://localhost:9090"
echo "  Agent:     http://localhost:9101"
echo "  BB AI Foundation:     http://localhost:8100"
