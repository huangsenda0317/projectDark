# AI Code Rules

**Applies to:** `src/ai/**`, `src/gameplay/ai/**`, `prototypes/**/scripts/ai/**`

## Performance Budgets

- AI updates must not exceed **2ms/frame** total across all active NPCs
- Worst-case scenario (max NPCs active) must stay under budget
- Use staggered updates: only update a subset of NPCs per frame

## Debuggability

- Every AI decision must be **observable** in debug mode:
  - Current behavior tree node (highlighted)
  - Detection radius (visible circle)
  - Line-of-sight rays (visible lines)
  - Target position (visible marker)
  - Decision scores (visible labels)
- AI state changes must be logged at `verbose` level

## Data-Driven Parameters

All AI tuning values must come from config files:
- Detection ranges, reaction times, patrol points
- Behavior tree node parameters
- Decision weights and scoring curves
- Difficulty scaling multipliers

## Player-Fairness Rules

- Enemy attacks must be **telegraphed** (0.3–0.5s windup) before execution
- AI must use the same rules as the player (no cheating on cooldowns, ranges, or resources)
- AI line-of-sight checks must use the same system as the player's visibility

## Architecture

- Use **behavior trees** or **hierarchical state machines** for complex NPCs
- Share behavior logic across similar enemy types via reusable nodes/states
- Separate **perception** (sensing), **decision** (thinking), and **action** (doing) into distinct systems
