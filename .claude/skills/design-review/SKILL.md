---
name: design-review
description: Validate design documents against the 8-section standard and flag gaps.
---

# /design-review

## Purpose

Ensure every design document meets the project's quality standard before implementation begins.

## Usage

```
/design-review design/gdd/combat-system.md
/design-review --all design/gdd/
```

## Validation Checklist

For each document, verify all 8 required sections:

| # | Section | Check |
|---|---------|-------|
| 1 | **Overview** | Present? Concise? |
| 2 | **Player Fantasy** | Describes emotional experience? |
| 3 | **Detailed Rules** | Unambiguous? Two designers would agree? |
| 4 | **Formulas** | All variables defined? Ranges specified? |
| 5 | **Edge Cases** | Explicitly resolved? No "TBD"? |
| 6 | **Dependencies** | Bidirectional? Complete? |
| 7 | **Tuning Knobs** | Safe ranges specified? |
| 8 | **Acceptance Criteria** | Testable and measurable? |

## Additional Checks

- **Consistency**: No contradictions with other design docs
- **Scope**: Does this belong in MVP, Alpha, or Full Vision?
- **Dependencies**: Are referenced docs already written?
- **Pillar Alignment**: Does this support the game's core pillars?

## Output Format

```markdown
## Design Review: [filepath]

### Section Completeness
| Section | Status | Notes |
|---------|--------|-------|
| Overview | ✅ / ❌ | |
| ... | | |

### Critical Issues
1. [Issue] → [Suggested fix]

### Recommendations
1. [Recommendation]

### Verdict
[ PASS / PASS with notes / NEEDS REVISION ]
```

## Collaboration Protocol

- Flag every missing section explicitly
- Never approve a doc with "TBD" in Edge Cases
- Suggest improvements but let user decide
- Update doc status in `design/gdd/systems-index.md`
