import React, { useState } from 'react';
import { useGameStore } from '../../stores/useGameStore';
import { getRandomEvent } from '../../data/events';
import { PixelButton } from '../common/PixelButton';

interface EventModalProps {
  onClose: () => void;
}

export const EventModal: React.FC<EventModalProps> = ({ onClose }) => {
  const game = useGameStore();
  const [resolved, setResolved] = useState(false);
  const [result, setResult] = useState('');

  const event = getRandomEvent();

  const handleOptionA = () => {
    applyEffect(event.optionA.effect);
    setResult(event.optionA.label);
    setResolved(true);
  };

  const handleOptionB = () => {
    applyEffect(event.optionB.effect);
    setResult(event.optionB.label);
    setResolved(true);
  };

  const applyEffect = (effect: string) => {
    if (effect.includes('gold_-1')) game.addGold(-1);
    if (effect.includes('gold_-20')) game.addGold(-20);
    if (effect.includes('faith_+2')) game.addFaith(2);
    if (effect.includes('faith_+3')) game.addFaith(3);
    if (effect.includes('faith_+4')) game.addFaith(4);
    if (effect.includes('faith_-1')) game.addFaith(-1);
    if (effect.includes('faith_-2')) game.addFaith(-2);
    if (effect.includes('faith_-3')) game.addFaith(-3);
    if (effect.includes('hp_-5')) game.takeDamage(5);
    if (effect.includes('card_heretic')) {
      // Simplified: just add gold as placeholder
      game.addGold(10);
    }
    if (effect.includes('relic_random')) {
      game.addGold(15);
    }
    if (effect.includes('random_blessing')) {
      const blessings = ['获得 10 金币', '回复 10 HP', '获得 5 信仰', '抽一张卡'];
      const blessing = blessings[Math.floor(Math.random() * blessings.length)];
      setResult(prev => prev + ` (${blessing})`);
      if (blessing.includes('金币')) game.addGold(10);
      if (blessing.includes('HP')) game.heal(10);
      if (blessing.includes('信仰')) game.addFaith(5);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-parchment scroll-paper max-w-md w-full p-6 rounded-card shadow-2xl">
        <h2 className="text-xl font-bold text-house-green font-gothic mb-2">{event.title}</h2>
        <p className="text-sm text-text-black mb-6 leading-relaxed">{event.description}</p>

        {!resolved ? (
          <div className="flex flex-col gap-3">
            <PixelButton variant="primary" onClick={handleOptionA}>
              A: {event.optionA.label}
            </PixelButton>
            <PixelButton variant="secondary" onClick={handleOptionB}>
              B: {event.optionB.label}
            </PixelButton>
          </div>
        ) : (
          <div className="flex flex-col gap-3">
            <div className="bg-ceramic p-3 rounded text-sm text-text-black">
              你选择了: <span className="font-semibold">{result}</span>
            </div>
            <PixelButton variant="primary" onClick={onClose}>
              继续
            </PixelButton>
          </div>
        )}
      </div>
    </div>
  );
};
