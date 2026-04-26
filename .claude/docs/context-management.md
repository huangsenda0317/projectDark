# Context Management

## File-Backed State Strategy

To survive context compaction and session crashes, all important decisions are persisted to files. The live conversation context only holds the **current topic**.

## Active Session State

`production/session-state/active.md` tracks what's happening right now:

```markdown
# Active Session State

## Current Sprint
[Sprint name and goal]

## In Progress
- [Feature name] — [status]

## Blockers
- [Blocker description]

## Recent Decisions
- [Decision made in last session]

<!-- STATUS -->
Production | Combat System > Damage Calculator > Formula Validation
<!-- /STATUS -->
```

Update this file at the end of every session or after major decisions.

## Incremental Document Writing

For multi-section documents (GDDs, architecture docs):

1. Create file with skeleton (all headers, empty bodies)
2. For EACH section:
   - Draft in conversation
   - Revise with user
   - Write approved section to file
   - Update active.md
   - Conversation context can now be compacted (decisions are in the file)

## Recovery After Compaction

If context is compacted mid-session:

1. Read `production/session-state/active.md` — know what's happening
2. Read the file being worked on — see completed sections
3. Resume from where you left off

## Context Budget

- Start compacting when context reaches ~65-70%
- Before compaction, ensure active.md is up to date
- Use `/clear` to start completely fresh when switching topics

## Session Start Recovery

The `session-start.sh` hook automatically loads:
- Current git branch and recent commits
- Active sprint context
- Current stage from `production/stage.txt`

This gives you immediate context even after a long break.
