# Prototype Code Rules

**Applies to:** `prototypes/**`

## Relaxed Standards

Prototype code intentionally has **lower standards** than production code:

- Hardcoded values are **allowed**
- Tests are **not required**
- Copy-paste code is **tolerated**
- Quick and dirty is **encouraged**

## Required Elements

Every prototype directory must contain:

1. **README.md** with:
   - Hypothesis being tested
   - Success criteria (what proves/disproves the hypothesis)
   - Current status (In Progress / Complete / Abandoned)
   - Findings and verdict (Ship It / Rework / Kill It)

2. **Hypothesis documented** in code comments or README

## Constraints

- Prototype code must **never be copied directly** to `src/` for production
- Prototypes must be **isolated** — they should not import from `src/` or vice versa
- Assets in prototypes should be **placeholder** only (colored rectangles, free sounds)
- Prototypes should be completable in **1-4 hours**

## When to Promote

A prototype graduates to production only when:
- Hypothesis is validated (success criteria met)
- A production GDD exists for the system
- Code is rewritten following production rules (not copied)
- Tests are written for the production implementation
