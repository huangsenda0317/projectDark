# Design Document Rules

**Applies to:** `design/gdd/**`, `design/narrative/**`, `design/levels/**`, `docs/architecture/**`

## Required 8 Sections

Every Game Design Document must contain these sections:

| # | Section | Description |
|---|---------|-------------|
| 1 | **Overview** | One-paragraph summary of the system |
| 2 | **Player Fantasy** | What the player imagines/feels when using this system |
| 3 | **Detailed Rules** | Unambiguous mechanical rules — two designers would build the same thing |
| 4 | **Formulas** | Every calculation, with variable definitions and ranges |
| 5 | **Edge Cases** | What happens in weird situations? Explicitly resolved |
| 6 | **Dependencies** | What other systems this connects to (bidirectional) |
| 7 | **Tuning Knobs** | Which values designers can safely change, with safe ranges |
| 8 | **Acceptance Criteria** | How do you test that this works? Specific, measurable |

## Formula Format

All formulas must use this structure:

```
result = base_value * (1 + modifier_stat * multiplier)

Where:
- base_value: defined in assets/data/system_config.json, default 10
- modifier_stat: player's relevant stat (0-100)
- multiplier: per-level scaling factor, default 0.1
- result is clamped to [min, max] defined in config
```

## Edge Case Requirements

- Every formula must specify behavior at boundary values (0, max, negative)
- Every state transition must specify what happens if the transition fails
- Every random event must specify the distribution and seed behavior

## Dependency Format

Dependencies must be bidirectional:
```
Depends on: combat-system.md (for damage formulas)
Used by: progression-system.md (for XP rewards), inventory-system.md (for loot tables)
```

## Tuning Knobs Format

```
| Parameter | Default | Safe Range | Description |
|-----------|---------|-----------|-------------|
| base_damage | 10 | 5-20 | Base damage before modifiers |
| crit_multiplier | 2.0 | 1.5-3.0 | Critical hit damage multiplier |
```

## Acceptance Criteria Format

Must be testable and measurable:
```
- [ ] Player with 50 STR deals 15 damage to target with 0 armor (formula: 10 * (1 + 50*0.1))
- [ ] Critical hit with base config deals 20 damage
- [ ] Negative damage input is clamped to 0
- [ ] All values load from config file; changing config changes output
```
