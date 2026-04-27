import React, { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { useCombatStore } from '../../stores/useCombatStore';
import { ActionPanel } from '../ui/ActionPanel';
import { RewardModal } from '../ui/RewardModal';
import { PixelButton } from '../common/PixelButton';
import { WEAPONS } from '../../data/weapons';
import { generateRewards } from '../../services/rewardService';
import type { RewardOption } from '../../types/game';

const TICK_MS = 100;

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

export const CombatScene: React.FC = () => {
  const game = useGameStore();
  const combat = useCombatStore();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const [rewards, setRewards] = useState<RewardOption[] | null>(null);

  useEffect(() => {
    if (combat.units.length === 0) {
      combat.startCombat(game.run.floor);
    }
  }, []);

  useEffect(() => {
    if (combat.combatEnded) {
      if (timerRef.current) clearInterval(timerRef.current);
      return;
    }
    timerRef.current = setInterval(() => {
      combat.tick();
    }, TICK_MS);
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [combat.combatEnded, combat.units.length]);

  const handleEnemyClick = (index: number) => {
    if (!combat.selectedAction) return;
    if (combat.selectedAction.type !== 'attack' && combat.selectedAction.type !== 'skill') return;
    combat.executeAction(combat.selectedAction, index);
  };

  const handleVictory = () => {
    if (!rewards) {
      const r = generateRewards(game.run.floor, false);
      setRewards(r);
      return;
    }
    combat.resetCombat();
    setRewards(null);
    if (game.run.floor >= 10) {
      game.resetGame();
      game.setScene('board');
    } else {
      game.setScene('interlude');
    }
  };

  const handleRewardPick = () => {
    setRewards(null);
    combat.resetCombat();
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

  const playerUnit = combat.playerUnit;
  const isPlayerActing = playerUnit?.isActing ?? false;
  const enemyUnits = combat.units.filter(u => !u.isPlayer);

  return (
    <div className="flex flex-col gap-3 p-4 max-w-4xl mx-auto">
      {/* Combat header */}
      <div className="flex items-center justify-between bg-house-green text-white px-4 py-2 rounded-card flex-wrap gap-2">
        <div className="text-sm font-semibold">⚔️ 战斗中</div>
        <div className="text-sm">
          武器: <span className="font-bold text-gold">{combat.currentWeapon?.name || '无'}</span>
        </div>
        <PixelButton variant="secondary" onClick={combat.openEquipModal} className="text-xs py-1 px-3">
          切换武器
        </PixelButton>
      </div>

      {/* Battlefield: Player + Enemies in horizontal flex */}
      <div className="flex flex-row items-start justify-center gap-3 flex-wrap">
        {/* Player card */}
        {playerUnit && (
          <div className="bg-ceramic rounded-card p-3 border-2 border-accent-green/40 w-40 flex flex-col items-center">
            <div className="text-3xl mb-1">🧙</div>
            <div className="text-sm font-bold text-house-green">信仰者</div>
            {/* HP bar */}
            <div className="w-full bg-black/10 rounded-full h-2.5 mt-2 overflow-hidden">
              <div
                className="h-full rounded-full bg-green-500 transition-all"
                style={{ width: `${(game.player.hp / game.player.maxHp) * 100}%` }}
              />
            </div>
            <div className="text-[10px] text-text-soft mt-0.5">
              {game.player.hp}/{game.player.maxHp}
            </div>
            {/* ATB gauge */}
            <div className="w-full bg-black/10 rounded-full h-3 mt-2 overflow-hidden relative">
              <div
                className="h-full rounded-full transition-all duration-100"
                style={{
                  width: `${playerUnit.gauge}%`,
                  backgroundColor: isPlayerActing ? '#cba258' : '#2b7de9',
                }}
              />
              {isPlayerActing && (
                <div className="absolute inset-0 animate-pulse bg-gold/20 rounded-full" />
              )}
            </div>
            <div className="text-[10px] font-bold mt-0.5" style={{ color: isPlayerActing ? '#cba258' : '#2b7de9' }}>
              {isPlayerActing ? '⚡ 行动就绪' : `${Math.floor(playerUnit.gauge)}%`}
            </div>
            {/* Stats */}
            <div className="flex gap-2 mt-2 text-[10px] text-text-soft flex-wrap justify-center">
              <span>🛡️{game.player.armor}</span>
              <span>✝️{game.player.faith}</span>
              <span>⚡{Math.floor((combat.currentWeapon?.baseSpeed ?? 0) * (1 + game.player.stats.agi * 0.02))}</span>
            </div>
          </div>
        )}

        {/* Enemy cards */}
        {enemyUnits.map((unit, idx) => {
          const enemy = unit.enemyRef;
          if (!enemy || enemy.hp <= 0) return null;
          const hpPercent = Math.max(0, (enemy.hp / enemy.maxHp) * 100);
          return (
            <div
              key={unit.id}
              onClick={() => handleEnemyClick(idx)}
              className={`
                bg-ceramic rounded-card p-3 border-2 border-house-green/30 w-40 flex flex-col items-center cursor-pointer transition-all
                ${combat.selectedAction && (combat.selectedAction.type === 'attack' || combat.selectedAction.type === 'skill')
                  ? 'hover:scale-105 hover:border-gold'
                  : ''}
              `}
            >
              {/* Sprite */}
              <div className="w-12 h-12 bg-house-green/10 rounded-lg flex items-center justify-center text-2xl border border-house-green/20 mb-1">
                {enemy.sprite === 'goblin' && '👺'}
                {enemy.sprite === 'skeleton' && '💀'}
                {enemy.sprite === 'cultist' && '👹'}
                {enemy.sprite === 'knight' && '🛡️'}
                {enemy.sprite === 'boss' && '👑'}
              </div>
              <div className="text-sm font-bold text-house-green">{enemy.name}</div>
              {/* HP bar */}
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
              {/* ATB gauge */}
              <div className="w-full bg-black/10 rounded-full h-3 mt-1 overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-100"
                  style={{
                    width: `${unit.gauge}%`,
                    backgroundColor: unit.isActing ? '#c82014' : '#7c3aed',
                  }}
                />
              </div>
              <div className="text-[10px] font-bold mt-0.5" style={{ color: unit.isActing ? '#c82014' : '#7c3aed' }}>
                {unit.isActing ? '⚡ 行动中' : `${Math.floor(unit.gauge)}%`}
              </div>
              {/* Intent + armor */}
              <div className="flex gap-2 mt-2 text-[10px] text-text-soft">
                {enemy.armor > 0 && <span>🛡️{enemy.armor}</span>}
                <span>{INTENT_ICONS[enemy.intent]}{INTENT_LABELS[enemy.intent]}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Combat log */}
      <div className="bg-black/5 rounded-card p-3 h-24 overflow-y-auto text-xs space-y-1 border border-house-green/10">
        {combat.combatLog.slice(-12).map((log, i) => (
          <div key={i} className={`text-text-black ${log.includes('暴击') ? 'text-danger font-bold' : ''} ${log.includes('→') ? 'pl-2 border-l-2 border-gold/30' : ''}`}>
            {log}
          </div>
        ))}
        {combat.combatLog.length === 0 && (
          <div className="text-text-soft italic">战斗开始...</div>
        )}
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

      {/* Action Panel */}
      {isPlayerActing && !combat.combatEnded && (
        <ActionPanel
          actions={combat.actions}
          selectedAction={combat.selectedAction}
          onSelectAction={combat.selectAction}
          onExecuteAction={combat.executeAction}
          playerFaith={game.player.faith}
          enemyCount={enemyUnits.length}
        />
      )}

      {!isPlayerActing && !combat.combatEnded && (
        <div className="text-center text-sm text-text-soft py-2 animate-pulse">
          读条中... 等待行动时机
        </div>
      )}

      {/* Weapon switch modal */}
      {combat.equipModalOpen && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="bg-parchment scroll-paper p-6 rounded-card max-w-sm w-full">
            <h3 className="text-lg font-bold text-house-green font-gothic mb-4">切换武器</h3>
            <p className="text-xs text-text-soft mb-3">切换武器将消耗当前读条进度的 50%</p>
            <div className="grid grid-cols-2 gap-2">
              {WEAPONS.map(weapon => (
                <button
                  key={weapon.id}
                  onClick={() => combat.switchWeapon(weapon)}
                  disabled={combat.currentWeapon?.id === weapon.id}
                  className={`p-2 rounded-card border-2 text-left text-xs transition ${
                    combat.currentWeapon?.id === weapon.id
                      ? 'bg-light-green/30 border-accent-green'
                      : 'bg-white border-house-green/20 hover:border-house-green/40'
                  }`}
                >
                  <div className="font-bold text-house-green">{weapon.name}</div>
                  <div className="text-text-soft">攻速: {weapon.baseSpeed}</div>
                  <div className="text-text-soft">{weapon.description}</div>
                </button>
              ))}
            </div>
            <div className="mt-4 flex justify-center">
              <PixelButton variant="secondary" onClick={combat.closeEquipModal}>
                取消
              </PixelButton>
            </div>
          </div>
        </div>
      )}

      {/* Reward Modal - shown after victory */}
      {rewards && (
        <RewardModal rewards={rewards} onClose={handleRewardPick} />
      )}

      {/* Combat ended overlay */}
      {combat.combatEnded && !rewards && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <div className="bg-parchment scroll-paper p-8 rounded-card text-center max-w-sm">
            {combat.victory ? (
              <>
                <div className="text-4xl mb-2">🏆</div>
                <h2 className="text-2xl font-bold text-accent-green font-gothic mb-2">战斗胜利！</h2>
                <p className="text-sm text-text-soft mb-4">敌人已被击败</p>
                <PixelButton variant="gold" onClick={handleVictory}>
                  继续
                </PixelButton>
              </>
            ) : (
              <>
                <div className="text-4xl mb-2">💀</div>
                <h2 className="text-2xl font-bold text-danger font-gothic mb-2">战斗失败</h2>
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
