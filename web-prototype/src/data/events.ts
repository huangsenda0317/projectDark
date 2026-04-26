import type { GameEvent } from '../types/game';

export const RANDOM_EVENTS: GameEvent[] = [
  {
    id: 'beggar',
    title: '十字路口的流浪汉',
    description: '一个衣衫褴褛的流浪汉向你伸出手，眼中闪烁着绝望与希望交织的光芒。',
    optionA: { label: '给他面包（-1 金币，+2 信仰）', effect: 'gold_-1_faith_+2' },
    optionB: { label: '无视他（+0，-1 信仰）', effect: 'faith_-1' },
  },
  {
    id: 'heretic_pamphlet',
    title: '异端的小册子',
    description: '路边散落着一本被雨水浸湿的小册子，封面上画着禁忌的符文。',
    optionA: { label: '焚毁（+3 信仰，获得"正统"标签）', effect: 'faith_+3_tag_orthodox' },
    optionB: { label: '阅读（-2 信仰，获得异端卡）', effect: 'faith_-2_card_heretic' },
  },
  {
    id: 'collapsed_shrine',
    title: '倒塌的神坛',
    description: '一座古老的神坛倒在路边，碎石间隐约可见圣物的微光。',
    optionA: { label: '修复（消耗 20 金，+4 信仰）', effect: 'gold_-20_faith_+4' },
    optionB: { label: '取走遗物（获得遗物，-3 信仰）', effect: 'faith_-3_relic_random' },
  },
  {
    id: 'dying_knight',
    title: '临死的骑士',
    description: '一位身披破烂铠甲的骑士倒在血泊中，他的剑还紧紧握在手中。',
    optionA: { label: '救治（付出 5HP，获得传承卡）', effect: 'hp_-5_card_legacy' },
    optionB: { label: '问询（获得情报，下层棋盘可预览）', effect: 'preview_next_floor' },
  },
  {
    id: 'divine_whisper',
    title: '神明的低语',
    description: '一阵不可名状的低语在你脑海中回响，既像命令又像请求。',
    optionA: { label: '顺从（随机效果）', effect: 'random_blessing' },
    optionB: { label: '质疑（-2 信仰，但获得一张强力异端牌）', effect: 'faith_-2_card_heretic_strong' },
  },
];

export function getRandomEvent(): GameEvent {
  return RANDOM_EVENTS[Math.floor(Math.random() * RANDOM_EVENTS.length)];
}
