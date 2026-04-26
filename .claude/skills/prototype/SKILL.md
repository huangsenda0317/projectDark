---
name: prototype
description: Set up and manage throwaway prototypes to validate risky mechanics or technical approaches.
---

# /prototype

## Purpose

Validate uncertain mechanics or technical approaches with minimal time investment.

## Usage

```
/prototype "grappling hook movement with momentum"
/prototype "procedural dungeon generation using cellular automata"
```

## Workflow

### Step 1: Clarify Hypothesis

Ask:
- "What core question does this prototype need to answer?"
- "Is this testing fun, feasibility, or comparing options?"

### Step 2: Define Success Criteria

Collaboratively define 2-4 specific, measurable criteria:

```
Hypothesis: [clear statement]

Success Criteria:
1. [Specific, measurable outcome]
2. [Specific, measurable outcome]
3. [Specific, measurable outcome]
```

### Step 3: Scope the Prototype

Define strict boundaries:
- Timebox: 1-4 hours maximum
- No art, no sound, no polish
- Minimal UI (debug text only)
- Isolate from production code

### Step 4: Create Prototype Structure

Create `prototypes/[prototype-name]/` with:
- `README.md` (hypothesis, criteria, status)
- Minimal code to test the hypothesis
- `project.godot` if standalone Godot prototype

### Step 5: Evaluate

After testing, update README with:
- Findings
- Verdict: **Ship It** / **Rework** / **Kill It**
- What would change for production

## Collaboration Protocol

- Force timeboxing — prototypes must stay small
- Ask for hypothesis before writing code
- Present findings before suggesting next steps
- Never copy prototype code directly to `src/`
