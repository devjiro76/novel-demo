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
  tags?: string[];          // e.g., ['로맨스', '판타지', '성인']
  chatBackground?: string;  // CSS gradient or color for chat background theme
}

export interface RelSeed {
  source: { type: 'user' | 'persona'; id: string };
  target: { type: 'user' | 'persona'; id: string };
  relationshipType: string;
  description?: string;
  strength: number;
  trust: number;
}

export interface PersonaSeed {
  persona_config_id: string;
  display_name: string;
  config: Record<string, unknown>;
}

export interface ActionSeed {
  name: string;
  description: string;
  appraisal: {
    goal_relevance: number;
    goal_congruence: number;
    expectedness: number;
    controllability: number;
    agency: number;
    norm_compatibility: number;
    internal_standards: number;
    adjustment_potential: number;
    urgency: number;
  };
}

export interface StoryManifest {
  slug: string;
  title: string;
  subtitle?: string;
  description: string;

  // World API seed data
  personas: PersonaSeed[];
  actions: ActionSeed[];
  initialRelationships: RelSeed[];

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
}

/** Client-safe subset — no prompt text, no seed data */
export interface ClientStoryPack {
  slug: string;
  title: string;
  subtitle?: string;
  characters: CharacterMeta[];
  assetsBasePath: string;
  logo: string;
  coverTall: string;
  coverWide: string;
  playerCharacterId: string;
  playerDisplayName: string;
  defaultSituation: string;
}

export function getStoryPack(slug?: string): StoryManifest {
  const key = slug ?? DEFAULT_STORY;
  const pack = STORY_PACKS[key];
  if (!pack) throw new Error(`Unknown story pack: "${key}"`);
  return pack;
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
    playerCharacterId: pack.playerCharacterId,
    playerDisplayName: pack.playerDisplayName,
    defaultSituation: pack.defaultSituation,
  };
}

export function getAllClientPacks(): ClientStoryPack[] {
  return Object.values(STORY_PACKS).map(toClientPack);
}

// ---- World Card ----

export interface WorldCardData {
  id: string;
  type: 'builtin' | 'user';
  name: string;
  description: string;
  tags: string[];
  themeColor: string;
  themeColorRgb: string;
  characters: {
    id: string;
    name: string;
    fullName: string;
    role: string;
    age: number;
    image?: string;
    glow: string;
    glowRgb: string;
  }[];
  relationshipCount: number;
  slug?: string;            // builtin worlds only
  assetsBasePath?: string;  // builtin worlds only
  isAdult?: boolean;
}

/** Convert a StoryManifest into a WorldCardData for display */
export function storyToWorldCard(pack: StoryManifest): WorldCardData {
  const firstChar = pack.characters[0];
  const themeColor = firstChar?.glow ?? '#a855f7';
  const themeColorRgb = firstChar?.glowRgb ?? '168,85,247';

  return {
    id: pack.slug,
    type: 'builtin',
    name: pack.title,
    description: pack.description ?? pack.subtitle ?? '',
    tags: Array.from(new Set(pack.characters.flatMap((c) => c.tags ?? []))),
    themeColor,
    themeColorRgb,
    characters: pack.characters.map((c) => ({
      id: c.id,
      name: c.name,
      fullName: c.fullName,
      role: c.role,
      age: c.age,
      image: c.image ? `${pack.assetsBasePath}${c.image}` : undefined,
      glow: c.glow,
      glowRgb: c.glowRgb,
    })),
    relationshipCount: pack.initialRelationships.filter(
      (r) => r.source.type === 'persona' && r.target.type === 'persona'
    ).length,
    slug: pack.slug,
    assetsBasePath: pack.assetsBasePath,
  };
}

/** Get all builtin stories as WorldCardData */
export function getAllWorldCards(): WorldCardData[] {
  return Object.values(STORY_PACKS).map(storyToWorldCard);
}

/** 모든 스토리팩에서 사용 가능한 태그 목록 추출 */
export function getAllTags(): string[] {
  const packs = getAllClientPacks();
  const tagSet = new Set<string>();
  for (const pack of packs) {
    for (const char of pack.characters) {
      if (char.tags) {
        for (const tag of char.tags) tagSet.add(tag);
      }
    }
  }
  return Array.from(tagSet).sort((a, b) => a.localeCompare(b, 'ko'));
}
