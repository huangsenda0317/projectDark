# Coding Standards

## Universal Principles

1. **Readability over cleverness**: Code is read more than written
2. **Explicit over implicit**: Don't hide behavior in side effects
3. **Fail fast**: Validate assumptions early, crash loudly in debug
4. **Testability**: If you can't test it easily, redesign it

## GDScript Style Guide

### Formatting

- Indent: 4 spaces (no tabs)
- Max line length: 120 characters
- Blank lines: 1 between functions, 2 between classes
- Trailing commas in multi-line arrays/dicts

### Comments

- Use `##` for documentation comments (shows in editor)
- Use `#` for inline implementation notes
- Document WHY, not WHAT (the code says what)

```gdscript
## Calculates damage based on attacker stats and defender armor.
## Applies type modifiers and clamps to minimum 0.
func calculate_damage(attacker: Stats, defender: Stats, damage_type: DamageType) -> int:
    var base = attacker.attack_power * get_type_multiplier(damage_type)
    var mitigated = base - defender.armor
    return max(0, mitigated)
```

### Type Safety

- Use static typing everywhere (`-> int`, `: String`)
- Use `TypedArray` and `Dictionary[KeyType, ValueType]` where possible
- Avoid `Variant` unless truly necessary

### Error Handling

- Use `assert()` for programmer errors (should never happen)
- Use `push_error()` / `push_warning()` for runtime issues
- Return early on invalid state (guard clauses)

```gdscript
func apply_damage(target: Entity, amount: int) -> void:
    if not is_instance_valid(target):
        push_error("apply_damage called with invalid target")
        return
    if amount < 0:
        push_warning("Negative damage treated as 0")
        amount = 0
    # ... actual logic
```

## Architecture Patterns

### State Machines

Use `enum` + `match` for simple states, `StateMachine` node for complex hierarchies:

```gdscript
class_name StateMachine
extends Node

@export var initial_state: State
var current_state: State
var states: Dictionary[String, State] = {}

func _ready() -> void:
    for child in get_children():
        if child is State:
            states[child.name] = child
            child.state_machine = self
    if initial_state:
        transition_to(initial_state.name)

func transition_to(state_name: String) -> void:
    if not states.has(state_name):
        push_error("State not found: " + state_name)
        return
    if current_state:
        current_state.exit()
    current_state = states[state_name]
    current_state.enter()
```

### Event Bus

```gdscript
# autoloads/event_bus.gd
extends Node

signal damage_dealt(target: Entity, amount: int, source: Entity)
signal turn_started(entity: Entity)
signal turn_ended(entity: Entity)
signal game_state_changed(new_state: GameState)
```

### Component Pattern

```gdscript
class_name HealthComponent
extends Node

@export var max_health: int = 100
var current_health: int

signal health_changed(new_health: int, max_health: int)
signal died()

func _ready() -> void:
    current_health = max_health

func take_damage(amount: int) -> void:
    current_health = maxi(0, current_health - amount)
    health_changed.emit(current_health, max_health)
    if current_health == 0:
        died.emit()
```

## Testing

- Write tests alongside implementation (Verification-Driven Development)
- Use GUT (Godot Unit Testing) framework
- Name tests: `test_[system]_[scenario]_[expected]`
- Arrange / Act / Assert structure
