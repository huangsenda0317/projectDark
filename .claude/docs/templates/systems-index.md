# Systems Index

> **Game:** [Game Title]
> **Date:** [YYYY-MM-DD]
> **Status:** [Draft / Active]

## Foundation Systems

| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| Core Loop | — | All systems | MVP | Not Started |
| Scene Management | — | All scenes | MVP | Not Started |
| Input Handling | — | Player, UI | MVP | Not Started |
| Save/Load | — | Progression, Settings | MVP | Not Started |
| Event Bus | — | All systems | MVP | Not Started |

## Core Systems

| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| Combat | Core Loop, Input | Progression, Inventory | MVP | Not Started |
| Movement | Core Loop, Input | Combat, Exploration | MVP | Not Started |
| Inventory | Core Loop | Combat, Crafting, UI | MVP | Not Started |
| Progression | Core Loop, Save/Load | — | MVP | Not Started |
| Dice System | Core Loop | Movement, Combat | MVP | Not Started |
| Board System | Core Loop, Dice | All board events | MVP | Not Started |

## Feature Systems

| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| Equipment | Inventory | Combat, Progression | MVP | Not Started |
| Card System | Combat | — | MVP | Not Started |
| Faith System | Combat, Board | Village, Progression | Alpha | Not Started |
| Village | Save/Load, Faith | Meta-progression | Alpha | Not Started |
| Events | Board | — | Alpha | Not Started |
| Shop | Inventory, Economy | — | Alpha | Not Started |

## Presentation Systems

| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| UI/HUD | All systems | Player feedback | MVP | Not Started |
| Camera | Scene Management | All scenes | MVP | Not Started |
| VFX | Combat, Board | Visual feedback | Alpha | Not Started |
| Audio | All systems | Immersion | Alpha | Not Started |

## Polish Systems

| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| Tutorial | All core systems | Onboarding | Beta | Not Started |
| Accessibility | UI | Inclusivity | Beta | Not Started |
| Achievements | Save/Load | Player retention | Full Vision | Not Started |
| Analytics | All systems | Data-driven tuning | Full Vision | Not Started |

## Dependency Graph

```
Foundation
  → Core Loop
    → Combat → Equipment → Card System
    → Movement → Board System → Events, Shop
    → Inventory
    → Progression
    → Dice System
  → Scene Management → Camera
  → Input Handling
  → Save/Load → Village, Progression
  → Event Bus
```

## Design Order

1. Foundation systems (all at once, they're interdependent)
2. Core systems in dependency order:
   - Dice System → Board System → Events
   - Combat → Equipment → Card System
   - Inventory
   - Progression
3. Feature systems:
   - Faith System
   - Village
   - Shop
4. Presentation systems (parallel with feature systems)
5. Polish systems (after Beta)
