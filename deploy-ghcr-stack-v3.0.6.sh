#!/usr/bin/env bash
set -euo pipefail

# deploy-ghcr-stack.sh
# Pull SecureOne, SecureOne Scan Agent, Jenkins, and common security tool images.
# Works on macOS/Linux and Windows (Git Bash / WSL).
#
# Usage:
#   ./deploy-ghcr-stack.sh
#   ./deploy-ghcr-stack.sh v3.0.6
#   SECUREONE_TAG=v3.0.6 ./deploy-ghcr-stack.sh
#   TOOL_IMAGES="returntocorp/semgrep:latest,owasp/zap2docker-stable:latest" ./deploy-ghcr-stack.sh

if uname -s 2>/dev/null | grep -iq "MINGW\|CYGWIN\|MSYS"; then
  export MSYS_NO_PATHCONV=1
fi

SECUREONE_TAG="${1:-${SECUREONE_TAG:-v3.0.6}}"
SECUREONE_IMAGE="${SECUREONE_IMAGE:-ghcr.io/bountybreach/secureone}"
SCAN_AGENT_IMAGE="${SCAN_AGENT_IMAGE:-ghcr.io/bountybreach/secureone_scan_agent}"
JENKINS_IMAGE="${JENKINS_IMAGE:-jenkins/jenkins:lts-jdk17}"

DEFAULT_TOOL_IMAGES="returntocorp/semgrep:latest zricethezav/gitleaks:latest snyk/snyk-cli:latest owasp/zap2docker-stable:latest"
TOOL_IMAGES_RAW="${TOOL_IMAGES:-$DEFAULT_TOOL_IMAGES}"
TOOL_IMAGES_NORMALIZED="${TOOL_IMAGES_RAW//,/ }"

print_header() {
  echo ""
  echo "=============================================="
  echo " SecureOne Docker Stack Pull Helper"
  echo " Version tag: ${SECUREONE_TAG}"
  echo "=============================================="
  echo ""
}

pull_image() {
  local image="$1"
  echo "Pulling: ${image}"
  docker pull "${image}"
}

print_summary() {
  echo ""
  echo "Done. Pulled images:"
  echo "  - ${SECUREONE_IMAGE}:${SECUREONE_TAG}"
  echo "  - ${SCAN_AGENT_IMAGE}:${SECUREONE_TAG}"
  echo "  - ${JENKINS_IMAGE}"
  for image in ${TOOL_IMAGES_NORMALIZED}; do
    echo "  - ${image}"
  done
  echo ""
  echo "Next steps:"
  echo "  1) Run SecureOne with your existing docker-start/docker-run scripts."
  echo "  2) Start Scan Agent using secureone_scan_agents scripts."
  echo "  3) Use Jenkins and tool images in CI/CD pipelines as needed."
  echo ""
}

main() {
  if ! command -v docker >/dev/null 2>&1; then
    echo "Error: docker command not found. Install Docker Desktop/Engine first."
    exit 1
  fi

  print_header

  pull_image "${SECUREONE_IMAGE}:${SECUREONE_TAG}"
  pull_image "${SCAN_AGENT_IMAGE}:${SECUREONE_TAG}"
  pull_image "${JENKINS_IMAGE}"

  for image in ${TOOL_IMAGES_NORMALIZED}; do
    pull_image "${image}"
  done

  print_summary
}

main "$@"
