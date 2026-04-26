import React, { useEffect, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useBoardStore } from '../../stores/useBoardStore';
import { CircularBoard } from '../ui/CircularBoard';
import { DiceRoller } from '../ui/DiceRoller';
import { PixelButton } from '../common/PixelButton';
import { EventModal } from '../ui/EventModal';
import type { CellType } from '../../types/game';

export const BoardScene: React.FC = () => {
  const game = useGameStore();
  const board = useBoardStore();
  const [message, setMessage] = useState('');

  // Generate board on mount / floor change
  useEffect(() => {
    if (board.cells.length === 0) {
      board.generateBoard(game.run.floor);
    }
  }, [game.run.floor]);

  const handleRoll = () => {
    const roll = board.rollDice();
    game.addDiceHistory(roll);

    const count = board.cells.length;
    const cw = (board.playerIndex + roll) % count;
    const ccw = (board.playerIndex - roll + count) % count;

    board.setHighlights(cw, ccw);
    setMessage(`投出了 ${roll} 点！选择顺时针(${cw + 1})或逆时针(${ccw + 1})`);
  };

  const handleCellClick = (index: number) => {
    if (!board.diceResult) return;
    if (index !== board.highlightCW && index !== board.highlightCCW) return;

    const cell = board.cells[index];
    if (cell.triggered) {
      setMessage('这个格子已经触发过了');
      return;
    }

    board.moveTo(index);
    setMessage(`到达 ${getCellName(cell.type)}！`);
    handleCellTrigger(cell.type, index);
  };

  const handleCellTrigger = (type: CellType, index: number) => {
    switch (type) {
      case 'combat':
      case 'elite':
        game.setScene('combat');
        break;
      case 'boss':
        game.setScene('combat');
        break;
      case 'shop':
        board.setShowShopModal(true);
        break;
      case 'prayer':
        game.addFaith(3);
        setMessage('在祈祷所获得 3 点信仰！');
        break;
      case 'treasure':
        board.setShowTreasureModal(true);
        break;
      case 'event':
        board.setShowEventModal(true);
        break;
      case 'trap':
        game.takeDamage(5);
        setMessage('触发陷阱！受到 5 点伤害！');
        break;
      case 'void':
        game.addCurse(1);
        setMessage('踏入虚空格，诅咒+1！');
        break;
      default:
        break;
    }
  };

  const getCellName = (type: CellType) => {
    const names: Record<string, string> = {
      combat: '战斗', elite: '精英战', shop: '商店', prayer: '祈祷所',
      treasure: '宝藏', event: '随机事件', trap: '陷阱', boss: 'BOSS',
      sanctified: '圣化格', void: '虚空格', start: '起点',
    };
    return names[type] || '未知';
  };

  const handleReturnToCenter = () => {
    if (!board.canRoll) return;
    // Show interlude after completing a circuit
    game.setScene('interlude');
  };

  return (
    <div className="flex flex-col items-center gap-4 p-4 max-w-2xl mx-auto">
      {/* Message area */}
      {message && (
        <div className="w-full bg-house-green text-white px-4 py-2 rounded-card text-center text-sm">
          {message}
        </div>
      )}

      {/* Circular Board */}
      <CircularBoard
        cells={board.cells}
        playerIndex={board.playerIndex}
        highlightCW={board.highlightCW}
        highlightCCW={board.highlightCCW}
        diceResult={board.diceResult}
        onCellClick={handleCellClick}
      />

      {/* Controls */}
      <div className="flex flex-wrap items-center justify-center gap-4 w-full">
        <DiceRoller
          canRoll={board.canRoll}
          onRoll={handleRoll}
          diceResult={board.diceResult}
        />

        {board.diceResult && (
          <div className="flex gap-2">
            {board.highlightCW !== null && (
              <PixelButton variant="secondary" onClick={() => handleCellClick(board.highlightCW!)}>
                顺时针 ({board.highlightCW! + 1})
              </PixelButton>
            )}
            {board.highlightCCW !== null && (
              <PixelButton variant="secondary" onClick={() => handleCellClick(board.highlightCCW!)}>
                逆时针 ({board.highlightCCW! + 1})
              </PixelButton>
            )}
          </div>
        )}
      </div>

      {/* Return to center / Next floor */}
      <div className="flex gap-3">
        <PixelButton variant="gold" onClick={handleReturnToCenter}>
          回到中心 / 层间结算
        </PixelButton>
        <PixelButton variant="secondary" onClick={() => game.setScene('village')}>
          回村
        </PixelButton>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-xs text-text-soft justify-center">
        {['⚔️战斗', '💀精英', '🏪商店', '🕯️祈祷', '📦宝藏', '❓事件', '🔥陷阱', '🗡️BOSS'].map(tag => (
          <span key={tag} className="bg-ceramic px-2 py-1 rounded">{tag}</span>
        ))}
      </div>

      {/* Event Modal */}
      {board.showEventModal && (
        <EventModal onClose={() => board.setShowEventModal(false)} />
      )}
    </div>
  );
};
