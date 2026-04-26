import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { getEncumbranceState, getEncumbranceEffects } from '../../services/encumbranceService';

export const TopBar: React.FC = () => {
  const player = useGameStore(s => s.player);
  const run = useGameStore(s => s.run);

  const encState = getEncumbranceState(player.encumbrance, player.maxEncumbrance);
  const encInfo = getEncumbranceEffects(encState);

  const barItem = (icon: string, label: string, value: string | number, color?: string) => (
    <div className="flex items-center gap-1.5 bg-house-green/10 px-3 py-1 rounded-pill border border-house-green/20">
      <span className="text-base">{icon}</span>
      <span className="text-xs font-medium text-text-soft">{label}</span>
      <span className="text-sm font-bold" style={{ color: color || '#1E3932' }}>{value}</span>
    </div>
  );

  return (
    <div className="w-full bg-parchment/95 backdrop-blur-sm border-b-2 border-house-green/20 shadow-nav z-50">
      <div className="max-w-6xl mx-auto px-4 py-2 flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {barItem('🏰', '层数', `${run.floor}/10`)}
        </div>

        <div className="flex items-center gap-2 flex-wrap">
          {barItem('✝️', '信仰', `${player.faith}/${player.maxFaith}`, '#cba258')}
          {barItem('💰', '金币', player.gold, '#fbbf24')}
          {barItem('❤️', 'HP', `${player.hp}/${player.maxHp}`, player.hp < player.maxHp * 0.3 ? '#c82014' : '#22c55e')}
          {barItem('💀', '诅咒', player.curseLevel, player.curseLevel > 5 ? '#c82014' : undefined)}
          {barItem('⚖️', '负重', `${player.encumbrance}/${player.maxEncumbrance}`, encInfo.color)}
        </div>
      </div>

      {/* Encumbrance tooltip */}
      <div className="max-w-6xl mx-auto px-4 pb-1">
        <div className="text-xs text-text-soft">
          负重状态: <span style={{ color: encInfo.color }} className="font-semibold">{encInfo.label}</span>
          {' '}( {encInfo.bonus} )
        </div>
      </div>
    </div>
  );
};
