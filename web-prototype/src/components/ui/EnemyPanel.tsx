import React from 'react';
import type { Enemy } from '../../types/game';

interface EnemyPanelProps {
  enemy: Enemy;
  index: number;
}

const INTENT_ICONS: Record<string, string> = {
  attack: '⚔️',
  block: '🛡️',
  summon: '👥',
  curse: '💀',
  buff: '✨',
};

const INTENT_LABELS: Record<string, string> = {
  attack: '攻击',
  block: '格挡',
  summon: '召唤',
  curse: '诅咒',
  buff: '强化',
};

export const EnemyPanel: React.FC<EnemyPanelProps> = ({ enemy, index }) => {
  const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);

  return (
    <div className="bg-ceramic border-2 border-house-green/30 rounded-card p-3 w-36 flex flex-col items-center gap-2">
      {/* Sprite placeholder */}
      <div className="w-16 h-16 bg-house-green/10 rounded-lg flex items-center justify-center text-3xl border border-house-green/20">
        {enemy.sprite === 'goblin' && '👺'}
        {enemy.sprite === 'skeleton' && '💀'}
        {enemy.sprite === 'cultist' && '👹'}
        {enemy.sprite === 'knight' && '🛡️'}
        {enemy.sprite === 'boss' && '👑'}
      </div>

      <div className="text-sm font-bold text-house-green text-center leading-tight">{enemy.name}</div>

      {/* HP bar */}
      <div className="w-full bg-black/10 rounded-full h-3 overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${hpPercent}%`,
            backgroundColor: hpPercent > 50 ? '#c82014' : hpPercent > 25 ? '#f97316' : '#7c3aed',
          }}
        />
      </div>
      <div className="text-xs text-text-soft">
        {Math.max(0, enemy.hp)}/{enemy.maxHp}
      </div>

      {/* Armor */}
      {enemy.armor > 0 && (
        <div className="text-xs text-light-green font-semibold">
          护甲: {enemy.armor}
        </div>
      )}

      {/* Intent */}
      <div className="flex items-center gap-1 bg-house-green/10 px-2 py-1 rounded-pill">
        <span>{INTENT_ICONS[enemy.intent] || '?'}</span>
        <span className="text-xs font-medium">{INTENT_LABELS[enemy.intent] || '未知'}</span>
        {enemy.intent === 'attack' && (
          <span className="text-xs text-danger font-bold">{enemy.damage}</span>
        )}
      </div>
    </div>
  );
};
