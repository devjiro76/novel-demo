// ---- API types (mirrors server types) ----

export interface Choice {
  text: string;
  subtext: string;
  targets: ChoiceTarget[];
}

export interface ChoiceTarget {
  characterId: string;
  actionName: string;
}

export interface CharacterStatus {
  characterId: string;
  displayName: string;
  emotionLabel: string;
  mood: string;
}

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

export interface GameStartResponse {
  gameId: string;
  chapter: number;
  turnCount: number;
  situation: string;
  location: string;
  characters: CharacterStatus[];
  choices: Choice[];
}

export interface TurnNextResponse {
  situation: string;
  location: string;
  characters: CharacterStatus[];
  choices: Choice[];
  chapter: number;
  turnCount: number;
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

export interface ConversationResponse {
  characterId: string;
  displayName: string;
  dialogue: string;
  action: string;
  innerThought: string;
  emotion: { primary: string; vad: { V: number; A: number; D: number } };
  conversationOver: boolean;
}

export interface GameStateResponse {
  gameId: string;
  chapter: number;
  turnCount: number;
  relationships: Record<string, number>;
  tension: Record<string, number>;
  recentEvents: EventSummary[];
}

export interface EventSummary {
  turn: number;
  situation: string;
  choiceText: string;
  actionName: string;
  targets: string[];
  reactions: ReactionSummary[];
}

export interface ReactionSummary {
  characterId: string;
  dialogue: string;
  emotionPrimary: string;
  valenceChange: number;
}

// ---- App state ----

export type GamePhase = 'title' | 'loading' | 'situation' | 'reacting' | 'reaction' | 'conversation' | 'error';

export interface TurnRecord {
  turn: number;
  situation: string;
  location: string;
  choiceText: string;
  reactions: CharacterReaction[];
}
