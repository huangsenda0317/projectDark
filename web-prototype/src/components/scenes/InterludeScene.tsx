import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useBoardStore } from '../../stores/useBoardStore';
import { CARDS } from '../../data/cards';
import { EQUIPMENT_ITEMS } from '../../data/equipmentSets';
import { PixelButton } from '../common/PixelButton';
import type { Card, EquipmentItem } from '../../types/game';

export const InterludeScene: React.FC = () => {
  const game = useGameStore();
  const board = useBoardStore();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [selectedEquip, setSelectedEquip] = useState<EquipmentItem | null>(null);
  const [purified, setPurified] = useState(false);

  // Generate rewards
  const cardRewards = React.useMemo(() => {
    const pool = CARDS.filter(c => c.type !== 'curse' && c.type !== 'miracle');
    const shuffled = [...pool].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 3);
  }, [game.run.floor]);

  const equipRewards = React.useMemo(() => {
    const shuffled = [...EQUIPMENT_ITEMS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, [game.run.floor]);

  const handlePickCard = (card: Card) => {
    if (selectedCard) return;
    setSelectedCard(card);
    game.addCardToDeck(card);
  };

  const handlePickEquip = (equip: EquipmentItem) => {
    if (selectedEquip) return;
    setSelectedEquip(equip);
    game.addToBackpack(equip);
  };

  const handlePurify = () => {
    if (purified) return;
    if (game.player.gold < 5) {
      alert('金币不足！');
      return;
    }
    game.addGold(-5);
    game.addCurse(-Math.min(3, game.player.curseLevel));
    setPurified(true);
  };

  const handleContribute = () => {
    const gold = Math.floor(game.player.gold * 0.3);
    const faith = Math.floor(game.player.faith * 0.3);
    game.addGold(-gold);
    game.addFaith(-faith);
    useGameStore.setState({
      village: {
        ...game.village,
        faithReserve: game.village.faithReserve + faith,
      },
    });
  };

  const handleContinue = () => {
    game.nextFloor();
    board.generateBoard(game.run.floor + 1);
    game.setScene('board');
  };

  const handleReturnToVillage = () => {
    game.setScene('village');
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-house-green text-white rounded-card p-4 text-center">
        <h1 className="text-2xl font-bold font-gothic">层间神坛</h1>
        <p className="text-sm text-white/70 mt-1">第 {game.run.floor} 层已完成</p>
      </div>

      {/* Card reward */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20">
        <h2 className="text-lg font-bold text-house-green mb-3">🃏 选择一张卡牌加入卡组</h2>
        <div className="flex justify-center gap-3 flex-wrap">
          {cardRewards.map(card => (
            <button
              key={card.id}
              onClick={() => handlePickCard(card)}
              disabled={!!selectedCard}
              className={`
                w-24 h-36 rounded-card p-2 flex flex-col justify-between border-2 transition-all
                ${selectedCard?.id === card.id ? 'border-gold scale-105 shadow-lg' : 'border-black/20 hover:border-black/40'}
                ${selectedCard && selectedCard.id !== card.id ? 'opacity-40' : ''}
              `}
              style={{ backgroundColor: card.color + '15' }}
            >
              <div className="h-1.5 w-full rounded-full" style={{ backgroundColor: card.color }} />
              <div className="text-xs font-bold text-center">{card.name}</div>
              <div className="text-[10px] text-text-soft text-center">{card.description}</div>
              <div className="text-center text-xs font-bold">
                {card.type === 'attack' && '⚔️ 攻击'}
                {card.type === 'defense' && '🛡️ 防御'}
                {card.type === 'faith' && '✝️ 信仰'}
                {card.type === 'heretic' && '🔥 异端'}
                {card.type === 'curse' && '💀 诅咒'}
                {card.type === 'miracle' && '✨ 神迹'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Equipment reward */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20">
        <h2 className="text-lg font-bold text-house-green mb-3">⚔️ 选择一件装备</h2>
        <div className="flex justify-center gap-3 flex-wrap">
          {equipRewards.map(equip => (
            <button
              key={equip.id}
              onClick={() => handlePickEquip(equip)}
              disabled={!!selectedEquip}
              className={`
                p-3 rounded-card border-2 text-left min-w-[140px] transition-all
                ${selectedEquip?.id === equip.id ? 'border-gold scale-105 shadow-lg bg-gold-lightest' : 'border-house-green/20 bg-white hover:border-house-green/40'}
                ${selectedEquip && selectedEquip.id !== equip.id ? 'opacity-40' : ''}
              `}
            >
              <div className="text-sm font-bold text-house-green">{equip.name}</div>
              <div className="text-xs text-text-soft">{equip.description}</div>
              <div className="text-xs mt-1">
                <span className="text-text-soft">重量: </span>
                <span className="font-semibold">{equip.weight}kg</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Actions */}
      <div className="flex flex-wrap justify-center gap-3">
        <PixelButton variant="secondary" onClick={handlePurify} disabled={purified || game.player.gold < 5}>
          {purified ? '已净化' : '净化诅咒 (-5金)'}
        </PixelButton>
        <PixelButton variant="gold" onClick={handleContribute}>
          贡献村庄 (30%资源)
        </PixelButton>
      </div>

      {/* Continue */}
      <div className="flex justify-center gap-3">
        <PixelButton variant="primary" onClick={handleContinue} className="text-lg px-8 py-3">
          继续上升
        </PixelButton>
        <PixelButton variant="secondary" onClick={handleReturnToVillage}>
          回村休整
        </PixelButton>
      </div>
    </div>
  );
};
