// ---- Env bindings ----

export interface Env {
  GAME_STATE: KVNamespace;
  OPENROUTER_API_KEY: string;
  WORLD_API_KEY: string;
  WORLD_API_URL: string;
  VILLAGE_ID: string;
}

// ---- Game state ----

export interface GameState {
  gameId: string;
  chapter: number;
  turnCount: number;
  /**
   * Narrator-specific history — stores dialogue/situation text for LLM chat history.
   * NOT the authoritative event log. Engine events are logged by the World API
   * (via interact endpoint) and read via GET /villages/{id}/events.
   */
  narratorHistory: EventSummary[];
  // relationships — now read/written via World API (GET/PUT /villages/{id}/relationships)
  tension: Record<string, number>;       // characterId → tension (0~100) — game-specific, kept in KV
  personaIds: Record<string, string>;    // characterId → Persona API config ID
  tiersCrossed: Record<string, number[]>; // characterId → [20, 40, ...] — tier thresholds already crossed
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
  actionLabel: string;           // was: actionName
  stimulusDescription: string;   // NEW
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

// ---- 1:1 Conversation ----

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
