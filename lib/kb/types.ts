export interface KBChunk {
  id: string;              // "motchama-ep001-chunk003"
  storySlug: string;       // "motchama"
  episodeNum: number;      // 1
  sceneRange: string;      // "#12-#15"
  text: string;            // 청크 원문
  embedding: number[];     // 1536-dim vector
  metadata: {
    characters: string[];  // 등장인물
    keywords: string[];    // 핵심 키워드
  };
}

export interface KBIndex {
  storySlug: string;
  model: string;           // "text-embedding-3-small"
  dimensions: number;      // 1536
  chunks: KBChunk[];
  createdAt: string;
}

export interface KBSearchResult {
  chunk: KBChunk;
  score: number;
}
