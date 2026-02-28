'use client';

import { useState } from 'react';
import Link from 'next/link';

const COLOR_PRESETS = [
  { label: '핑크', value: '#ff6b9d' },
  { label: '퍼플', value: '#a855f7' },
  { label: '블루', value: '#3b82f6' },
  { label: '그린', value: '#22c55e' },
  { label: '레드', value: '#ef4444' },
  { label: '앰버', value: '#f59e0b' },
];

interface FormState {
  name: string;
  fullName: string;
  age: number;
  role: string;
  desc: string;
  personality: string;
  speakingStyle: string;
  tags: string[];
  isPublic: boolean;
  isAdult: boolean;
  glow: string;
}

export default function CharacterWizard() {
  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    name: '', fullName: '', age: 20, role: '', desc: '',
    personality: '', speakingStyle: '', tags: [] as string[],
    isPublic: true, isAdult: false, glow: '#a855f7',
  });
  const [tagInput, setTagInput] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState('');

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm(prev => ({ ...prev, [key]: value }));
  }

  function handleTagInputKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === ',' || e.key === 'Enter') {
      e.preventDefault();
      addTagFromInput();
    }
  }

  function addTagFromInput() {
    const trimmed = tagInput.trim().replace(/,$/, '');
    if (trimmed && !form.tags.includes(trimmed)) {
      set('tags', [...form.tags, trimmed]);
    }
    setTagInput('');
  }

  function removeTag(tag: string) {
    set('tags', form.tags.filter(t => t !== tag));
  }

  function validateStep(): string | null {
    if (step === 1) {
      if (!form.name.trim()) return '표시 이름을 입력해주세요.';
      if (!form.fullName.trim()) return '전체 이름을 입력해주세요.';
      if (!form.role.trim()) return '역할을 입력해주세요.';
    }
    if (step === 2) {
      if (!form.personality.trim()) return '성격 프롬프트를 입력해주세요.';
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
      const res = await fetch('/api/character', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json() as { ok: boolean; error?: string };
      if (!data.ok) throw new Error(data.error || '알 수 없는 오류');
      setDone(true);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '서버 오류가 발생했습니다.');
    } finally {
      setSubmitting(false);
    }
  }

  const inputClass =
    'w-full bg-[var(--color-surface-2)] border border-white/[0.06] rounded-xl px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-dim)] outline-none focus:border-white/20 transition-colors';
  const labelClass = 'block text-sm font-medium text-[var(--color-text-secondary)] mb-1.5';

  if (done) {
    return (
      <div className="min-h-screen bg-[#08080d] flex items-center justify-center px-4">
        <div className="max-w-[480px] w-full text-center space-y-6">
          <div
            className="w-20 h-20 rounded-full mx-auto flex items-center justify-center text-3xl"
            style={{ background: `${form.glow}22`, border: `2px solid ${form.glow}66` }}
          >
            {form.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-[var(--color-text)] mb-2">
              {form.name} 생성 완료!
            </h2>
            <p className="text-[var(--color-text-secondary)] text-sm">
              캐릭터가 성공적으로 만들어졌습니다.
            </p>
          </div>
          <Link
            href="/"
            className="inline-block px-6 py-3 rounded-xl text-sm font-semibold text-white"
            style={{ background: 'linear-gradient(135deg, #ff6b9d, #a855f7)' }}
          >
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#08080d] flex flex-col items-center px-4 py-8">
      <div className="max-w-[480px] w-full space-y-6">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-[var(--color-text)]">캐릭터 만들기</h1>
          <p className="text-sm text-[var(--color-text-secondary)]">나만의 AI 캐릭터를 생성하세요</p>
        </div>

        {/* Step indicator */}
        <div className="space-y-2">
          <div className="flex justify-between text-xs text-[var(--color-text-secondary)]">
            <span>단계 {step} / 3</span>
            <span>{step === 1 ? '기본 정보' : step === 2 ? '성격 설정' : '외형 + 확인'}</span>
          </div>
          <div className="h-1.5 bg-[var(--color-surface-2)] rounded-full overflow-hidden">
            <div
              className="h-full rounded-full transition-all duration-300"
              style={{
                width: `${(step / 3) * 100}%`,
                background: 'linear-gradient(90deg, #ff6b9d, #a855f7)',
              }}
            />
          </div>
        </div>

        {/* Step 1: 기본 정보 */}
        {step === 1 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>표시 이름 *</label>
              <input
                className={inputClass}
                placeholder="예: 유리"
                value={form.name}
                onChange={e => set('name', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>전체 이름 *</label>
              <input
                className={inputClass}
                placeholder="예: 김유리"
                value={form.fullName}
                onChange={e => set('fullName', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>나이</label>
              <input
                className={inputClass}
                type="number"
                min={1}
                max={999}
                placeholder="20"
                value={form.age}
                onChange={e => set('age', Number(e.target.value))}
              />
            </div>
            <div>
              <label className={labelClass}>역할 *</label>
              <input
                className={inputClass}
                placeholder="예: 카페 바리스타"
                value={form.role}
                onChange={e => set('role', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>캐릭터 설명</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="캐릭터를 2-3문장으로 소개해주세요."
                value={form.desc}
                onChange={e => set('desc', e.target.value)}
              />
            </div>
          </div>
        )}

        {/* Step 2: 성격 설정 */}
        {step === 2 && (
          <div className="space-y-4">
            <div>
              <label className={labelClass}>성격 프롬프트 *</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={4}
                placeholder="예: 따뜻하고 공감 능력이 뛰어난 성격. 상대방의 감정을 잘 읽고 위로를 건넨다."
                value={form.personality}
                onChange={e => set('personality', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>말투 예시</label>
              <textarea
                className={`${inputClass} resize-none`}
                rows={3}
                placeholder="예: 오늘 하루 어떠셨어요? 저는 항상 여기 있을게요."
                value={form.speakingStyle}
                onChange={e => set('speakingStyle', e.target.value)}
              />
            </div>
            <div>
              <label className={labelClass}>태그</label>
              <input
                className={inputClass}
                placeholder="태그 입력 후 쉼표 또는 Enter"
                value={tagInput}
                onChange={e => setTagInput(e.target.value)}
                onKeyDown={handleTagInputKeyDown}
                onBlur={addTagFromInput}
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
          </div>
        )}

        {/* Step 3: 외형 + 확인 */}
        {step === 3 && (
          <div className="space-y-6">
            <div>
              <label className={labelClass}>테마 색상</label>
              <div className="flex gap-3 mt-1">
                {COLOR_PRESETS.map(preset => (
                  <button
                    key={preset.value}
                    type="button"
                    title={preset.label}
                    onClick={() => set('glow', preset.value)}
                    className="w-9 h-9 rounded-full transition-transform hover:scale-110"
                    style={{
                      background: preset.value,
                      outline: form.glow === preset.value ? `3px solid ${preset.value}` : '3px solid transparent',
                      outlineOffset: '2px',
                    }}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  role="checkbox"
                  aria-checked={form.isPublic}
                  onClick={() => set('isPublic', !form.isPublic)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isPublic ? 'bg-purple-500' : 'bg-[var(--color-surface-3)]'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isPublic ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">공개 캐릭터로 설정</span>
              </label>

              <label className="flex items-center gap-3 cursor-pointer">
                <div
                  role="checkbox"
                  aria-checked={form.isAdult}
                  onClick={() => set('isAdult', !form.isAdult)}
                  className={`w-10 h-6 rounded-full transition-colors relative ${form.isAdult ? 'bg-red-500' : 'bg-[var(--color-surface-3)]'}`}
                >
                  <span
                    className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isAdult ? 'translate-x-5' : 'translate-x-1'}`}
                  />
                </div>
                <span className="text-sm text-[var(--color-text-secondary)]">성인 콘텐츠 포함</span>
              </label>
            </div>

            {/* Summary */}
            <div className="rounded-xl border border-white/[0.06] bg-[var(--color-surface)] p-4 space-y-2">
              <div className="flex items-center gap-3 mb-3">
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center text-lg font-bold"
                  style={{ background: `${form.glow}33`, color: form.glow }}
                >
                  {form.name.charAt(0) || '?'}
                </div>
                <div>
                  <p className="text-sm font-semibold text-[var(--color-text)]">{form.name || '이름 없음'}</p>
                  <p className="text-xs text-[var(--color-text-secondary)]">{form.fullName} · {form.age}세 · {form.role || '역할 없음'}</p>
                </div>
              </div>
              {form.desc && (
                <p className="text-xs text-[var(--color-text-secondary)] leading-relaxed">{form.desc}</p>
              )}
              {form.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {form.tags.map(tag => (
                    <span
                      key={tag}
                      className="px-2 py-0.5 rounded-full text-xs"
                      style={{ background: `${form.glow}22`, color: form.glow }}
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <p className="text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-2.5">
            {error}
          </p>
        )}

        {/* Actions */}
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
          {step < 3 ? (
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
              {submitting ? '생성 중...' : '캐릭터 만들기'}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
