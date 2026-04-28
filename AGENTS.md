# AGENTS.md -- Circle of Faith / 信仰轮回

> **Game:** Circle of Faith (信仰轮回)
> **Engine:** Godot 4.x (GDScript primary)
> **Genre:** Pixel-art roguelike deckbuilder with dice-driven circular board movement and village meta-progression
> **Stage:** Prototype → Production transition (MVP Phase 1)
> **Framework:** Claude Code Game Studios

---

## CRITICAL: Collaboration Protocol (强制执行)

**This agent architecture is designed for USER-DRIVEN COLLABORATION, not autonomous AI generation.**

Every interaction MUST follow this pattern:

```
Question → Options → Decision → Draft → Approval
```

### Rules You MUST Follow

1. **ASK before proposing solutions**
   - Identify what's ambiguous or unspecified
   - Ask clarifying questions about the user's vision
   - Gather context before making recommendations

2. **PRESENT 2-4 options with trade-offs**
   - Explain pros/cons for each approach
   - Reference game design theory, pillars, or comparable games
   - Make a recommendation but DEFER final decision to user

3. **WAIT for explicit approval before writing files**
   - Show draft or summary first
   - Ask: "May I write this to [filepath]?"
   - Only write after user says "Yes"

4. **NEVER assume, never hide confusion**
   - State assumptions explicitly
   - If multiple interpretations exist, present them — don't pick silently
   - If something is unclear, STOP. Name what's confusing. Ask.

5. **SURGICAL CHANGES only**
   - Touch only what you must
   - Don't "improve" adjacent code, comments, or formatting
   - Match existing style, even if you'd do it differently
   - Every changed line should trace directly to the user's request

### Forbidden Behaviors

- ❌ Creating designs and writing them without user input
- ❌ Making decisions without user input
- ❌ Writing code without approval
- ❌ "Just do it" — no collaboration opportunity
- ❌ Implementing everything in a design doc without approval points
- ❌ Autonomous execution

---

## Path-Scoped Rules (自动应用)

When editing or reviewing files in these paths, automatically enforce the corresponding rules:

### `src/gameplay/**` or `prototypes/**/scripts/gameplay/**`
Apply **gameplay-code** rules:
- All gameplay constants (damage, speed, cooldowns, ranges) must load from config files (`assets/data/*.json` or `.tres` resources). No magic numbers.
- All time-based calculations must use `delta` or engine equivalent. Never assume fixed frame rate.
- Gameplay systems must NOT import, reference, or depend on UI nodes. Use signals/events to communicate.
- Gameplay results must be reproducible given same inputs and random seed.
- Systems should be stateless utilities where possible (e.g., `DamageCalculator`).
- Stateful systems should use dependency injection for testability.
- Prefer composition over inheritance for entity behavior.
- Use the global `EventBus` (AutoLoad singleton) for cross-system communication.
- Naming: Classes `PascalCase`, functions `snake_case`, constants `UPPER_SNAKE_CASE`, signals `snake_case` past tense.

### `src/ai/**`
Apply **ai-code** rules:
- AI updates must not exceed **2ms/frame** total across all active NPCs.
- Use staggered updates: only update a subset of NPCs per frame.
- Every AI decision must be observable in debug mode (behavior tree node, detection radius, line-of-sight, target position, decision scores).
- All AI tuning values must come from config files (detection ranges, reaction times, patrol points, behavior tree parameters, decision weights).
- Enemy attacks must be telegraphed (0.3–0.5s windup) before execution.
- AI must use the same rules as the player (no cheating on cooldowns, ranges, or resources).
- Separate perception, decision, and action into distinct systems.

### `src/ui/**` or `scenes/ui/**`
Apply **ui-code** rules:
- UI code must not own or directly modify gameplay state. UI is a VIEW that reads from and sends commands to gameplay systems.
- No hardcoded strings — all text must use localization keys or be passed as parameters.
- Support text scaling, colorblind-friendly palettes, keyboard/gamepad navigation.
- Use Model-View-Presenter or Model-View-ViewModel pattern.
- UI scenes should be self-contained and testable in isolation.
- Communicate with gameplay via `EventBus` (signals/events), never direct node references.
- Naming: UI Scenes `PascalCase` + suffix (`InventoryPanel.tscn`), scripts `snake_case` + suffix.
- All interactive elements must have focus states for keyboard/gamepad.
- All buttons must have hover, pressed, disabled, and focus visual states.
- All text must support dynamic font size scaling.
- Loading states must show progress indicators for operations >200ms.

### `design/gdd/**` or `design/narrative/**`
Apply **design-docs** rules:
- Every GDD must contain 8 sections: Overview, Player Fantasy, Detailed Rules, Formulas, Edge Cases, Dependencies, Tuning Knobs, Acceptance Criteria.
- All formulas must define variables, defaults, and ranges.
- Edge cases must be explicitly resolved — no "TBD".
- Dependencies must be bidirectional (depends on + used by).
- Tuning knobs must specify safe ranges.
- Acceptance criteria must be testable and measurable.

### `tests/**`
Apply **test-standards** rules:
- Test naming: `test_[system]_[scenario]_[expected_result]`
- Structure: Arrange / Act / Assert
- No external state dependencies
- Tests clean up after themselves
- Each test file mirrors the source file it tests
- Unit tests: 80%+ coverage for gameplay systems
- Performance tests must specify target and fail if exceeded

### `prototypes/**`
Apply **prototype-code** rules:
- Hardcoded values allowed
- Tests not required
- Copy-paste tolerated
- Must contain README.md with: hypothesis, success criteria, status, findings, verdict (Ship It / Rework / Kill It)
- Never copy prototype code directly to `src/`
- Isolated — no imports between prototypes and `src/`
- Completable in 1-4 hours

---

## Technology Stack

| Layer | Choice |
|-------|--------|
| Engine | Godot 4.3+ |
| Language | GDScript (primary), C# (optional for performance) |
| Renderer | Forward+ (Desktop), Mobile (lower-end) |
| Resolution | 320×180 base (pixel ×3~4 display) |
| Scene Management | SceneTree switching (Board / Combat / Village) |
| Data Management | Resource (`.tres`) for editor config, JSON for balance |
| Save System | `FileAccess` + JSON serialization, single-slot auto-save |
| Signals | Global `EventBus` (AutoLoad singleton) |
| Random | `RandomNumberGenerator` with seeds for run sharing |

## GDScript Standards

### Formatting
- Indent: 4 spaces (no tabs)
- Max line length: 120 characters
- Blank lines: 1 between functions, 2 between classes
- Trailing commas in multi-line arrays/dicts

### Comments
- `##` for documentation comments (shows in editor)
- `#` for inline implementation notes
- Document WHY, not WHAT

### Type Safety
- Static typing everywhere (`-> int`, `: String`)
- Use `TypedArray` and `Dictionary[KeyType, ValueType]` where possible
- Avoid `Variant` unless truly necessary

### Error Handling
- `assert()` for programmer errors
- `push_error()` / `push_warning()` for runtime issues
- Return early on invalid state (guard clauses)

### Architecture Patterns
- Use `class_name` for all reusable scripts
- Prefer `signal` + `EventBus` over direct node references
- Use `Resource` (`.tres`) for all data definitions
- Use `RandomNumberGenerator` with seeds for deterministic randomness
- Use `AnimationPlayer` for all tweened animations
- Use `SubViewport` for embedding combat in board UI
- Disable filtering on all pixel art textures (`texture_filter = nearest`)

### Naming
| Type | Convention | Example |
|------|-----------|---------|
| Classes / Nodes | PascalCase | `DamageCalculator`, `PlayerController` |
| Functions | snake_case | `calculate_damage()` |
| Variables | snake_case | `current_health` |
| Constants | UPPER_SNAKE_CASE | `MAX_HEALTH` |
| Signals | snake_case, past tense | `damage_taken` |
| Enums | PascalCase name, UPPER_SNAKE_CASE values | `enum DamageType { PHYSICAL, MAGICAL }` |
| Files | snake_case | `damage_calculator.gd` |
| Scenes | PascalCase + suffix | `PlayerCharacter.tscn` |
| Resources | snake_case + suffix | `knight_set_data.tres` |

---

## Agent Delegation Quick Reference

When user asks for domain-specific work, delegate mentally to the right agent persona:

| Topic | Primary | Consult |
|-------|---------|---------|
| Combat feel/mechanics | game-designer | gameplay-programmer, technical-artist |
| Combat implementation | gameplay-programmer | game-designer (edge cases) |
| Combat VFX | technical-artist | game-designer |
| UI layout/UX | ux-designer | game-designer |
| UI implementation | ui-programmer | ux-designer |
| AI behavior | ai-programmer | game-designer |
| Level design | level-designer | game-designer, narrative-director |
| Story/narrative | narrative-director | creative-director, game-designer |
| World lore | world-builder | narrative-director |
| Progression/math | systems-designer | game-designer, economy-designer |
| Economy balance | economy-designer | game-designer, systems-designer |
| Architecture decisions | technical-director | lead-programmer |
| Scope/schedule | producer | all leads |
| Vision/pillar conflicts | creative-director | — |

---

## Project Structure Reference

```
res:// (Godot project root)
├── scenes/           # .tscn files (board, combat, village, ui)
├── scripts/
│   ├── systems/      # Core gameplay systems (dice, faith, encumbrance, build)
│   ├── entities/     # Player, enemies, NPCs
│   └── autoloads/    # EventBus, GameState, SaveManager
├── resources/
│   ├── equipment/    # .tres equipment data
│   ├── cards/        # .tres card data
│   ├── relics/       # .tres relic data
│   └── enemies/      # .tres enemy data
├── assets/
│   ├── sprites/      # Pixel art
│   ├── audio/        # Music and SFX
│   └── fonts/        # Gothic pixel fonts
└── data/
    └── events/       # Random event JSON data

projectDark/ (repo root)
├── src/              # Production source code
├── prototypes/       # Throwaway prototypes
│   └── projectDark/  # Godot prototype project
├── design/gdd/       # Game design documents
├── production/       # Sprints, milestones, session logs
└── .claude/          # This framework
```

---

## File Writing Protocol (强制执行)

### NEVER Write Files Without Explicit Approval

Every file write must follow:

1. Show draft or summary in conversation first
2. Ask: "May I write this to [filepath]?"
3. Wait for "Yes" or "Show me the full draft"
4. Only then use Write/Edit tools

### Incremental Section Writing (Design Documents)

For multi-section documents:
1. Create file with skeleton (all section headers, empty bodies)
2. For EACH section: draft in conversation → revise → ask approval → edit into file
3. This keeps live context small and prevents data loss on compaction

### Multi-File Changes

When a change affects multiple files, say:
> "This requires changes to N files: [list]. Should I: A) Show code first then write all, B) One at a time, C) Write all now?"

---

## Current Project State

Check `production/session-state/active.md` for the latest active context.
Check `production/stage.txt` for the current development stage.

If those files are empty or missing, the project is likely at:
- **Stage:** Prototype / Pre-Production
- **Goal:** Validate core mechanics (dice movement, circular board, combat)
- **Next:** Complete prototype evaluation, then transition to production sprint planning

---

## Performance Budgets

| Target | Budget |
|--------|--------|
| Frame Rate | 60 FPS (16.6ms/frame) |
| Total AI per frame | ≤ 2ms |
| Physics per frame | ≤ 1ms |
| UI rendering | ≤ 1ms |
| Memory (RAM) | ≤ 1GB |
| Load time (initial) | ≤ 5 seconds |

---

## Game Pillars (from GDD)

- **Every Run is Different**: Board generation, monster combos, rewards are random
- **Meaningful Choices**: Dice points are fixed, but direction, equipment, when to unload are decisions
- **Equipment Defines Character**: No fixed classes, equipment sets define playstyle
- **Encumbrance is Strategy**: How much gear to bring, dimensional pouch usage
- **Faith Flows Both Ways**: Faith drives tower abilities AND village construction
- **Village Has Soul**: Meta-progression provides long-term goals
- **Narrative Atmosphere**: Brief text events build medieval world feel

---

## Key References

- `GDD.md` -- Full game design document (Chinese, 823 lines)
- `.claude/docs/directory-structure.md` -- Complete directory layout
- `.claude/docs/technical-preferences.md` -- Godot-specific conventions
- `.claude/docs/coding-standards.md` -- Detailed GDScript standards
- `.claude/docs/coordination-rules.md` -- Agent delegation patterns
- `.claude/docs/context-management.md` -- Session state strategy
- `docs/COLLABORATIVE-DESIGN-PRINCIPLE.md` -- Full collaboration protocol
