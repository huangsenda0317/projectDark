import { create } from 'zustand';
import type { Cell, CellType, DiceEntity } from '../types/game';

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

function generateCells(count: number, _floor: number): Cell[] {
  const cells: Cell[] = [];
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
  // Dice selection
  selectedDie: DiceEntity | null;
  moveError: string | null;

  generateBoard: (floor: number) => void;
  selectDie: (die: DiceEntity | null) => void;
  rollDice: () => number | null;
  setDiceResult: (n: number | null) => void;
  setCanRoll: (v: boolean) => void;
  setHighlights: (cw: number | null, ccw: number | null) => void;
  moveTo: (index: number) => void;
  markTriggered: (index: number) => void;
  setShowEventModal: (v: boolean) => void;
  setShowShopModal: (v: boolean) => void;
  setShowTreasureModal: (v: boolean) => void;
  setCurrentEventId: (id: string | null) => void;
  clearMoveError: () => void;
  resetBoard: () => void;
}

/** GDD v0.4.1: Tower-level based cell count */
const CELL_COUNT_TABLE: Record<number, number> = {
  1: 20, 2: 20, 3: 22, 4: 22, 5: 24,
  6: 24, 7: 26, 8: 26, 9: 28, 10: 30,
};

function getCellCount(floor: number): number {
  return CELL_COUNT_TABLE[floor] ?? (20 + Math.floor((floor - 1) / 2) * 2);
}

export const useBoardStore = create<BoardState>((set, get) => ({
  cells: [],
  playerIndex: 0,
  diceResult: null,
  canRoll: false,
  isMoving: false,
  highlightCW: null,
  highlightCCW: null,
  showEventModal: false,
  showShopModal: false,
  showTreasureModal: false,
  currentEventId: null,
  selectedDie: null,
  moveError: null,

  generateBoard: (floor) =>
    set({
      cells: generateCells(getCellCount(floor), floor),
      playerIndex: 0,
      diceResult: null,
      canRoll: false,
      isMoving: false,
      highlightCW: null,
      highlightCCW: null,
      selectedDie: null,
      moveError: null,
    }),

  selectDie: (die) => set({ selectedDie: die, moveError: null }),

  rollDice: () => {
    const s = get();
    if (!s.selectedDie) {
      set({ moveError: '请先从骰子匣选择一枚骰子' });
      return null;
    }
    if (!s.selectedDie.canMove) {
      set({ moveError: 'D100 太重了，掷不动！仅供嵌入战斗使用' });
      return null;
    }

    const faces: number = s.selectedDie.faces;
    let result: number = Math.floor(Math.random() * faces) + 1;

    // D20 halving for movement (GDD section 6.4)
    if (faces === 20) {
      result = Math.floor(result / 2);
    }

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
      canRoll: false,
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
  clearMoveError: () => set({ moveError: null }),

  resetBoard: () =>
    set({
      cells: [],
      playerIndex: 0,
      diceResult: null,
      canRoll: false,
      isMoving: false,
      highlightCW: null,
      highlightCCW: null,
      selectedDie: null,
      moveError: null,
    }),
}));
