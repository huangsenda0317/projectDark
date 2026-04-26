# Quick Start Guide

## First Time Setup

1. **Run `/start`** — The skill detects your project stage and routes you correctly
2. **Choose engine**: `/setup-engine godot 4.3` (or your version)
3. **Create concept**: `/brainstorm` (if no game idea yet)

## Daily Workflow

```
1. Start Claude Code session
   (session-start.sh shows branch, sprint, recent commits)

2. Pick a task from the sprint plan
   "I'm working on the damage calculation system"

3. Implement with agent help
   - Read design doc first
   - Ask gameplay-programmer for implementation
   - Write tests alongside code

4. Commit work
   (validate-commit.sh checks for hardcoded values, TODO format, JSON validity)

5. /clear when switching topics or context is full
```

## Common Commands

| Command | When to Use |
|---------|-------------|
| `/start` | New project, new session, unsure what to do |
| `/brainstorm` | Need game ideas |
| `/map-systems` | Ready to break concept into systems |
| `/design-system [system]` | Write a GDD section |
| `/design-review [file]` | Validate a design doc |
| `/sprint-plan new` | Plan next sprint |
| `/code-review [file]` | Review code quality |
| `/prototype "hypothesis"` | Validate risky mechanic |
| `/gate-check [phase]` | Check readiness to advance |
| `/team-combat "feature"` | Multi-agent combat feature |
| `/team-ui "feature"` | Multi-agent UI feature |

## Getting Help

- **"What agents do I have?"** → Read `.claude/docs/agent-roster.md`
- **"How do agents coordinate?"** → Read `.claude/docs/agent-coordination-map.md`
- **"What rules apply here?"** → Check `.claude/rules/` for path-scoped rules
- **"What's my current stage?"** → Run `/project-stage-detect`

## Troubleshooting

| Problem | Solution |
|---------|----------|
| Context getting full | Update `active.md`, then `/clear` |
| Forgot where we left off | Read `production/session-state/active.md` |
| Design doc missing sections | Run `/design-review` on the file |
| Code has hardcoded values | Check `assets/data/` — values should live there |
| Unsure which agent to use | Read `agent-coordination-map.md` |
