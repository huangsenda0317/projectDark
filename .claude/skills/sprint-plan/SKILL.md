---
name: sprint-plan
description: Create and manage sprint plans with task breakdowns, capacity tracking, and risk registers.
---

# /sprint-plan

## Purpose

Plan and track development sprints with structured task breakdowns.

## Usage

```
/sprint-plan new              # Create a new sprint
/sprint-plan status           # Check current sprint status
/sprint-plan next             # Plan next sprint based on velocity
```

## Workflow: New Sprint

### Step 1: Gather Context

- "What's your primary goal for this sprint? (One sentence)"
- "How much time do you have available? (hours or days)"
- "Any blockers or dependencies I should know about?"

### Step 2: Break Down Tasks

Categorize tasks into:

| Category | Definition |
|----------|-----------|
| **Must Have** | Sprint fails without these |
| **Should Have** | Important but can slip |
| **Nice to Have** | If time permits |

### Step 3: Estimate and Validate

- Assign rough hour estimates to each task
- Sum estimates and compare to available capacity
- Flag if scope exceeds capacity by >20%

### Step 4: Risk Register

Identify risks:
- Missing design docs (blocker)
- Unfamiliar tech (learning curve)
- Cross-domain dependencies (coordination needed)

### Step 5: Write Sprint Document

Create `production/sprints/sprint-NN.md` with:
- Goal
- Task list with categories and estimates
- Capacity vs scope
- Risk register
- Definition of Done

## Sprint Document Template

```markdown
# Sprint NN: [Goal]

## Goal
[One sentence]

## Tasks

### Must Have
- [ ] Task (Xh)

### Should Have
- [ ] Task (Xh)

### Nice to Have
- [ ] Task (Xh)

## Capacity
Available: Xh | Planned: Yh | Buffer: Zh

## Risks
| Risk | Impact | Mitigation |
|------|--------|-----------|

## Definition of Done
- [ ] All Must-Have tasks complete
- [ ] Code reviewed
- [ ] Tests passing
```

## Collaboration Protocol

- Present task breakdown for approval before writing
- Flag capacity overruns immediately
- Suggest scope cuts when needed
- Update `production/session-state/active.md` with sprint context
