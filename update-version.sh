#!/bin/bash

# 最新のコミット情報を取得
COMMIT_HASH=$(git rev-parse --short HEAD)
COMMIT_DATE=$(git log -1 --format="%ci")
VERSION=$(date +"%Y.%m.%d-%H%M")

# script.jsのバージョン情報を更新
sed -i.bak "s|// Version: .*|// Version: ${VERSION}|" script.js
sed -i.bak "s|// Build Date: .*|// Build Date: ${COMMIT_DATE}|" script.js
sed -i.bak "s|// Commit: .*|// Commit: ${COMMIT_HASH}|" script.js

# バックアップファイルを削除
rm -f script.js.bak

echo "✅ Version updated: ${VERSION}"
echo "📦 Commit: ${COMMIT_HASH}"
echo "📅 Date: ${COMMIT_DATE}"
