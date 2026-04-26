#!/usr/bin/env bash
# log-agent.sh -- Agent audit hook
# Logs all subagent invocations for traceability

LOG_DIR="production/session-logs"
mkdir -p "$LOG_DIR"

DATE=$(date +%Y-%m-%d)
LOGFILE="$LOG_DIR/agents-$DATE.log"

# Arguments passed by the orchestrator (if any)
AGENT_NAME="$1"
TASK_DESC="$2"
TIME=$(date +%H:%M:%S)

if [ -n "$AGENT_NAME" ]; then
  echo "[$TIME] Agent: $AGENT_NAME | Task: $TASK_DESC" >> "$LOGFILE"
fi
