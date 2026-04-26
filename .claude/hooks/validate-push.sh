#!/usr/bin/env bash
# validate-push.sh -- Pre-push validation hook
# Warns on pushes to protected branches

set -e

BRANCH=$(git rev-parse --abbrev-ref HEAD 2>/dev/null || echo "unknown")
PROTECTED_BRANCHES="main master release/*"

echo "=== Pre-Push Validation ==="
echo "Branch: $BRANCH"

for protected in $PROTECTED_BRANCHES; do
  case "$BRANCH" in
    $protected)
      echo ""
      echo "WARNING: You are pushing to a protected branch ($BRANCH)."
      echo "Protected branches: $PROTECTED_BRANCHES"
      echo ""
      read -p "Continue with push? [y/N] " -n 1 -r < /dev/tty
      echo ""
      if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        echo "Push aborted."
        exit 1
      fi
      ;;
  esac
done

echo "Push validation passed."
exit 0
