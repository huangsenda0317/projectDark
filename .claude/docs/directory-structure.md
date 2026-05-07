# Project Directory Structure

```
projectDark/
├── CLAUDE.md                        # Master configuration (this file)
├── README.md                        # Human-readable project overview
├── GDD.md            # Game Design Document (Chinese)
├── LICENSE                          # MIT License
├── UPGRADING.md                     # Version migration guide
│
├── .claude/                         # Claude Code Game Studios framework
│   ├── settings.json                # Hooks, permissions, safety rules
│   ├── statusline.sh                # Terminal status line script
│   ├── agents/                      # 38 agent definitions
│   ├── skills/                      # 37 slash command definitions
│   ├── hooks/                       # 8 automation scripts
│   ├── rules/                       # 11 path-scoped coding standards
│   └── docs/                        # Framework documentation & templates
│
├── .cursor/                         # Cursor IDE configuration
│   └── .rules/                      # Cursor-specific rules
│
├── .rules/                          # OpenCode / general rules
│
├── src/                             # Game source code (production)
│   ├── core/                        # Engine/framework code
│   ├── gameplay/                    # Gameplay systems
│   ├── ai/                          # AI systems
│   ├── ui/                          # UI code
│   └── autoloads/                   # Global singletons (EventBus, GameState, SaveManager)
│
├── assets/                          # Game assets
│   ├── art/                         # Sprites, models, textures
│   ├── audio/                       # Music, SFX
│   ├── vfx/                         # Particle effects
│   ├── shaders/                     # Shader files
│   └── data/                        # JSON config / balance data
│
├── design/                          # Design documents
│   ├── gdd/                         # Game design documents (per system)
│   ├── narrative/                   # Story, lore, dialogue
│   ├── levels/                      # Level design documents
│   └── balance/                     # Balance spreadsheets and data
│
├── docs/                            # Technical documentation
│   ├── architecture/                # Architecture Decision Records (ADRs)
│   ├── api/                         # API documentation
│   ├── examples/                    # Example documents
│   └── postmortems/                 # Post-mortems
│
├── tests/                           # Test suites
│
├── prototypes/                      # Throwaway prototypes
│   ├── projectDark/                 # Main game prototype (Godot)
│   └── tetris/                      # Other prototypes
│
├── production/                      # Sprint plans, milestones, release tracking
│   ├── sprints/                     # Sprint documents
│   ├── milestones/                  # Milestone definitions
│   ├── releases/                    # Release tracking
│   ├── session-logs/                # Session activity logs
│   └── session-state/               # Active session state
│
└── 参考/                             # Reference materials (Chinese)
```

## Godot Project Layout (prototypes/projectDark/)

```
prototypes/projectDark/
├── project.godot                    # Godot project file
├── scenes/                          # Scene files (.tscn)
│   ├── board.tscn                   # Circular board scene
│   ├── combat.tscn                  # Combat scene
│   └── main_menu.tscn               # Main menu scene
├── scripts/                         # GDScript files
├── data/                            # Game data (JSON, .tres)
└── md/                              # Prototype documentation
```

## Key Conventions

- **Source code**: `src/` for production, `prototypes/` for throwaway experiments
- **Design docs**: `design/gdd/[system-name].md` using the 8-section standard
- **Config data**: `assets/data/*.json` for balance values, `resources/*.tres` for Godot resources
- **Tests**: Mirror `src/` structure in `tests/`
- **Production tracking**: `production/sprints/`, `production/milestones/`
