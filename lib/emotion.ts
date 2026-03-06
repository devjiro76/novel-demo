/** Discrete emotion label → Korean display string */
export const EMOTION_KO: Record<string, string> = {
  joy: '기쁨',
  excitement: '설렘',
  contentment: '만족',
  anger: '분노',
  fear: '두려움',
  sadness: '슬픔',
  anxiety: '불안',
  surprise: '놀라움',
  disgust: '혐오',
  trust: '신뢰',
  calm: '평온',
  shame: '수치심',
  guilt: '죄책감',
  numbness: '무감각',
};

/** Discrete emotion label → emoji */
export const EMOTION_EMOJI: Record<string, string> = {
  joy: '😊',
  excitement: '✨',
  contentment: '😌',
  anger: '😠',
  fear: '😨',
  sadness: '😢',
  anxiety: '😰',
  surprise: '😲',
  disgust: '🤢',
  trust: '🤝',
  calm: '😶',
  shame: '😳',
  guilt: '😔',
  numbness: '😶‍🌫️',
};

export function resolveEmotionLabel(raw: string): string {
  const key = raw.toLowerCase().trim();
  return EMOTION_KO[key] ?? EMOTION_KO[key.replace(/\s+/g, '_')] ?? '';
}
