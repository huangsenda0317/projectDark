import React from 'react';
import { PixelButton } from '../common/PixelButton';

interface DiceRollerProps {
  canRoll: boolean;
  onRoll: () => void;
  diceResult: number | null;
}

export const DiceRoller: React.FC<DiceRollerProps> = ({ canRoll, onRoll, diceResult }) => {
  return (
    <div className="flex flex-col items-center gap-3 p-4 bg-ceramic rounded-card border-2 border-house-green/20">
      <div className="text-sm font-semibold text-text-soft">🎲 骰子</div>

      {diceResult !== null ? (
        <div className="flex flex-col items-center gap-2">
          <div className="text-3xl font-bold text-house-green">{diceResult}</div>
          <div className="text-xs text-text-soft">选择方向移动</div>
        </div>
      ) : (
        <PixelButton
          onClick={onRoll}
          disabled={!canRoll}
          variant="primary"
          className="text-base px-6 py-3"
        >
          投掷骰子
        </PixelButton>
      )}
    </div>
  );
};
