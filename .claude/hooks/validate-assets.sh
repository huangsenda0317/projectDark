#!/usr/bin/env bash
# validate-assets.sh -- Asset validation hook
# Validates naming conventions and JSON structure for files in assets/

FILE="$1"

if [ -z "$FILE" ]; then
  echo "Usage: validate-assets.sh <filepath>"
  exit 0
fi

# Only validate files in assets/
case "$FILE" in
  assets/*) ;;
  *) exit 0 ;;
esac

echo "=== Asset Validation: $FILE ==="

# Check naming convention (snake_case)
BASENAME=$(basename "$FILE")
if echo "$BASENAME" | grep -qE "[A-Z\-]"; then
  echo "WARNING: Asset filenames should use snake_case: $BASENAME"
fi

# Validate JSON data files
if echo "$FILE" | grep -q "\.json$"; then
  if command -v python3 >/dev/null 2>&1; then
    python3 -m json.tool "$FILE" >/dev/null 2>&1 || echo "WARNING: Invalid JSON: $FILE"
  elif command -v jq >/dev/null 2>&1; then
    jq empty "$FILE" 2>&1 >/dev/null || echo "WARNING: Invalid JSON: $FILE"
  fi
fi

echo "Done."
