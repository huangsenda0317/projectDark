#!/usr/bin/env bash
# session-stop.sh -- Session stop hook
# Logs accomplishments

LOG_DIR="production/session-logs"
mkdir -p "$LOG_DIR"

DATE=$(date +%Y-%m-%d)
TIME=$(date +%H:%M:%S)
LOGFILE="$LOG_DIR/session-$DATE.log"

echo "" >> "$LOGFILE"
echo "=== Session End: $TIME ===" >> "$LOGFILE"

# Recent commits since last session
if [ -d ".git" ]; then
  LAST_COMMIT=$(git log -1 --format=%H 2>/dev/null || true)
  if [ -n "$LAST_COMMIT" ]; then
    echo "Last commit: $(git log -1 --oneline)" >> "$LOGFILE"
  fi
fi

# Files modified
if [ -d ".git" ]; then
  MODIFIED=$(git diff --name-only 2>/dev/null || true)
  if [ -n "$MODIFIED" ]; then
    echo "Modified files:" >> "$LOGFILE"
    echo "$MODIFIED" | sed 's/^/  /' >> "$LOGFILE"
  fi
fi

echo "Session logged to $LOGFILE"
