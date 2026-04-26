---
name: gate-check
description: Validate readiness to advance to the next development phase.
---

# /gate-check

## Purpose

Verify that all requirements for the current phase are met before advancing to the next.

## Usage

```
/gate-check "pre-production"
/gate-check "alpha"
```

## Workflow

### Step 1: Define Gate Criteria

For each phase, check standard criteria:

| Phase | Criteria |
|-------|---------|
| **Concept → Pre-Production** | Game pillars defined, concept doc written, engine chosen |
| **Pre-Production → Prototype** | All MVP systems designed, GDDs reviewed, architecture decided |
| **Prototype → Production** | Core mechanic validated, vertical slice playable |
| **Production → Alpha** | All core systems implemented, placeholder art, no blockers |
| **Alpha → Beta** | Content complete, all features in, first balance pass |
| **Beta → Release** | Bug count < threshold, performance targets met, cert ready |

### Step 2: Evaluate Project State

Check project artifacts against criteria:
- Design docs exist and are reviewed?
- Prototype validated with findings?
- Code coverage acceptable?
- No unresolved blockers?

### Step 3: Verdict

- **PASS**: All criteria met. Update `production/stage.txt` to new phase.
- **PARTIAL**: Most criteria met. List blockers and action items.
- **FAIL**: Significant gaps. Do not advance.

## Output Format

```markdown
## Gate Check: [Phase]

### Criteria
| # | Criterion | Status | Evidence |
|---|-----------|--------|----------|
| 1 | [criterion] | ✅ / ❌ | [file/link] |

### Verdict
[ PASS / PARTIAL / FAIL ]

### Action Items
- [ ] [item]
```

## Collaboration Protocol

- Be strict about criteria — gates exist for a reason
- Provide specific evidence for each criterion
- If PARTIAL, clearly distinguish "must fix" from "nice to fix"
- Never advance without user confirmation
