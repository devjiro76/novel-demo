import { engineModel, generateObject, z } from './llm';
import type { Village } from './personas';
import type { AppraisalVector } from '@molroo-io/sdk/world';
import type { Env } from './types';

const appraisalSchema = z.object({
  goalRelevance: z.number().describe('이 상황이 내 삶에 얼마나 중요한가 (0.0~1.0)'),
  goalCongruence: z.number().describe('내 목표에 부합(+)/방해(-) (-1.0~1.0)'),
  expectedness: z.number().describe('예상된 정도 (0.0~1.0)'),
  controllability: z.number().describe('내가 상황을 통제할 수 있는 정도 (0.0~1.0)'),
  agency: z.number().describe('행위자의 의도성. 의도적(+)/우연(-) (-1.0~1.0)'),
  normCompatibility: z.number().describe('사회 규범 부합(+)/위반(-) (-1.0~1.0)'),
  internalStandards: z.number().describe('내 내적 가치관 부합(+)/위반(-) (-1.0~1.0)'),
  adjustmentPotential: z.number().describe('적응/대처 여지 (0.0~1.0)'),
  urgency: z.number().describe('즉각 반응 필요도 (0.0~1.0)'),
  estimatedElapsedSeconds: z.number().describe('이전 대화로부터 서사적으로 경과한 시간(초). 바로 이어지는 대화=5, 잠시 침묵=60, 시간 경과 언급=해당 초. 최소 1, 최대 86400.'),
});

export async function generateAppraisal(
  characterId: string,
  stimulusDescription: string,
  village: Village,
  env: Env,
  senderCharacterId?: string,
): Promise<AppraisalVector & { estimatedElapsedSeconds: number }> {
  const persona = village.persona(characterId);
  const promptCtx = await persona.getPromptContext(senderCharacterId ?? 'yongjun');

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

  const model = engineModel(env);
  const timeout = AbortSignal.timeout(30_000);
  const { object } = await generateObject({
    model,
    system: systemPrompt,
    messages: [{ role: 'user', content: stimulusDescription }],
    schema: appraisalSchema,
    temperature: 0.3,
    abortSignal: timeout,
  });

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
    estimatedElapsedSeconds: Math.max(1, Math.min(86400, Math.round(object.estimatedElapsedSeconds))),
  };
}
