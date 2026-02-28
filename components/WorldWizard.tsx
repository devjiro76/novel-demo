'use client';

import { useState } from 'react';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { PageLayout, PageCard } from '@/components/layout';
import type { UserWorldRelationship } from '@/lib/types';
import { Switch } from '@/components/ui/switch';

// ---- Types ----

type SpeakingPreset = 'polite' | 'casual' | 'rough' | 'warm' | 'custom';

interface Big5 {
  E: number; // Extraversion
  N: number; // Neuroticism (inverse: emotional <-> rational)
  C: number; // Conscientiousness
  A: number; // Agreeableness
  O: number; // Openness
}

interface WizardCharacter {
  id: string;
  name: string;
  fullName: string;
  age: number;
  role: string;
  desc: string;
  personality: string;
  speakingStyle: string;
  glow: string;
  big5: Big5;
  speakingPreset: SpeakingPreset;
}

interface WizardForm {
  situation: string;
  isAdult: boolean;
}

// ---- Constants ----

const COLOR_PRESETS = [
  { label: '핑크', value: '#ff6b9d' },
  { label: '퍼플', value: '#a855f7' },
  { label: '블루', value: '#3b82f6' },
  { label: '그린', value: '#22c55e' },
  { label: '레드', value: '#ef4444' },
  { label: '앰버', value: '#f59e0b' },
];

const BIG5_LABELS: { key: keyof Big5; left: string; right: string }[] = [
  { key: 'E', left: '내성적', right: '외향적' },
  { key: 'N', left: '감정적', right: '이성적' },
  { key: 'C', left: '자유로운', right: '계획적' },
  { key: 'A', left: '경쟁적', right: '협조적' },
  { key: 'O', left: '보수적', right: '개방적' },
];

const SPEAKING_PRESETS: { key: SpeakingPreset; label: string; value: string }[] = [
  { key: 'polite', label: '존댓말', value: '~요, ~습니다' },
  { key: 'casual', label: '반말', value: '~야, ~이야' },
  { key: 'rough', label: '거침', value: '~거든, ~하든가' },
  { key: 'warm', label: '다정', value: '~네, ~구나' },
  { key: 'custom', label: '직접 입력', value: '' },
];

const RELATIONSHIP_TYPE_PRESETS = ['연인', '친구', '라이벌', '가족', '비밀'];

const stepLabels = ['상황', '캐릭터', '관계'];

// ---- Helpers ----

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function defaultBig5(): Big5 {
  return { E: 0.5, N: 0.5, C: 0.5, A: 0.5, O: 0.5 };
}

function emptyCharacter(): WizardCharacter {
  return {
    id: makeId(),
    name: '',
    fullName: '',
    age: 20,
    role: '',
    desc: '',
    personality: '',
    speakingStyle: '',
    glow: '#a855f7',
    big5: defaultBig5(),
    speakingPreset: 'polite',
  };
}

function resolvedSpeakingStyle(char: WizardCharacter): string {
  if (char.speakingPreset === 'custom') return char.speakingStyle;
  const preset = SPEAKING_PRESETS.find(p => p.key === char.speakingPreset);
  return preset ? preset.value : char.speakingStyle;
}

// ---- Sub-components ----

function Big5Sliders({
  big5,
  onChange,
}: {
  big5: Big5;
  onChange: (key: keyof Big5, v: number) => void;
}) {
  return (
    <div className="space-y-2.5">
      {BIG5_LABELS.map(({ key, left, right }) => (
        <div key={key} className="flex items-center gap-2">
          <span className="w-16 text-xs text-right text-[var(--color-text-secondary)] shrink-0">
            {left}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={big5[key]}
            onChange={e => onChange(key, Number(e.target.value))}
            aria-label={`${left} ↔ ${right}`}
            className="flex-1 accent-purple-500"
          />
          <span className="w-16 text-xs text-[var(--color-text-secondary)] shrink-0">
            {right}
          </span>
        </div>
      ))}
    </div>
  );
}

function SpeakingPresetButtons({
  preset,
  onChange,
}: {
  preset: SpeakingPreset;
  onChange: (p: SpeakingPreset) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {SPEAKING_PRESETS.map(p => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
          style={
            preset === p.key
              ? {
                  background: 'rgba(168,85,247,0.25)',
                  color: '#d8b4fe',
                  border: '1px solid rgba(168,85,247,0.5)',
                }
              : {
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-secondary)',
                  border: '1px solid transparent',
                }
          }
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// ---- SVG relationship preview (circle layout) ----
function RelationshipGraph({
  characters,
  relationships,
  themeColor = '#a855f7',
}: {
  characters: { id: string; name: string; glow: string }[];
  relationships: UserWorldRelationship[];
  themeColor?: string;
}) {
  if (characters.length === 0) return null;
  const cx = 160;
  const cy = 160;
  const r = 110;
  const n = characters.length;

  const positions = characters.map((_, i) => {
    const angle = (2 * Math.PI * i) / n - Math.PI / 2;
    return { x: cx + r * Math.cos(angle), y: cy + r * Math.sin(angle) };
  });

  const charIndex = Object.fromEntries(characters.map((c, i) => [c.id, i]));

  return (
    <svg width="320" height="320" viewBox="0 0 320 320" className="mx-auto">
      {relationships.map(rel => {
        const si = charIndex[rel.sourceId];
        const ti = charIndex[rel.targetId];
        if (si === undefined || ti === undefined) return null;
        const sp = positions[si];
        const tp = positions[ti];
        const opacity = 0.3 + rel.strength * 0.6;
        return (
          <g key={`${rel.sourceId}-${rel.targetId}`}>
            <line
              x1={sp.x}
              y1={sp.y}
              x2={tp.x}
              y2={tp.y}
              stroke={themeColor}
              strokeWidth={1 + rel.strength * 2}
              strokeOpacity={opacity}
            />
            {rel.relationshipType && (
              <text
                x={(sp.x + tp.x) / 2}
                y={(sp.y + tp.y) / 2 - 4}
                textAnchor="middle"
                fontSize="9"
                fill={themeColor}
                fillOpacity={0.9}
              >
                {rel.relationshipType}
              </text>
            )}
          </g>
        );
      })}

      {characters.map((char, i) => {
        const pos = positions[i];
        const color = char.glow || themeColor;
        return (
          <g key={char.id}>
            <circle
              cx={pos.x}
              cy={pos.y}
              r={24}
              fill={`${color}22`}
              stroke={color}
              strokeWidth={1.5}
            />
            <text
              x={pos.x}
              y={pos.y + 1}
              textAnchor="middle"
              dominantBaseline="middle"
              fontSize="13"
              fontWeight="600"
              fill={color}
            >
              {char.name.charAt(0) || '?'}
            </text>
            <text
              x={pos.x}
              y={pos.y + 34}
              textAnchor="middle"
              fontSize="10"
              fill="rgba(255,255,255,0.7)"
            >
              {char.name || '이름없음'}
            </text>
          </g>
        );
      })}
    </svg>
  );
}

// ---- Main component ----

export default function WorldWizard() {
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);

  // Step 1
  const [form, setForm] = useState<WizardForm>({
    situation: '',
    isAdult: false,
  });

  // Step 2
  const [characters, setCharacters] = useState<WizardCharacter[]>([emptyCharacter()]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});

  // Step 3
  const [relationships, setRelationships] = useState<UserWorldRelationship[]>([]);

  // Submit
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [newWorldId, setNewWorldId] = useState('');
  const [error, setError] = useState('');

  const inputClass =
    'w-full bg-[var(--color-surface-2)] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-white/20 transition-colors';
  const labelClass = 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5';

  // ---- Character helpers ----
  function updateChar(id: string, patch: Partial<WizardCharacter>) {
    setCharacters(prev => prev.map(c => (c.id === id ? { ...c, ...patch } : c)));
  }

  function updateCharBig5(id: string, key: keyof Big5, v: number) {
    setCharacters(prev =>
      prev.map(c => (c.id === id ? { ...c, big5: { ...c.big5, [key]: v } } : c))
    );
  }

  function addCharacter() {
    setCharacters(prev => [...prev, emptyCharacter()]);
  }

  function removeCharacter(id: string) {
    setCharacters(prev => prev.filter(c => c.id !== id));
    setRelationships(prev => prev.filter(r => r.sourceId !== id && r.targetId !== id));
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ---- Relationship helpers ----
  function getRelationship(
    sourceId: string,
    targetId: string
  ): UserWorldRelationship | undefined {
    return relationships.find(
      r =>
        (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
    );
  }

  function addRelationship(sourceId: string, targetId: string) {
    if (getRelationship(sourceId, targetId)) return;
    setRelationships(prev => [
      ...prev,
      { sourceId, targetId, relationshipType: '', strength: 0.5, trust: 0.5 },
    ]);
  }

  function removeRelationship(sourceId: string, targetId: string) {
    setRelationships(prev =>
      prev.filter(
        r =>
          !(
            (r.sourceId === sourceId && r.targetId === targetId) ||
            (r.sourceId === targetId && r.targetId === sourceId)
          )
      )
    );
  }

  function updateRelationship(
    sourceId: string,
    targetId: string,
    patch: Partial<UserWorldRelationship>
  ) {
    setRelationships(prev =>
      prev.map(r => {
        const match =
          (r.sourceId === sourceId && r.targetId === targetId) ||
          (r.sourceId === targetId && r.targetId === sourceId);
        return match ? { ...r, ...patch } : r;
      })
    );
  }

  // ---- Validation ----
  function validateStep(): string | null {
    if (step === 1) {
      if (!form.situation.trim()) return '어떤 이야기인지 설명해주세요.';
    }
    if (step === 2) {
      for (const c of characters) {
        if (!c.name.trim()) return '모든 캐릭터의 이름을 입력해주세요.';
        if (!c.role.trim()) return '모든 캐릭터의 역할을 입력해주세요.';
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const themeColor = characters[0]?.glow ?? '#a855f7';
      const payload = {
        name: form.situation.slice(0, 30),
        description: form.situation,
        lore: '',
        tags: [],
        themeColor,
        isAdult: form.isAdult,
        characters: characters.map(c => ({
          ...c,
          speakingStyle: resolvedSpeakingStyle(c),
          personality: `Big5: E=${c.big5.E} N=${c.big5.N} C=${c.big5.C} A=${c.big5.A} O=${c.big5.O}. ${c.personality}`,
        })),
        relationships,
        isPublic: true,
      };
      const res = await fetch('/api/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = (await res.json()) as { ok: boolean; id?: string; error?: string };
      if (!data.ok) throw new Error(data.error || '알 수 없는 오류');
      setNewWorldId(data.id || '');
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  // ---- Pairs for Step 3 ----
  const pairs: [WizardCharacter, WizardCharacter][] = [];
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      pairs.push([characters[i], characters[j]]);
    }
  }

  // ---- Done screen ----
  if (done) {
    const themeColor = characters[0]?.glow ?? '#a855f7';
    return (
      <PageLayout width="sm" className="flex items-center justify-center">
        <div className="text-center space-y-6">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl"
            style={{ background: `${themeColor}22`, border: `2px solid ${themeColor}66` }}
          >
            {form.situation.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              월드 생성 완료!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              월드가 성공적으로 만들어졌습니다.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            {newWorldId && (
              <Link
                href="/my"
                className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'var(--color-brand-gradient)' }}
              >
                내 월드 보기
              </Link>
            )}
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-2)]"
            >
              홈으로
            </Link>
          </div>
        </div>
      </PageLayout>
    );
  }

  const isDesktop = useIsDesktop();

  return (
    <PageLayout 
      title="월드 만들기" 
      subtitle="나만의 AI 스토리 월드를 생성하세요" 
      width="md"
      showBackButton={!isDesktop}
    >
      <div className="space-y-6">
        {/* Step indicator -->
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>단계 {step} / {TOTAL_STEPS}</span>
            <span>{stepLabels[step - 1]}</span>
          </div>
          <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(step / TOTAL_STEPS) * 100}%`,
                background: 'var(--color-brand-gradient)',
              }}
            />
          </div>
          <div className="flex justify-between mt-1">
            {stepLabels.map((label, i) => (
              <span
                key={label}
                className="text-xs"
                style={{
                  color: i + 1 <= step ? 'var(--color-text)' : 'var(--color-text-dim)',
                  fontWeight: i + 1 === step ? 600 : 400,
                }}
              >
                {label}
              </span>
            ))}
          </div>
        </div>

        {/* ---- Step 1: 상황 ---- */}
        {step === 1 && (
          <div className="space-y-5">
            <div>
              <label className={labelClass}>어떤 이야기? *</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={5}
                placeholder="예: 달빛 아카데미에서 벌어지는 마법사들의 이야기. 경쟁과 우정, 숨겨진 비밀이 얽혀 있다."
                value={form.situation}
                onChange={e => setForm(prev => ({ ...prev, situation: e.target.value }))}
                autoFocus
              />
              <p className="text-xs text-[var(--color-text-dim)] mt-1.5">
                상황, 배경, 분위기를 자유롭게 설명하세요. 이것이 월드의 핵심이 됩니다.
              </p>
            </div>

            <label className="flex items-center gap-3 cursor-pointer">
              <Switch
                checked={form.isAdult}
                onCheckedChange={checked => setForm(prev => ({ ...prev, isAdult: checked }))}
              />
              <span className="text-sm text-[var(--color-text-secondary)]">성인 콘텐츠 포함</span>
            </label>
          </div>
        )}

        {/* ---- Step 2: 캐릭터 (SDK Core) ---- */}
        {step === 2 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              캐릭터의 성격을 Big5 슬라이더로 설정하세요. World SDK가 이 값을 바탕으로 살아있는 페르소나를 구성합니다.
            </p>

            {characters.map((char, idx) => (
              <div
                key={char.id}
                className="rounded-xl border border-white/[0.06] bg-[var(--color-surface)] overflow-hidden"
              >
                {/* Card header */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                    style={{ background: `${char.glow}33`, color: char.glow }}
                  >
                    {char.name.charAt(0) || (idx + 1)}
                  </div>
                  <span className="flex-1 text-sm font-medium text-[var(--color-text)]">
                    {char.name || `캐릭터 ${idx + 1}`}
                  </span>
                  <div className="flex items-center gap-2">
                    {characters.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeCharacter(char.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        삭제
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => toggleCollapse(char.id)}
                      className="text-xs text-[var(--color-text-secondary)] hover:text-[var(--color-text)] transition-colors px-2"
                    >
                      {collapsed[char.id] ? '펼치기' : '접기'}
                    </button>
                  </div>
                </div>

                {/* Card body */}
                {!collapsed[char.id] && (
                  <div className="px-4 pb-4 space-y-4 border-t border-white/[0.04]">
                    {/* Name + Full Name */}
                    <div className="grid grid-cols-2 gap-3 pt-3">
                      <div>
                        <label className={labelClass}>표시 이름 *</label>
                        <input
                          className={inputClass}
                          placeholder="예: 유리"
                          value={char.name}
                          onChange={e => updateChar(char.id, { name: e.target.value })}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>전체 이름</label>
                        <input
                          className={inputClass}
                          placeholder="예: 김유리"
                          value={char.fullName}
                          onChange={e => updateChar(char.id, { fullName: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Age + Role */}
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className={labelClass}>나이</label>
                        <input
                          className={inputClass}
                          type="number"
                          min={1}
                          max={999}
                          value={char.age}
                          onChange={e => updateChar(char.id, { age: Number(e.target.value) })}
                        />
                      </div>
                      <div>
                        <label className={labelClass}>역할 *</label>
                        <input
                          className={inputClass}
                          placeholder="예: 마법사"
                          value={char.role}
                          onChange={e => updateChar(char.id, { role: e.target.value })}
                        />
                      </div>
                    </div>

                    {/* Big5 personality sliders */}
                    <div>
                      <label className={labelClass}>성격 (Big5)</label>
                      <Big5Sliders
                        big5={char.big5}
                        onChange={(key, v) => updateCharBig5(char.id, key, v)}
                      />
                    </div>

                    {/* Speaking style presets */}
                    <div>
                      <label className={labelClass}>말투</label>
                      <SpeakingPresetButtons
                        preset={char.speakingPreset}
                        onChange={p => updateChar(char.id, { speakingPreset: p })}
                      />
                      {char.speakingPreset === 'custom' && (
                        <textarea
                          className={`${inputClass} resize-none mt-2`}
                          rows={2}
                          placeholder="예: 오늘 하루 어떠셨어요? (말투 예시를 입력하세요)"
                          value={char.speakingStyle}
                          onChange={e => updateChar(char.id, { speakingStyle: e.target.value })}
                        />
                      )}
                    </div>

                    {/* Theme color */}
                    <div>
                      <label className={labelClass}>테마 색상</label>
                      <div className="flex gap-2 mt-1">
                        {COLOR_PRESETS.map(preset => (
                          <button
                            key={preset.value}
                            type="button"
                            title={preset.label}
                            onClick={() => updateChar(char.id, { glow: preset.value })}
                            className="w-7 h-7 rounded-full transition-transform hover:scale-110"
                            style={{
                              background: preset.value,
                              outline:
                                char.glow === preset.value
                                  ? `2px solid ${preset.value}`
                                  : '2px solid transparent',
                              outlineOffset: '2px',
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            ))}

            <button
              type="button"
              onClick={addCharacter}
              className="w-full py-3 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] border border-dashed border-white/[0.12] hover:border-white/20 hover:text-[var(--color-text)] transition-colors"
            >
              + 캐릭터 추가
            </button>
          </div>
        )}

        {/* ---- Step 3: 관계 ---- */}
        {step === 3 && (
          <div className="space-y-4">
            <p className="text-sm text-[var(--color-text-secondary)]">
              캐릭터 간의 관계를 선택적으로 정의하세요. 관계를 추가하지 않아도 됩니다.
            </p>

            {pairs.map(([a, b]) => {
              const rel = getRelationship(a.id, b.id);
              return (
                <div
                  key={`${a.id}-${b.id}`}
                  className="rounded-xl border border-white/[0.06] bg-[var(--color-surface)] p-4 space-y-3"
                >
                  {/* Pair header */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: a.glow || '#a855f7' }}>
                        {a.name || '이름없음'}
                      </span>
                      <span className="text-xs text-[var(--color-text-dim)]">↔</span>
                      <span className="text-sm font-semibold" style={{ color: b.glow || '#a855f7' }}>
                        {b.name || '이름없음'}
                      </span>
                    </div>
                    {rel ? (
                      <button
                        type="button"
                        onClick={() => removeRelationship(a.id, b.id)}
                        className="text-xs text-red-400 hover:text-red-300 transition-colors"
                      >
                        관계 삭제
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => addRelationship(a.id, b.id)}
                        className="text-xs text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        + 관계 추가
                      </button>
                    )}
                  </div>

                  {rel && (
                    <div className="space-y-3">
                      {/* Relationship type presets */}
                      <div>
                        <label className={`${labelClass} mb-2`}>관계 유형</label>
                        <div className="flex flex-wrap gap-2 mb-2">
                          {RELATIONSHIP_TYPE_PRESETS.map(type => (
                            <button
                              key={type}
                              type="button"
                              onClick={() =>
                                updateRelationship(a.id, b.id, { relationshipType: type })
                              }
                              className="px-3 py-1 rounded-full text-xs font-medium transition-colors"
                              style={
                                rel.relationshipType === type
                                  ? {
                                      background: 'rgba(168,85,247,0.25)',
                                      color: '#d8b4fe',
                                      border: '1px solid rgba(168,85,247,0.5)',
                                    }
                                  : {
                                      background: 'var(--color-surface-2)',
                                      color: 'var(--color-text-secondary)',
                                      border: '1px solid transparent',
                                    }
                              }
                            >
                              {type}
                            </button>
                          ))}
                        </div>
                        <input
                          className={inputClass}
                          placeholder="직접 입력 (예: 스승, 형제, 숙적)"
                          value={rel.relationshipType}
                          onChange={e =>
                            updateRelationship(a.id, b.id, { relationshipType: e.target.value })
                          }
                        />
                      </div>

                      {/* Strength slider */}
                      <div>
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                          <span>관계 강도</span>
                          <span>{Math.round(rel.strength * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={rel.strength}
                          onChange={e =>
                            updateRelationship(a.id, b.id, { strength: Number(e.target.value) })
                          }
                          aria-label="관계 강도"
                          className="w-full accent-purple-500"
                        />
                      </div>

                      {/* Trust slider */}
                      <div>
                        <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
                          <span>신뢰도</span>
                          <span>{Math.round(rel.trust * 100)}%</span>
                        </div>
                        <input
                          type="range"
                          min={0}
                          max={1}
                          step={0.01}
                          value={rel.trust}
                          onChange={e =>
                            updateRelationship(a.id, b.id, { trust: Number(e.target.value) })
                          }
                          aria-label="신뢰도"
                          className="w-full accent-purple-500"
                        />
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {pairs.length === 0 && (
              <p className="text-sm text-[var(--color-text-dim)] text-center py-4">
                캐릭터를 2명 이상 추가하면 관계를 정의할 수 있습니다.
              </p>
            )}

            {/* Relationship graph preview */}
            {characters.length > 0 && (
              <div>
                <p className={labelClass}>관계 미리보기</p>
                <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface)] p-4">
                  <RelationshipGraph
                    characters={characters}
                    relationships={relationships}
                    themeColor={characters[0]?.glow ?? '#a855f7'}
                  />
                  {relationships.length === 0 && (
                    <p className="text-xs text-center text-[var(--color-text-dim)] mt-2">
                      정의된 관계가 없습니다.
                    </p>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        {/* Navigation buttons */}
        <div className="flex gap-3">
          {step > 1 && (
            <button
              type="button"
              onClick={() => {
                setError('');
                setStep(s => s - 1);
              }}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-[var(--color-text-secondary)] bg-[var(--color-surface-2)] hover:bg-[var(--color-surface-3)] transition-colors"
            >
              이전
            </button>
          )}
          {step < TOTAL_STEPS ? (
            <button
              type="button"
              onClick={handleNext}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90"
              style={{ background: 'var(--color-brand-gradient)' }}
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'var(--color-brand-gradient)' }}
            >
              {submitting ? '생성 중...' : '월드 만들기'}
            </button>
          )}
        </div>
      </div>
    </PageLayout>
  );
}
