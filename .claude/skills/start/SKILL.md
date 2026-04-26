---
name: start
description: Guided onboarding flow for new projects. Detects current stage and routes to the right workflow.
---

# /start

## Purpose

The `/start` skill is the entry point for new users or new projects. It detects where you are in the development journey and routes you to the correct next step.

## When to Use

- First time opening the project
- When you're unsure what to do next
- After a long break from the project

## Workflow

### Step 1: Detect Current Stage

The skill analyzes the project state:

1. **No engine configured** → Route to `/setup-engine`
2. **No game concept** → Route to `/brainstorm`
3. **Concept exists, no GDD** → Route to `/map-systems`
4. **GDD exists, no prototype** → Route to `/prototype`
5. **Prototype exists, no production code** → Route to `/sprint-plan new`
6. **Production code exists** → Show project dashboard

### Step 2: Present Options

If stage is ambiguous, ask the user:

```
I detected your project is at: [STAGE]

What would you like to do?
A) Continue with current stage
B) Jump to a different workflow
C) Review project status
```

### Step 3: Route to Appropriate Skill

Delegate to the relevant skill based on user selection.

## Collaboration Protocol

- Always ask before making assumptions
- Present detected stage with reasoning
- Allow user to override auto-detection
- Never skip steps the user hasn't completed
