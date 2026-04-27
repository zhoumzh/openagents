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
echo "  => release/agent-launcher-latest.tgz"


# 2. 构建 Launcher UI 的 CLI 安装包
echo ""
echo "==> [2/2] Building UI CLI package (openagentsui)..."
cd "$ROOT_DIR/packages/launcher"
rm -f *.tgz
TGZ_FILE=$(npm pack)
mv "$TGZ_FILE" "$DIST/openagentsui-latest.tgz"
echo "  => release/openagentsui-latest.tgz"

# 3. 生成独立内容哈希 (Content Hash)
echo ""
echo "==> [3/3] Generating Content Hash for independent versioning..."
# Helper function to compute hash of directory source files
get_dir_hash() {
  local dir=$1
  find "$dir" -type f -not -path "*/node_modules/*" -not -path "*/dist/*" -not -path "*/release/*" -not -path "*/.git/*" -not -name "*.tgz" -not -name ".DS_Store" | sort | xargs shasum -a 256 | shasum -a 256 | awk '{print $1}'
}

CORE_HASH=$(get_dir_hash "$ROOT_DIR/packages/agent-connector")
UI_HASH=$(get_dir_hash "$ROOT_DIR/packages/launcher")

cat > "$DIST/version.json" <<EOF
{
  "core": "$CORE_HASH",
  "launcher": "$UI_HASH"
}
EOF
echo "  => release/version.json (core: ${CORE_HASH:0:8}, launcher: ${UI_HASH:0:8})"

# 4. 上传到 GitLab Generic Package Registry
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
