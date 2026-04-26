import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { PixelButton } from '../common/PixelButton';
import type { Building, Villager, EquipmentItem } from '../../types/game';

export const VillageScene: React.FC = () => {
  const game = useGameStore();
  const [activeTab, setActiveTab] = useState<'buildings' | 'villagers' | 'storage' | 'contribute'>('buildings');

  const handleBuild = (building: Building) => {
    if (building.built) return;
    if (game.player.gold < building.costGold) {
      alert('金币不足！');
      return;
    }
    game.addGold(-building.costGold);
    const updatedBuildings = game.village.buildings.map(b =>
      b.id === building.id ? { ...b, built: true } : b
    );
    game.updatePlayer({ ...game.player }); // trigger re-render
    // Update village directly via store mutation (simplified)
    useGameStore.setState({
      village: { ...game.village, buildings: updatedBuildings },
    });
  };

  const handleRecruit = (villager: Villager) => {
    if (villager.recruited) return;
    if (game.player.faith < villager.recruitFaith) {
      alert('信仰不足！');
      return;
    }
    game.addFaith(-villager.recruitFaith);
    const updatedVillagers = game.village.villagers.map(v =>
      v.id === villager.id ? { ...v, recruited: true } : v
    );
    useGameStore.setState({
      village: {
        ...game.village,
        villagers: updatedVillagers,
        population: game.village.population + 1,
        taxPerRun: game.village.taxPerRun + 2,
      },
    });
  };

  const handleContribute = (goldAmount: number, faithAmount: number) => {
    if (game.player.gold < goldAmount || game.player.faith < faithAmount) {
      alert('资源不足！');
      return;
    }
    game.addGold(-goldAmount);
    game.addFaith(-faithAmount);
    useGameStore.setState({
      village: {
        ...game.village,
        faithReserve: game.village.faithReserve + faithAmount,
      },
    });
  };

  const handleStartRun = () => {
    game.startNewRun();
    game.setScene('board');
  };

  return (
    <div className="flex flex-col gap-4 p-4 max-w-3xl mx-auto">
      {/* Village header */}
      <div className="bg-house-green text-white rounded-card p-4 text-center">
        <h1 className="text-2xl font-bold font-gothic">{game.village.name}</h1>
        <div className="flex justify-center gap-4 mt-2 text-sm">
          <span>等级: {'⭐'.repeat(game.village.level)}</span>
          <span>人口: {game.village.population}</span>
          <span>税收: {game.village.taxPerRun}金/局</span>
          <span>信仰储量: {game.village.faithReserve}</span>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 justify-center">
        {[
          { key: 'buildings', label: '🏗️ 建筑' },
          { key: 'villagers', label: '👥 村民' },
          { key: 'storage', label: '📦 仓库' },
          { key: 'contribute', label: '✝️ 贡献' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            className={`px-4 py-2 rounded-pill text-sm font-medium transition ${
              activeTab === tab.key
                ? 'bg-accent-green text-white'
                : 'bg-ceramic text-text-soft hover:bg-ceramic/80'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Content */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20 min-h-[300px]">
        {activeTab === 'buildings' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {game.village.buildings.map(building => (
              <div
                key={building.id}
                className={`p-3 rounded-card border-2 ${
                  building.built
                    ? 'bg-light-green/30 border-accent-green'
                    : building.unlocked
                    ? 'bg-white border-house-green/30'
                    : 'bg-gray-100 border-gray-200 opacity-60'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-house-green">{building.name}</span>
                  {building.built && <span className="text-xs text-accent-green">✅ 已建造</span>}
                </div>
                <div className="text-xs text-text-soft mt-1">{building.effect}</div>
                {!building.built && building.unlocked && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs">
                      {building.costGold > 0 && `💰${building.costGold} `}
                      {building.costFaith > 0 && `✝️${building.costFaith} `}
                      {building.costResources > 0 && `🪵${building.costResources}`}
                    </span>
                    <PixelButton
                      variant="primary"
                      onClick={() => handleBuild(building)}
                      disabled={game.player.gold < building.costGold}
                    >
                      建造
                    </PixelButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'villagers' && (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {game.village.villagers.map(villager => (
              <div
                key={villager.id}
                className={`p-3 rounded-card border-2 ${
                  villager.recruited
                    ? 'bg-light-green/30 border-accent-green'
                    : 'bg-white border-house-green/30'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-house-green">{villager.name}</span>
                  <span className="text-xs bg-house-green/10 px-2 py-0.5 rounded-pill">{villager.profession}</span>
                </div>
                <div className="text-xs text-text-soft mt-1">{villager.specialty}</div>
                {!villager.recruited && (
                  <div className="mt-2 flex items-center justify-between">
                    <span className="text-xs">招募: ✝️{villager.recruitFaith}</span>
                    <PixelButton
                      variant="primary"
                      onClick={() => handleRecruit(villager)}
                      disabled={game.player.faith < villager.recruitFaith}
                    >
                      招募
                    </PixelButton>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {activeTab === 'storage' && (
          <div className="space-y-3">
            <div>
              <h3 className="text-sm font-bold text-house-green mb-2">已存放 ({game.village.storedItems.length}/4)</h3>
              {game.village.storedItems.length === 0 ? (
                <p className="text-xs text-text-soft">仓库为空。在塔中获取的装备可在此存放，供下一次 Run 携带。</p>
              ) : (
                <div className="grid grid-cols-2 gap-2">
                  {game.village.storedItems.map((item, idx) => (
                    <div key={idx} className="bg-white p-2 rounded border text-xs">
                      {item.name}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'contribute' && (
          <div className="space-y-4">
            <p className="text-sm text-text-soft">
              将本次爬塔获得的资源贡献给村庄，推动村庄发展。
            </p>
            <div className="flex gap-3">
              <PixelButton variant="gold" onClick={() => handleContribute(10, 0)}>
                贡献 10 金币
              </PixelButton>
              <PixelButton variant="gold" onClick={() => handleContribute(0, 5)}>
                贡献 5 信仰
              </PixelButton>
              <PixelButton variant="gold" onClick={() => handleContribute(10, 5)}>
                贡献全部
              </PixelButton>
            </div>
            <div className="text-xs text-text-soft">
              当前持有: 💰{game.player.gold} / ✝️{game.player.faith}
            </div>
          </div>
        )}
      </div>

      {/* Start run */}
      <div className="flex justify-center">
        <PixelButton variant="primary" onClick={handleStartRun} className="text-lg px-8 py-3">
          🏰 出发进塔
        </PixelButton>
      </div>
    </div>
  );
};
