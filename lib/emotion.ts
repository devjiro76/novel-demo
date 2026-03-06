/** Discrete emotion label → Korean display string */
export const EMOTION_KO: Record<string, string> = {
  // Positive (8)
  joy: '기쁨',
  excitement: '설렘',
  contentment: '만족',
  love: '사랑',
  pride: '자부심',
  gratitude: '감사',
  amusement: '즐거움',
  relief: '안도',
  // Negative (7)
  anger: '분노',
  fear: '두려움',
  sadness: '슬픔',
  anxiety: '불안',
  disgust: '혐오',
  shame: '수치심',
  guilt: '죄책감',
  // Neutral / Mixed (4)
  surprise: '놀라움',
  trust: '신뢰',
  calm: '평온',
  numbness: '무감각',
};

/** Discrete emotion label → emoji */
export const EMOTION_EMOJI: Record<string, string> = {
  // Positive (8)
  joy: '😊',
  excitement: '✨',
  contentment: '😌',
  love: '💕',
  pride: '😤',
  gratitude: '🙏',
  amusement: '😄',
  relief: '😮‍💨',
  // Negative (7)
  anger: '😠',
  fear: '😨',
  sadness: '😢',
  anxiety: '😰',
  disgust: '🤢',
  shame: '😳',
  guilt: '😔',
  // Neutral / Mixed (4)
  surprise: '😲',
  trust: '🤝',
  calm: '😶',
  numbness: '😶‍🌫️',
};

export function resolveEmotionLabel(raw: string): string {
  const key = raw.toLowerCase().trim();
  return EMOTION_KO[key] ?? EMOTION_KO[key.replace(/\s+/g, '_')] ?? '';
}
