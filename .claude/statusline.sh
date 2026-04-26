#!/usr/bin/env bash
# Claude Code Game Studios -- Custom Status Line
# Displays production pipeline stage and active task context

# Detect current stage from project artifacts
get_stage() {
  if [ -f "production/stage.txt" ]; then
    cat "production/stage.txt"
    return
  fi

  # Auto-detect from project state
  if [ ! -f "CLAUDE.md" ] || grep -q "\[CHOOSE:" "CLAUDE.md" 2>/dev/null; then
    echo "Setup"
    return
  fi

  if [ ! -f "design/gdd/systems-index.md" ] && [ ! -f "design/gdd/core-loop.md" ]; then
    echo "Concept"
    return
  fi

  if [ -z "$(find src/ -type f 2>/dev/null)" ] && [ -z "$(find prototypes/ -name '*.gd' -o -name '*.cs' -o -name '*.cpp' 2>/dev/null)" ]; then
    echo "Pre-Production"
    return
  fi

  if [ -d "prototypes/" ] && [ -z "$(find src/gameplay/ -type f 2>/dev/null)" ]; then
    echo "Prototyping"
    return
  fi

  if [ -f "production/sprints/sprint-01.md" ]; then
    local latest_sprint=$(ls -1 production/sprints/ 2>/dev/null | sort -V | tail -1)
    if [ -n "$latest_sprint" ]; then
      echo "Production | $(echo "$latest_sprint" | sed 's/\.md$//')"
      return
    fi
  fi

  echo "Production"
}

# Get active task from session state
get_active_task() {
  if [ -f "production/session-state/active.md" ]; then
    local status_block=$(sed -n '/<!-- STATUS -->/,/<!-- \/STATUS -->/p' "production/session-state/active.md" 2>/dev/null)
    if [ -n "$status_block" ]; then
      echo "$status_block" | grep -v "<!--" | head -1 | sed 's/^[[:space:]]*//'
    fi
  fi
}

stage=$(get_stage)
task=$(get_active_task)

if [ -n "$task" ]; then
  echo "$stage > $task"
else
  echo "$stage"
fi
