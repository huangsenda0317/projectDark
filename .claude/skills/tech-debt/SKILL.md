---
name: tech-debt
description: Scan codebase for technical debt and categorize by priority.
---

# /tech-debt

## Purpose

Identify and prioritize technical debt before release.

## Usage

```
/tech-debt
/tech-debt --category refactoring
```

## Scans For

- TODO/FIXME/HACK comments
- Code duplication
- Overly complex functions (cyclomatic complexity)
- Missing tests
- Outdated dependencies
- Unused imports/variables
- Hardcoded values in production code

## Output Format

```markdown
## Technical Debt Report

### Critical (fix before release)
| File | Issue | Effort |
|------|-------|--------|
| [file] | [description] | [S/M/L] |

### High (fix if time)
...

### Medium (defer to post-release)
...

### Low (nice to have)
...
```

## Collaboration Protocol

- Categorize by risk, not just code smell
- Estimate effort for each item
- Let user decide what to fix vs defer
