import React from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { PixelButton } from '../common/PixelButton';

export const VillageScene: React.FC = () => {
  const game = useGameStore();

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
          <span>信仰储量: {game.village.faithReserve}</span>
        </div>
      </div>

      {/* Storage */}
      <div className="bg-ceramic rounded-card p-4 border border-house-green/20">
        <h2 className="text-lg font-bold text-house-green mb-3">📦 仓库</h2>
        {game.village.storedItems.length === 0 ? (
          <p className="text-sm text-text-soft">仓库为空。在塔中获取的装备可在此存放，供下一次 Run 携带。</p>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {game.village.storedItems.map((item, idx) => (
              <div key={idx} className="bg-white p-2 rounded border text-sm">
                {item.name}
              </div>
            ))}
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
