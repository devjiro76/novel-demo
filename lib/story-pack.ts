import { STORY_PACKS, DEFAULT_STORY } from '@/stories';

export interface CharacterMeta {
  id: string;
  name: string;
  fullName: string;
  age: number;
  role: string;
  desc: string;
  image: string;
  glow: string;
  glowRgb: string;
  gradient: string;
  accentText: string;
  btnBg: string;
}

export interface RelSeed {
  source: { type: 'user' | 'persona'; id: string };
  target: { type: 'user' | 'persona'; id: string };
  relationshipType: string;
  description?: string;
  strength: number;
  trust: number;
}

export interface StoryManifest {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;

  // World API
  villageId: string;
  playerCharacterId: string;
  playerDisplayName: string;
  npcIds: string[];
  displayNames: Record<string, string>;

  // UI
  characters: CharacterMeta[];
  assetsBasePath: string;
  logo: string;
  coverTall: string;
  coverWide: string;

  // Narrator prompt blocks (use {{displayName}} placeholder)
  conversationInstructions: string;
  defaultSituation: string; // use {{charFullName}} placeholder

  // State
  initialRelationships: RelSeed[];
}

/** Client-safe subset — no prompt text, no relationships */
export interface ClientStoryPack {
  slug: string;
  title: string;
  subtitle?: string;
  characters: CharacterMeta[];
  assetsBasePath: string;
  logo: string;
  coverTall: string;
  coverWide: string;
  playerDisplayName: string;
  defaultSituation: string;
}

export function getStoryPack(slug?: string): StoryManifest {
  return STORY_PACKS[slug ?? DEFAULT_STORY] ?? STORY_PACKS[DEFAULT_STORY];
}

export function toClientPack(pack: StoryManifest): ClientStoryPack {
  return {
    slug: pack.slug,
    title: pack.title,
    subtitle: pack.subtitle,
    characters: pack.characters,
    assetsBasePath: pack.assetsBasePath,
    logo: pack.logo,
    coverTall: pack.coverTall,
    coverWide: pack.coverWide,
    playerDisplayName: pack.playerDisplayName,
    defaultSituation: pack.defaultSituation,
  };
}
