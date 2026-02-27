import type { StoryManifest } from '@/lib/story-pack';
import motchama from './motchama/manifest';
import oppaFriends from './oppa-friends/manifest';

export const STORY_PACKS: Record<string, StoryManifest> = {
  motchama,
  'oppa-friends': oppaFriends,
};

export const DEFAULT_STORY = 'motchama';
