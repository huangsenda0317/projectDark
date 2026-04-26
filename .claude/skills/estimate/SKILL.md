---
name: estimate
description: Provide time estimates for tasks or features with uncertainty ranges.
---

# /estimate

## Purpose

Generate realistic development time estimates with uncertainty.

## Usage

```
/estimate "implement dice system with 5 dice types"
/estimate --sprint production/sprints/sprint-01.md
```

## Estimation Method

Use three-point estimation:
- **Optimistic**: Best case (experienced, no blockers)
- **Realistic**: Most likely
- **Pessimistic**: Worst case (learning curve, unknowns)

Formula: `(O + 4R + P) / 6`

## Output Format

```markdown
## Estimate: [Feature]

### Breakdown
| Task | Optimistic | Realistic | Pessimistic | Expected |
|------|-----------|-----------|-------------|----------|
| [task] | Xh | Yh | Zh | Wh |

### Total
- **Expected:** X hours (~Y days at 4h/day)
- **Range:** [optimistic] - [pessimistic]

### Assumptions
- [Assumption 1]
- [Assumption 2]

### Risks
- [Risk that could push to pessimistic]
```

## Collaboration Protocol

- Always provide ranges, not single numbers
- List assumptions explicitly
- Flag high-uncertainty items
