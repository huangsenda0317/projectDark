#!/usr/bin/env bash
# detect-gaps.sh -- Gap detection hook
# Suggests /start for fresh projects, detects missing docs when code exists

echo ""
echo "=== Gap Detection ==="

# Fresh project check
if [ ! -f "CLAUDE.md" ] || grep -q "\[CHOOSE:" "CLAUDE.md" 2>/dev/null; then
  echo "Project appears to be uninitialized."
  echo "Suggestion: Run /start to begin the onboarding flow."
  exit 0
fi

# Missing docs when code exists
CODE_EXISTS=$(find src/ prototypes/ -type f \( -name "*.gd" -o -name "*.cs" -o -name "*.cpp" \) 2>/dev/null | head -1)
GDD_EXISTS=$(find design/gdd/ -type f 2>/dev/null | head -1)

if [ -n "$CODE_EXISTS" ] && [ -z "$GDD_EXISTS" ]; then
  echo "WARNING: Code exists but no design documents found."
  echo "Suggestion: Run /map-systems to create system design docs."
fi

# Prototype without README
for proto_dir in prototypes/*/; do
  if [ -d "$proto_dir" ] && [ ! -f "$proto_dir/README.md" ]; then
    echo "WARNING: Prototype $(basename "$proto_dir") is missing README.md"
  fi
done

echo "Done."
