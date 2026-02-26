// ---- Server env ----

export interface Env {
  OPENROUTER_API_KEY: string;
  WORLD_API_KEY: string;
  WORLD_API_URL: string;
  VILLAGE_ID: string;
}

export function getEnv(): Env {
  return {
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY!,
    WORLD_API_KEY: process.env.WORLD_API_KEY!,
    WORLD_API_URL: process.env.WORLD_API_URL!,
    VILLAGE_ID: process.env.VILLAGE_ID!,
  };
}

// ---- Game state ----

export interface GameState {
  gameId: string;
  chapter: number;
  turnCount: number;
  narratorHistory: EventSummary[];
  tension: Record<string, number>;
  personaIds: Record<string, string>;
  tiersCrossed: Record<string, number[]>;
}

export interface EventSummary {
  turn: number;
  situation: string;
  choiceText: string;
  actionLabel: string;
  targets: string[];
  reactions: ReactionSummary[];
}

export interface ReactionSummary {
  characterId: string;
  dialogue: string;
  emotionPrimary: string;
  valenceChange: number;
}

// ---- Director output ----

export interface DirectorOutput {
  situation: string;
  location: string;
  characters: string[];
  choices: Choice[];
}

export interface Choice {
  text: string;
  subtext: string;
  targets: ChoiceTarget[];
}

export interface ChoiceTarget {
  characterId: string;
  actionLabel: string;
  stimulusDescription?: string;
}

// ---- Narrator output ----

export interface NarratorOutput {
  action: string;
  dialogue: string;
  innerThought: string;
  emotionLabel: string;
}

// ---- Character reaction (returned to client) ----

export interface CharacterReaction {
  characterId: string;
  displayName: string;
  action: string;
  dialogue: string;
  innerThought: string;
  emotion: {
    primary: string;
    secondary?: string;
    vad: { V: number; A: number; D: number };
  };
  mood?: { V: number; A: number; D: number };
}

// ---- API responses ----

export interface TurnNextResponse {
  situation: string;
  location: string;
  characters: CharacterStatus[];
  choices: Choice[];
  chapter: number;
  turnCount: number;
}

export interface CharacterStatus {
  characterId: string;
  displayName: string;
  emotionLabel: string;
  mood: string;
}

export interface TurnChooseResponse {
  choiceText: string;
  reactions: CharacterReaction[];
  chapter: number;
  turnCount: number;
  relationships: Record<string, number>;
  conversationAvailable?: {
    characterId: string;
    displayName: string;
    tierCrossed: number;
    arousal: number;
  };
}

export interface ConversationRequest {
  characterId: string;
  userMessage: string;
  situation: string;
}

export interface ConversationResponse {
  characterId: string;
  displayName: string;
  dialogue: string;
  action: string;
  innerThought: string;
  emotion: { primary: string; vad: { V: number; A: number; D: number } };
  conversationOver: boolean;
}

export interface GameStartResponse {
  gameId: string;
  chapter: number;
  turnCount: number;
  situation: string;
  location: string;
  characters: CharacterStatus[];
  choices: Choice[];
}

export interface GameStateResponse {
  gameId: string;
  chapter: number;
  turnCount: number;
  relationships: Record<string, number>;
  tension: Record<string, number>;
  recentEvents: EventSummary[];
}

// ---- App state (client-side) ----

export type GamePhase = 'title' | 'loading' | 'situation' | 'reacting' | 'reaction' | 'conversation' | 'error';

export interface TurnRecord {
  turn: number;
  situation: string;
  location: string;
  choiceText: string;
  reactions: CharacterReaction[];
}
