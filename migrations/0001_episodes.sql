-- Episodic memory storage for novel demo NPCs
-- Used by D1 + Vectorize + Workers AI memory adapter

CREATE TABLE IF NOT EXISTS episodes (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  npc_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  source_entity TEXT,
  context TEXT,
  importance REAL NOT NULL DEFAULT 0.5,
  emotion_v REAL NOT NULL DEFAULT 0,
  emotion_a REAL NOT NULL DEFAULT 0,
  emotion_d REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_episodes_room_npc_time
  ON episodes (room_id, npc_id, timestamp DESC);

CREATE INDEX IF NOT EXISTS idx_episodes_room_npc_importance
  ON episodes (room_id, npc_id, importance DESC);

CREATE TABLE IF NOT EXISTS reflections (
  id TEXT PRIMARY KEY,
  room_id TEXT NOT NULL,
  npc_id TEXT NOT NULL,
  timestamp INTEGER NOT NULL,
  source_entity TEXT,
  content TEXT NOT NULL,
  trigger_type TEXT,
  emotion_v REAL NOT NULL DEFAULT 0,
  emotion_a REAL NOT NULL DEFAULT 0,
  emotion_d REAL NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_reflections_room_npc_time
  ON reflections (room_id, npc_id, timestamp DESC);
