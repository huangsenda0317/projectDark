import { create } from 'zustand';
import type { PlayerState, RunProgress, VillageMeta, SceneType, EquipmentItem, Item, Relic, DiceEntity } from '../types/game';
import { INITIAL_PLAYER_DICE, FALLBACK_D4 } from '../data/dice';
import { calculateMaxEncumbrance, calculateTotalWeight } from '../services/encumbranceService';

interface GameState {
  currentScene: SceneType;
  player: PlayerState;
  run: RunProgress;
  village: VillageMeta;
  equipped: EquipmentItem[];
  backpack: EquipmentItem[];
  dimensionalPouch: EquipmentItem[];
  items: Item[];
  relics: Relic[];
  diceBox: DiceEntity[];
  maxDiceBoxSlots: number;
  selectedMovementDieId: string | null;
  showRewardModal: boolean;
  pendingRewards: any[] | null;
  visitedInterlude: boolean;

  setScene: (scene: SceneType) => void;
  updatePlayer: (partial: Partial<PlayerState>) => void;
  addGold: (amount: number) => void;
  addFaith: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addCurse: (amount: number) => void;
  addDiceHistory: (roll: number) => void;
  nextFloor: () => void;
  // Dice box
  addDice: (dice: DiceEntity) => boolean;
  removeDice: (diceId: string) => void;
  expandDiceBox: () => void;
  setSelectedMovementDie: (diceId: string | null) => void;
  getFallbackDice: () => void;
  consumeFaith: (amount: number) => boolean;
  // Equipment
  equipItem: (item: EquipmentItem) => void;
  unequipItem: (itemId: string) => void;
  addToBackpack: (item: EquipmentItem) => void;
  addToDimensionalPouch: (item: EquipmentItem) => void;
  recalcEncumbrance: () => void;
  // Items & Relics
  addItem: (item: Item) => void;
  useItem: (itemId: string) => void;
  addRelic: (relic: Relic) => void;
  removeRelic: (relicId: string) => void;
  // Meta
  addFaithTag: (tag: string) => void;
  contributeToVillage: (gold: number, faith: number) => void;
  startNewRun: () => void;
  resetGame: () => void;
  setShowRewardModal: (v: boolean) => void;
  setPendingRewards: (r: any[] | null) => void;
}

const INITIAL_PLAYER: PlayerState = {
  hp: 60, maxHp: 60, armor: 0,
  stats: { str: 5, agi: 5, int: 5, con: 5, fai: 5 },
  faith: 5, maxFaith: 20, gold: 50,
  curseLevel: 0, encumbrance: 0,
  maxEncumbrance: calculateMaxEncumbrance(5),
  faithTags: [],
};

const INITIAL_RUN: RunProgress = {
  floor: 1, maxFloor: 10, diceHistory: [], totalFloorsCleared: 0,
};

const INITIAL_VILLAGE: VillageMeta = {
  level: 1, name: '晨星村', population: 3, taxPerRun: 5, faithReserve: 0,
  buildings: [
    { id: 'house', name: '家', unlocked: true, built: true, costGold: 0, costFaith: 0, costResources: 0, effect: '基础住所' },
    { id: 'prayer', name: '祈祷场', unlocked: true, built: true, costGold: 0, costFaith: 0, costResources: 0, effect: 'Run开始时+1信仰' },
    { id: 'smithy', name: '铁匠铺', unlocked: false, built: false, costGold: 50, costFaith: 0, costResources: 30, effect: '每次Run出发时可强化1件装备' },
    { id: 'market', name: '市场', unlocked: false, built: false, costGold: 30, costFaith: 0, costResources: 20, effect: '商店货物+2，价格-10%' },
    { id: 'church', name: '教堂', unlocked: false, built: false, costGold: 0, costFaith: 30, costResources: 80, effect: '信仰上限+3，祈祷所效果×1.5' },
  ],
  villagers: [
    { id: 'v1', name: '老汤姆', profession: '农民', recruited: true, recruitFaith: 5, specialty: '基础税收' },
    { id: 'v2', name: '玛丽', profession: '农民', recruited: true, recruitFaith: 5, specialty: '基础税收' },
    { id: 'v3', name: '小彼得', profession: '铁匠', recruited: false, recruitFaith: 10, specialty: '强化装备效果+1' },
  ],
  storedItems: [],
};

export const useGameStore = create<GameState>((set, get) => ({
  currentScene: 'board',
  player: { ...INITIAL_PLAYER },
  run: { ...INITIAL_RUN },
  village: { ...INITIAL_VILLAGE },
  equipped: [], backpack: [], dimensionalPouch: [],
  items: [], relics: [],
  diceBox: [{ ...INITIAL_PLAYER_DICE }],
  maxDiceBoxSlots: 2,
  selectedMovementDieId: null,
  showRewardModal: false, pendingRewards: null,
  visitedInterlude: false,

  setScene: (scene) => set({ currentScene: scene }),
  updatePlayer: (partial) => set((s) => ({ player: { ...s.player, ...partial } })),
  addGold: (amount) => set((s) => ({ player: { ...s.player, gold: Math.max(0, s.player.gold + amount) } })),
  addFaith: (amount) => set((s) => ({
    player: { ...s.player, faith: Math.max(0, Math.min(s.player.maxFaith, s.player.faith + amount)) },
  })),
  consumeFaith: (amount) => {
    const state = get();
    if (state.player.faith < amount) return false;
    set((s) => ({ player: { ...s.player, faith: s.player.faith - amount } }));
    return true;
  },
  takeDamage: (amount) => set((s) => {
    const armor = s.player.armor;
    const through = Math.max(0, amount - armor);
    return { player: { ...s.player, hp: Math.max(0, s.player.hp - through), armor: Math.max(0, armor - amount) } };
  }),
  heal: (amount) => set((s) => ({ player: { ...s.player, hp: Math.min(s.player.maxHp, s.player.hp + amount) } })),
  addCurse: (amount) => set((s) => ({ player: { ...s.player, curseLevel: Math.max(0, s.player.curseLevel + amount) } })),
  addDiceHistory: (roll) => set((s) => ({ run: { ...s.run, diceHistory: [...s.run.diceHistory, roll] } })),
  nextFloor: () => set((s) => ({
    run: { ...s.run, floor: s.run.floor + 1, diceHistory: [], totalFloorsCleared: s.run.totalFloorsCleared + 1 },
    visitedInterlude: false,
  })),

  // ─── Dice Box ───────────────────────────────────────────

  addDice: (dice) => {
    const state = get();
    if (state.diceBox.length >= state.maxDiceBoxSlots) return false;
    set({ diceBox: [...state.diceBox, dice] });
    return true;
  },
  removeDice: (diceId) => set((s) => ({ diceBox: s.diceBox.filter(d => d.id !== diceId) })),
  expandDiceBox: () => set((s) => ({ maxDiceBoxSlots: Math.min(10, s.maxDiceBoxSlots + 1) })),
  setSelectedMovementDie: (diceId) => set({ selectedMovementDieId: diceId }),
  getFallbackDice: () => set((s) => {
    if (s.diceBox.length === 0) {
      return { diceBox: [{ ...FALLBACK_D4 }] };
    }
    return {};
  }),

  // ─── Equipment ──────────────────────────────────────────

  equipItem: (item) => set((s) => {
    const existing = s.equipped.find(e => e.slot === item.slot);
    let newEquipped = s.equipped.filter(e => e.slot !== item.slot);
    let newBackpack = s.backpack.filter(b => b.id !== item.id);
    if (existing) {
      newBackpack = [...newBackpack, existing];
    }
    newEquipped = [...newEquipped, item];
    const enc = calculateTotalWeight(newEquipped, newBackpack);
    const maxEnc = calculateMaxEncumbrance(s.player.stats.str);
    return {
      equipped: newEquipped,
      backpack: newBackpack,
      player: { ...s.player, encumbrance: enc, maxEncumbrance: maxEnc },
    };
  }),
  unequipItem: (itemId) => set((s) => {
    const item = s.equipped.find(e => e.id === itemId);
    if (!item) return s;
    const newE = s.equipped.filter(e => e.id !== itemId);
    const newB = [...s.backpack, item];
    const enc = calculateTotalWeight(newE, newB);
    const maxEnc = calculateMaxEncumbrance(s.player.stats.str);
    return { equipped: newE, backpack: newB, player: { ...s.player, encumbrance: enc, maxEncumbrance: maxEnc } };
  }),
  addToBackpack: (item) => set((s) => {
    const newB = [...s.backpack, item];
    const enc = calculateTotalWeight(s.equipped, newB);
    const maxEnc = calculateMaxEncumbrance(s.player.stats.str);
    return { backpack: newB, player: { ...s.player, encumbrance: enc, maxEncumbrance: maxEnc } };
  }),
  addToDimensionalPouch: (item) => set((s) => ({ dimensionalPouch: [...s.dimensionalPouch, item] })),
  recalcEncumbrance: () => set((s) => {
    const enc = calculateTotalWeight(s.equipped, s.backpack);
    const maxEnc = calculateMaxEncumbrance(s.player.stats.str);
    return { player: { ...s.player, encumbrance: enc, maxEncumbrance: maxEnc } };
  }),

  // ─── Items & Relics ─────────────────────────────────────

  addItem: (item) => set((s) => ({ items: [...s.items, item] })),
  useItem: (itemId) => set((s) => {
    const idx = s.items.findIndex(i => i.id === itemId);
    if (idx === -1) return s;
    const items = [...s.items];
    items.splice(idx, 1);
    return { items };
  }),
  addRelic: (relic) => set((s) => {
    if (s.relics.length >= 6) return s;
    return { relics: [...s.relics, relic] };
  }),
  removeRelic: (relicId) => set((s) => ({ relics: s.relics.filter(r => r.id !== relicId) })),
  addFaithTag: (tag) => set((s) => {
    if (s.player.faithTags.includes(tag as never)) return s;
    return { player: { ...s.player, faithTags: [...s.player.faithTags, tag as never] } };
  }),
  contributeToVillage: (gold, faith) => set((s) => ({
    player: { ...s.player, gold: s.player.gold - gold },
    village: { ...s.village, faithReserve: s.village.faithReserve + faith },
  })),

  // ─── Run Management ─────────────────────────────────────

  startNewRun: () => set((s) => ({
    currentScene: 'board',
    player: {
      ...INITIAL_PLAYER,
      stats: s.player.stats,
      maxHp: 60 + s.player.stats.con * 5,
      hp: 60 + s.player.stats.con * 5,
      maxFaith: 20 + (s.village.buildings.find(b => b.id === 'church')?.built ? 3 : 0),
      faith: 5 + s.village.population,
      gold: 50 + s.village.taxPerRun,
      maxEncumbrance: calculateMaxEncumbrance(s.player.stats.str),
    },
    run: { floor: 1, maxFloor: 10, diceHistory: [], totalFloorsCleared: s.run.totalFloorsCleared },
    equipped: [], backpack: [], dimensionalPouch: [], items: [], relics: [],
    diceBox: [{ ...INITIAL_PLAYER_DICE }],
    maxDiceBoxSlots: 2,
    selectedMovementDieId: null,
    visitedInterlude: false,
  })),
  resetGame: () => set({
    currentScene: 'board',
    player: { ...INITIAL_PLAYER },
    run: { ...INITIAL_RUN },
    village: { ...INITIAL_VILLAGE },
    equipped: [], backpack: [], dimensionalPouch: [],
    items: [], relics: [],
    diceBox: [{ ...INITIAL_PLAYER_DICE }],
    maxDiceBoxSlots: 2,
    selectedMovementDieId: null,
    showRewardModal: false, pendingRewards: null,
    visitedInterlude: false,
  }),
  setShowRewardModal: (v) => set({ showRewardModal: v }),
  setPendingRewards: (r) => set({ pendingRewards: r }),
}));
