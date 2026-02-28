'use client';

import Link from 'next/link';
import { ArrowLeft, Users, Heart, Sparkles } from 'lucide-react';
import type { StoryManifest, CharacterMeta, RelSeed, WorldCardData } from '@/lib/story-pack';
import type { UserWorld, UserWorldRelationship, UserWorldCharacter } from '@/lib/types';

// ---- Unified types for rendering ----

interface DisplayCharacter {
  id: string;
  name: string;
  fullName: string;
  age: number;
  role: string;
  desc: string;
  glow: string;
  glowRgb?: string;
  image?: string;
}

interface DisplayRelationship {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: number;
  trust: number;
}

interface WorldDetailProps {
  manifest?: StoryManifest;
  userWorld?: UserWorld;
  worldCard: WorldCardData;
}

// ---- Relationship Graph (SVG) ----

interface GraphNode {
  id: string;
  name: string;
  glow: string;
  glowRgb?: string;
  x: number;
  y: number;
}

interface GraphEdge {
  sourceId: string;
  targetId: string;
  relationshipType: string;
  strength: number;
  trust: number;
}

function RelationshipGraph({
  characters,
  relationships,
  themeColor,
}: {
  characters: DisplayCharacter[];
  relationships: DisplayRelationship[];
  themeColor: string;
}) {
  const SIZE = 320;
  const CENTER = SIZE / 2;
  const RADIUS = 110;
  const NODE_R = 22;

  // Place characters in a circle
  const nodes: GraphNode[] = characters.map((c, i) => {
    const angle = (2 * Math.PI * i) / characters.length - Math.PI / 2;
    return {
      id: c.id,
      name: c.name,
      glow: c.glow,
      glowRgb: c.glowRgb,
      x: CENTER + RADIUS * Math.cos(angle),
      y: CENTER + RADIUS * Math.sin(angle),
    };
  });

  const nodeMap = new Map(nodes.map((n) => [n.id, n]));

  // Deduplicate edges — keep stronger for bidirectional
  const edgeMap = new Map<string, DisplayRelationship>();
  for (const rel of relationships) {
    const key = [rel.sourceId, rel.targetId].sort().join('|');
    const existing = edgeMap.get(key);
    if (!existing || rel.strength > existing.strength) {
      edgeMap.set(key, rel);
    }
  }
  const edges: GraphEdge[] = Array.from(edgeMap.values()).map((r) => ({
    sourceId: r.sourceId,
    targetId: r.targetId,
    relationshipType: r.relationshipType,
    strength: r.strength,
    trust: r.trust,
  }));

  return (
    <div className="relative w-full flex justify-center">
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        className="max-w-full"
        style={{ filter: 'drop-shadow(0 0 24px rgba(0,0,0,0.6))' }}
      >
        {/* Edges */}
        {edges.map((edge, i) => {
          const src = nodeMap.get(edge.sourceId);
          const tgt = nodeMap.get(edge.targetId);
          if (!src || !tgt) return null;
          const strokeWidth = 1 + edge.strength * 3; // 1–4px
          const opacity = 0.2 + edge.trust * 0.8;    // 0.2–1.0
          return (
            <g key={i}>
              <line
                x1={src.x}
                y1={src.y}
                x2={tgt.x}
                y2={tgt.y}
                stroke={themeColor}
                strokeWidth={strokeWidth}
                opacity={opacity}
                strokeLinecap="round"
              />
            </g>
          );
        })}

        {/* Nodes */}
        {nodes.map((node) => {
          const rgb = node.glowRgb ?? hexToRgb(node.glow);
          return (
            <g key={node.id}>
              {/* Glow halo */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R + 5}
                fill={`rgba(${rgb},0.12)`}
              />
              {/* Avatar circle */}
              <circle
                cx={node.x}
                cy={node.y}
                r={NODE_R}
                fill={`rgba(${rgb},0.18)`}
                stroke={node.glow}
                strokeWidth={2}
              />
              {/* Character initial */}
              <text
                x={node.x}
                y={node.y}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={13}
                fontWeight="bold"
                fill={node.glow}
              >
                {node.name.charAt(0)}
              </text>
              {/* Name label below */}
              <text
                x={node.x}
                y={node.y + NODE_R + 12}
                textAnchor="middle"
                dominantBaseline="central"
                fontSize={10}
                fill="rgba(255,255,255,0.7)"
              >
                {node.name}
              </text>
            </g>
          );
        })}
      </svg>
    </div>
  );
}

// ---- Character Card (horizontal scroll) ----

function CharacterCard({ char, themeColor }: { char: DisplayCharacter; themeColor: string }) {
  const rgb = char.glowRgb ?? hexToRgb(char.glow);
  return (
    <div
      className="flex-none w-32 rounded-2xl overflow-hidden flex flex-col"
      style={{
        background: `linear-gradient(160deg, rgba(${rgb},0.12) 0%, rgba(14,14,20,0.95) 70%)`,
        border: `1px solid rgba(${rgb},0.22)`,
      }}
    >
      {/* Avatar */}
      <div
        className="w-full aspect-square flex items-center justify-center"
        style={{ background: `rgba(${rgb},0.08)` }}
      >
        {char.image ? (
          <img
            src={char.image}
            alt={char.name}
            className="w-full h-full object-cover object-top"
          />
        ) : (
          <span
            className="text-3xl font-bold opacity-40"
            style={{ color: char.glow }}
          >
            {char.name.charAt(0)}
          </span>
        )}
      </div>
      {/* Info */}
      <div className="px-2.5 py-2 flex flex-col gap-0.5">
        <span className="text-xs font-bold text-white leading-tight">{char.name}</span>
        <span className="text-[10px] leading-tight" style={{ color: char.glow }}>
          {char.role}
        </span>
        <span className="text-[10px] text-zinc-500 leading-tight mt-0.5">{char.age}세</span>
      </div>
    </div>
  );
}

// ---- Helpers ----

function hexToRgb(hex: string): string {
  const clean = hex.replace('#', '');
  const r = parseInt(clean.slice(0, 2), 16);
  const g = parseInt(clean.slice(2, 4), 16);
  const b = parseInt(clean.slice(4, 6), 16);
  return `${r},${g},${b}`;
}

function npcRelationshipsFrom(manifest: StoryManifest): DisplayRelationship[] {
  // Only NPC↔NPC relationships for the graph (exclude player)
  return manifest.initialRelationships
    .filter(
      (r) => r.source.type === 'persona' && r.target.type === 'persona'
    )
    .map((r) => ({
      sourceId: r.source.id,
      targetId: r.target.id,
      relationshipType: r.relationshipType,
      strength: r.strength,
      trust: r.trust,
    }));
}

function userWorldRelationships(world: UserWorld): DisplayRelationship[] {
  return world.relationships.map((r) => ({
    sourceId: r.sourceId,
    targetId: r.targetId,
    relationshipType: r.relationshipType,
    strength: r.strength,
    trust: r.trust,
  }));
}

// ---- Main Component ----

export default function WorldDetail({ manifest, userWorld, worldCard }: WorldDetailProps) {
  const themeColor = worldCard.themeColor;
  const themeRgb = worldCard.themeColorRgb;

  // Build unified character list
  const characters: DisplayCharacter[] = manifest
    ? manifest.characters
        .filter((c) => c.id !== manifest.playerCharacterId)
        .map((c) => ({
          id: c.id,
          name: c.name,
          fullName: c.fullName,
          age: c.age,
          role: c.role,
          desc: c.desc,
          glow: c.glow,
          glowRgb: c.glowRgb,
          image: c.image ? `${manifest.assetsBasePath}${c.image}` : undefined,
        }))
    : userWorld
    ? userWorld.characters.map((c) => ({
        id: c.id,
        name: c.name,
        fullName: c.fullName,
        age: c.age,
        role: c.role,
        desc: c.desc,
        glow: c.glow,
      }))
    : [];

  const relationships: DisplayRelationship[] = manifest
    ? npcRelationshipsFrom(manifest)
    : userWorld
    ? userWorldRelationships(userWorld)
    : [];

  const slug = worldCard.slug ?? worldCard.id;
  const lore = userWorld?.lore ?? manifest?.defaultSituation?.replace(/\{\{[^}]+\}\}/g, '...') ?? '';

  return (
    <div
      className="min-h-screen text-white"
      style={{
        background: `radial-gradient(ellipse 70% 40% at 50% -5%, rgba(${themeRgb},0.18) 0%, #08080d 55%)`,
      }}
    >
      {/* Header */}
      <header className="sticky top-0 z-20 flex items-center gap-3 px-4 py-3 backdrop-blur-md"
        style={{ background: `rgba(8,8,13,0.75)`, borderBottom: `1px solid rgba(${themeRgb},0.12)` }}>
        <Link
          href="/"
          className="flex items-center justify-center w-9 h-9 rounded-full transition-colors"
          style={{ background: `rgba(${themeRgb},0.1)`, border: `1px solid rgba(${themeRgb},0.2)` }}
        >
          <ArrowLeft size={18} style={{ color: themeColor }} />
        </Link>
        <span className="text-sm font-semibold text-zinc-300 truncate">{worldCard.name}</span>
      </header>

      <main className="px-4 pb-32 max-w-lg mx-auto">
        {/* World name + description */}
        <section className="pt-8 pb-6">
          <div className="flex items-center gap-2 mb-1">
            {worldCard.tags.slice(0, 3).map((tag) => (
              <span
                key={tag}
                className="text-[10px] px-2 py-0.5 rounded-full font-medium"
                style={{
                  background: `rgba(${themeRgb},0.14)`,
                  color: themeColor,
                  border: `1px solid rgba(${themeRgb},0.25)`,
                }}
              >
                {tag}
              </span>
            ))}
          </div>
          <h1
            className="text-3xl font-extrabold leading-tight mt-2"
            style={{ color: themeColor }}
          >
            {worldCard.name}
          </h1>
          <p className="mt-3 text-sm text-zinc-400 leading-relaxed">{worldCard.description}</p>
        </section>

        {/* Character Roster */}
        {characters.length > 0 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Users size={15} style={{ color: themeColor }} />
              <h2 className="text-sm font-bold text-zinc-200">등장인물</h2>
              <span className="ml-auto text-xs text-zinc-500">{characters.length}명</span>
            </div>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-hide -mx-4 px-4">
              {characters.map((char) => (
                <CharacterCard key={char.id} char={char} themeColor={themeColor} />
              ))}
            </div>
          </section>
        )}

        {/* Relationship Visualization */}
        {characters.length > 1 && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Heart size={15} style={{ color: themeColor }} />
              <h2 className="text-sm font-bold text-zinc-200">관계도</h2>
              {relationships.length > 0 && (
                <span className="ml-auto text-xs text-zinc-500">{relationships.length}개의 관계</span>
              )}
            </div>
            <div
              className="rounded-2xl overflow-hidden p-3"
              style={{
                background: `rgba(${themeRgb},0.04)`,
                border: `1px solid rgba(${themeRgb},0.12)`,
              }}
            >
              <RelationshipGraph
                characters={characters}
                relationships={relationships}
                themeColor={themeColor}
              />
              {/* Legend */}
              <div className="flex gap-4 justify-center mt-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-0.5 rounded-full" style={{ background: themeColor, opacity: 0.3 }} />
                  <span className="text-[10px] text-zinc-500">약한 유대</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <div className="w-6 h-1 rounded-full" style={{ background: themeColor }} />
                  <span className="text-[10px] text-zinc-500">강한 유대</span>
                </div>
              </div>
            </div>
          </section>
        )}

        {/* Lore Section */}
        {lore && (
          <section className="mb-8">
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={15} style={{ color: themeColor }} />
              <h2 className="text-sm font-bold text-zinc-200">세계관</h2>
            </div>
            <div
              className="rounded-2xl p-4 text-sm text-zinc-400 leading-relaxed"
              style={{
                background: `rgba(${themeRgb},0.04)`,
                border: `1px solid rgba(${themeRgb},0.12)`,
              }}
            >
              {lore}
            </div>
          </section>
        )}
      </main>

      {/* CTA — Fixed Bottom */}
      <div
        className="fixed bottom-0 left-0 right-0 p-4 z-30"
        style={{ background: `linear-gradient(to top, #08080d 60%, transparent)` }}
      >
        <div className="max-w-lg mx-auto">
          <Link
            href={`/${slug}`}
            className="flex items-center justify-center w-full h-14 rounded-2xl text-base font-bold tracking-wide transition-opacity active:opacity-80"
            style={{
              background: `linear-gradient(135deg, ${themeColor} 0%, rgba(${themeRgb},0.7) 100%)`,
              boxShadow: `0 0 24px rgba(${themeRgb},0.35)`,
              color: '#fff',
            }}
          >
            세계 탐험하기
          </Link>
        </div>
      </div>
    </div>
  );
}
