import { create } from 'zustand';
import type { Cell, CellType } from '../types/game';

const CELL_TYPE_POOL: CellType[] = [
  'combat', 'combat', 'combat', 'combat',
  'elite', 'elite',
  'shop', 'shop',
  'prayer', 'prayer',
  'treasure',
  'event', 'event', 'event',
  'trap', 'trap',
  'boss',
];

function generateCells(count: number, floor: number): Cell[] {
  const cells: Cell[] = [];
  // Ensure at least one boss
  const bossIndex = Math.floor(Math.random() * count);

  for (let i = 0; i < count; i++) {
    let type: CellType;
    if (i === bossIndex) {
      type = 'boss';
    } else if (i === 0) {
      type = 'start';
    } else {
      type = CELL_TYPE_POOL[Math.floor(Math.random() * CELL_TYPE_POOL.length)];
    }
    cells.push({
      id: i,
      type,
      index: i,
      triggered: false,
      sanctified: false,
      corrupted: false,
    });
  }
  return cells;
}

interface BoardState {
  cells: Cell[];
  playerIndex: number;
  diceResult: number | null;
  canRoll: boolean;
  isMoving: boolean;
  highlightCW: number | null;
  highlightCCW: number | null;
  showEventModal: boolean;
  showShopModal: boolean;
  showTreasureModal: boolean;
  currentEventId: string | null;

  // Actions
  generateBoard: (floor: number) => void;
  rollDice: () => number;
  setDiceResult: (n: number | null) => void;
  setCanRoll: (v: boolean) => void;
  setHighlights: (cw: number | null, ccw: number | null) => void;
  moveTo: (index: number) => void;
  markTriggered: (index: number) => void;
  setShowEventModal: (v: boolean) => void;
  setShowShopModal: (v: boolean) => void;
  setShowTreasureModal: (v: boolean) => void;
  setCurrentEventId: (id: string | null) => void;
  resetBoard: () => void;
}

function getCellCount(floor: number): number {
  if (floor <= 3) return 30;
  if (floor <= 6) return 32;
  if (floor <= 9) return 34;
  return 36;
}

export const useBoardStore = create<BoardState>((set) => ({
  cells: [],
  playerIndex: 0,
  diceResult: null,
  canRoll: true,
  isMoving: false,
  highlightCW: null,
  highlightCCW: null,
  showEventModal: false,
  showShopModal: false,
  showTreasureModal: false,
  currentEventId: null,

  generateBoard: (floor) =>
    set({
      cells: generateCells(getCellCount(floor), floor),
      playerIndex: 0,
      diceResult: null,
      canRoll: true,
      isMoving: false,
      highlightCW: null,
      highlightCCW: null,
    }),

  rollDice: () => {
    const result = Math.floor(Math.random() * 6) + 1;
    set({ diceResult: result, canRoll: false });
    return result;
  },

  setDiceResult: (n) => set({ diceResult: n }),
  setCanRoll: (v) => set({ canRoll: v }),

  setHighlights: (cw, ccw) => set({ highlightCW: cw, highlightCCW: ccw }),

  moveTo: (index) =>
    set((state) => ({
      playerIndex: index,
      isMoving: false,
      canRoll: true,
      diceResult: null,
      highlightCW: null,
      highlightCCW: null,
      cells: state.cells.map((c, i) =>
        i === index ? { ...c, triggered: true } : c
      ),
    })),

  markTriggered: (index) =>
    set((state) => ({
      cells: state.cells.map((c, i) =>
        i === index ? { ...c, triggered: true } : c
      ),
    })),

  setShowEventModal: (v) => set({ showEventModal: v }),
  setShowShopModal: (v) => set({ showShopModal: v }),
  setShowTreasureModal: (v) => set({ showTreasureModal: v }),
  setCurrentEventId: (id) => set({ currentEventId: id }),

  resetBoard: () =>
    set({
      cells: [],
      playerIndex: 0,
      diceResult: null,
      canRoll: true,
      isMoving: false,
      highlightCW: null,
      highlightCCW: null,
    }),
}));
