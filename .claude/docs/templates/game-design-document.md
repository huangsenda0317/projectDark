# [System Name] Design

> **System:** [Name]
> **Game:** [Game Title]
> **Designer:** [Name]
> **Date:** [YYYY-MM-DD]
> **Status:** [Draft / Review / Approved / Implemented]

---

## 1. Overview

[One-paragraph summary. A stranger should understand what this system does and why it exists.]

## 2. Player Fantasy

[What does the player imagine/feel when using this system? What emotional experience does it create?]

> When the player interacts with this system, they should feel...

## 3. Detailed Rules

[Unambiguous mechanical rules. If two designers read this, they would build the same thing.]

### 3.1 [Sub-system / Feature]

[Detailed rules]

### 3.2 [Sub-system / Feature]

[Detailed rules]

## 4. Formulas

[Every calculation, with variable definitions and ranges.]

```
result = base_value * (1 + modifier_stat * multiplier)

Where:
- base_value: defined in assets/data/system_config.json, default 10
- modifier_stat: player's relevant stat (0-100)
- multiplier: per-level scaling factor, default 0.1
- result is clamped to [min, max] defined in config
```

## 5. Edge Cases

[Explicitly resolved. No "TBD".]

| Situation | Resolution |
|-----------|-----------|
| [What happens when X is 0?] | [Behavior] |
| [What happens when Y exceeds max?] | [Behavior] |
| [What happens if Z fails?] | [Behavior] |

## 6. Dependencies

**Depends on:**
- [system-name.md] (for [specific dependency])

**Used by:**
- [system-name.md] (for [specific usage])

## 7. Tuning Knobs

[Values designers can safely change, with safe ranges.]

| Parameter | Default | Safe Range | Description |
|-----------|---------|-----------|-------------|
| param_name | 10 | 5-20 | What this controls |

## 8. Acceptance Criteria

[How do you test that this works? Specific, measurable.]

- [ ] [Criterion 1: specific testable condition]
- [ ] [Criterion 2: specific testable condition]
- [ ] [Criterion 3: specific testable condition]

---

## Appendix: Reference

### Related Documents
- [Link to related GDD]
- [Link to concept doc]
- [Link to ADR]

### Changelog
| Date | Change | Author |
|------|--------|--------|
| YYYY-MM-DD | Initial draft | [Name] |
