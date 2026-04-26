# Agent Coordination Map

## How to Invoke Agents

```
Ask the [agent-name] agent to [task description]
```

Example:
```
Ask the game-designer agent to design a dice-based movement system
that creates meaningful choices without overwhelming the player.
```

## Common Delegation Patterns

### New Feature (Design → Implementation)

```
1. game-designer → creates GDD section
2. /design-review → validates GDD
3. gameplay-programmer → implements per GDD
4. qa-tester → writes tests
5. /code-review → validates implementation
```

### Combat Feature (Team Orchestration)

```
/team-combat "feature description"
  → game-designer (design)
  → gameplay-programmer (architecture)
  → [parallel] gameplay-programmer + technical-artist + sound-designer (implementation)
  → gameplay-programmer (integration)
  → qa-tester (validation)
```

### Performance Issue

```
1. performance-analyst → profiles and identifies root cause
2. technical-director → approves optimization approach
3. gameplay-programmer / engine-programmer → implements fix
4. performance-analyst → validates improvement
```

### Design Conflict Resolution

```
1. game-designer and narrative-director disagree
2. Both present their cases
3. creative-director evaluates against pillars
4. creative-director makes recommendation
5. You make final decision
```

### Technical Conflict Resolution

```
1. gameplay-programmer and ui-programmer disagree on interface
2. Both present their cases
3. lead-programmer evaluates against architecture
4. technical-director approves or overrides
5. You make final decision
```

## Escalation Quick Reference

| If... | Escalate to |
|-------|------------|
| Creative vision conflict | creative-director |
| Technical architecture conflict | technical-director |
| Schedule/scope conflict | producer |
| Design ambiguity | game-designer |
| Code quality concern | lead-programmer |
| Performance issue | performance-analyst → technical-director |
| Bug severity dispute | qa-lead |
| Cross-department coordination | producer |

## Domain Boundaries

| Topic | Primary Owner | Consult |
|-------|--------------|---------|
| Combat feel | game-designer | gameplay-programmer, technical-artist |
| Combat code | gameplay-programmer | game-designer (for edge cases) |
| Combat VFX | technical-artist | game-designer |
| Combat audio | sound-designer | game-designer, technical-artist |
| UI layout | ux-designer | game-designer |
| UI code | ui-programmer | ux-designer |
| AI behavior | ai-programmer | game-designer |
| Level layout | level-designer | game-designer, narrative-director |
| Story | narrative-director | creative-director, game-designer |
| World lore | world-builder | narrative-director |
| Progression | systems-designer | game-designer, economy-designer |
| Economy | economy-designer | game-designer, systems-designer |
