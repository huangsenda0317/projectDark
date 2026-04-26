import React from 'react';
import type { Cell } from '../../types/game';

interface CircularBoardProps {
  cells: Cell[];
  playerIndex: number;
  highlightCW: number | null;
  highlightCCW: number | null;
  diceResult: number | null;
  onCellClick: (index: number) => void;
}

const CELL_ICONS: Record<string, string> = {
  combat: '⚔️',
  elite: '💀',
  shop: '🏪',
  prayer: '🕯️',
  treasure: '📦',
  event: '❓',
  trap: '🔥',
  boss: '🗡️',
  sanctified: '✨',
  void: '💀',
  start: '⭐',
};

const CELL_COLORS: Record<string, string> = {
  combat: '#c82014',
  elite: '#7c3aed',
  shop: '#2b7de9',
  prayer: '#cba258',
  treasure: '#fbbf24',
  event: '#10b981',
  trap: '#f97316',
  boss: '#c82014',
  sanctified: '#fbbf24',
  void: '#666666',
  start: '#2b7de9',
};

export const CircularBoard: React.FC<CircularBoardProps> = ({
  cells,
  playerIndex,
  highlightCW,
  highlightCCW,
  diceResult,
  onCellClick,
}) => {
  const centerX = 200;
  const centerY = 200;
  const radius = 140;

  const getPosition = (index: number) => {
    const angle = (index / cells.length) * Math.PI * 2 - Math.PI / 2;
    return {
      x: centerX + Math.cos(angle) * radius,
      y: centerY + Math.sin(angle) * radius,
    };
  };

  const isHighlighted = (index: number) => index === highlightCW || index === highlightCCW;

  return (
    <div className="relative w-full max-w-md mx-auto aspect-square">
      <svg viewBox="0 0 400 400" className="w-full h-full">
        {/* Center hub */}
        <circle cx={centerX} cy={centerY} r={36} fill="#1E3932" stroke="#cba258" strokeWidth={3} />
        <text x={centerX} y={centerY + 5} textAnchor="middle" fill="#fff" fontSize={14} fontWeight="bold">
          神坛
        </text>

        {/* Connecting lines */}
        {cells.map((cell, i) => {
          const pos = getPosition(i);
          return (
            <line
              key={`line-${cell.id}`}
              x1={centerX}
              y1={centerY}
              x2={pos.x}
              y2={pos.y}
              stroke={cell.triggered ? '#d4e9e2' : '#1E3932'}
              strokeWidth={1}
              strokeDasharray={cell.triggered ? '4 4' : undefined}
              opacity={cell.triggered ? 0.4 : 0.6}
            />
          );
        })}

        {/* Cell nodes */}
        {cells.map((cell, i) => {
          const pos = getPosition(i);
          const highlighted = isHighlighted(i);
          const triggered = cell.triggered;

          return (
            <g key={cell.id} onClick={() => onCellClick(i)} className="cursor-pointer">
              {/* Glow for highlighted */}
              {highlighted && (
                <circle
                  cx={pos.x}
                  cy={pos.y}
                  r={22}
                  fill="none"
                  stroke="#cba258"
                  strokeWidth={3}
                  opacity={0.8}
                >
                  <animate attributeName="r" values="22;26;22" dur="1s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="0.8;0.3;0.8" dur="1s" repeatCount="indefinite" />
                </circle>
              )}

              {/* Cell circle */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={18}
                fill={triggered ? '#edebe9' : CELL_COLORS[cell.type] || '#666'}
                stroke={highlighted ? '#cba258' : triggered ? '#999' : '#1E3932'}
                strokeWidth={highlighted ? 3 : 2}
                opacity={triggered ? 0.5 : 1}
              />

              {/* Icon */}
              <text
                x={pos.x}
                y={pos.y + 5}
                textAnchor="middle"
                fontSize={14}
                opacity={triggered ? 0.5 : 1}
              >
                {CELL_ICONS[cell.type] || '?'}
              </text>

              {/* Index label */}
              <text
                x={pos.x}
                y={pos.y + 28}
                textAnchor="middle"
                fontSize={8}
                fill="#666"
              >
                {i + 1}
              </text>
            </g>
          );
        })}

        {/* Player token */}
        {(() => {
          const pos = getPosition(playerIndex);
          return (
            <g>
              <circle cx={pos.x} cy={pos.y} r={10} fill="#2b7de9" stroke="#fff" strokeWidth={2}>
                <animate attributeName="r" values="10;12;10" dur="1.5s" repeatCount="indefinite" />
              </circle>
              <text x={pos.x} y={pos.y + 4} textAnchor="middle" fontSize={10} fill="#fff">🧙</text>
            </g>
          );
        })()}
      </svg>

      {/* Dice result overlay */}
      {diceResult !== null && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
          <div className="bg-white border-4 border-house-green rounded-2xl px-6 py-4 shadow-2xl animate-bounce">
            <div className="text-4xl font-bold text-house-green text-center">{diceResult}</div>
            <div className="text-xs text-text-soft text-center mt-1">点</div>
          </div>
        </div>
      )}
    </div>
  );
};
