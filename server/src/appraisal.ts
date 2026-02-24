/**
 * Dedicated Appraisal Generation — persona-specific cognitive evaluation.
 *
 * Interface designed for drop-in replacement:
 *   current: LLM (Sonnet/GPT) → 9D vector
 *   future: fine-tuned model (Qwen2.5-3B/Phi-3.5) → 9D vector
 *
 * scripts/appraisal-finetune/ pipeline uses identical I/O structure.
 */

import { createLLM, ENGINE_MODEL, z } from './llm';
import type { Village } from './personas';
import type { AppraisalVector } from '@molroo-ai/world-sdk';
import type { Env } from './types';

const appraisalSchema = z.object({
  goalRelevance: z.number().min(0).max(1).describe('이 상황이 내 삶에 얼마나 중요한가'),
  goalCongruence: z.number().min(-1).max(1).describe('내 목표에 부합(+)/방해(-)'),
  expectedness: z.number().min(0).max(1).describe('예상된 정도'),
  controllability: z.number().min(0).max(1).describe('내가 상황을 통제할 수 있는 정도'),
  agency: z.number().min(-1).max(1).describe('행위자의 의도성. 의도적(+)/우연(-)'),
  normCompatibility: z.number().min(-1).max(1).describe('사회 규범 부합(+)/위반(-)'),
  internalStandards: z.number().min(-1).max(1).describe('내 내적 가치관 부합(+)/위반(-)'),
  adjustmentPotential: z.number().min(0).max(1).describe('적응/대처 여지'),
  urgency: z.number().min(0).max(1).describe('즉각 반응 필요도'),
});

/** Stimulus description writing guide for director prompt */
export function getStimulusGuide(): string {
  return `## Stimulus Description 가이드
각 선택지의 target마다 stimulusDescription을 작성하세요.
- NPC의 관점에서 "나에게 무슨 일이 일어나는가"를 묘사
- 감각적 디테일 포함 (체온, 거리, 접촉, 시선)
- 1-2문장으로 간결하게
- 예: "용준이 내 이마에 입술을 가져다 댄다. 따뜻한 숨결이 피부에 닿는다."`;
}

/**
 * Generate persona-specific appraisal for a stimulus.
 *
 * @param characterId - target persona config ID
 * @param stimulusDescription - what happens TO this character (from director)
 * @param village - Village handle for getPromptContext
 * @param env - environment (LLM API key)
 * @returns 9D AppraisalVector (camelCase, matches SDK AppraisalVector type)
 */
export async function generateAppraisal(
  characterId: string,
  stimulusDescription: string,
  village: Village,
  env: Env,
): Promise<AppraisalVector> {
  const persona = village.persona(characterId);
  const promptCtx = await persona.getPromptContext('yongjun');

  const systemPrompt = `${promptCtx.systemPrompt}

## 인지적 평가 (Cognitive Appraisal)
당신은 아래 상황을 경험하는 캐릭터입니다.
당신의 성격, 가치관, 현재 감정 상태에 기반하여 이 상황을 9개 차원으로 평가하세요.

**중요: 모든 값은 소수점 둘째 자리까지만. 범위를 반드시 준수하세요.**
- goalRelevance: 0.0 ~ 1.0
- goalCongruence: -1.0 ~ 1.0
- expectedness: 0.0 ~ 1.0
- controllability: 0.0 ~ 1.0
- agency: -1.0 ~ 1.0
- normCompatibility: -1.0 ~ 1.0
- internalStandards: -1.0 ~ 1.0
- adjustmentPotential: 0.0 ~ 1.0
- urgency: 0.0 ~ 1.0`;

  const llm = createLLM(env.OPENROUTER_API_KEY, ENGINE_MODEL);
  const { object } = await llm.generateObject({
    system: systemPrompt,
    messages: [{ role: 'user', content: stimulusDescription }],
    schema: appraisalSchema,
    temperature: 0.3,
  });

  // Defensive clamp — Gemini Flash sometimes ignores Zod min/max constraints
  const clamp = (v: number, min: number, max: number) => Math.max(min, Math.min(max, +v.toFixed(2)));
  return {
    goalRelevance: clamp(object.goalRelevance, 0, 1),
    goalCongruence: clamp(object.goalCongruence, -1, 1),
    expectedness: clamp(object.expectedness, 0, 1),
    controllability: clamp(object.controllability, 0, 1),
    agency: clamp(object.agency, -1, 1),
    normCompatibility: clamp(object.normCompatibility, -1, 1),
    internalStandards: clamp(object.internalStandards, -1, 1),
    adjustmentPotential: clamp(object.adjustmentPotential, 0, 1),
    urgency: clamp(object.urgency, 0, 1),
  };
}
