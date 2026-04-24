#!/usr/bin/env bash
# Build and upload OpenAgents binaries to GitLab Generic Package Registry.
# Usage:
#   GITLAB_TOKEN=<token> ./scripts/publish-internal.sh

set -euo pipefail

GITLAB_HOST="gitlab.chehejia.com"
GITLAB_PROJECT="zhoumingzhu%2Fli-openagents"
NAME="openagents"
VERSION="latest"

TOKEN="${GITLAB_TOKEN:?GITLAB_TOKEN is not set. Please provide your GitLab access token.}"

ROOT_DIR=$(pwd)
DIST="$ROOT_DIR/release"
rm -rf "$DIST" && mkdir -p "$DIST"

echo "================================================="
echo "   OpenAgents 私有化构建与发布脚本"
echo "================================================="

# 1. 构建命令行核心包 (CLI)
echo "==> [1/2] Building core components (agent-connector)..."
cd "$ROOT_DIR/packages/agent-connector"
rm -f *.tgz
TGZ_FILE=$(npm pack)
mv "$TGZ_FILE" "$DIST/agent-launcher-latest.tgz"
echo "  => dist/agent-launcher-latest.tgz"

# 2. 构建桌面端 (Launcher)
echo ""
echo "==> [2/2] Building macOS desktop app (Launcher)..."
cd "$ROOT_DIR/packages/launcher"
npm run build:mac
find dist -name "*.zip" -exec cp {} "$DIST/" \;
echo "  => dist/*.zip"

# 3. 上传到 GitLab Generic Package Registry
echo ""
echo "==> Uploading to GitLab Package Registry (${GITLAB_HOST})..."

cd "$DIST"
for file in *; do
  if [ -f "$file" ]; then
    # Replace spaces with hyphens to avoid curl URL malformed errors
    safe_file="${file// /-}"
    if [ "$file" != "$safe_file" ]; then
      mv "$file" "$safe_file"
    fi
    echo "  -> uploading: $safe_file"
    # Use -sS to hide progress meter but show errors. We capture HTTP code in a variable.
    HTTP_CODE=$(curl -sS -o /dev/null -w "%{http_code}" --upload-file "$safe_file" \
      --header "PRIVATE-TOKEN: ${TOKEN}" \
      "https://${GITLAB_HOST}/api/v4/projects/${GITLAB_PROJECT}/packages/generic/${NAME}/${VERSION}/${safe_file}")
      
    if [ "$HTTP_CODE" != "200" ] && [ "$HTTP_CODE" != "201" ]; then
      echo "❌ Upload failed with HTTP status: $HTTP_CODE"
      echo "  👉 If you see 403, your GITLAB_TOKEN might belong to a different project or lacks 'api' scope."
      echo "  👉 If you see 413, the file is too large for the GitLab server configuration."
      exit 1
    fi
  fi
done

echo ""
echo "================================================="
echo "🎉 发布完成！"
echo "所有的产物已成功上传到 GitLab Package Registry。"
echo "================================================="
