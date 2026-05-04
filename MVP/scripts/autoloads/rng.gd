extends Node

## Seeded random number generator wrapper.
## All game randomness flows through this singleton for determinism.

var _rng: RandomNumberGenerator


func _ready() -> void:
	_rng = RandomNumberGenerator.new()
	_rng.randomize()


func init_seed(seed_val: int) -> void:
	_rng.set_seed(seed_val)


func get_seed() -> int:
	return _rng.get_seed()


## -- Dice rolling --

func roll_dice(faces: int) -> int:
	return _rng.randi_range(1, faces)


func roll_many(count: int, faces: int) -> Array:
	var results: Array = []
	for i in count:
		results.append(_rng.randi_range(1, faces))
	return results


func roll_sum(count: int, faces: int) -> int:
	var total := 0
	for i in count:
		total += _rng.randi_range(1, faces)
	return total


## -- Weighted random --

func weighted_pick(items: Array, weights: Array) -> int:
	## Returns the index of the chosen item.
	var total := 0.0
	for w in weights:
		total += w
	var roll = randf_range(0.0, total)
	var cumulative := 0.0
	for i in items.size():
		cumulative += weights[i]
		if roll <= cumulative:
			return i
	return items.size() - 1


## -- General purpose --

func randf_range(min_v: float, max_v: float) -> float:
	return _rng.randf_range(min_v, max_v)


func randi_range(min_v: int, max_v: int) -> int:
	return _rng.randi_range(min_v, max_v)


func randf() -> float:
	return _rng.randf()


func randi() -> int:
	return _rng.randi()


## -- Array shuffling --

func shuffle(arr: Array) -> void:
	## Fisher-Yates shuffle in place.
	var n = arr.size()
	for i in range(n - 1, 0, -1):
		var j = _rng.randi_range(0, i)
		var tmp = arr[i]
		arr[i] = arr[j]
		arr[j] = tmp


func pick_random(arr: Array):
	## Return a random element from an array.
	if arr.is_empty():
		return null
	return arr[_rng.randi_range(0, arr.size() - 1)]


## -- Quality roll (for drops) --

func roll_quality(tower_level: int) -> String:
	var weights := {}
	match tower_level:
		1: weights = {"white": 70, "blue": 25, "purple": 5}
		2: weights = {"white": 50, "blue": 35, "purple": 14}
		3: weights = {"white": 30, "blue": 35, "purple": 30}
		4: weights = {"white": 15, "blue": 35, "purple": 35}
		_: weights = {"white": 5, "blue": 25, "purple": 40}

	var items: Array = ["white", "blue", "purple"]
	var w: Array = [weights["white"], weights["blue"], weights["purple"]]
	var idx = weighted_pick(items, w)
	return items[idx]


## -- Dice face count roll (for drops, influenced by floor) --

func roll_face_count(floor_num: int) -> int:
	## Returns face count for a dropped dice based on floor.
	if floor_num <= 3:
		var idx = weighted_pick([4, 6, 8], [40, 40, 20])
		return [4, 6, 8][idx]
	if floor_num <= 6:
		var idx = weighted_pick([6, 8, 10, 12], [20, 35, 30, 15])
		return [6, 8, 10, 12][idx]
	# MVP doesn't go beyond floor 6
	return 12
