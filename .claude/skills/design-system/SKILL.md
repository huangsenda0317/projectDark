---
name: design-system
description: Guided GDD authoring, section-by-section, with automatic rule checking.
---

# /design-system

## Purpose

Collaboratively write a complete Game Design Document one section at a time, with built-in validation against the design-docs rule.

## Usage

```
/design-system combat-system
/design-system next          # Pick next system from systems-index.md
```

## Workflow

### Step 1: Load Context

Read:
- `design/gdd/systems-index.md` (to understand dependencies)
- Any existing design docs this system depends on
- Game concept and pillars

### Step 2: Create Skeleton

Create the file with all 8 section headers and empty bodies:

```markdown
# [System Name] Design

## 1. Overview

## 2. Player Fantasy

## 3. Detailed Rules

## 4. Formulas

## 5. Edge Cases

## 6. Dependencies

## 7. Tuning Knobs

## 8. Acceptance Criteria
```

Ask: "May I create the skeleton for design/gdd/[system].md?"

### Step 3: Write Each Section Iteratively

For each section:
1. Draft the section in conversation
2. Incorporate user feedback
3. Ask: "May I write this section to the file?"
4. If yes, append to file
5. Update `production/session-state/active.md` with progress

This keeps live context small — only the current section is in conversation.

### Step 4: Run Design Review

After all sections are complete:
```
/design-review design/gdd/[system].md
```

Fix any issues flagged.

### Step 5: Update Systems Index

Mark the system as "Reviewed" in `design/gdd/systems-index.md`.

## Collaboration Protocol

- Write skeleton first, get approval
- One section at a time to prevent context overflow
- Show drafts before writing to file
- Validate against the 8-section standard continuously
