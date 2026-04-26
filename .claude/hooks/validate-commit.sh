#!/usr/bin/env bash
# validate-commit.sh -- Pre-commit validation hook
# Checks for hardcoded values, TODO format, JSON validity, design doc completeness

set -e

EXIT_CODE=0

echo "=== Pre-Commit Validation ==="

# Get list of staged files
STAGED=$(git diff --cached --name-only 2>/dev/null || true)

if [ -z "$STAGED" ]; then
  echo "No staged files."
  exit 0
fi

# Check for hardcoded magic numbers in gameplay code
echo "[1/5] Checking for hardcoded values in gameplay code..."
GAMEPLAY_FILES=$(echo "$STAGED" | grep -E "^src/gameplay/|^prototypes/.*/scripts/gameplay/" || true)
if [ -n "$GAMEPLAY_FILES" ]; then
  HARDCODED=$(echo "$GAMEPLAY_FILES" | while read f; do
    git show ":$f" 2>/dev/null | grep -En "[^0-9a-zA-Z_]([2-9][0-9]+|1[0-9]{2,})[^0-9a-zA-Z_]" || true
  done)
  if [ -n "$HARDCODED" ]; then
    echo "  WARNING: Potential hardcoded values found:"
    echo "$HARDCODED" | head -20
    EXIT_CODE=1
  else
    echo "  OK"
  fi
else
  echo "  Skipped (no gameplay files)"
fi

# Check TODO format
echo "[2/5] Checking TODO format..."
TODO_ISSUES=$(echo "$STAGED" | while read f; do
  git show ":$f" 2>/dev/null | grep -En "TODO[^:]" || true
done)
if [ -n "$TODO_ISSUES" ]; then
  echo "  WARNING: TODOs must use 'TODO:' format:"
  echo "$TODO_ISSUES" | head -10
  EXIT_CODE=1
else
  echo "  OK"
fi

# Validate JSON files
echo "[3/5] Validating JSON files..."
JSON_FILES=$(echo "$STAGED" | grep "\.json$" || true)
if [ -n "$JSON_FILES" ]; then
  JSON_ERRORS=$(echo "$JSON_FILES" | while read f; do
    if command -v python3 >/dev/null 2>&1; then
      python3 -m json.tool <(git show ":$f" 2>/dev/null) >/dev/null 2>&1 || echo "  Invalid JSON: $f"
    elif command -v jq >/dev/null 2>&1; then
      git show ":$f" 2>/dev/null | jq empty 2>&1 >/dev/null || echo "  Invalid JSON: $f"
    fi
  done)
  if [ -n "$JSON_ERRORS" ]; then
    echo "$JSON_ERRORS"
    EXIT_CODE=1
  else
    echo "  OK"
  fi
else
  echo "  Skipped (no JSON files)"
fi

# Check design docs have required sections
echo "[4/5] Checking design docs..."
GDD_FILES=$(echo "$STAGED" | grep "^design/gdd/" || true)
if [ -n "$GDD_FILES" ]; then
  MISSING_SECTIONS=$(echo "$GDD_FILES" | while read f; do
    CONTENT=$(git show ":$f" 2>/dev/null || true)
    for section in "Overview" "Player Fantasy" "Detailed Rules" "Formulas" "Edge Cases" "Dependencies" "Tuning Knobs" "Acceptance Criteria"; do
      if ! echo "$CONTENT" | grep -q "$section"; then
        echo "  Missing section '$section' in $f"
      fi
    done
  done)
  if [ -n "$MISSING_SECTIONS" ]; then
    echo "$MISSING_SECTIONS"
    EXIT_CODE=1
  else
    echo "  OK"
  fi
else
  echo "  Skipped (no GDD changes)"
fi

# Check for .env or credential files
echo "[5/5] Checking for secrets..."
SECRETS=$(echo "$STAGED" | grep -E "\.env|credentials|secret|token|password" -i || true)
if [ -n "$SECRETS" ]; then
  echo "  WARNING: Potential secrets staged:"
  echo "$SECRETS"
  EXIT_CODE=1
else
  echo "  OK"
fi

if [ $EXIT_CODE -ne 0 ]; then
  echo ""
  echo "VALIDATION FAILED. Fix issues or use --no-verify to bypass."
  exit 1
else
  echo ""
  echo "All checks passed."
  exit 0
fi
