import { create } from 'zustand';
import type { PlayerState, RunProgress, VillageMeta, SceneType, EquipmentItem, Card } from '../types/game';
import { STARTER_DECK } from '../data/cards';

interface GameState {
  currentScene: SceneType;
  player: PlayerState;
  run: RunProgress;
  village: VillageMeta;
  equipped: EquipmentItem[];
  backpack: EquipmentItem[];
  dimensionalPouch: EquipmentItem[];
  deck: Card[];
  visitedInterlude: boolean;

  // Actions
  setScene: (scene: SceneType) => void;
  updatePlayer: (partial: Partial<PlayerState>) => void;
  addGold: (amount: number) => void;
  addFaith: (amount: number) => void;
  takeDamage: (amount: number) => void;
  heal: (amount: number) => void;
  addCurse: (amount: number) => void;
  addDiceHistory: (roll: number) => void;
  nextFloor: () => void;
  equipItem: (item: EquipmentItem) => void;
  unequipItem: (itemId: string) => void;
  addToBackpack: (item: EquipmentItem) => void;
  addToDimensionalPouch: (item: EquipmentItem) => void;
  addCardToDeck: (card: Card) => void;
  removeCardFromDeck: (cardId: string) => void;
  addFaithTag: (tag: string) => void;
  contributeToVillage: (gold: number, faith: number) => void;
  startNewRun: () => void;
  resetGame: () => void;
}

const INITIAL_PLAYER: PlayerState = {
  hp: 60,
  maxHp: 60,
  armor: 0,
  stats: { str: 5, agi: 5, int: 5, con: 5, fai: 5 },
  faith: 5,
  maxFaith: 20,
  gold: 50,
  curseLevel: 0,
  encumbrance: 0,
  maxEncumbrance: 20, // base 10 + str*2
  faithTags: [],
};

const INITIAL_RUN: RunProgress = {
  floor: 1,
  maxFloor: 10,
  diceHistory: [],
  totalFloorsCleared: 0,
};

const INITIAL_VILLAGE: VillageMeta = {
  level: 1,
  name: '晨星村',
  population: 3,
  taxPerRun: 5,
  faithReserve: 0,
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
  equipped: [],
  backpack: [],
  dimensionalPouch: [],
  deck: [...STARTER_DECK],
  visitedInterlude: false,

  setScene: (scene) => set({ currentScene: scene }),

  updatePlayer: (partial) =>
    set((state) => ({
      player: { ...state.player, ...partial },
    })),

  addGold: (amount) =>
    set((state) => ({
      player: { ...state.player, gold: Math.max(0, state.player.gold + amount) },
    })),

  addFaith: (amount) =>
    set((state) => ({
      player: {
        ...state.player,
        faith: Math.max(0, Math.min(state.player.maxFaith, state.player.faith + amount)),
      },
    })),

  takeDamage: (amount) =>
    set((state) => {
      const armor = state.player.armor;
      const damageThroughArmor = Math.max(0, amount - armor);
      const newArmor = Math.max(0, armor - amount);
      const newHp = Math.max(0, state.player.hp - damageThroughArmor);
      return {
        player: { ...state.player, hp: newHp, armor: newArmor },
      };
    }),

  heal: (amount) =>
    set((state) => ({
      player: {
        ...state.player,
        hp: Math.min(state.player.maxHp, state.player.hp + amount),
      },
    })),

  addCurse: (amount) =>
    set((state) => ({
      player: { ...state.player, curseLevel: state.player.curseLevel + amount },
    })),

  addDiceHistory: (roll) =>
    set((state) => ({
      run: { ...state.run, diceHistory: [...state.run.diceHistory, roll] },
    })),

  nextFloor: () =>
    set((state) => ({
      run: {
        ...state.run,
        floor: state.run.floor + 1,
        diceHistory: [],
        totalFloorsCleared: state.run.totalFloorsCleared + 1,
      },
      visitedInterlude: false,
    })),

  equipItem: (item) =>
    set((state) => {
      const existing = state.equipped.find(e => e.slot === item.slot);
      let newEquipped = state.equipped.filter(e => e.slot !== item.slot);
      if (existing) {
        state.backpack.push(existing);
      }
      newEquipped = [...newEquipped, item];
      const encumbrance = newEquipped.reduce((sum, e) => sum + e.weight, 0)
        + state.backpack.reduce((sum, b) => sum + b.weight, 0);
      return {
        equipped: newEquipped,
        backpack: state.backpack.filter(b => b.id !== item.id),
        player: { ...state.player, encumbrance },
      };
    }),

  unequipItem: (itemId) =>
    set((state) => {
      const item = state.equipped.find(e => e.id === itemId);
      if (!item) return state;
      const newEquipped = state.equipped.filter(e => e.id !== itemId);
      const newBackpack = [...state.backpack, item];
      const encumbrance = newEquipped.reduce((sum, e) => sum + e.weight, 0)
        + newBackpack.reduce((sum, b) => sum + b.weight, 0);
      return {
        equipped: newEquipped,
        backpack: newBackpack,
        player: { ...state.player, encumbrance },
      };
    }),

  addToBackpack: (item) =>
    set((state) => {
      const newBackpack = [...state.backpack, item];
      const encumbrance = state.equipped.reduce((sum, e) => sum + e.weight, 0)
        + newBackpack.reduce((sum, b) => sum + b.weight, 0);
      return {
        backpack: newBackpack,
        player: { ...state.player, encumbrance },
      };
    }),

  addToDimensionalPouch: (item) =>
    set((state) => ({
      dimensionalPouch: [...state.dimensionalPouch, item],
    })),

  addCardToDeck: (card) =>
    set((state) => ({
      deck: [...state.deck, card],
    })),

  removeCardFromDeck: (cardId) =>
    set((state) => ({
      deck: state.deck.filter(c => c.id !== cardId),
    })),

  addFaithTag: (tag) =>
    set((state) => {
      if (state.player.faithTags.includes(tag as never)) return state;
      return {
        player: {
          ...state.player,
          faithTags: [...state.player.faithTags, tag as never],
        },
      };
    }),

  contributeToVillage: (gold, faith) =>
    set((state) => ({
      player: { ...state.player, gold: state.player.gold - gold },
      village: {
        ...state.village,
        faithReserve: state.village.faithReserve + faith,
      },
    })),

  startNewRun: () =>
    set((state) => ({
      currentScene: 'board',
      player: {
        ...INITIAL_PLAYER,
        stats: state.player.stats, // keep upgraded stats
        maxHp: 60 + state.player.stats.con * 5,
        hp: 60 + state.player.stats.con * 5,
        maxFaith: 20 + (state.village.buildings.find(b => b.id === 'church')?.built ? 3 : 0),
        faith: 5 + state.village.population,
        gold: 50 + state.village.taxPerRun,
        maxEncumbrance: 10 + state.player.stats.str * 2,
      },
      run: {
        floor: 1,
        maxFloor: 10,
        diceHistory: [],
        totalFloorsCleared: state.run.totalFloorsCleared,
      },
      deck: [...STARTER_DECK],
      visitedInterlude: false,
    })),

  resetGame: () =>
    set({
      currentScene: 'board',
      player: { ...INITIAL_PLAYER },
      run: { ...INITIAL_RUN },
      village: { ...INITIAL_VILLAGE },
      equipped: [],
      backpack: [],
      dimensionalPouch: [],
      deck: [...STARTER_DECK],
      visitedInterlude: false,
    }),
}));
