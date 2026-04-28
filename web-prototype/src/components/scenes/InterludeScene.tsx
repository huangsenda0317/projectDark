import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useBoardStore } from '../../stores/useBoardStore';
import { EQUIPMENT_ITEMS } from '../../data/equipmentSets';
import { getRandomRelic } from '../../data/relics';
import { generateRandomDice } from '../../data/dice';
import { PixelButton } from '../common/PixelButton';
import type { EquipmentItem, Relic, DiceEntity } from '../../types/game';

export const InterludeScene: React.FC = () => {
  const game = useGameStore();
  const board = useBoardStore();
  const [selectedEquip, setSelectedEquip] = useState<EquipmentItem | null>(null);
  const [selectedRelic, setSelectedRelic] = useState<Relic | null>(null);
  const [selectedDice, setSelectedDice] = useState<DiceEntity | null>(null);
  const [purified, setPurified] = useState(false);

  const equipRewards = React.useMemo(() => {
    const shuffled = [...EQUIPMENT_ITEMS].sort(() => Math.random() - 0.5);
    return shuffled.slice(0, 2);
  }, [game.run.floor]);

  const relicRewards = React.useMemo(() => {
    return [getRandomRelic(), getRandomRelic()];
  }, [game.run.floor]);

  const diceRewards = React.useMemo(() => {
    return [generateRandomDice(game.run.floor), generateRandomDice(game.run.floor)];
  }, [game.run.floor]);

  const handlePickEquip = (equip: EquipmentItem) => {
    if (selectedEquip) return;
    setSelectedEquip(equip);
    game.addToBackpack(equip);
  };

  const handlePickRelic = (relic: Relic) => {
    if (selectedRelic) return;
    setSelectedRelic(relic);
    game.addRelic(relic);
  };

  const handlePickDice = (dice: DiceEntity) => {
    if (selectedDice) return;
    if (!game.addDice(dice)) {
      alert('骰子匣已满！');
      return;
    }
    setSelectedDice(dice);
  };

  const handlePurify = () => {
    if (purified) return;
    if (game.player.gold < 5) return;
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
      village: { ...game.village, faithReserve: game.village.faithReserve + faith },
    });
  };

  const handleContinue = () => {
    game.nextFloor();
    board.generateBoard(game.run.floor + 1);
    game.setScene('board');
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto">
      <div className="bg-house-green text-white rounded-card p-4 text-center">
        <h1 className="text-2xl font-bold font-gothic">层间神坛</h1>
        <p className="text-sm text-white/70 mt-1">第 {game.run.floor} 层已完成</p>
      </div>

      {/* Dice reward (NEW per GDD v0.3) */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20">
        <h2 className="text-lg font-bold text-house-green mb-3">🎲 选择一枚骰子</h2>
        <div className="flex justify-center gap-3 flex-wrap">
          {diceRewards.map(dice => (
            <button key={dice.id} onClick={() => handlePickDice(dice)} disabled={!!selectedDice}
              className={`p-3 rounded-card border-2 text-left min-w-[140px] transition-all ${
                selectedDice?.id === dice.id ? 'border-gold scale-105 shadow-lg bg-gold-lightest' : 'border-house-green/20 bg-white hover:border-house-green/40'
              } ${selectedDice && selectedDice.id !== dice.id ? 'opacity-40' : ''}`}>
              <div className="text-sm font-bold text-house-green">{dice.name}</div>
              <div className="text-xs text-text-soft">面数: D{dice.faces}</div>
              <div className="text-xs mt-1">
                {dice.affixes.map((a, i) => (
                  <div key={i} className="text-[9px] text-text-soft">{a.name}: {a.effect}</div>
                ))}
              </div>
            </button>
          ))}
        </div>
        <div className="text-xs text-text-soft mt-2 text-center">
          骰子匣: {game.diceBox.length}/{game.maxDiceBoxSlots}
        </div>
      </div>

      {/* Equipment reward */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20">
        <h2 className="text-lg font-bold text-house-green mb-3">🗡️ 选择一件装备</h2>
        <div className="flex justify-center gap-3 flex-wrap">
          {equipRewards.map(equip => (
            <button key={equip.id} onClick={() => handlePickEquip(equip)} disabled={!!selectedEquip}
              className={`p-3 rounded-card border-2 text-left min-w-[140px] transition-all ${
                selectedEquip?.id === equip.id ? 'border-gold scale-105 shadow-lg bg-gold-lightest' : 'border-house-green/20 bg-white hover:border-house-green/40'
              } ${selectedEquip && selectedEquip.id !== equip.id ? 'opacity-40' : ''}`}>
              <div className="text-sm font-bold text-house-green">{equip.name}</div>
              <div className="text-xs text-text-soft">{equip.description}</div>
              <div className="text-xs mt-1">重量: <span className="font-semibold">{equip.weight}kg</span></div>
            </button>
          ))}
        </div>
      </div>

      {/* Relic reward */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20">
        <h2 className="text-lg font-bold text-house-green mb-3">📿 选择一件遗物</h2>
        <div className="flex justify-center gap-3 flex-wrap">
          {relicRewards.map(relic => (
            <button key={relic.id} onClick={() => handlePickRelic(relic)} disabled={!!selectedRelic}
              className={`p-3 rounded-card border-2 text-left min-w-[140px] transition-all ${
                selectedRelic?.id === relic.id ? 'border-gold scale-105 shadow-lg bg-gold-lightest' : 'border-house-green/20 bg-white hover:border-house-green/40'
              } ${selectedRelic && selectedRelic.id !== relic.id ? 'opacity-40' : ''}`}>
              <div className="text-sm font-bold text-house-green">{relic.name}</div>
              <div className="text-xs text-text-soft">{relic.description}</div>
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-wrap justify-center gap-3">
        <PixelButton variant="secondary" onClick={handlePurify} disabled={purified || game.player.gold < 5}>
          {purified ? '已净化' : '净化诅咒 (-5金)'}
        </PixelButton>
        <PixelButton variant="gold" onClick={handleContribute}>
          贡献村庄 (30%资源)
        </PixelButton>
      </div>

      <div className="flex justify-center gap-3">
        <PixelButton variant="primary" onClick={handleContinue} className="text-lg px-8 py-3">
          继续上升
        </PixelButton>
        <PixelButton variant="secondary" onClick={() => game.setScene('village')}>
          回村休整
        </PixelButton>
      </div>
    </div>
  );
};
