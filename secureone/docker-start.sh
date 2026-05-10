#!/usr/bin/env bash
# ====================================================
# docker-start.sh – Pull and start the SecureOne panel
# container from GHCR.
#
# Usage:
#   ./docker-start.sh
#   ./docker-start.sh v3.0.1
#   ./docker-start.sh latest
#   IMAGE_TAG=v3.0.2 ./docker-start.sh
#
# Optional env vars:
#   DATABASE_URL   - override runtime database URL
#   CONFIG_PATH    - override runtime config path inside container
# ====================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/bountybreach}"
IMAGE_NAME="${IMAGE_NAME:-secureone}"
CONTAINER_NAME="${CONTAINER_NAME:-secureone-panel}"
IMAGE_PLATFORM="${IMAGE_PLATFORM:-}"

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
  read -rp "Image tag (e.g. latest, v3.0.1, v3.0.2): " IMAGE_TAG
  IMAGE_TAG="${IMAGE_TAG:-latest}"
fi

FULL_IMAGE="${IMAGE_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

if docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | grep -q '^true$'; then
  echo "Container '$CONTAINER_NAME' is already running."
  echo "   Use ./docker-stop.sh to stop it first."
  exit 1
fi

if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Removing stopped container '$CONTAINER_NAME'..."
  docker rm "$CONTAINER_NAME"
fi

if [[ "${SKIP_PULL:-0}" != "1" ]]; then
  echo "Pulling image: $FULL_IMAGE ..."
  if [[ -n "$IMAGE_PLATFORM" ]]; then
    echo "   Platform: $IMAGE_PLATFORM"
  fi

  set +e
  if [[ -n "$IMAGE_PLATFORM" ]]; then
    docker pull --platform "$IMAGE_PLATFORM" "$FULL_IMAGE"
  else
    docker pull "$FULL_IMAGE"
  fi
  pull_rc=$?
  set -e

  if [[ $pull_rc -ne 0 ]]; then
    echo ""
    echo "Unable to pull image: $FULL_IMAGE"
    echo "   This usually means the tag is missing your platform manifest."
    echo "   Publish multi-arch from source: ./docker-image-create.sh $IMAGE_TAG"
    echo "   Or try explicit platform (if available):"
    echo "   IMAGE_PLATFORM=linux/amd64 ./docker-start.sh $IMAGE_TAG"
    echo "   IMAGE_PLATFORM=linux/arm64 ./docker-start.sh $IMAGE_TAG"
    exit $pull_rc
  fi
else
  echo "Skipping pull (SKIP_PULL=1). Using cached image: $FULL_IMAGE"
fi

echo ""
echo "Starting container '$CONTAINER_NAME'"
echo "   Image : $FULL_IMAGE"
echo "   Port  : 9000 → 9000"
echo ""

DOCKER_ARGS=(
  run --rm -it
  --name "$CONTAINER_NAME"
  --add-host host.docker.internal:host-gateway
  -p 9000:9000
)

if [[ -n "$IMAGE_PLATFORM" ]]; then
  DOCKER_ARGS+=( --platform "$IMAGE_PLATFORM" )
fi

if [[ -n "${DATABASE_URL:-}" ]]; then
  DOCKER_ARGS+=( -e "DATABASE_URL=$DATABASE_URL" )
fi

if [[ -n "${CONFIG_PATH:-}" ]]; then
  DOCKER_ARGS+=( -e "CONFIG_PATH=$CONFIG_PATH" )
fi

DOCKER_ARGS+=( "$FULL_IMAGE" )

docker "${DOCKER_ARGS[@]}"
