export interface DebugEntry {
  type:
    | 'director_call'
    | 'narrator_call'
    | 'perceive_call'
    | 'appraisal_call'
    | 'prompt_context'
    | 'emotion_change'
    | 'history_built'
    | 'turn_choose_start'
    | 'converse_start'
    | 'converse_appraisal'
    | 'converse_perceive'
    | 'converse_narrate'
    | 'converse_result'
    | 'stimulus_gen'
    | 'update_relationships'
    | 'request_summary';
  ts: string;
  durationMs?: number;
  data: Record<string, unknown>;
}

export class DebugLog {
  private entries: DebugEntry[] = [];
  private requestStart: number;

  constructor() {
    this.requestStart = Date.now();
  }

  add(type: DebugEntry['type'], data: Record<string, unknown>, durationMs?: number) {
    const entry: DebugEntry = {
      type,
      ts: new Date().toISOString(),
      ...(durationMs != null ? { durationMs } : {}),
      data,
    };
    this.entries.push(entry);
    console.log(`[DEBUG] ${JSON.stringify(entry)}`);
  }

  async time<T>(
    type: DebugEntry['type'],
    data: Record<string, unknown>,
    fn: () => Promise<T>,
  ): Promise<T> {
    const start = Date.now();
    try {
      const result = await fn();
      const durationMs = Date.now() - start;
      this.add(type, { ...data, status: 'ok' }, durationMs);
      return result;
    } catch (err) {
      const durationMs = Date.now() - start;
      this.add(type, { ...data, status: 'error', error: (err as Error).message }, durationMs);
      throw err;
    }
  }

  logEmotionChange(
    characterId: string,
    displayName: string,
    before: { vad: { V: number; A: number; D: number }; discrete?: string } | null,
    after: { vad: { V: number; A: number; D: number }; discrete?: string } | null,
    actionName: string,
  ) {
    const bVad = before?.vad;
    const aVad = after?.vad;
    const delta = bVad && aVad
      ? { dV: +(aVad.V - bVad.V).toFixed(3), dA: +(aVad.A - bVad.A).toFixed(3), dD: +(aVad.D - bVad.D).toFixed(3) }
      : null;

    this.add('emotion_change', {
      characterId,
      displayName,
      actionName,
      before: bVad ? { V: +bVad.V.toFixed(3), A: +bVad.A.toFixed(3), D: +bVad.D.toFixed(3), label: before?.discrete } : null,
      after: aVad ? { V: +aVad.V.toFixed(3), A: +aVad.A.toFixed(3), D: +aVad.D.toFixed(3), label: after?.discrete } : null,
      delta,
    });
  }

  getEntries(): DebugEntry[] {
    return this.entries;
  }

  finalize(): DebugEntry[] {
    this.add('request_summary', {
      totalMs: Date.now() - this.requestStart,
      entryCount: this.entries.length - 1,
    });
    return this.entries;
  }
}
