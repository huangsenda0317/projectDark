---
name: team-combat
description: Coordinate multiple agents to design and implement combat system features.
---

# /team-combat

## Purpose

Orchestrate the combat team (game-designer, gameplay-programmer, technical-artist, sound-designer) to collaboratively build combat features.

## Usage

```
/team-combat "healing ability with HoT and cleanse"
/team-combat "new enemy type: shield bearer"
```

## Workflow

### Phase 1 — Design (game-designer)
- Ask clarifying questions
- Present mechanical options with pros/cons
- Create design doc section
- **User approves before proceeding**

### Phase 2 — Architecture (gameplay-programmer)
- Propose code structure
- Identify files to create/modify
- **User approves before proceeding**

### Phase 3 — Parallel Implementation
Coordinate specialists:
- gameplay-programmer: Core logic
- technical-artist: VFX spec
- sound-designer: SFX spec
- ai-programmer: Enemy reactions (if applicable)

Each shows work before writing.

### Phase 4 — Integration
gameplay-programmer integrates all components.

### Phase 5 — Validation
qa-tester validates against acceptance criteria.

### Phase 6 — Report
Summarize status and next steps.

## Collaboration Protocol

- Decision points stay with the user at every phase
- Parallel work only starts after architecture approval
- Each specialist asks questions before proposing solutions
- Nothing writes to disk without user approval
