# Coordination Rules

## Agent Hierarchy

```
Tier 1 — Directors (Opus)
  creative-director    technical-director    producer

Tier 2 — Department Leads (Sonnet)
  game-designer        lead-programmer       art-director
  audio-director       narrative-director    qa-lead
  release-manager      localization-lead

Tier 3 — Specialists (Sonnet/Haiku)
  gameplay-programmer  engine-programmer     ai-programmer
  network-programmer   tools-programmer      ui-programmer
  systems-designer     level-designer        economy-designer
  technical-artist     sound-designer        writer
  world-builder        ux-designer           prototyper
  performance-analyst  devops-engineer       analytics-engineer
  security-engineer    qa-tester             accessibility-specialist
  live-ops-designer    community-manager
```

## Delegation Model

### Vertical Delegation

Directors delegate to leads, leads delegate to specialists.

Example:
```
producer → game-designer → systems-designer
producer → lead-programmer → gameplay-programmer
```

### Horizontal Consultation

Same-tier agents can consult each other but cannot make binding cross-domain decisions.

Example:
```
game-designer consults with narrative-director on story-mechanic integration
BUT neither can override the other's domain decisions
```

### Conflict Resolution

Disagreements escalate to the shared parent:
- Design conflicts → `creative-director`
- Technical conflicts → `technical-director`
- Schedule/resource conflicts → `producer`

### Change Propagation

Cross-department changes are coordinated by `producer`:
```
Combat system change affects:
- gameplay-programmer (implementation)
- technical-artist (VFX)
- sound-designer (SFX)
- ui-programmer (HUD updates)
- qa-tester (regression)

producer coordinates all of the above
```

### Domain Boundaries

Agents don't modify files outside their domain without explicit delegation:

| Agent | Owns | Can Read | Must Ask to Modify |
|-------|------|----------|-------------------|
| gameplay-programmer | `src/gameplay/**` | Design docs, UI specs | `src/ui/**`, `src/ai/**` |
| ui-programmer | `src/ui/**` | Gameplay signals | `src/gameplay/**` |
| game-designer | `design/gdd/**` | All code | `src/**` |
| technical-artist | `assets/**`, shaders | All code | `src/**` |

## Team Skill Orchestration

Team skills (like `/team-combat`) follow this pattern:

1. **Coordinator** asks user clarifying questions
2. **Phase 1**: Design agent creates design → user approves
3. **Phase 2**: Architecture agent proposes structure → user approves
4. **Phase 3**: Multiple specialists work in parallel → each shows work before writing
5. **Phase 4**: Integration agent combines everything → user tests
6. **Phase 5**: QA validates → user approves fixes
7. **Phase 6**: Coordinator reports completion

Decision points stay with the user at every phase transition.
