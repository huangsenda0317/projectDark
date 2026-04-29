import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { DiceAllocationPanel } from '../ui/DiceAllocationPanel';
import { RewardModal } from '../ui/RewardModal';
import { PixelButton } from '../common/PixelButton';
import { generateRewards } from '../../services/rewardService';
import type { RewardOption } from '../../types/game';

const INTENT_ICONS: Record<string, string> = {
  attack: '⚔️', block: '🛡️', summon: '👥', curse: '💀', buff: '✨',
};

const INTENT_LABELS: Record<string, string> = {
  attack: '攻击', block: '防御', summon: '召唤', curse: '诅咒', buff: '强化',
};

export const CombatScene: React.FC = () => {
  const game = useGameStore();
  const combat = useCombatStore();
  const [rewards, setRewards] = useState<RewardOption[] | null>(null);

  const handleVictory = () => {
    if (!rewards) {
      const r = generateRewards(game.run.floor, false);
      setRewards(r);
      return;
    }
    // GDD v0.4.1: dice stay embedded after combat
    combat.resetCombatSoft();
    setRewards(null);
    if (game.run.floor >= 10) {
      game.resetGame();
      game.setScene('board');
    } else {
      game.setScene('interlude');
    }
  };

  const handleRewardPick = (reward: RewardOption) => {
    if (reward.type === 'dice' && reward.dice) {
      game.addDice(reward.dice);
    } else if (reward.type === 'equipment' && reward.equipment) {
      game.addToBackpack(reward.equipment);
    } else if (reward.type === 'gold' && reward.gold) {
      game.addGold(reward.gold);
    } else if (reward.type === 'item' && reward.item) {
      game.addItem(reward.item);
    } else if (reward.type === 'relic' && reward.relic) {
      game.addRelic(reward.relic);
    } else if (reward.type === 'restore' && reward.restore) {
      if (reward.restore.hp) game.heal(reward.restore.hp);
      if (reward.restore.faith) game.addFaith(reward.restore.faith);
      if (reward.restore.curse) game.addCurse(-reward.restore.curse);
    }

    setRewards(null);
    // GDD v0.4.1: dice stay embedded after combat
    combat.resetCombatSoft();
    if (game.run.floor >= 10) {
      game.resetGame();
      game.setScene('board');
    } else {
      game.setScene('interlude');
    }
  };

  const handleDefeat = () => {
    combat.resetCombat();
    game.resetGame();
    game.setScene('board');
  };

  const isEmbedding = combat.phase === 'embedding';
  const isCombat = combat.phase === 'combat';
  const [selectedEnemyIndex, setSelectedEnemyIndex] = useState(0);

  return (
    <div className="flex flex-col gap-3 p-4 max-w-4xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between bg-house-green text-white px-4 py-2 rounded-card flex-wrap gap-2">
        <div className="text-sm font-semibold">
          {isEmbedding ? '🔮 骰子嵌入阶段' : isCombat ? '⚔️ 战斗中' : '⚔️ 战斗结束'}
        </div>
        <div className="flex items-center gap-3">
          {isCombat && (
            <div className="flex items-center gap-1">
              <span className="text-xs">⚡</span>
              {Array.from({ length: combat.maxAP }, (_, i) => (
                <span key={i} className={`text-sm ${i < combat.currentAP ? 'text-gold' : 'text-white/30'}`}>
                  {i < combat.currentAP ? '◆' : '◇'}
                </span>
              ))}
            </div>
          )}
          <div className="text-sm">
            骰子匣: <span className="font-bold text-gold">{game.diceBox.length}/{game.maxDiceBoxSlots}</span>
          </div>
        </div>
      </div>

      {/* Battlefield */}
      <div className="flex flex-row items-start justify-center gap-3 flex-wrap">
        {/* Player card */}
        <div className="bg-ceramic rounded-card p-3 border-2 border-accent-green/40 w-36 flex flex-col items-center">
          <div className="text-3xl mb-1">🧙</div>
          <div className="text-sm font-bold text-house-green">信仰者</div>
          <div className="w-full bg-black/10 rounded-full h-2.5 mt-2 overflow-hidden">
            <div
              className="h-full rounded-full bg-green-500 transition-all"
              style={{ width: `${(game.player.hp / game.player.maxHp) * 100}%` }}
            />
          </div>
          <div className="text-[10px] text-text-soft mt-0.5">
            {game.player.hp}/{game.player.maxHp}
          </div>
          <div className="flex gap-2 mt-2 text-[10px] text-text-soft flex-wrap justify-center">
            <span>🛡️{game.player.armor}</span>
            <span>✝️{game.player.faith}</span>
            <span>🎲{game.diceBox.length}</span>
          </div>
        </div>

        {/* Enemy cards */}
        {combat.enemies.map((enemy, idx) => {
          if (enemy.hp <= 0) return null;
          const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
          return (
            <div
              key={`${enemy.id}-${idx}`}
              onClick={() => isCombat && setSelectedEnemyIndex(idx)}
              className={`bg-ceramic rounded-card p-3 border-2 w-36 flex flex-col items-center ${
                selectedEnemyIndex === idx && isCombat
                  ? 'border-gold ring-2 ring-gold/50 scale-105'
                  : 'border-house-green/30'
              } ${isCombat ? 'cursor-pointer hover:border-house-green/50' : ''}`}
            >
              <div className="w-12 h-12 bg-house-green/10 rounded-lg flex items-center justify-center text-2xl border border-house-green/20 mb-1">
                {enemy.sprite === 'goblin' && '👺'}
                {enemy.sprite === 'skeleton' && '💀'}
                {enemy.sprite === 'cultist' && '👹'}
                {enemy.sprite === 'knight' && '🛡️'}
                {enemy.sprite === 'boss' && '👑'}
              </div>
              <div className="text-sm font-bold text-house-green">{enemy.name}</div>
              <div className="w-full bg-black/10 rounded-full h-2.5 mt-2 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all"
                  style={{
                    width: `${hpPercent}%`,
                    backgroundColor: hpPercent > 50 ? '#c82014' : hpPercent > 25 ? '#f97316' : '#7c3aed',
                  }}
                />
              </div>
              <div className="text-[10px] text-text-soft mt-0.5">
                {Math.max(0, enemy.hp)}/{enemy.maxHp}
              </div>
              <div className="flex gap-2 mt-2 text-xs font-semibold">
                {enemy.armor > 0 && <span>🛡️{enemy.armor}</span>}
                <span className="px-2 py-0.5 rounded" style={{
                  backgroundColor: enemy.intent === 'attack' ? '#fecaca' :
                    enemy.intent === 'block' ? '#bfdbfe' : '#e9d5ff',
                  color: enemy.intent === 'attack' ? '#991b1b' :
                    enemy.intent === 'block' ? '#1e3a5f' : '#6b21a8',
                }}>
                  {INTENT_ICONS[enemy.intent]} {INTENT_LABELS[enemy.intent]}
                </span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Embedding Phase */}
      {isEmbedding && (
        <DiceAllocationPanel
          availableDice={combat.availableDice}
          embeddedSlots={combat.embeddedSlots}
          equippedItems={combat.equippedItems}
          onEmbed={combat.embedDie}
          onUnembed={combat.unembedDie}
          playerFaith={game.player.faith}
          onConfirm={combat.confirmEmbedding}
        />
      )}

      {/* Combat Phase Actions */}
      {isCombat && (
        <div className="bg-ceramic rounded-card p-3 border-2 border-gold/20">
          {/* AP display */}
          <div className="flex items-center justify-between mb-3">
            <div className="text-sm font-bold text-house-green">⚡ 行动选择</div>
            <div className="flex items-center gap-1 text-xs">
              <span className="text-text-soft">AP:</span>
              {Array.from({ length: combat.maxAP }, (_, i) => (
                <span key={i} className={`text-sm ${i < combat.currentAP ? 'text-gold' : 'text-gray-300'}`}>
                  {i < combat.currentAP ? '◆' : '◇'}
                </span>
              ))}
            </div>
          </div>

          {/* Embedded dice summary */}
          <div className="flex gap-2 flex-wrap mb-3">
            {combat.embeddedSlots.filter(s => s.embeddedDie).map(slot => {
              const item = combat.equippedItems.find(e => e.slot === slot.equipmentSlotId);
              const die = slot.embeddedDie!;
              return (
                <div key={slot.equipmentSlotId} className={`bg-house-green/5 px-2 py-1 rounded text-xs ${die.shattered ? 'opacity-50' : ''}`}>
                  <span className="text-text-soft">{item?.name || slot.equipmentSlotId}: </span>
                  <span className="font-bold text-gold font-mono">D{die.faces}</span>
                  <span className="text-text-soft"> {die.name}</span>
                  {die.wear > 0 && (
                    <div className="w-full bg-gray-200 rounded-full h-1 mt-0.5">
                      <div className="h-full rounded-full bg-red-500 transition-all" style={{ width: `${die.wear}%` }} />
                    </div>
                  )}
                  {die.shattered && <span className="text-[8px] text-red-500">💔 破裂</span>}
                </div>
              );
            })}
          </div>

          <div className="flex gap-2 flex-wrap justify-center">
            <PixelButton variant="primary" onClick={() => combat.playerAttack(selectedEnemyIndex)}
              disabled={combat.currentAP < 1}>
              ⚔️ 攻击 (1AP)
            </PixelButton>
            <PixelButton variant="secondary" onClick={combat.playerDefend}
              disabled={combat.currentAP < 1}>
              🛡️ 防御 (1AP)
            </PixelButton>
            <PixelButton variant="secondary" onClick={combat.playerSkill}
              disabled={combat.currentAP < 2}>
              ✨ 神判之刃 (2AP)
            </PixelButton>
            <PixelButton variant="secondary" onClick={() => {
              const firstItem = game.items[0];
              if (firstItem) combat.playerUseItem(firstItem.id);
            }} disabled={combat.currentAP < 1}>
              🧪 道具 (1AP)
            </PixelButton>
            <PixelButton variant="secondary" onClick={combat.endPlayerTurn}>
              ⏳ 结束回合
            </PixelButton>
          </div>
        </div>
      )}

      {/* Combat log */}
      <div className="bg-black/5 rounded-card p-3 h-28 overflow-y-auto text-xs space-y-1 border border-house-green/10">
        {combat.combatLog.slice(-20).map((log, i) => (
          <div key={i} className={`text-text-black ${log.includes('暴击') ? 'text-danger font-bold' : ''} ${log.includes('→') ? 'pl-2 border-l-2 border-gold/30' : ''}`}>
            {log}
          </div>
        ))}
      </div>

      {/* Damage result */}
      {combat.lastDamageResult && (
        <div className="bg-white border-2 border-gold rounded-card p-3 text-center">
          <div className="text-lg font-bold text-danger">
            {combat.lastDamageResult.isCrit ? '💥 暴击！' : ''} {combat.lastDamageResult.damageDealt} 点伤害
          </div>
          <div className="text-xs text-text-soft mt-1 font-mono">
            {combat.lastDamageResult.breakdown}
          </div>
        </div>
      )}

      {/* Reward Modal */}
      {rewards && (
        <RewardModal rewards={rewards} onClose={handleRewardPick} />
      )}

      {/* Combat ended overlay */}
      {combat.phase === 'ended' && !rewards && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-parchment scroll-paper p-8 rounded-card text-center max-w-sm">
            {combat.victory ? (
              <>
                <div className="text-4xl mb-2">🏆</div>
                <h2 className="text-2xl font-bold text-accent-green mb-2">战斗胜利！</h2>
                <p className="text-sm text-text-soft mb-4">敌人已被击败</p>
                <PixelButton variant="gold" onClick={handleVictory}>
                  查看奖励
                </PixelButton>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">💀</div>
                <h2 className="text-2xl font-bold text-danger mb-2">战斗失败</h2>
                <p className="text-sm text-text-soft mb-4">你的信仰之路在此终结</p>
                <PixelButton variant="danger" onClick={handleDefeat}>
                  重新开始
                </PixelButton>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
