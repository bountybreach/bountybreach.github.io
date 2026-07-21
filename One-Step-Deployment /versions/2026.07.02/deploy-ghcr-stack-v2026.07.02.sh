#!/usr/bin/env bash

set -euo pipefail

usage() {
  cat <<'EOF'
Usage: ./deploy-ghcr-stack.sh --version <tag> [--ghcr-user <user>] [--ghcr-token <token>] [--no-cleanup] [--help]

Description:
  Pulls GHCR images and deploys:
  1) SecureOne PostgreSQL
  2) SecureOne application
  3) SecureAI PostgreSQL (BB AI Foundation)
  4) SecureAI application
  5) Jenkins
  6) SecureOne Scan Agent

Examples:
  ./deploy-ghcr-stack.sh --version latest
  ./deploy-ghcr-stack.sh --version v3.0.7
  ./deploy-ghcr-stack.sh --version v3.0.7 --ghcr-user bountybreach --ghcr-token <token>

Notes:
  - Uses shared Docker network: ci-network
  - Uses persistent Docker volumes
  - Database credentials are collected interactively
  - GHCR credentials can be supplied or existing docker login can be used
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


###############################################################################
# Database credential collection
###############################################################################

validate_required_value() {
  local value="$1"
  local field="$2"

  if [[ -z "$value" ]]; then
    echo "$field cannot be empty."
    exit 1
  fi
}


printf "\n=====================================\n"
printf " SecureOne Database Configuration\n"
printf "=====================================\n"

read -r -p "SecureOne DB Username: " SECUREONE_DB_USER

read -rs -p "SecureOne DB Password: " SECUREONE_DB_PASSWORD
echo

read -r -p "SecureOne DB Name: " SECUREONE_DB_NAME


printf "\n=====================================\n"
printf " SecureAI Database Configuration\n"
printf "=====================================\n"

read -r -p "SecureAI DB Username: " SECUREAI_DB_USER

read -rs -p "SecureAI DB Password: " SECUREAI_DB_PASSWORD
echo

read -r -p "SecureAI DB Name: " SECUREAI_DB_NAME


validate_required_value "$SECUREONE_DB_USER" "SecureOne DB Username"
validate_required_value "$SECUREONE_DB_PASSWORD" "SecureOne DB Password"
validate_required_value "$SECUREONE_DB_NAME" "SecureOne DB Name"

validate_required_value "$SECUREAI_DB_USER" "SecureAI DB Username"
validate_required_value "$SECUREAI_DB_PASSWORD" "SecureAI DB Password"
validate_required_value "$SECUREAI_DB_NAME" "SecureAI DB Name"


###############################################################################
# Docker configuration
###############################################################################

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


###############################################################################
# Container names
###############################################################################

DB_CONTAINER="secureone-db"

BB_AI_DB_FOUNDATION_CONTAINER="bountybreach-ai-foundation-db"

APP_CONTAINER="secureone"

BB_AI_APP_FOUNDATION_CONTAINER="bountybreach-ai-foundation"

JENKINS_CONTAINER="jenkins"

SCAN_AGENT_CONTAINER="secureone-scan-agent"


###############################################################################
# Images
###############################################################################

SECUREONE_IMAGE="ghcr.io/bountybreach/secureone:${VERSION}"

SCAN_AGENT_IMAGE="ghcr.io/bountybreach/secureone_scan_agent:${VERSION}"

BOUNTYBREACH_AI_FOUNDATION_IMAGE="ghcr.io/bountybreach/bountybreach-ai-foundation:${VERSION}"

JENKINS_IMAGE="jenkins/jenkins:lts"

POSTGRES_IMAGE="postgres:15"

BB_AI_FOUNDATION_POSTGRES_IMAGE="pgvector/pgvector:pg16"


ROOT_DIR="$(cd -- "$(dirname -- "${BASH_SOURCE[0]}")/.." && pwd)"

LICENSE_DIR="${LICENSE_DIR:-$ROOT_DIR/secureone_scan_agents/data/license}"

###############################################################################
# Create network and volumes
###############################################################################

printf "\n[1/9] Ensuring network and shared volumes...\n"

docker network inspect "$NETWORK" >/dev/null 2>&1 || \
  docker network create "$NETWORK" >/dev/null

docker volume inspect "$JENKINS_HOME_VOLUME" >/dev/null 2>&1 || \
  docker volume create "$JENKINS_HOME_VOLUME" >/dev/null

docker volume inspect "$SCAN_WORKSPACE_VOLUME" >/dev/null 2>&1 || \
  docker volume create "$SCAN_WORKSPACE_VOLUME" >/dev/null

docker volume inspect "$POSTGRES_VOLUME" >/dev/null 2>&1 || \
  docker volume create "$POSTGRES_VOLUME" >/dev/null

docker volume inspect "$BB_AI_FOUNDATION_POSTGRES_VOLUME" >/dev/null 2>&1 || \
  docker volume create "$BB_AI_FOUNDATION_POSTGRES_VOLUME" >/dev/null


###############################################################################
# GHCR login
###############################################################################

if [[ -n "$GHCR_USER" && -n "$GHCR_TOKEN" ]]; then

  printf "\n[2/9] Logging into GHCR...\n"

  echo "$GHCR_TOKEN" | docker login ghcr.io \
    -u "$GHCR_USER" \
    --password-stdin >/dev/null

else

  printf "\n[2/9] Skipping GHCR login (using existing docker credentials).\n"

fi


###############################################################################
# Pull images
###############################################################################

printf "\n[3/9] Pulling images...\n"

docker pull "$SECUREONE_IMAGE"

docker pull "$SCAN_AGENT_IMAGE"

docker pull "$BOUNTYBREACH_AI_FOUNDATION_IMAGE"

docker pull "$JENKINS_IMAGE"

docker pull "$POSTGRES_IMAGE"

docker pull "$BB_AI_FOUNDATION_POSTGRES_IMAGE"



###############################################################################
# Cleanup existing containers
###############################################################################

if [[ "$CLEANUP_EXISTING" == "true" ]]; then

  printf "\n[4/9] Cleaning existing containers (if any)...\n"

  for container in \
    "$SCAN_AGENT_CONTAINER" \
    "$APP_CONTAINER" \
    "$DB_CONTAINER" \
    "$BB_AI_APP_FOUNDATION_CONTAINER" \
    "$BB_AI_DB_FOUNDATION_CONTAINER" \
    "$JENKINS_CONTAINER"
  do

    if docker ps -a --format '{{.Names}}' | grep -q "^${container}$"; then
      docker rm -f "$container" >/dev/null
    fi

  done

else

  printf "\n[4/9] Skipping cleanup (--no-cleanup enabled).\n"

fi



###############################################################################
# SecureOne PostgreSQL
###############################################################################

printf "\n[5/9] Starting SecureOne PostgreSQL...\n"


docker run -d \
  --name "$DB_CONTAINER" \
  --network "$NETWORK" \
  -e POSTGRES_USER="$SECUREONE_DB_USER" \
  -e POSTGRES_PASSWORD="$SECUREONE_DB_PASSWORD" \
  -e POSTGRES_DB="$SECUREONE_DB_NAME" \
  -p 5432:5432 \
  -v "$POSTGRES_VOLUME":/var/lib/postgresql/data \
  --health-cmd="pg_isready -U $SECUREONE_DB_USER" \
  --health-interval=5s \
  --health-timeout=3s \
  --health-retries=10 \
  --restart unless-stopped \
  "$POSTGRES_IMAGE" >/dev/null



printf "\nWaiting for SecureOne PostgreSQL health...\n"

for _ in {1..30}; do

  db_health="$(docker inspect \
    -f '{{.State.Health.Status}}' \
    "$DB_CONTAINER" 2>/dev/null || true)"

  if [[ "$db_health" == "healthy" ]]; then
    break
  fi

  sleep 2

done


if [[ "$(docker inspect \
  -f '{{.State.Health.Status}}' \
  "$DB_CONTAINER" 2>/dev/null || true)" != "healthy" ]]; then

  echo "SecureOne PostgreSQL did not become healthy in time."
  exit 1

fi



###############################################################################
# SecureOne application
###############################################################################

printf "\nStarting SecureOne application...\n"


docker run -d \
  --name "$APP_CONTAINER" \
  --network "$NETWORK" \
  -p 9000:9000 \
  -e DATABASE_URL="postgresql+psycopg2://${SECUREONE_DB_USER}:${SECUREONE_DB_PASSWORD}@${DB_CONTAINER}:5432/${SECUREONE_DB_NAME}" \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  "$SECUREONE_IMAGE" >/dev/null




###############################################################################
# SecureAI PostgreSQL
###############################################################################

printf "\nStarting SecureAI PostgreSQL...\n"


docker run -d \
  --name "$BB_AI_DB_FOUNDATION_CONTAINER" \
  --network "$NETWORK" \
  -e POSTGRES_USER="$SECUREAI_DB_USER" \
  -e POSTGRES_PASSWORD="$SECUREAI_DB_PASSWORD" \
  -e POSTGRES_DB="$SECUREAI_DB_NAME" \
  -p 5433:5432 \
  -v "$BB_AI_FOUNDATION_POSTGRES_VOLUME":/var/lib/postgresql/data \
  --health-cmd="pg_isready -U $SECUREAI_DB_USER" \
  --health-interval=5s \
  --health-timeout=3s \
  --health-retries=10 \
  --restart unless-stopped \
  "$BB_AI_FOUNDATION_POSTGRES_IMAGE" >/dev/null



printf "\nWaiting for SecureAI PostgreSQL health...\n"


for _ in {1..30}; do

  db_health="$(docker inspect \
    -f '{{.State.Health.Status}}' \
    "$BB_AI_DB_FOUNDATION_CONTAINER" 2>/dev/null || true)"

  if [[ "$db_health" == "healthy" ]]; then
    break
  fi

  sleep 2

done


if [[ "$(docker inspect \
  -f '{{.State.Health.Status}}' \
  "$BB_AI_DB_FOUNDATION_CONTAINER" 2>/dev/null || true)" != "healthy" ]]; then

  echo "SecureAI PostgreSQL did not become healthy in time."
  exit 1

fi



###############################################################################
# SecureAI application
###############################################################################

printf "\nStarting SecureAI application...\n"


docker run -d \
  --name "$BB_AI_APP_FOUNDATION_CONTAINER" \
  --network "$NETWORK" \
  -p 8100:8100 \
  -e DATABASE_URL="postgresql+psycopg2://${SECUREAI_DB_USER}:${SECUREAI_DB_PASSWORD}@${BB_AI_DB_FOUNDATION_CONTAINER}:5432/${SECUREAI_DB_NAME}" \
  --add-host=host.docker.internal:host-gateway \
  --restart unless-stopped \
  "$BOUNTYBREACH_AI_FOUNDATION_IMAGE" >/dev/null
  ###############################################################################
# Jenkins
###############################################################################

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



###############################################################################
# SecureOne Scan Agent
###############################################################################

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

  echo
  echo "Warning: license directory not found:"
  echo "  $LICENSE_DIR"
  echo "Scan agent will start without local license files."

fi



docker run "${scan_agent_run_args[@]}" "$SCAN_AGENT_IMAGE" >/dev/null




###############################################################################
# Deployment summary
###############################################################################

printf "\n[9/9] Deployment summary...\n"


docker ps \
  --format 'table {{.Names}}\t{{.Image}}\t{{.Status}}' \
  | grep -E "^(${DB_CONTAINER}|${APP_CONTAINER}|${BB_AI_DB_FOUNDATION_CONTAINER}|${BB_AI_APP_FOUNDATION_CONTAINER}|${JENKINS_CONTAINER}|${SCAN_AGENT_CONTAINER})" \
  || true



echo

echo "================================================="
echo " Deployment completed successfully"
echo "================================================="

echo

echo "Docker Network:"
echo "  $NETWORK"

echo

echo "Docker Volumes:"
echo "  $JENKINS_HOME_VOLUME"
echo "  $SCAN_WORKSPACE_VOLUME"
echo "  $POSTGRES_VOLUME"
echo "  $BB_AI_FOUNDATION_POSTGRES_VOLUME"


echo

echo "Database Containers:"
echo "  SecureOne DB : $DB_CONTAINER"
echo "  SecureAI DB  : $BB_AI_DB_FOUNDATION_CONTAINER"


echo

echo "Application Endpoints:"
echo "  SecureOne:"
echo "    http://localhost:9000"

echo

echo "  SecureAI Foundation:"
echo "    http://localhost:8100"

echo

echo "  Jenkins:"
echo "    http://localhost:9090"

echo

echo "  Scan Agent:"
echo "    http://localhost:9101"


echo

echo "Database configuration:"
echo "  SecureOne DB User : $SECUREONE_DB_USER"
echo "  SecureOne DB Name : $SECUREONE_DB_NAME"
echo
echo "  SecureAI DB User  : $SECUREAI_DB_USER"
echo "  SecureAI DB Name  : $SECUREAI_DB_NAME"

echo

echo "Done."