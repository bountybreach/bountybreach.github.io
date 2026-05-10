#!/usr/bin/env bash
# ====================================================
# docker-start.sh – Pull and start the SecureOne Scan
# Agent Docker container from GHCR in config-manager mode.
#
# Usage:
#   ./docker-start.sh             # prompts for image tag
#   ./docker-start.sh v3.0.1     # tag as argument
#   ./docker-start.sh latest
#   IMAGE_TAG=v3.0.2 ./docker-start.sh
# ====================================================
set -euo pipefail

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$ROOT_DIR"

# ── Configurable defaults ────────────────────────────
IMAGE_REGISTRY="${IMAGE_REGISTRY:-ghcr.io/bountybreach}"
IMAGE_NAME="${IMAGE_NAME:-secureone_scan_agent}"
CONTAINER_NAME="${CONTAINER_NAME:-secureone-scan-agent}"
SECUREONE_AGENT_MODE="${SECUREONE_AGENT_MODE:-config-manager}"
IMAGE_PLATFORM="${IMAGE_PLATFORM:-}"
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

# ── Resolve image tag (arg > env > interactive prompt) ─
if [[ -n "${1:-}" ]]; then
  IMAGE_TAG="$1"
elif [[ -n "${IMAGE_TAG:-}" ]]; then
  : # already set in environment
else
  read -rp "Image tag (e.g. latest, v3.0.1, v3.0.2): " IMAGE_TAG
  IMAGE_TAG="${IMAGE_TAG:-latest}"
fi

FULL_IMAGE="${IMAGE_REGISTRY}/${IMAGE_NAME}:${IMAGE_TAG}"

VALID_MODES=("agent" "factory" "cicd" "cicd-workspace" "config-manager")
valid_mode=false
for m in "${VALID_MODES[@]}"; do
  if [[ "$SECUREONE_AGENT_MODE" == "$m" ]]; then
    valid_mode=true
    break
  fi
done

if [[ "$valid_mode" != "true" ]]; then
  echo "Unknown SECUREONE_AGENT_MODE: '$SECUREONE_AGENT_MODE'"
  echo "   Valid options: ${VALID_MODES[*]}"
  exit 1
fi

# ── Check if container is already running ────────────
if docker inspect --format '{{.State.Running}}' "$CONTAINER_NAME" 2>/dev/null | grep -q "^true$"; then
  echo "Container '$CONTAINER_NAME' is already running."
  echo "   Use ./docker-stop.sh to stop it first, or set CONTAINER_NAME to a different name."
  exit 1
fi

# ── Remove stopped container with same name if present
if docker inspect "$CONTAINER_NAME" >/dev/null 2>&1; then
  echo "Removing stopped container '$CONTAINER_NAME'..."
  docker rm "$CONTAINER_NAME"
fi

# ── Pull latest image from GHCR ──────────────────────
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
  echo "Skipping pull (SKIP_PULL=1). Using locally cached image: $FULL_IMAGE"
fi

# ── Detect Windows (Git Bash) and handle path conversion ─
# On Windows with Git Bash, MSYS auto-converts /var/run to Windows paths, which breaks mounts.
# The docker.sock mount is only needed on native Linux anyway.
IS_WINDOWS=false
if uname -s 2>/dev/null | grep -iq "MINGW\|CYGWIN\|MSYS"; then
  IS_WINDOWS=true
  export MSYS_NO_PATHCONV=1
fi

# ── Start container ───────────────────────────────────
echo ""
echo "Starting container '$CONTAINER_NAME'"
echo "   Mode  : $SECUREONE_AGENT_MODE"
echo "   Image : $FULL_IMAGE"
echo "   Ports : 9001 → 9001 | 9100 → 9100 | 9101 → 9101"
echo "   Network mapping: host.docker.internal → host-gateway"
if [[ "$IS_WINDOWS" == "true" ]]; then
  echo "   Windows detected: skipping docker.sock mount (not available on Docker Desktop)"
fi
echo ""

DOCKER_ARGS=(
  run --rm -it
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

if [[ -n "$IMAGE_PLATFORM" ]]; then
  DOCKER_ARGS+=( --platform "$IMAGE_PLATFORM" )
fi

if [[ -n "${FASTAPI_URL:-}" ]]; then
  DOCKER_ARGS+=( -e "FASTAPI_URL=$FASTAPI_URL" )
fi

DOCKER_ARGS+=( "$FULL_IMAGE" )

docker "${DOCKER_ARGS[@]}"

echo "Container started: $CONTAINER_NAME"
echo ""
echo "   Shared workspace volume: ${SECUREONE_WORKSPACE_VOLUME} -> ${WORKSPACE_DIR_IN_CONTAINER}"
echo "   License data dir: ${LICENSE_DATA_DIR} -> /app/data/license"
echo "   License server URL: $LICENSE_SERVER_URL"
if [[ "$SECUREONE_AGENT_MODE" == "config-manager" ]]; then
  echo "   Config Manager UI: http://localhost:9101"
fi
echo "   docker logs -f $CONTAINER_NAME"
echo ""

if [[ -n "${FASTAPI_URL:-}" ]]; then
  echo "   Agent API target override: $FASTAPI_URL"
fi
echo ""
