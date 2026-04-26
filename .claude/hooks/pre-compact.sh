#!/usr/bin/env bash
# pre-compact.sh -- Pre-compaction hook
# Preserves session progress notes before context compression

STATE_FILE="production/session-state/active.md"

if [ -f "$STATE_FILE" ]; then
  echo "Preserving session state before compaction..."
  # The state file already persists progress; this hook serves as a reminder
  # that active context should be in the file, not just in conversation.
  echo "Session state preserved in $STATE_FILE"
else
  echo "No active session state found."
fi
