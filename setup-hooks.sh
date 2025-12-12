#!/bin/bash

# Git hooksをセットアップするスクリプト

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
HOOKS_DIR="$SCRIPT_DIR/.git/hooks"
CUSTOM_HOOKS_DIR="$SCRIPT_DIR/.githooks"

echo "🔧 Setting up Git hooks..."

# .git/hooks ディレクトリが存在することを確認
if [ ! -d "$HOOKS_DIR" ]; then
    echo "❌ Error: .git/hooks directory not found. Are you in a Git repository?"
    exit 1
fi

# カスタムフックをコピー
if [ -d "$CUSTOM_HOOKS_DIR" ]; then
    for hook in "$CUSTOM_HOOKS_DIR"/*; do
        if [ -f "$hook" ]; then
            hook_name=$(basename "$hook")
            cp "$hook" "$HOOKS_DIR/$hook_name"
            chmod +x "$HOOKS_DIR/$hook_name"
            echo "✅ Installed: $hook_name"
        fi
    done
else
    echo "❌ Error: .githooks directory not found"
    exit 1
fi

echo "🎉 Git hooks setup complete!"
echo ""
echo "Now, version info will be automatically updated on every commit."
