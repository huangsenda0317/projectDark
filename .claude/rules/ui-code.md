# UI Code Rules

**Applies to:** `src/ui/**`, `scenes/ui/**`, `prototypes/**/scenes/ui/**`

## Core Principles

1. **No Game State Ownership**: UI code must not own or directly modify gameplay state. UI is a **view** that reads from and sends commands to gameplay systems.
2. **Localization-Ready**: No hardcoded strings. All text must use localization keys or be passed as parameters.
3. **Accessibility**: Support text scaling, colorblind-friendly palettes, keyboard/gamepad navigation.

## Architecture

- Use the **Model-View-Presenter** or **Model-View-ViewModel** pattern
- UI scenes should be **self-contained** and testable in isolation
- Communicate with gameplay via the `EventBus` (signals/events), never direct node references

## Naming Conventions

| Type | Convention | Example |
|------|-----------|---------|
| UI Scenes | PascalCase + suffix | `InventoryPanel.tscn`, `HealthBarUI.tscn` |
| UI Scripts | PascalCase + suffix | `inventory_panel.gd`, `health_bar_ui.gd` |
| Theme constants | UPPER_SNAKE_CASE | `BUTTON_PADDING`, `PANEL_RADIUS` |
| Localization keys | dot-notation | `ui.inventory.title`, `combat.damage.dealt` |

## Forbidden Patterns

- UI nodes calling gameplay functions directly (e.g., `player.take_damage()`)
- Hardcoded pixel values for responsive layouts (use anchors, containers, theme constants)
- Blocking UI operations (always use async/callback patterns)
- UI code that assumes a specific scene tree structure outside its own subtree

## Required Patterns

- All interactive UI elements must have **focus states** for keyboard/gamepad
- All buttons must have **hover, pressed, disabled, and focus** visual states
- All text must support **dynamic font size scaling**
- Loading states must show **progress indicators** for operations >200ms
