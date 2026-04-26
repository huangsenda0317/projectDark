# Test Standards Rules

**Applies to:** `tests/**`, `**/*_test.gd`, `**/*_test.cs`, `**/*_spec.*`

## Naming Convention

Tests must follow: `test_[system]_[scenario]_[expected_result]`

Examples:
- `test_damage_calculation_basic_hit_returns_expected_value`
- `test_inventory_add_item_when_full_returns_false`
- `test_player_movement_with_zero_delta_returns_same_position`

## Test Structure

Every test must use **Arrange / Act / Assert**:

```gdscript
func test_damage_calculation_basic_hit_returns_expected_value():
    # Arrange
    var calculator = DamageCalculator.new()
    var config = load("res://tests/fixtures/combat_test_config.tres")
    calculator.initialize(config)

    # Act
    var result = calculator.calculate(10, 50, DamageType.PHYSICAL)

    # Assert
    assert_eq(result, 15, "Base 10 + 50 STR * 0.1 = 15")
```

## Coverage Requirements

- Unit tests: **80%+ coverage** for gameplay systems
- Integration tests: All cross-system interactions must have at least one test
- Edge cases: Every edge case mentioned in the GDD must have a test

## Test Independence

- Tests must not depend on execution order
- Tests must clean up after themselves (free nodes, reset static state)
- Tests must not modify global state unless they restore it
- Use fixtures/test data instead of production data files

## Performance Tests

- Performance-critical systems must have benchmark tests
- Tests must specify target performance and fail if exceeded
- Example: `test_damage_performance_10k_calculations_takes_under_1ms`

## Forbidden Patterns

- Tests that only verify the test framework works (e.g., `assert_true(true)`)
- Tests with commented-out assertions
- Tests that depend on randomness without a fixed seed
- Tests that require manual setup outside the test file
