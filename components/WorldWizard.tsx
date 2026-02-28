'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { UserWorldCharacter, UserWorldRelationship } from '@/lib/types';

const COLOR_PRESETS = [
  { label: '핑크', value: '#ff6b9d' },
  { label: '퍼플', value: '#a855f7' },
  { label: '블루', value: '#3b82f6' },
  { label: '그린', value: '#22c55e' },
  { label: '레드', value: '#ef4444' },
  { label: '앰버', value: '#f59e0b' },
];

function makeId() {
  return Math.random().toString(36).slice(2, 10);
}

function emptyCharacter(): UserWorldCharacter {
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
  };
}

interface WorldForm {
  name: string;
  description: string;
  lore: string;
  tags: string[];
  themeColor: string;
  isAdult: boolean;
}

// ---- Toggle ----
function Toggle({
  checked,
  onChange,
  color = 'bg-purple-500',
}: {
  checked: boolean;
  onChange: () => void;
  color?: string;
}) {
  return (
    <div
      role="checkbox"
      aria-checked={checked}
      onClick={onChange}
      className={`w-10 h-6 rounded-full transition-colors relative cursor-pointer ${checked ? color : 'bg-[var(--color-surface-3)]'}`}
    >
      <span
        className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${checked ? 'translate-x-5' : 'translate-x-1'}`}
      />
    </div>
  );
}

// ---- Slider ----
function Slider({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <div>
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-1">
        <span>{label}</span>
        <span>{Math.round(value * 100)}%</span>
      </div>
      <input
        type="range"
        min={0}
        max={1}
        step={0.01}
        value={value}
        onChange={e => onChange(Number(e.target.value))}
        className="w-full accent-purple-500"
      />
    </div>
  );
}

// ---- SVG relationship preview (circle layout) ----
function RelationshipGraph({
  characters,
  relationships,
}: {
  characters: UserWorldCharacter[];
  relationships: UserWorldRelationship[];
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
    <svg
      width="320"
      height="320"
      viewBox="0 0 320 320"
      className="mx-auto"
    >
      {/* Relationship lines */}
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
              stroke="#a855f7"
              strokeWidth={1 + rel.strength * 2}
              strokeOpacity={opacity}
            />
            {/* Label at midpoint */}
            {rel.relationshipType && (
              <text
                x={(sp.x + tp.x) / 2}
                y={(sp.y + tp.y) / 2 - 4}
                textAnchor="middle"
                fontSize="9"
                fill="#a855f7"
                fillOpacity={0.9}
              >
                {rel.relationshipType}
              </text>
            )}
          </g>
        );
      })}

      {/* Character nodes */}
      {characters.map((char, i) => {
        const pos = positions[i];
        const color = char.glow || '#a855f7';
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
  const [step, setStep] = useState(1);
  const TOTAL_STEPS = 4;

  // Step 1
  const [form, setForm] = useState<WorldForm>({
    name: '',
    description: '',
    lore: '',
    tags: [],
    themeColor: '#a855f7',
    isAdult: false,
  });
  const [tagInput, setTagInput] = useState('');

  // Step 2
  const [characters, setCharacters] = useState<UserWorldCharacter[]>([emptyCharacter(), emptyCharacter()]);
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

  // ---- World form helpers ----
  function setF<K extends keyof WorldForm>(key: K, value: WorldForm[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleTagKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTag();
    }
  }

  function addTag() {
    const trimmed = tagInput.trim().replace(/,$/, '');
    if (trimmed && !form.tags.includes(trimmed)) {
      setF('tags', [...form.tags, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    setF('tags', form.tags.filter(t => t !== tag));
  }

  // ---- Character helpers ----
  function updateChar(id: string, patch: Partial<UserWorldCharacter>) {
    setCharacters(prev => prev.map(c => c.id === id ? { ...c, ...patch } : c));
  }

  function addCharacter() {
    setCharacters(prev => [...prev, emptyCharacter()]);
  }

  function removeCharacter(id: string) {
    setCharacters(prev => prev.filter(c => c.id !== id));
    // remove relationships involving this character
    setRelationships(prev => prev.filter(r => r.sourceId !== id && r.targetId !== id));
  }

  function toggleCollapse(id: string) {
    setCollapsed(prev => ({ ...prev, [id]: !prev[id] }));
  }

  // ---- Relationship helpers ----
  function getRelationship(sourceId: string, targetId: string): UserWorldRelationship | undefined {
    return relationships.find(
      r => (r.sourceId === sourceId && r.targetId === targetId) ||
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
    setRelationships(prev => prev.filter(
      r => !(
        (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId)
      )
    ));
  }

  function updateRelationship(sourceId: string, targetId: string, patch: Partial<UserWorldRelationship>) {
    setRelationships(prev => prev.map(r => {
      const match =
        (r.sourceId === sourceId && r.targetId === targetId) ||
        (r.sourceId === targetId && r.targetId === sourceId);
      return match ? { ...r, ...patch } : r;
    }));
  }

  // ---- Validation ----
  function validateStep(): string | null {
    if (step === 1) {
      if (!form.name.trim()) return '월드 이름을 입력해주세요.';
      if (!form.description.trim()) return '월드 설명을 입력해주세요.';
    }
    if (step === 2) {
      if (characters.length < 2) return '캐릭터를 최소 2명 추가해주세요.';
      for (const c of characters) {
        if (!c.name.trim()) return '모든 캐릭터의 이름을 입력해주세요.';
        if (!c.role.trim()) return '모든 캐릭터의 역할을 입력해주세요.';
        if (!c.personality.trim()) return '모든 캐릭터의 성격을 입력해주세요.';
      }
    }
    return null;
  }

  function handleNext() {
    const err = validateStep();
    if (err) { setError(err); return; }
    setError('');
    setStep(s => s + 1);
  }

  async function handleSubmit() {
    setSubmitting(true);
    setError('');
    try {
      const payload = {
        ...form,
        characters,
        relationships,
        isPublic: true,
      };
      const res = await fetch('/api/world', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      const data = await res.json() as { ok: boolean; id?: string; error?: string };
      if (!data.ok) throw new Error(data.error || '알 수 없는 오류');
      setNewWorldId(data.id || '');
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  const stepLabels = ['월드 기본', '캐릭터 추가', '관계 정의', '리뷰 + 발행'];

  // ---- Pairs for Step 3 ----
  const pairs: [UserWorldCharacter, UserWorldCharacter][] = [];
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      pairs.push([characters[i], characters[j]]);
    }
  }

  // ---- Done screen ----
  if (done) {
    return (
      <div className="min-h-screen bg-[#08080d] flex items-center justify-center px-4">
        <div className="max-w-[480px] w-full text-center space-y-6">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl"
            style={{ background: `${form.themeColor}22`, border: `2px solid ${form.themeColor}66` }}
          >
            {form.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              {form.name} 월드 생성 완료!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              월드가 성공적으로 만들어졌습니다.
            </p>
          </div>
          <div className="flex gap-3 justify-center">
            {newWorldId && (
              <Link
                href={`/my`}
                className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
                style={{ background: 'linear-gradient(135deg, #ff6b9d, #a855f7)' }}
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
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080d] flex flex-col items-center px-4 py-8">
      <div className="max-w-[520px] w-full space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--color-text)]">월드 만들기</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">나만의 AI 스토리 월드를 생성하세요</p>
        </div>

        {/* Step indicator */}
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
                background: 'linear-gradient(90deg, #ff6b9d, #a855f7)',
              }}
            />
          </div>
        </div>

        {/* ---- Step 1: 월드 기본 ---- */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>월드 이름 *</label>
              <input
                className={inputClass}
                placeholder="예: 달빛 아카데미"
                value={form.name}
                onChange={e => setF('name', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>월드 설명 *</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="이 월드의 분위기와 핵심 설정을 2-3문장으로 소개해주세요."
                value={form.description}
                onChange={e => setF('description', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>로어 (선택)</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="세계관 설정, 역사적 배경, 마법 시스템 등 자세한 설정을 입력해주세요."
                value={form.lore}
                onChange={e => setF('lore', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>태그</label>
              <input
                className={inputClass}
                placeholder="태그 입력 후 쉼표 또는 Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagKeyDown}
                onBlur={addTag}
              />
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-2">
                  {form.tags.map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => removeTag(tag)}
                      className="flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-[var(--color-surface-3)] text-[var(--color-text-secondary)] hover:bg-white/10 transition-colors"
                    >
                      {tag}
                      <span className="text-[var(--color-text-dim)] ml-0.5">x</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
            <div>
              <label className={labelClass}>테마 색상</label>
              <div className="flex gap-3 mt-1">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => setF('themeColor', preset.value)}
                    className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: preset.value,
                      outline: form.themeColor === preset.value ? `3px solid ${preset.value}` : '3px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>
            <label className="flex items-center gap-3 cursor-pointer">
              <Toggle
                checked={form.isAdult}
                onChange={() => setF('isAdult', !form.isAdult)}
                color="bg-red-500"
              />
              <span className="text-sm text-[var(--color-text-secondary)]">성인 콘텐츠 포함</span>
            </label>
          </div>
        )}

        {/* ---- Step 2: 캐릭터 추가 ---- */}
        {step === 2 && (
          <div className="space-y-4">
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
                    {characters.length > 2 && (
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
                  <div className="px-4 pb-4 space-y-3 border-t border-white/[0.04]">
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
                          placeholder="예: 바리스타"
                          value={char.role}
                          onChange={e => updateChar(char.id, { role: e.target.value })}
                        />
                      </div>
                    </div>
                    <div>
                      <label className={labelClass}>캐릭터 설명</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        rows={2}
                        placeholder="간단한 소개"
                        value={char.desc}
                        onChange={e => updateChar(char.id, { desc: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>성격 프롬프트 *</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        rows={2}
                        placeholder="예: 따뜻하고 공감 능력이 뛰어난 성격."
                        value={char.personality}
                        onChange={e => updateChar(char.id, { personality: e.target.value })}
                      />
                    </div>
                    <div>
                      <label className={labelClass}>말투 예시</label>
                      <textarea
                        className={`${inputClass} resize-none`}
                        rows={2}
                        placeholder="예: 오늘 하루 어떠셨어요?"
                        value={char.speakingStyle}
                        onChange={e => updateChar(char.id, { speakingStyle: e.target.value })}
                      />
                    </div>
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
                              outline: char.glow === preset.value ? `2px solid ${preset.value}` : '2px solid transparent',
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

        {/* ---- Step 3: 관계 정의 ---- */}
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
                      <span
                        className="text-sm font-semibold"
                        style={{ color: a.glow || '#a855f7' }}
                      >
                        {a.name || '이름없음'}
                      </span>
                      <span className="text-xs text-[var(--color-text-dim)]">↔</span>
                      <span
                        className="text-sm font-semibold"
                        style={{ color: b.glow || '#a855f7' }}
                      >
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
                      <div>
                        <label className={labelClass}>관계 유형</label>
                        <input
                          className={inputClass}
                          placeholder="예: 연인, 라이벌, 형제, 스승"
                          value={rel.relationshipType}
                          onChange={e =>
                            updateRelationship(a.id, b.id, { relationshipType: e.target.value })
                          }
                        />
                      </div>
                      <Slider
                        label="관계 강도"
                        value={rel.strength}
                        onChange={v => updateRelationship(a.id, b.id, { strength: v })}
                      />
                      <Slider
                        label="신뢰도"
                        value={rel.trust}
                        onChange={v => updateRelationship(a.id, b.id, { trust: v })}
                      />
                    </div>
                  )}
                </div>
              );
            })}

            {pairs.length === 0 && (
              <p className="text-sm text-[var(--color-text-dim)] text-center py-4">
                캐릭터가 2명 이상이어야 관계를 정의할 수 있습니다.
              </p>
            )}
          </div>
        )}

        {/* ---- Step 4: 리뷰 + 발행 ---- */}
        {step === 4 && (
          <div className="space-y-6">
            {/* World summary */}
            <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface)] p-4 space-y-3">
              <div className="flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: `${form.themeColor}33`, color: form.themeColor }}
                >
                  {form.name.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{form.name || '이름 없음'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">
                    캐릭터 {characters.length}명 · 관계 {relationships.length}개
                    {form.isAdult ? ' · 성인' : ''}
                  </p>
                </div>
              </div>
              {form.description && (
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">
                  {form.description}
                </p>
              )}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: `${form.themeColor}22`, color: form.themeColor }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Character list */}
            <div>
              <p className={labelClass}>캐릭터</p>
              <div className="space-y-2">
                {characters.map(char => (
                  <div
                    key={char.id}
                    className="flex items-center gap-3 rounded-xl border border-white/[0.06] bg-[var(--color-surface)] px-4 py-2.5"
                  >
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold shrink-0"
                      style={{ background: `${char.glow}33`, color: char.glow }}
                    >
                      {char.name.charAt(0) || '?'}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-[var(--color-text)]">{char.name}</p>
                      <p className="text-xs text-[var(--color-text-secondary)]">
                        {char.role}{char.age ? ` · ${char.age}세` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* SVG relationship preview */}
            {relationships.length > 0 && (
              <div>
                <p className={labelClass}>관계 미리보기</p>
                <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface)] p-4">
                  <RelationshipGraph characters={characters} relationships={relationships} />
                </div>
              </div>
            )}

            {relationships.length === 0 && (
              <div className="rounded-xl border border-white/[0.04] bg-[var(--color-surface)] p-4">
                <RelationshipGraph characters={characters} relationships={relationships} />
                <p className="text-xs text-center text-[var(--color-text-dim)] mt-2">정의된 관계가 없습니다.</p>
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
              onClick={() => { setError(''); setStep(s => s - 1); }}
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
              style={{ background: 'linear-gradient(135deg, #ff6b9d, #a855f7)' }}
            >
              다음
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={submitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: 'linear-gradient(135deg, #ff6b9d, #a855f7)' }}
            >
              {submitting ? '생성 중...' : '월드 만들기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
