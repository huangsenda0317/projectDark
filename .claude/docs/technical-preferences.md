# Technical Preferences

## Engine: Godot 4.x

| Aspect | Setting |
|--------|---------|
| Engine Version | Godot 4.3+ (Latest stable) |
| Language | GDScript (primary), C# (optional for performance-critical modules) |
| Renderer | Forward+ (Desktop), Mobile (if targeting lower-end) |
| Scripting Backend | GDExtension for native modules if needed |

## Naming Conventions

### GDScript

| Type | Convention | Example |
|------|-----------|---------|
| Classes / Nodes | PascalCase | `DamageCalculator`, `PlayerController` |
| Functions | snake_case | `calculate_damage()`, `on_hit_received()` |
| Variables | snake_case | `current_health`, `is_invulnerable` |
| Constants | UPPER_SNAKE_CASE | `MAX_HEALTH`, `BASE_DAMAGE` |
| Signals | snake_case, past tense | `damage_taken`, `turn_ended` |
| Enums | PascalCase for name, UPPER_SNAKE_CASE for values | `enum DamageType { PHYSICAL, MAGICAL, PIERCING }` |
| Files | snake_case | `damage_calculator.gd`, `player_controller.gd` |
| Scenes | PascalCase + type suffix | `PlayerCharacter.tscn`, `MainMenuUI.tscn` |
| Resources | snake_case + suffix | `knight_set_data.tres`, `enemy_goblin_stats.tres` |

### Project Structure

```
res://
├── scenes/           # .tscn scene files
├── scripts/          # .gd script files
│   ├── systems/      # Core gameplay systems
│   ├── entities/     # Player, enemies, NPCs
│   └── autoloads/    # Global singletons
├── resources/        # .tres resource files
│   ├── equipment/    # Equipment definitions
│   ├── cards/        # Card definitions
│   ├── relics/       # Relic definitions
│   └── enemies/      # Enemy definitions
├── assets/           # Binary assets
│   ├── sprites/      # Pixel art
│   ├── audio/        # Music and SFX
│   └── fonts/        # Typography
└── data/             # JSON configuration
    └── events/       # Random event data
```

## Performance Budgets

| Target | Budget |
|--------|--------|
| Frame Rate | 60 FPS (16.6ms/frame) |
| Total AI per frame | ≤ 2ms |
| Physics per frame | ≤ 1ms |
| UI rendering | ≤ 1ms |
| Memory (RAM) | ≤ 1GB |
| Load time (initial) | ≤ 5 seconds |
| Load time (save) | ≤ 1 second |

## Data-Driven Defaults

- All damage values: `assets/data/combat_damage.json`
- All enemy stats: `resources/enemies/*.tres`
- All equipment: `resources/equipment/*.tres`
- All event text: `data/events/*.json`
- UI text: Localization CSV (Chinese primary, English secondary)

## Godot-Specific Patterns

- Use `class_name` for all reusable scripts
- Prefer `signal` + `EventBus` over direct node references
- Use `Resource` (`.tres`) for all data definitions
- Use `RandomNumberGenerator` with seeds for deterministic randomness
- Use `CanvasItem` shaders for pixel-perfect 2D effects
- Use `AnimationPlayer` for all tweened animations (not code-based tweens)
- Use `SubViewport` for embedding combat in board UI
- Disable filtering on all pixel art textures (`texture_filter = nearest`)

## Version Control

- `.godot/` directory: Git-ignored (auto-generated)
- `uid_cache.bin`: Git-ignored
- Import files (`.import`): Commit them for consistency
- Large assets (>10MB): Consider Git LFS
