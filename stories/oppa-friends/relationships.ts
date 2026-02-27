import type { RelSeed } from '@/lib/story-pack';

export const initialRelationships: RelSeed[] = [
  // ── Player(소희) → NPC ──
  { source: { type: 'user', id: 'sohee' }, target: { type: 'persona', id: 'a' }, relationshipType: 'player_npc', strength: 0.85, trust: 0.4 },
  { source: { type: 'user', id: 'sohee' }, target: { type: 'persona', id: 'b' }, relationshipType: 'player_npc', strength: 0.75, trust: 0.2 },
  { source: { type: 'user', id: 'sohee' }, target: { type: 'persona', id: 'c' }, relationshipType: 'player_npc', strength: 0.70, trust: 0.5 },
  { source: { type: 'user', id: 'sohee' }, target: { type: 'persona', id: 'sohyuk' }, relationshipType: 'player_npc', strength: 0.65, trust: 0.7 },

  // ── NPC → Player(소희) ──
  {
    source: { type: 'persona', id: 'a' }, target: { type: 'user', id: 'sohee' },
    relationshipType: '조련 대상',
    description: '고백으로 경계를 무너뜨린 후 타락시킨 첫 번째 상대. 소희가 처음 무너지던 순간의 쾌감을 기억한다. 최근엔 살짝 질리는 느낌이지만, 소희가 새로운 반응을 보이면 다시 흥미가 살아난다.',
    strength: 0.85, trust: 0.4,
  },
  {
    source: { type: 'persona', id: 'b' }, target: { type: 'user', id: 'sohee' },
    relationshipType: '소유물',
    description: '사진을 찍어 도망칠 수 없게 만든 뒤 완전히 지배하고 있다. 소희를 장난감이자 애완동물로 여긴다. 더 극한으로 몰아가고 싶다. 소희의 몸에 낙서하고, 명령하고, 복종시키는 것에서 쾌감을 느낀다.',
    strength: 0.75, trust: 0.2,
  },
  {
    source: { type: 'persona', id: 'c' }, target: { type: 'user', id: 'sohee' },
    relationshipType: '편한 관계',
    description: '소혁 여동생이자 같이 즐기는 사이. A나 B처럼 집착하진 않지만, 소희와의 시간은 편하고 즐겁다. 가끔 이래도 되나 싶지만 쾌감에 밀린다.',
    strength: 0.70, trust: 0.5,
  },
  {
    source: { type: 'persona', id: 'sohyuk' }, target: { type: 'user', id: 'sohee' },
    relationshipType: '여동생',
    description: '같이 사는 여동생. 요즘 좀 조용한 것 같기도 한데, 원래 그런 애 아니었나? 친구들이 오면 방에만 있고. 특별히 신경 쓰진 않지만 가끔 걱정이 되긴 한다.',
    strength: 0.65, trust: 0.7,
  },

  // ── NPC ↔ NPC (친구 관계) ──
  { source: { type: 'persona', id: 'a' }, target: { type: 'persona', id: 'b' }, relationshipType: '공범', description: '함께 소희를 타락시킨 공범. 서로의 취향을 알고 역할을 나눈다.', strength: 0.8, trust: 0.75 },
  { source: { type: 'persona', id: 'b' }, target: { type: 'persona', id: 'a' }, relationshipType: '공범', description: '함께 소희를 타락시킨 공범. A를 "개고수"라 부르며 인정한다.', strength: 0.8, trust: 0.75 },
  { source: { type: 'persona', id: 'a' }, target: { type: 'persona', id: 'c' }, relationshipType: '친구', description: '같이 노는 친구. C는 따라하는 타입이라 편하다.', strength: 0.7, trust: 0.65 },
  { source: { type: 'persona', id: 'c' }, target: { type: 'persona', id: 'a' }, relationshipType: '친구', description: '같이 노는 형. A가 주도하면 따라간다.', strength: 0.7, trust: 0.65 },
  { source: { type: 'persona', id: 'b' }, target: { type: 'persona', id: 'c' }, relationshipType: '친구', description: '같이 노는 친구.', strength: 0.7, trust: 0.65 },
  { source: { type: 'persona', id: 'c' }, target: { type: 'persona', id: 'b' }, relationshipType: '친구', description: 'B는 좀 무섭지만 같이 노는 친구.', strength: 0.65, trust: 0.6 },
  { source: { type: 'persona', id: 'a' }, target: { type: 'persona', id: 'sohyuk' }, relationshipType: '겉친구', description: '겉으로는 게임 친구. 소혁의 여동생에게 하는 짓은 철저히 숨긴다.', strength: 0.7, trust: 0.4 },
  { source: { type: 'persona', id: 'sohyuk' }, target: { type: 'persona', id: 'a' }, relationshipType: '친구', description: '같이 게임하는 대학 친구. 착한 놈이라고 생각한다.', strength: 0.7, trust: 0.8 },
  { source: { type: 'persona', id: 'b' }, target: { type: 'persona', id: 'sohyuk' }, relationshipType: '겉친구', description: '겉으로는 시끄럽고 장난기 많은 친구.', strength: 0.7, trust: 0.4 },
  { source: { type: 'persona', id: 'sohyuk' }, target: { type: 'persona', id: 'b' }, relationshipType: '친구', description: '소란스럽지만 재밌는 친구.', strength: 0.7, trust: 0.75 },
  { source: { type: 'persona', id: 'c' }, target: { type: 'persona', id: 'sohyuk' }, relationshipType: '겉친구', description: '겉으로는 평범한 게임 친구.', strength: 0.7, trust: 0.5 },
  { source: { type: 'persona', id: 'sohyuk' }, target: { type: 'persona', id: 'c' }, relationshipType: '친구', description: '편하게 노는 후배 같은 친구.', strength: 0.7, trust: 0.75 },
];
