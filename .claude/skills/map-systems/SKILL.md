---
name: map-systems
description: Decompose a game concept into all required systems with dependency mapping and priority tiers.
---

# /map-systems

## Purpose

Break down a game concept into a complete systems inventory with dependencies and priorities.

## Usage

```
/map-systems              # Generate full systems map
/map-systems next         # Identify next system to design
```

## Workflow

### Step 1: Enumerate Systems

From the game concept, identify all systems needed:

**Foundation Systems** (design first):
- Core loop
- Input handling
- Scene management
- Save/load

**Core Systems** (design second):
- Combat
- Movement
- Inventory
- Progression

**Feature Systems** (design third):
- Crafting
- Dialogue
- Quests
- Economy

**Presentation Systems** (design fourth):
- UI/HUD
- Camera
- VFX
- Audio

**Polish Systems** (design last):
- Tutorial
- Accessibility
- Analytics
- Achievements

### Step 2: Map Dependencies

For each system, identify:
- **Requires**: What must exist before this system works?
- **Required by**: What systems depend on this?

### Step 3: Assign Priority Tiers

| Tier | Meaning |
|------|---------|
| **MVP** | Must exist for the game to function |
| **Vertical Slice** | Needed for the first playable demo |
| **Alpha** | Needed for first external test |
| **Full Vision** | Needed for final release |

### Step 4: Determine Design Order

Sort systems by: Foundation → Core → Feature → Presentation → Polish

Within each layer, sort by dependency count (most-depended-on first).

### Step 5: Write Systems Index

Create `design/gdd/systems-index.md` with:
- Complete system list
- Dependency graph
- Priority tiers
- Design order
- Status (Not Started / In Design / Reviewed / Implemented)

## Output Format

```markdown
# Systems Index

## Foundation
| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| Core Loop | — | Combat, UI | MVP | Not Started |

## Core
| System | Depends On | Required By | Tier | Status |
|--------|-----------|-------------|------|--------|
| Combat | Core Loop | Progression | MVP | Not Started |
```

## Collaboration Protocol

- Ask user to confirm/enrich the system list
- Flag systems that seem over-scoped for the team size
- Suggest cuts for MVP if needed
- Get approval before writing the index
