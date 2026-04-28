import React from 'react';
import type { DiceEntity } from '../../types/game';
import { PixelButton } from '../common/PixelButton';

interface DiceRollerProps {
  diceBox: DiceEntity[];
  selectedDie: DiceEntity | null;
  onSelectDie: (die: DiceEntity | null) => void;
  canRoll: boolean;
  onRoll: () => void;
  diceResult: number | null;
  error: string | null;
}

const QUALITY_COLORS: Record<string, string> = {
  common: 'border-gray-300 bg-white',
  fine: 'border-blue-400 bg-blue-50',
  rare: 'border-purple-400 bg-purple-50',
  legendary: 'border-yellow-400 bg-yellow-50',
};

const QUALITY_LABELS: Record<string, string> = {
  common: '普通',
  fine: '精良',
  rare: '稀有',
  legendary: '传说',
};

const AFFIX_TYPE_LABELS: Record<string, string> = {
  throw: '投',
  embed: '嵌',
  universal: '通',
};

export const DiceRoller: React.FC<DiceRollerProps> = ({
  diceBox,
  selectedDie,
  onSelectDie,
  canRoll,
  onRoll,
  diceResult,
  error,
}) => {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-ceramic rounded-card border-2 border-house-green/20">
      <div className="text-sm font-semibold text-text-soft">
        🎲 骰子匣 ({diceBox.length} 枚)
      </div>

      {/* Dice box grid */}
      {diceBox.length === 0 ? (
        <div className="text-xs text-text-soft italic py-2">骰子匣为空</div>
      ) : (
        <div className="flex gap-2 flex-wrap justify-center">
          {diceBox.map(die => {
            const isSelected = selectedDie?.id === die.id;
            return (
              <button
                key={die.id}
                onClick={() => onSelectDie(isSelected ? null : die)}
                disabled={!canRoll}
                className={`
                  relative w-16 h-20 rounded-xl border-2 transition-all duration-150
                  flex flex-col items-center justify-center gap-1
                  ${QUALITY_COLORS[die.quality]}
                  ${isSelected
                    ? 'scale-110 shadow-lg border-gold ring-2 ring-gold/50'
                    : 'hover:border-house-green/40 cursor-pointer'
                  }
                  ${!die.canMove ? 'opacity-50' : ''}
                  ${!canRoll ? 'opacity-60 cursor-not-allowed' : ''}
                `}
                title={!die.canMove ? 'D100 不可用于移动' : `${die.name} — 点击选择`}
              >
                <span className="text-lg font-bold font-mono text-house-green">
                  D{die.faces}
                </span>
                <span className="text-[9px] text-text-soft leading-tight text-center">
                  {die.name}
                </span>
                {/* Affix badges */}
                {die.affixes.length > 0 && (
                  <div className="flex gap-0.5 absolute -bottom-1">
                    {die.affixes.map((a, i) => (
                      <span
                        key={i}
                        className="text-[7px] px-1 rounded-full bg-house-green/10 text-house-green"
                      >
                        {AFFIX_TYPE_LABELS[a.type]}
                      </span>
                    ))}
                  </div>
                )}
                {!die.canMove && (
                  <span className="absolute -top-1 -right-1 text-[10px]">🚫</span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* Error message */}
      {error && (
        <div className="text-xs text-danger bg-red-50 px-3 py-1 rounded">
          {error}
        </div>
      )}

      {/* Selected info */}
      {selectedDie && (
        <div className="text-xs text-text-soft bg-house-green/5 px-3 py-1 rounded text-center">
          已选: <span className="font-bold text-house-green">{selectedDie.name}</span>
          <span className="mx-1">·</span>
          {QUALITY_LABELS[selectedDie.quality]}
          <span className="mx-1">·</span>
          面数 D{selectedDie.faces}
          {selectedDie.affixes.length > 0 && (
            <div className="mt-0.5 flex gap-1 justify-center flex-wrap">
              {selectedDie.affixes.map((a, i) => (
                <span key={i} className="text-[9px] bg-house-green/10 px-1 rounded" title={a.effect}>
                  {a.name}: {a.effect}
                </span>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Roll result or button */}
      {diceResult !== null ? (
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl font-bold text-house-green animate-bounce">{diceResult}</div>
          <div className="text-xs text-text-soft">选择方向移动</div>
        </div>
      ) : (
        <PixelButton
          onClick={onRoll}
          disabled={!canRoll || !selectedDie}
          variant="primary"
          className="text-base px-6 py-3"
        >
          {!selectedDie ? '请先选择骰子' : '投掷骰子'}
        </PixelButton>
      )}
    </div>
  );
};
