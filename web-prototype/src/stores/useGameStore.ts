import { create } from 'zustand';
import type { PlayerState, RunProgress, VillageMeta, SceneType, EquipmentItem, Item, Relic, DiceEntity } from '../types/game';
import { INITIAL_PLAYER_DICE_SET, FALLBACK_D4 } from '../data/dice';
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
  startNewRun: () => void;
  resetGame: () => void;
  setShowRewardModal: (v: boolean) => void;
  setPendingRewards: (r: any[] | null) => void;
}

const INITIAL_PLAYER: PlayerState = {
  hp: 45, maxHp: 45, armor: 0,
  stats: { str: 3, agi: 3, int: 3, con: 3, fai: 3 },
  faith: 10, gold: 50,
  curseLevel: 0, encumbrance: 0,
  maxEncumbrance: calculateMaxEncumbrance(3),
  faithTags: [],
};

const INITIAL_RUN: RunProgress = {
  floor: 1, maxFloor: 10, diceHistory: [], totalFloorsCleared: 0,
};

const INITIAL_VILLAGE: VillageMeta = {
  level: 1, name: '晨星村', population: 3, faithReserve: 0,
  storedItems: [],
};

export const useGameStore = create<GameState>((set, get) => ({
  currentScene: 'board',
  player: { ...INITIAL_PLAYER },
  run: { ...INITIAL_RUN },
  village: { ...INITIAL_VILLAGE },
  equipped: [], backpack: [], dimensionalPouch: [],
  items: [], relics: [],
  diceBox: INITIAL_PLAYER_DICE_SET.map(d => ({ ...d })),
  maxDiceBoxSlots: 2,
  selectedMovementDieId: null,
  showRewardModal: false, pendingRewards: null,
  visitedInterlude: false,

  setScene: (scene) => set({ currentScene: scene }),
  updatePlayer: (partial) => set((s) => ({ player: { ...s.player, ...partial } })),
  addGold: (amount) => set((s) => ({ player: { ...s.player, gold: Math.max(0, s.player.gold + amount) } })),
  addFaith: (amount) => set((s) => ({
    player: { ...s.player, faith: Math.max(0, s.player.faith + amount) },
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
  // ─── Run Management ─────────────────────────────────────

  startNewRun: () => set((s) => ({
    currentScene: 'board',
    player: {
      ...INITIAL_PLAYER,
      stats: s.player.stats,
      maxHp: 30 + s.player.stats.con * 5,
      hp: 30 + s.player.stats.con * 5,
      faith: 10,
      gold: 50,
      maxEncumbrance: calculateMaxEncumbrance(s.player.stats.str),
    },
    run: { floor: 1, maxFloor: 10, diceHistory: [], totalFloorsCleared: s.run.totalFloorsCleared },
    equipped: [], backpack: [], dimensionalPouch: [], items: [], relics: [],
    diceBox: INITIAL_PLAYER_DICE_SET.map(d => ({ ...d })),
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
    diceBox: INITIAL_PLAYER_DICE_SET.map(d => ({ ...d })),
    maxDiceBoxSlots: 2,
    selectedMovementDieId: null,
    showRewardModal: false, pendingRewards: null,
    visitedInterlude: false,
  }),
  setShowRewardModal: (v) => set({ showRewardModal: v }),
  setPendingRewards: (r) => set({ pendingRewards: r }),
}));
