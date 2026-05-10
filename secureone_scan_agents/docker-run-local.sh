#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io}"
IMAGE_OWNER="${IMAGE_OWNER:-bountybreach}"
IMAGE_NAME="${IMAGE_NAME:-secureone_scan_agent}"
CONTAINER_NAME="${CONTAINER_NAME:-secureone-scan-agent}"
SECUREONE_AGENT_MODE="${SECUREONE_AGENT_MODE:-config-manager}"
SECUREONE_WORKSPACE_VOLUME="${SECUREONE_WORKSPACE_VOLUME:-secureone_scans}"
WORKSPACE_DIR_IN_CONTAINER="${WORKSPACE_DIR_IN_CONTAINER:-/tmp/secureone_scans}"

LICENSE_DATA_DIR="${SECUREONE_LICENSE_DATA_DIR:-$ROOT_DIR/data/license}"
mkdir -p "$LICENSE_DATA_DIR"

LICENSE_FILE_PATH="${SECUREONE_LICENSE_FILE:-/app/data/license/license.json}"
PUBLIC_KEY_PATH="${SECUREONE_LICENSE_PUBLIC_KEY_PATH:-/app/data/license/license_public.pem}"
LICENSE_SERVER_URL="${SECUREONE_LICENSE_SERVER_URL:-https://secureone-licensing.bountybreach.com}"

if [[ "$LICENSE_SERVER_URL" == http://127.0.0.1* || "$LICENSE_SERVER_URL" == https://127.0.0.1* ]]; then
  LICENSE_SERVER_URL="${LICENSE_SERVER_URL/127.0.0.1/host.docker.internal}"
fi
if [[ "$LICENSE_SERVER_URL" == http://localhost* || "$LICENSE_SERVER_URL" == https://localhost* ]]; then
  LICENSE_SERVER_URL="${LICENSE_SERVER_URL/localhost/host.docker.internal}"
fi

if [[ -n "${1:-}" ]]; then
  IMAGE_TAG="$1"
elif [[ -n "${IMAGE_TAG:-}" ]]; then
  :
else
  read -rp "Local image tag to run (default: latest): " IMAGE_TAG
  IMAGE_TAG="${IMAGE_TAG:-latest}"
fi

FULL_IMAGE="${IMAGE_REGISTRY}/${IMAGE_OWNER}/${IMAGE_NAME}:${IMAGE_TAG}"

VALID_MODES=("agent" "factory" "cicd" "cicd-workspace" "config-manager")
valid_mode=false
for mode in "${VALID_MODES[@]}"; do
  if [[ "$SECUREONE_AGENT_MODE" == "$mode" ]]; then
    valid_mode=true
    break
  fi
done
if [[ "$valid_mode" != "true" ]]; then
  echo "Invalid SECUREONE_AGENT_MODE: $SECUREONE_AGENT_MODE"
  echo "   Valid modes: ${VALID_MODES[*]}"
  exit 1
fi

# ── Detect Windows (Git Bash) and handle path conversion ─
IS_WINDOWS=false
if uname -s 2>/dev/null | grep -iq "MINGW\|CYGWIN\|MSYS"; then
  IS_WINDOWS=true
  export MSYS_NO_PATHCONV=1
fi

if ! docker image inspect "$FULL_IMAGE" >/dev/null 2>&1; then
  echo "Local image not found: $FULL_IMAGE"
  echo "   Build first: ./docker-build-local.sh $IMAGE_TAG"
  exit 1
fi

if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  RUNNING="$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || echo false)"
  if [[ "$RUNNING" == "true" ]]; then
    echo "Container '$CONTAINER_NAME' is already running."
    echo "   Stop first: ./docker-stop-local.sh"
    exit 1
  fi
  echo "Removing stopped container '$CONTAINER_NAME'"
  docker rm "$CONTAINER_NAME" >/dev/null
fi

echo "Starting local container '$CONTAINER_NAME' from $FULL_IMAGE"
DOCKER_ARGS=(
  run -d
  --name "$CONTAINER_NAME"
  --add-host host.docker.internal:host-gateway
  -v "${SECUREONE_WORKSPACE_VOLUME}:${WORKSPACE_DIR_IN_CONTAINER}"
  -v "${LICENSE_DATA_DIR}:/app/data/license"
  -e "SECUREONE_WORKSPACE_VOLUME=$SECUREONE_WORKSPACE_VOLUME"
  -e SECUREONE_AGENT_MODE="$SECUREONE_AGENT_MODE"
  -e "SECUREONE_LICENSE_FILE=$LICENSE_FILE_PATH"
  -e "SECUREONE_LICENSE_PUBLIC_KEY_PATH=$PUBLIC_KEY_PATH"
  -e "SECUREONE_LICENSE_SERVER_URL=$LICENSE_SERVER_URL"
  -p 9101:9101
  -p 9100:9100
  -p 9001:9001
)

# Only mount docker.sock on Linux (not available on Windows Docker Desktop)
if [[ "$IS_WINDOWS" != "true" ]] && [[ -e /var/run/docker.sock ]]; then
  DOCKER_ARGS+=( -v /var/run/docker.sock:/var/run/docker.sock )
fi

if [[ -n "${FASTAPI_URL:-}" ]]; then
  DOCKER_ARGS+=( -e "FASTAPI_URL=$FASTAPI_URL" )
fi

DOCKER_ARGS+=( "$FULL_IMAGE" )

docker "${DOCKER_ARGS[@]}"

echo "Container started: $CONTAINER_NAME"
echo "   Mode: $SECUREONE_AGENT_MODE"
echo "   Shared workspace volume: ${SECUREONE_WORKSPACE_VOLUME} -> ${WORKSPACE_DIR_IN_CONTAINER}"
echo "   License data dir: ${LICENSE_DATA_DIR} -> /app/data/license"
echo "   License server URL: $LICENSE_SERVER_URL"
echo "   Logs: docker logs -f $CONTAINER_NAME"
if [[ "$SECUREONE_AGENT_MODE" == "config-manager" ]]; then
  echo "   UI: http://localhost:9101"
fi
if [[ -n "${FASTAPI_URL:-}" ]]; then
  echo "   Agent API target override: $FASTAPI_URL"
fi
