# Gameplay Code Rules

**Applies to:** `src/gameplay/**`, `prototypes/**/scripts/gameplay/**`

## Core Principles

1. **Data-Driven Values**: All gameplay constants (damage, speed, cooldowns, ranges) must be loaded from configuration files (`assets/data/*.json` or `.tres` resources). No magic numbers in code.
2. **Delta Time Independence**: All time-based calculations must use `delta` or the engine's equivalent time step. Never assume a fixed frame rate.
3. **No UI References in Gameplay Code**: Gameplay systems must not import, reference, or depend on UI nodes. Use signals/events to communicate state changes.
4. **Deterministic Logic**: Gameplay results must be reproducible given the same inputs and random seed. Avoid floating-point non-determinism where possible.

## Architecture

- Systems should be **stateless utilities** where possible (e.g., `DamageCalculator`)
- Stateful systems should use **dependency injection** for testability
- Prefer **composition over inheritance** for entity behavior
- Use the global `EventBus` (AutoLoad) for cross-system communication

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| Classes | PascalCase | `DamageCalculator` |
| Functions | snake_case | `calculate_damage()` |
| Constants | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| Signals | snake_case, past tense | `damage_taken`, `turn_ended` |
| Config keys | snake_case | `base_damage`, `crit_multiplier` |

## Forbidden Patterns

- Hardcoded numeric literals in gameplay logic (except 0, 1, -1 as array indices or trivial counters)
- Direct `print()` or `console.log()` statements in production gameplay code — use the logging system
- Singleton dependencies that make unit testing impossible
- Gameplay code directly reading input — use an input abstraction layer

## Required Patterns

- Every gameplay system that performs calculations must have corresponding **unit tests**
- All damage/healing/modifier effects must emit signals for VFX/SFX hookup
- State machines must expose their current state for debugging
