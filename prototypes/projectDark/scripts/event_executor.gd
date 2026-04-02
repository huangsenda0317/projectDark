class_name EventExecutor
## 表驱动事件解释器：读取 effect_ref，改写 RunState，返回给棋盘/UI 的指令。

static func apply(ev: Dictionary, cell_index: int) -> Dictionary:
	var out: Dictionary = {"msg": "", "combat": {}, "open_shop": false, "choice": {}, "move_extra": 0, "teleport": -1, "force_move": 0}
	if ev.is_empty():
		out.msg = "空事件"
		return out
	var ref: String = String(ev.get("effect_ref", ""))
	var params: Dictionary = ev.get("params", {})
	var floor: int = RunState.floor_num

	match ref:
		"gold_gain":
			var g: int = int(params.get("base", 5)) + int(params.get("per_floor", 0)) * floor
			RunState.add_gold(g)
			out.msg = "获得金币 +%d" % g
		"exp_or_stat":
			RunState.exp += int(params.get("exp", 3))
			var pick: String = ["max_hp", "atk"][RunState.rng.randi_range(0, 1)]
			if pick == "max_hp":
				var hb: int = int(params.get("hp_bonus", 6))
				RunState.max_hp += hb
				RunState.heal(hb)
				out.msg = "异端残卷：最大生命 +%d" % hb
			else:
				var ab: int = int(params.get("atk_bonus", 2))
				RunState.bonus_attack_flat += ab
				out.msg = "异端残卷：攻击潜质 +%d" % ab
		"shards_gain":
			var n: int = int(params.get("n", 4))
			RunState.add_shards(n)
			out.msg = "获得魂屑 +%d" % n
		"open_shop":
			out.open_shop = true
			out.msg = "商贩帐篷 — 打开商店"
		"heal_pct":
			var pct: float = float(params.get("act1", 0.15)) if floor < 33 else float(params.get("act3", 0.1))
			RunState.heal_percent(pct)
			out.msg = "恢复 %.0f%% 生命" % (pct * 100.0)
		"next_combat_armor":
			RunState.next_combat_armor_bonus = int(params.get("bonus", 5))
			out.msg = "下一场战斗额外护甲 +%d" % RunState.next_combat_armor_bonus
		"devil_trade":
			var pct: float = float(params.get("hp_pct", 0.05))
			if RunState.hp <= 5:
				out.msg = "生命过低，恶魔低语消散。"
			else:
				var loss: int = maxi(1, int(round(float(RunState.hp) * pct)))
				RunState.take_damage(loss)
				RunState.add_consumable("C01", 1)
				out.msg = "献出生命 %d，获得小型药水。" % loss
		"grant_extra_moves":
			out.move_extra = int(params.get("n", 1)) * 2
			out.msg = "再动圣铃：即将额外推进 %d 格" % int(out.move_extra)
		"forced_forward":
			var n: int = RunState.rng.randi_range(1, 3)
			out.force_move = n
			out.msg = "塌方！再被推动 %d 格" % n
		"back_and_heal":
			RunState.move_player_on_ring(-int(params.get("steps", 4)))
			RunState.heal_percent(float(params.get("heal_pct", 0.12)))
			out.msg = "后退并回暖"
		"teleport_revealed":
			var targets: Array[int] = []
			var i: int = 0
			for c: Variant in RunState.cells:
				if c is Dictionary and c.get("revealed", false) == true and i != cell_index:
					targets.append(i)
				i += 1
			if targets.is_empty():
				RunState.take_damage(3)
				out.msg = "雾门失效，受诅 3 伤害"
			else:
				out.teleport = targets[RunState.rng.randi_range(0, targets.size() - 1)]
				out.msg = "传送至已揭示格"
		"pit_slice":
			var pit: int = maxi(1, int(round(float(RunState.max_hp) * float(params.get("dmg_pct", 0.1)))))
			RunState.take_damage(pit)
			RunState.add_gold(int(params.get("gold", 10)))
			RunState.add_shards(int(params.get("shards", 3)))
			out.msg = "坠落！受 %d 伤，但拾得补给" % pit
		"hidden_stairs_combat":
			out.combat = {"kind": "minion", "enemy_id": "E27", "cell_index": cell_index, "unlock_hidden": true}
			out.msg = "血梯守卫袭来！"
		"stairs_prompt":
			out.msg = "楼梯口在此 — 击败守关者后方可上楼"
		"trap_physical":
			var lo: int = int(params.get("low", 5))
			var hi: int = int(params.get("high", 15))
			var dmg: int = RunState.rng.randi_range(lo, hi) + maxi(0, (floor - 1) / 3)
			RunState.take_damage(dmg)
			out.msg = "落石造成 %d 伤害" % dmg
		"trap_holy":
			var base: int = int(params.get("base", 10))
			var bonus: float = RunState.get_player_holy_resist()
			var dmg: int = maxi(1, int(round(float(base) * (1.0 - bonus))))
			RunState.take_damage(dmg)
			out.msg = "圣水灼伤 %d" % dmg
		"mp_drain":
			var m: int = int(params.get("mp", 12))
			if RunState.mp >= m:
				RunState.spend_mp(m)
				out.msg = "流失魔力 %d" % m
			else:
				var spill: int = m - RunState.mp
				RunState.spend_mp(RunState.mp)
				RunState.take_damage(maxi(1, spill))
				out.msg = "魔力干涸，精神受创"
		"confession":
			RunState.heal_percent(-float(params.get("hp_pct", 0.08)))
			RunState.add_exposure(int(params.get("exposure_delta", -10)))
			out.msg = "告解：以血洗刷，暴露值变化"
		"exposure_up":
			RunState.add_exposure(int(params.get("n", 3)))
			out.msg = "肃清钟鸣… 暴露值上升"
		"choice_ab":
			out.choice = {"id": "EV21", "a": "药水×2", "b": "下次商店 -30%"}
		"mirror_last":
			if RunState.last_resolved_event_id.is_empty() or RunState.last_resolved_event_id == "EV24":
				out.msg = "镜像池空空如也"
			else:
				var prev: Dictionary = DataDB.get_event(RunState.last_resolved_event_id)
				return apply(prev, cell_index)
		"combat_minion":
			out.combat = {"kind": "minion", "enemy_id": "E27", "cell_index": cell_index, "unlock_hidden": false}
			out.msg = "审判官小队！"
		"time_sand":
			RunState.time_sand_counter += int(params.get("add", 3))
			out.msg = "时砂计数 +%d（累计 %d）" % [int(params.get("add", 3)), RunState.time_sand_counter]
		_:
			out.msg = "未实现效果: %s" % ref

	var eid: String = String(ev.get("event_id", ""))
	if eid != "EV24":
		RunState.last_resolved_event_id = eid
	return out


static func apply_choice(ev21_option: String) -> void:
	if ev21_option == "a":
		RunState.add_consumable("C01", 2)
	elif ev21_option == "b":
		RunState.shop_discount = 0.3
