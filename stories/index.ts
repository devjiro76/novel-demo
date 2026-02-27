import type { StoryManifest } from '@/lib/story-pack';
import motchama from './motchama/manifest';

export const STORY_PACKS: Record<string, StoryManifest> = {
  motchama,
};

export const DEFAULT_STORY = 'motchama';
