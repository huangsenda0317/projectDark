---
name: code-review
description: Collaborative architectural review of code changes with rule enforcement and actionable recommendations.
---

# /code-review

## Purpose

Perform structured code reviews that check architectural compliance, SOLID principles, testability, and performance.

## Usage

```
/code-review src/gameplay/combat/damage_calculator.gd
/code-review --diff HEAD~1
```

## Workflow

### Step 1: Read Target

Read the specified file(s) or diff.

### Step 2: Check Against Rules

Verify compliance with path-scoped rules:
- `src/gameplay/**` → gameplay-code rules
- `src/ai/**` → ai-code rules
- `src/ui/**` → ui-code rules
- `tests/**` → test-standards rules

### Step 3: Review Categories

| Category | What to Check |
|----------|--------------|
| **Architectural Compliance** | Matches ADRs, follows project patterns |
| **SOLID Principles** | Single responsibility, dependency inversion, etc. |
| **Testability** | Can be unit tested? Dependencies mockable? |
| **Performance** | Allocations in hot paths, algorithmic complexity |
| **Readability** | Naming, comments, complexity |

### Step 4: Prioritize Findings

Label each finding:
- **HIGH**: Must fix before merge
- **MEDIUM**: Should fix, can defer
- **LOW**: Nice to have
- **INFO**: Awareness only

### Step 5: Present and Fix

Present findings with:
- Issue description
- Why it matters
- Suggested fix (with code example)

Ask: "Should I apply the fix?" for each HIGH finding.

## Output Format

```markdown
## Code Review: [filepath]

### Architectural Compliance
- [ ] ✅ / ❌ [finding]

### SOLID
- [ ] ✅ / ❌ [finding]

### Testability
- [ ] ✅ / ❌ [finding]

### Performance
- [ ] ✅ / ⚠️ [finding]

### Recommendations
1. **[HIGH]** [description] → [suggested fix]
2. **[MEDIUM]** [description] → [suggested fix]
```

## Collaboration Protocol

- Explain WHY each issue matters, not just WHAT
- Show refactored code examples
- Apply fixes only with user approval
- Never auto-commit changes
