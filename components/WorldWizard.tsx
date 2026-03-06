'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Plus, UserCheck } from 'lucide-react';
import { PageLayout } from '@/components/layout';
import type { UserWorldRelationship } from '@/lib/types';
import { Switch } from '@/components/ui/switch';
import { useUserCharacters } from '@/hooks/useUserCharacters';

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
  const preset = SPEAKING_PRESETS.find((p) => p.key === char.speakingPreset);
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
          <span className="w-16 shrink-0 text-right text-xs text-[var(--color-text-secondary)]">
            {left}
          </span>
          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={big5[key]}
            onChange={(e) => onChange(key, Number(e.target.value))}
            aria-label={`${left} ↔ ${right}`}
            className="flex-1 accent-purple-500"
          />
          <span className="w-16 shrink-0 text-xs text-[var(--color-text-secondary)]">{right}</span>
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
      {SPEAKING_PRESETS.map((p) => (
        <button
          key={p.key}
          type="button"
          onClick={() => onChange(p.key)}
          className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
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
      {relationships.map((rel) => {
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

// ---- Step sub-components ----

const inputClass =
  'w-full bg-[var(--color-surface-2)] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-white/20 transition-colors';
const labelClass = 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5';

function Step1Content({
  form,
  setForm,
}: {
  form: WizardForm;
  setForm: React.Dispatch<React.SetStateAction<WizardForm>>;
}) {
  return (
    <div className="space-y-5">
      <div>
        <label className={labelClass}>어떤 이야기? *</label>
        <textarea
          className={`${inputClass} resize-none`}
          rows={5}
          placeholder="예: 달빛 아카데미에서 벌어지는 마법사들의 이야기. 경쟁과 우정, 숨겨진 비밀이 얽혀 있다."
          value={form.situation}
          onChange={(e) => setForm((prev) => ({ ...prev, situation: e.target.value }))}
          autoFocus
        />
        <p className="mt-1.5 text-xs text-[var(--color-text-dim)]">
          상황, 배경, 분위기를 자유롭게 설명하세요. 이것이 월드의 핵심이 됩니다.
        </p>
      </div>

      <label className="flex cursor-pointer items-center gap-3">
        <Switch
          checked={form.isAdult}
          onCheckedChange={(checked) => setForm((prev) => ({ ...prev, isAdult: checked }))}
        />
        <span className="text-sm text-[var(--color-text-secondary)]">성인 콘텐츠 포함</span>
      </label>
    </div>
  );
}

function CharacterCard({
  char,
  idx,
  collapsed,
  canRemove,
  onToggleCollapse,
  onRemove,
  onUpdateChar,
  onUpdateCharBig5,
}: {
  char: WizardCharacter;
  idx: number;
  collapsed: boolean;
  canRemove: boolean;
  onToggleCollapse: () => void;
  onRemove: () => void;
  onUpdateChar: (patch: Partial<WizardCharacter>) => void;
  onUpdateCharBig5: (key: keyof Big5, v: number) => void;
}) {
  return (
    <div className="overflow-hidden rounded-xl border border-white/[0.06] bg-[var(--color-surface)]">
      {/* Card header */}
      <div className="flex items-center gap-3 px-4 py-3">
        <div
          className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-sm font-bold"
          style={{ background: `${char.glow}33`, color: char.glow }}
        >
          {char.name.charAt(0) || idx + 1}
        </div>
        <span className="flex-1 text-sm font-medium text-[var(--color-text)]">
          {char.name || `캐릭터 ${idx + 1}`}
        </span>
        <div className="flex items-center gap-2">
          {canRemove && (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs text-red-400 transition-colors hover:text-red-300"
            >
              삭제
            </button>
          )}
          <button
            type="button"
            onClick={onToggleCollapse}
            className="px-2 text-xs text-[var(--color-text-secondary)] transition-colors hover:text-[var(--color-text)]"
          >
            {collapsed ? '펼치기' : '접기'}
          </button>
        </div>
      </div>

      {/* Card body */}
      {!collapsed && (
        <div className="space-y-4 border-t border-white/[0.04] px-4 pb-4">
          {/* Name + Full Name */}
          <div className="grid grid-cols-2 gap-3 pt-3">
            <div>
              <label className={labelClass}>표시 이름 *</label>
              <input
                className={inputClass}
                placeholder="예: 유리"
                value={char.name}
                onChange={(e) => onUpdateChar({ name: e.target.value })}
              />
            </div>
            <div>
              <label className={labelClass}>전체 이름</label>
              <input
                className={inputClass}
                placeholder="예: 김유리"
                value={char.fullName}
                onChange={(e) => onUpdateChar({ fullName: e.target.value })}
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
                onChange={(e) => onUpdateChar({ age: Number(e.target.value) })}
              />
            </div>
            <div>
              <label className={labelClass}>역할 *</label>
              <input
                className={inputClass}
                placeholder="예: 마법사"
                value={char.role}
                onChange={(e) => onUpdateChar({ role: e.target.value })}
              />
            </div>
          </div>

          {/* Big5 personality sliders */}
          <div>
            <label className={labelClass}>성격 (Big5)</label>
            <Big5Sliders big5={char.big5} onChange={onUpdateCharBig5} />
          </div>

          {/* Speaking style presets */}
          <div>
            <label className={labelClass}>말투</label>
            <SpeakingPresetButtons
              preset={char.speakingPreset}
              onChange={(p) => onUpdateChar({ speakingPreset: p })}
            />
            {char.speakingPreset === 'custom' && (
              <textarea
                className={`${inputClass} mt-2 resize-none`}
                rows={2}
                placeholder="예: 오늘 하루 어떠셨어요? (말투 예시를 입력하세요)"
                value={char.speakingStyle}
                onChange={(e) => onUpdateChar({ speakingStyle: e.target.value })}
              />
            )}
          </div>

          {/* Theme color */}
          <div>
            <label className={labelClass}>테마 색상</label>
            <div className="mt-1 flex gap-2">
              {COLOR_PRESETS.map((preset) => (
                <button
                  key={preset.value}
                  type="button"
                  title={preset.label}
                  onClick={() => onUpdateChar({ glow: preset.value })}
                  className="h-7 w-7 rounded-full transition-transform hover:scale-110"
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
  );
}

function Step2Content({
  characters,
  collapsed,
  myCharacters,
  myCharsLoading,
  onAddCharacter,
  onRemoveCharacter,
  onToggleCollapse,
  onUpdateChar,
  onUpdateCharBig5,
  onAddMyCharacter,
}: {
  characters: WizardCharacter[];
  collapsed: Record<string, boolean>;
  myCharacters: ReturnType<typeof useUserCharacters>['characters'];
  myCharsLoading: boolean;
  onAddCharacter: () => void;
  onRemoveCharacter: (id: string) => void;
  onToggleCollapse: (id: string) => void;
  onUpdateChar: (id: string, patch: Partial<WizardCharacter>) => void;
  onUpdateCharBig5: (id: string, key: keyof Big5, v: number) => void;
  onAddMyCharacter: (mc: ReturnType<typeof useUserCharacters>['characters'][number]) => void;
}) {
  return (
    <div className="space-y-4">
      {/* My characters pick section */}
      {!myCharsLoading && myCharacters.length > 0 && (
        <div>
          <p className="mb-2 text-sm font-medium text-[var(--color-text-secondary)]">
            내 캐릭터에서 추가
          </p>
          <div className="flex flex-wrap gap-2">
            {myCharacters.map((mc) => {
              const alreadyAdded = characters.some(
                (c) =>
                  (c as WizardCharacter & { sourceCharacterId?: string }).sourceCharacterId ===
                  mc.id,
              );
              return (
                <button
                  key={mc.id}
                  type="button"
                  disabled={alreadyAdded}
                  onClick={() => onAddMyCharacter(mc)}
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-medium transition-colors disabled:opacity-40"
                  style={{
                    background: alreadyAdded ? 'var(--color-surface-2)' : `${mc.glow}15`,
                    border: `1px solid ${alreadyAdded ? 'transparent' : mc.glow + '33'}`,
                    color: alreadyAdded ? 'var(--color-text-dim)' : mc.glow,
                  }}
                >
                  {alreadyAdded ? (
                    <UserCheck className="h-3.5 w-3.5" />
                  ) : (
                    <Plus className="h-3.5 w-3.5" />
                  )}
                  {mc.name}
                </button>
              );
            })}
          </div>
        </div>
      )}

      <p className="text-sm text-[var(--color-text-secondary)]">
        {myCharacters.length > 0
          ? '추가한 캐릭터를 편집하거나, 직접 새 캐릭터를 만들 수도 있습니다.'
          : '캐릭터의 성격을 Big5 슬라이더로 설정하세요. World SDK가 이 값을 바탕으로 살아있는 페르소나를 구성합니다.'}
      </p>

      {characters.map((char, idx) => (
        <CharacterCard
          key={char.id}
          char={char}
          idx={idx}
          collapsed={!!collapsed[char.id]}
          canRemove={characters.length > 1}
          onToggleCollapse={() => onToggleCollapse(char.id)}
          onRemove={() => onRemoveCharacter(char.id)}
          onUpdateChar={(patch) => onUpdateChar(char.id, patch)}
          onUpdateCharBig5={(key, v) => onUpdateCharBig5(char.id, key, v)}
        />
      ))}

      <button
        type="button"
        onClick={onAddCharacter}
        className="w-full rounded-xl border border-dashed border-white/[0.12] py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:border-white/20 hover:text-[var(--color-text)]"
      >
        + 직접 만들기
      </button>
    </div>
  );
}

function RelationshipPair({
  a,
  b,
  rel,
  onAdd,
  onRemove,
  onUpdate,
}: {
  a: WizardCharacter;
  b: WizardCharacter;
  rel: UserWorldRelationship | undefined;
  onAdd: () => void;
  onRemove: () => void;
  onUpdate: (patch: Partial<UserWorldRelationship>) => void;
}) {
  return (
    <div className="space-y-3 rounded-xl border border-white/[0.06] bg-[var(--color-surface)] p-4">
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
            onClick={onRemove}
            className="text-xs text-red-400 transition-colors hover:text-red-300"
          >
            관계 삭제
          </button>
        ) : (
          <button
            type="button"
            onClick={onAdd}
            className="text-xs text-purple-400 transition-colors hover:text-purple-300"
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
            <div className="mb-2 flex flex-wrap gap-2">
              {RELATIONSHIP_TYPE_PRESETS.map((type) => (
                <button
                  key={type}
                  type="button"
                  onClick={() => onUpdate({ relationshipType: type })}
                  className="rounded-full px-3 py-1 text-xs font-medium transition-colors"
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
              onChange={(e) => onUpdate({ relationshipType: e.target.value })}
            />
          </div>

          {/* Strength slider */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>관계 강도</span>
              <span>{Math.round(rel.strength * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={rel.strength}
              onChange={(e) => onUpdate({ strength: Number(e.target.value) })}
              aria-label="관계 강도"
              className="w-full accent-purple-500"
            />
          </div>

          {/* Trust slider */}
          <div>
            <div className="mb-1 flex justify-between text-xs text-[var(--color-text-secondary)]">
              <span>신뢰도</span>
              <span>{Math.round(rel.trust * 100)}%</span>
            </div>
            <input
              type="range"
              min={0}
              max={1}
              step={0.01}
              value={rel.trust}
              onChange={(e) => onUpdate({ trust: Number(e.target.value) })}
              aria-label="신뢰도"
              className="w-full accent-purple-500"
            />
          </div>
        </div>
      )}
    </div>
  );
}

function Step3Content({
  pairs,
  characters,
  relationships,
  getRelationship,
  onAddRelationship,
  onRemoveRelationship,
  onUpdateRelationship,
}: {
  pairs: [WizardCharacter, WizardCharacter][];
  characters: WizardCharacter[];
  relationships: UserWorldRelationship[];
  getRelationship: (sid: string, tid: string) => UserWorldRelationship | undefined;
  onAddRelationship: (sid: string, tid: string) => void;
  onRemoveRelationship: (sid: string, tid: string) => void;
  onUpdateRelationship: (sid: string, tid: string, patch: Partial<UserWorldRelationship>) => void;
}) {
  return (
    <div className="space-y-4">
      <p className="text-sm text-[var(--color-text-secondary)]">
        캐릭터 간의 관계를 선택적으로 정의하세요. 관계를 추가하지 않아도 됩니다.
      </p>

      {pairs.map(([a, b]) => (
        <RelationshipPair
          key={`${a.id}-${b.id}`}
          a={a}
          b={b}
          rel={getRelationship(a.id, b.id)}
          onAdd={() => onAddRelationship(a.id, b.id)}
          onRemove={() => onRemoveRelationship(a.id, b.id)}
          onUpdate={(patch) => onUpdateRelationship(a.id, b.id, patch)}
        />
      ))}

      {pairs.length === 0 && (
        <p className="py-4 text-center text-sm text-[var(--color-text-dim)]">
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
              <p className="mt-2 text-center text-xs text-[var(--color-text-dim)]">
                정의된 관계가 없습니다.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

function WizardDoneScreen({
  form,
  newWorldId,
}: {
  form: WizardForm;
  newWorldId: string;
  characters: WizardCharacter[];
  themeColor: string;
}) {
  return (
    <PageLayout width="md" className="flex items-center justify-center">
      <div className="space-y-6 text-center">
        <div>
          <h2 className="mb-2 text-2xl font-bold text-[var(--color-text)]">월드 생성 완료!</h2>
          <p className="text-sm text-[var(--color-text-secondary)]">
            월드가 성공적으로 만들어졌습니다.
          </p>
        </div>
        <div className="flex justify-center gap-3">
          {newWorldId && (
            <Link
              href="/my"
              className="inline-block rounded-xl px-6 py-3 text-sm font-semibold text-white"
              style={{ background: 'var(--color-brand-gradient)' }}
            >
              내 월드 보기
            </Link>
          )}
          <Link
            href="/"
            className="inline-block rounded-xl bg-[var(--color-surface-2)] px-6 py-3 text-sm font-semibold text-[var(--color-text-secondary)]"
          >
            홈으로
          </Link>
        </div>
        {form.situation && (
          <div
            className="mx-auto flex h-20 w-20 items-center justify-center rounded-full text-3xl"
            style={{ background: '#a855f722', border: '2px solid #a855f766' }}
          >
            {form.situation.charAt(0)}
          </div>
        )}
      </div>
    </PageLayout>
  );
}

// ---- Module-level helpers (keep complexity out of component) ----

function validateWizardStep(
  step: number,
  form: WizardForm,
  characters: WizardCharacter[],
): string | null {
  if (step === 1 && !form.situation.trim()) return '어떤 이야기인지 설명해주세요.';
  if (step === 2) {
    for (const c of characters) {
      if (!c.name.trim()) return '모든 캐릭터의 이름을 입력해주세요.';
      if (!c.role.trim()) return '모든 캐릭터의 역할을 입력해주세요.';
    }
  }
  return null;
}

function buildCharacterPairs(characters: WizardCharacter[]): [WizardCharacter, WizardCharacter][] {
  const pairs: [WizardCharacter, WizardCharacter][] = [];
  for (let i = 0; i < characters.length; i++) {
    for (let j = i + 1; j < characters.length; j++) {
      pairs.push([characters[i], characters[j]]);
    }
  }
  return pairs;
}

function buildWorldPayload(
  form: WizardForm,
  characters: WizardCharacter[],
  relationships: UserWorldRelationship[],
) {
  const themeColor = characters[0]?.glow ?? '#a855f7';
  return {
    name: form.situation.slice(0, 30),
    description: form.situation,
    lore: '',
    tags: [],
    themeColor,
    isAdult: form.isAdult,
    characters: characters.map((c) => ({
      ...c,
      speakingStyle: resolvedSpeakingStyle(c),
      personality: `Big5: E=${c.big5.E} N=${c.big5.N} C=${c.big5.C} A=${c.big5.A} O=${c.big5.O}. ${c.personality}`,
    })),
    relationships,
    isPublic: true,
  };
}

function findRelationship(
  relationships: UserWorldRelationship[],
  sourceId: string,
  targetId: string,
): UserWorldRelationship | undefined {
  return relationships.find(
    (r) =>
      (r.sourceId === sourceId && r.targetId === targetId) ||
      (r.sourceId === targetId && r.targetId === sourceId),
  );
}

function makeCharacterFromMy(
  mc: ReturnType<typeof useUserCharacters>['characters'][number],
): WizardCharacter & { sourceCharacterId?: string } {
  return {
    id: makeId(),
    name: mc.name,
    fullName: mc.fullName,
    age: mc.age,
    role: mc.role,
    desc: mc.desc,
    personality: mc.personality,
    speakingStyle: mc.speakingStyle,
    glow: mc.glow,
    big5: defaultBig5(),
    speakingPreset: 'custom',
    sourceCharacterId: mc.id,
  };
}

// ---- Wizard UI helpers ----

function WizardStepIndicator({ step, totalSteps }: { step: number; totalSteps: number }) {
  return (
    <div className="space-y-2">
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
        <span>
          단계 {step} / {totalSteps}
        </span>
        <span>{stepLabels[step - 1]}</span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-[var(--color-surface-2)]">
        <div
          className="h-full rounded-full transition-all duration-300"
          style={{
            width: `${(step / totalSteps) * 100}%`,
            background: 'var(--color-brand-gradient)',
          }}
        />
      </div>
      <div className="mt-1 flex justify-between">
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
  );
}

function WizardNavButtons({
  step,
  totalSteps,
  submitting,
  onPrev,
  onNext,
  onSubmit,
}: {
  step: number;
  totalSteps: number;
  submitting: boolean;
  onPrev: () => void;
  onNext: () => void;
  onSubmit: () => void;
}) {
  return (
    <div className="flex gap-3">
      {step > 1 && (
        <button
          type="button"
          onClick={onPrev}
          className="flex-1 rounded-xl bg-[var(--color-surface-2)] py-3 text-sm font-semibold text-[var(--color-text-secondary)] transition-colors hover:bg-[var(--color-surface-3)]"
        >
          이전
        </button>
      )}
      {step < totalSteps ? (
        <button
          type="button"
          onClick={onNext}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90"
          style={{ background: 'var(--color-brand-gradient)' }}
        >
          다음
        </button>
      ) : (
        <button
          type="button"
          onClick={onSubmit}
          disabled={submitting}
          className="flex-1 rounded-xl py-3 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-50"
          style={{ background: 'var(--color-brand-gradient)' }}
        >
          {submitting ? '생성 중...' : '월드 만들기'}
        </button>
      )}
    </div>
  );
}

// ---- Custom hook: all wizard state ----

function useWorldWizard() {
  const TOTAL_STEPS = 3;
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<WizardForm>({ situation: '', isAdult: false });
  const [characters, setCharacters] = useState<WizardCharacter[]>([emptyCharacter()]);
  const [collapsed, setCollapsed] = useState<Record<string, boolean>>({});
  const [relationships, setRelationships] = useState<UserWorldRelationship[]>([]);
  const { characters: myCharacters, loading: myCharsLoading } = useUserCharacters();
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [newWorldId, setNewWorldId] = useState('');
  const [error, setError] = useState('');

  const updateChar = (id: string, patch: Partial<WizardCharacter>) =>
    setCharacters((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)));

  const updateCharBig5 = (id: string, key: keyof Big5, v: number) =>
    setCharacters((prev) =>
      prev.map((c) => (c.id === id ? { ...c, big5: { ...c.big5, [key]: v } } : c)),
    );

  const addCharacter = () => setCharacters((prev) => [...prev, emptyCharacter()]);

  const removeCharacter = (id: string) => {
    setCharacters((prev) => prev.filter((c) => c.id !== id));
    setRelationships((prev) => prev.filter((r) => r.sourceId !== id && r.targetId !== id));
  };

  const toggleCollapse = (id: string) => setCollapsed((prev) => ({ ...prev, [id]: !prev[id] }));

  const addMyCharacter = (mc: ReturnType<typeof useUserCharacters>['characters'][number]) =>
    setCharacters((prev) => [...prev, makeCharacterFromMy(mc)]);

  const getRelationship = (sourceId: string, targetId: string) =>
    findRelationship(relationships, sourceId, targetId);

  const addRelationship = (sourceId: string, targetId: string) => {
    if (findRelationship(relationships, sourceId, targetId)) return;
    setRelationships((prev) => [
      ...prev,
      { sourceId, targetId, relationshipType: '', strength: 0.5, trust: 0.5 },
    ]);
  };

  const removeRelationship = (sourceId: string, targetId: string) =>
    setRelationships((prev) => prev.filter((r) => !findRelationship([r], sourceId, targetId)));

  const updateRelationship = (
    sourceId: string,
    targetId: string,
    patch: Partial<UserWorldRelationship>,
  ) =>
    setRelationships((prev) =>
      prev.map((r) => (findRelationship([r], sourceId, targetId) ? { ...r, ...patch } : r)),
    );

  const handleNext = () => {
    const err = validateWizardStep(step, form, characters);
    if (err) {
      setError(err);
      return;
    }
    setError('');
    setStep((s) => s + 1);
  };

  const handlePrev = () => {
    setError('');
    setStep((s) => s - 1);
  };

  const handleSubmit = async () => {
    setSubmitting(true);
    setError('');
    try {
      const payload = buildWorldPayload(form, characters, relationships);
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
  };

  return {
    TOTAL_STEPS,
    step,
    form,
    setForm,
    characters,
    collapsed,
    relationships,
    myCharacters,
    myCharsLoading,
    submitting,
    done,
    newWorldId,
    error,
    updateChar,
    updateCharBig5,
    addCharacter,
    removeCharacter,
    toggleCollapse,
    addMyCharacter,
    getRelationship,
    addRelationship,
    removeRelationship,
    updateRelationship,
    handleNext,
    handlePrev,
    handleSubmit,
  };
}

// ---- Main component ----

export default function WorldWizard() {
  const w = useWorldWizard();
  const pairs = buildCharacterPairs(w.characters);

  if (w.done) {
    return (
      <WizardDoneScreen
        form={w.form}
        newWorldId={w.newWorldId}
        characters={w.characters}
        themeColor={w.characters[0]?.glow ?? '#a855f7'}
      />
    );
  }

  return (
    <PageLayout
      title="월드 만들기"
      subtitle="나만의 AI 스토리 월드를 생성하세요"
      width="md"
      showBackButton
      backHref="/create"
    >
      <div className="space-y-6">
        <WizardStepIndicator step={w.step} totalSteps={w.TOTAL_STEPS} />

        {w.step === 1 && <Step1Content form={w.form} setForm={w.setForm} />}
        {w.step === 2 && (
          <Step2Content
            characters={w.characters}
            collapsed={w.collapsed}
            myCharacters={w.myCharacters}
            myCharsLoading={w.myCharsLoading}
            onAddCharacter={w.addCharacter}
            onRemoveCharacter={w.removeCharacter}
            onToggleCollapse={w.toggleCollapse}
            onUpdateChar={w.updateChar}
            onUpdateCharBig5={w.updateCharBig5}
            onAddMyCharacter={w.addMyCharacter}
          />
        )}
        {w.step === 3 && (
          <Step3Content
            pairs={pairs}
            characters={w.characters}
            relationships={w.relationships}
            getRelationship={w.getRelationship}
            onAddRelationship={w.addRelationship}
            onRemoveRelationship={w.removeRelationship}
            onUpdateRelationship={w.updateRelationship}
          />
        )}

        {w.error && (
          <p className="rounded-xl border border-red-500/20 bg-red-500/10 px-4 py-2.5 text-sm text-red-400">
            {w.error}
          </p>
        )}

        <WizardNavButtons
          step={w.step}
          totalSteps={w.TOTAL_STEPS}
          submitting={w.submitting}
          onPrev={w.handlePrev}
          onNext={w.handleNext}
          onSubmit={w.handleSubmit}
        />
      </div>
    </PageLayout>
  );
}
