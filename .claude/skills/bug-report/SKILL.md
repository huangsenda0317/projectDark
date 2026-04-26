---
name: bug-report
description: Create structured bug reports with severity, reproduction steps, and affected systems.
---

# /bug-report

## Purpose

Generate consistent, actionable bug reports.

## Usage

```
/bug-report "healing spell applies damage instead of healing when target has shield buff"
```

## Template

```markdown
# Bug Report: [Title]

## Severity
[ Critical / Major / Minor / Cosmetic ]

## Priority
[ P0 (blocker) / P1 / P2 / P3 / P4 ]

## Environment
- Engine: [version]
- Platform: [OS]
- Commit: [hash]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Affected System
[Combat / UI / Progression / etc.]

## Related Design Doc
[Link to GDD section]

## Screenshots/Logs
[Attach if available]
```

## Collaboration Protocol

- Ask for reproduction steps if not provided
- Suggest severity/priority with reasoning
- Get user confirmation before writing
