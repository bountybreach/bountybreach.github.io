#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io}"
IMAGE_OWNER="${IMAGE_OWNER:-bountybreach}"
IMAGE_NAME="${IMAGE_NAME:-secureone}"
CONTAINER_NAME="${CONTAINER_NAME:-secureone-panel}"

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

# ── Detect Windows (Git Bash) and handle path conversion ─
IS_WINDOWS=false
if uname -s 2>/dev/null | grep -iq "MINGW\|CYGWIN\|MSYS"; then
  IS_WINDOWS=true
  export MSYS_NO_PATHCONV=1
fi

if [[ -n "${1:-}" ]]; then
  IMAGE_TAG="$1"
elif [[ -n "${IMAGE_TAG:-}" ]]; then
  :
else
  read -rp "🏷️  Local image tag to run (default: latest): " IMAGE_TAG
  IMAGE_TAG="${IMAGE_TAG:-latest}"
fi

FULL_IMAGE="${IMAGE_REGISTRY}/${IMAGE_OWNER}/${IMAGE_NAME}:${IMAGE_TAG}"

if ! docker image inspect "$FULL_IMAGE" >/dev/null 2>&1; then
  echo "❌ Local image not found: $FULL_IMAGE"
  echo "   Build first: ./docker-build-local.sh $IMAGE_TAG"
  exit 1
fi

if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  RUNNING="$(docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null || echo false)"
  if [[ "$RUNNING" == "true" ]]; then
    echo "⚠️  Container '$CONTAINER_NAME' is already running."
    echo "   Stop first: ./docker-stop-local.sh"
    exit 1
  fi
  echo "🗑️  Removing stopped container '$CONTAINER_NAME'"
  docker rm "$CONTAINER_NAME" >/dev/null
fi

DOCKER_ARGS=(
  run -d
  --name "$CONTAINER_NAME"
  --add-host host.docker.internal:host-gateway
  -v "$LICENSE_DATA_DIR:/app/data/license"
  -p 9000:9000
  -e "SECUREONE_LICENSE_FILE=$LICENSE_FILE_PATH"
  -e "SECUREONE_LICENSE_PUBLIC_KEY_PATH=$PUBLIC_KEY_PATH"
  -e "SECUREONE_LICENSE_SERVER_URL=$LICENSE_SERVER_URL"
)

if [[ -n "${DATABASE_URL:-}" ]]; then
  DOCKER_ARGS+=( -e "DATABASE_URL=$DATABASE_URL" )
fi

if [[ -n "${CONFIG_PATH:-}" ]]; then
  DOCKER_ARGS+=( -e "CONFIG_PATH=$CONFIG_PATH" )
fi

DOCKER_ARGS+=( "$FULL_IMAGE" )

echo "🚀 Starting local container '$CONTAINER_NAME' from $FULL_IMAGE"
echo "   License state dir: $LICENSE_DATA_DIR"
echo "   License server URL: $LICENSE_SERVER_URL"
if [[ "$IS_WINDOWS" == "true" ]]; then
  echo "   ℹ️  Windows detected: Git Bash path conversion disabled for mounts"
fi
docker "${DOCKER_ARGS[@]}"
echo "✅ Container started: $CONTAINER_NAME"
echo "   UI: http://localhost:9000"
echo "   Logs: docker logs -f $CONTAINER_NAME"
