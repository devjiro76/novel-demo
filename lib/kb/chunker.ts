import * as fs from 'fs';
import * as path from 'path';
import mammoth from 'mammoth';
import type { KBChunk } from './types';

/** Extract episode number from filename like "못참아 1화-1.docx" → 1 */
function extractEpisodeNum(filename: string): number {
  const m = filename.match(/(\d+)\s*화/);
  return m ? parseInt(m[1], 10) : 0;
}

/** Split text by #N scene markers */
function splitBySceneMarkers(text: string): { sceneNum: number; text: string }[] {
  const lines = text.split('\n');
  const scenes: { sceneNum: number; text: string }[] = [];
  let currentScene: { sceneNum: number; lines: string[] } | null = null;

  for (const line of lines) {
    const markerMatch = line.match(/^#(\d+)\s*$/);
    if (markerMatch) {
      if (currentScene && currentScene.lines.length > 0) {
        scenes.push({ sceneNum: currentScene.sceneNum, text: currentScene.lines.join('\n').trim() });
      }
      currentScene = { sceneNum: parseInt(markerMatch[1], 10), lines: [] };
    } else if (currentScene) {
      currentScene.lines.push(line);
    } else {
      // Text before first marker — start implicit scene 0
      if (!currentScene) {
        currentScene = { sceneNum: 0, lines: [line] };
      }
    }
  }
  if (currentScene && currentScene.lines.length > 0) {
    scenes.push({ sceneNum: currentScene.sceneNum, text: currentScene.lines.join('\n').trim() });
  }
  return scenes;
}

/** Group scenes into chunks of 500-800 characters */
function groupScenesIntoChunks(
  scenes: { sceneNum: number; text: string }[],
  storySlug: string,
  episodeNum: number,
): Omit<KBChunk, 'embedding'>[] {
  const chunks: Omit<KBChunk, 'embedding'>[] = [];
  let buffer: { sceneNum: number; text: string }[] = [];
  let bufferLen = 0;
  let chunkIdx = 0;

  const flush = () => {
    if (buffer.length === 0) return;
    const firstScene = buffer[0].sceneNum;
    const lastScene = buffer[buffer.length - 1].sceneNum;
    const sceneRange = firstScene === lastScene ? `#${firstScene}` : `#${firstScene}-#${lastScene}`;
    const text = buffer.map((s) => s.text).join('\n\n');

    chunks.push({
      id: `${storySlug}-ep${String(episodeNum).padStart(3, '0')}-chunk${String(chunkIdx).padStart(3, '0')}`,
      storySlug,
      episodeNum,
      sceneRange,
      text,
      metadata: { characters: [], keywords: [] },
    });
    chunkIdx++;
    buffer = [];
    bufferLen = 0;
  };

  for (const scene of scenes) {
    const sceneLen = scene.text.length;

    // If adding this scene exceeds 800 chars and we already have 3+ scenes, flush
    if (bufferLen + sceneLen > 800 && buffer.length >= 3) {
      flush();
    }

    buffer.push(scene);
    bufferLen += sceneLen;

    // If we hit 5 scenes, flush regardless
    if (buffer.length >= 5) {
      flush();
    }
  }

  // Flush remaining
  flush();

  return chunks;
}

/** Convert a single docx file to text chunks */
async function processDocx(
  filePath: string,
  storySlug: string,
  episodeNum: number,
): Promise<Omit<KBChunk, 'embedding'>[]> {
  const buffer = fs.readFileSync(filePath);
  const result = await mammoth.extractRawText({ buffer });
  const text = result.value;

  if (!text.trim()) return [];

  const scenes = splitBySceneMarkers(text);
  if (scenes.length === 0) return [];

  return groupScenesIntoChunks(scenes, storySlug, episodeNum);
}

/** Process all docx files for a story slug */
export async function chunkStory(storySlug: string): Promise<Omit<KBChunk, 'embedding'>[]> {
  const rawDir = path.join(process.cwd(), 'stories', storySlug, 'raw');
  if (!fs.existsSync(rawDir)) {
    throw new Error(`Raw directory not found: ${rawDir}`);
  }

  const files = fs.readdirSync(rawDir)
    .filter((f) => f.endsWith('.docx'))
    .sort();

  console.log(`Found ${files.length} docx files in ${rawDir}`);

  const allChunks: Omit<KBChunk, 'embedding'>[] = [];
  for (const file of files) {
    const episodeNum = extractEpisodeNum(file);
    const filePath = path.join(rawDir, file);
    const chunks = await processDocx(filePath, storySlug, episodeNum);
    console.log(`  ${file}: ${chunks.length} chunks (ep ${episodeNum})`);
    allChunks.push(...chunks);
  }

  console.log(`Total: ${allChunks.length} chunks`);
  return allChunks;
}
