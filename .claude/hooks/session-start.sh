#!/usr/bin/env bash
# session-start.sh -- Session start hook
# Loads sprint context and recent git activity

echo ""
echo "=== Claude Code Game Studios -- Session Context ==="

# Git info
if [ -d ".git" ]; then
  BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "N/A")
  echo "Branch: $BRANCH"

  RECENT=$(git log --oneline -5 2>/dev/null || true)
  if [ -n "$RECENT" ]; then
    echo "Recent commits:"
    echo "$RECENT" | sed 's/^/  /'
  fi
else
  echo "Not a git repository."
fi

# Sprint context
if [ -f "production/session-state/active.md" ]; then
  echo ""
  echo "Active Context:"
  sed -n '/<!-- STATUS -->/,/<!-- \/STATUS -->/p' "production/session-state/active.md" 2>/dev/null | grep -v "<!--" | sed 's/^[[:space:]]*/  /'
fi

# Current stage
if [ -f "production/stage.txt" ]; then
  echo ""
  echo "Stage: $(cat production/stage.txt)"
fi

echo "==================================="
echo ""
