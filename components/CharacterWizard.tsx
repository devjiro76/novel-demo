'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useIsDesktop } from '@/hooks/useMediaQuery';
import { ChevronLeft, Check, Sparkles } from 'lucide-react';

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
  const isDesktop = useIsDesktop();
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

  const inputClass = `
    w-full bg-[var(--color-surface)] border border-white/[0.06] rounded-xl 
    px-4 py-3 text-sm text-[var(--color-text)] placeholder:text-[var(--color-text-muted)] 
    outline-none focus:border-[var(--color-brand-primary)]/30 transition-all
  `;
  const labelClass = 'block text-sm font-medium text-[var(--color-text-secondary)] mb-2';

  // Success Screen
  if (done) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="max-w-md w-full text-center space-y-6 animate-scale-in">
          <div
            className="w-24 h-24 rounded-full mx-auto flex items-center justify-center text-4xl"
            style={{ 
              background: `${form.glow}22`, 
              border: `3px solid ${form.glow}`,
              boxShadow: `0 0 40px ${form.glow}33`,
            }}
          >
            {form.name.charAt(0)}
          </div>
          <div>
            <h2 className="text-2xl font-bold text-gradient mb-2">
              {form.name} 생성 완료!
            </h2>
            <p className="text-[var(--color-text-secondary)]">
              캐릭터가 성공적으로 만들어졌습니다.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-2 px-8 py-3 rounded-xl text-sm font-semibold text-white transition-all hover:scale-105"
            style={{ background: 'var(--color-brand-gradient)' }}
          >
            <Sparkles className="w-4 h-4" />
            홈으로
          </Link>
        </div>
      </div>
    );
  }

  const header = (
    <div className="mb-6">
      {isDesktop ? (
        <>
          <h1 className="text-3xl font-black text-gradient">캐릭터 만들기</h1>
          <p className="text-[var(--color-text-secondary)] mt-2">나만의 AI 캐릭터를 생성하세요</p>
        </>
      ) : (
        <>
          <Link href="/" className="text-[10px] text-[var(--color-text-dim)] flex items-center gap-1 mb-2">
            <ChevronLeft className="w-3 h-3" /> 홈
          </Link>
          <h1 className="text-2xl font-bold">캐릭터 만들기</h1>
          <p className="text-[11px] text-[var(--color-text-dim)] mt-1">나만의 AI 캐릭터를 생성하세요</p>
        </>
      )}
    </div>
  );

  const stepIndicator = (
    <div className="mb-8">
      <div className="flex justify-between text-xs text-[var(--color-text-secondary)] mb-2">
        <span>단계 {step} / 3</span>
        <span>{step === 1 ? '기본 정보' : step === 2 ? '성격 설정' : '외형 + 확인'}</span>
      </div>
      <div className="h-2 bg-[var(--color-surface)] rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-500"
          style={{
            width: `${(step / 3) * 100}%`,
            background: 'var(--color-brand-gradient)',
          }}
        />
      </div>
    </div>
  );

  const step1Content = (
    <div className="space-y-5">
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
  );

  const step2Content = (
    <div className="space-y-5">
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
          <div className="flex flex-wrap gap-2 mt-3">
            {form.tags.map(tag => (
              <button
                key={tag}
                type="button"
                onClick={() => removeTag(tag)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-colors"
                style={{ 
                  background: 'var(--color-surface-2)',
                  color: 'var(--color-text-secondary)',
                }}
              >
                {tag}
                <span className="text-[var(--color-text-dim)] ml-0.5">×</span>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const step3Content = (
    <div className="space-y-6">
      <div>
        <label className={labelClass}>테마 색상</label>
        <div className="flex gap-3 mt-2">
          {COLOR_PRESETS.map(preset => (
            <button
              key={preset.value}
              type="button"
              title={preset.label}
              onClick={() => set('glow', preset.value)}
              className="w-10 h-10 rounded-full transition-transform hover:scale-110"
              style={{
                background: preset.value,
                outline: form.glow === preset.value ? `3px solid ${preset.value}` : '3px solid transparent',
                outlineOffset: '2px',
              }}
            >
              {form.glow === preset.value && (
                <Check className="w-5 h-5 text-white mx-auto" />
              )}
            </button>
          ))}
        </div>
      </div>

      <div className="flex flex-col gap-4">
        <label className="flex items-center gap-3 cursor-pointer">
          <div
            role="checkbox"
            aria-checked={form.isPublic}
            onClick={() => set('isPublic', !form.isPublic)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.isPublic ? 'bg-[var(--color-brand-primary)]' : 'bg-[var(--color-surface-2)]'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isPublic ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </div>
          <span className="text-sm text-[var(--color-text-secondary)]">공개 캐릭터로 설정</span>
        </label>

        <label className="flex items-center gap-3 cursor-pointer">
          <div
            role="checkbox"
            aria-checked={form.isAdult}
            onClick={() => set('isAdult', !form.isAdult)}
            className={`w-11 h-6 rounded-full transition-colors relative ${form.isAdult ? 'bg-red-500' : 'bg-[var(--color-surface-2)]'}`}
          >
            <span
              className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${form.isAdult ? 'translate-x-6' : 'translate-x-1'}`}
            />
          </div>
          <span className="text-sm text-[var(--color-text-secondary)]">성인 콘텐츠 포함</span>
        </label>
      </div>

      {/* Summary Card */}
      <div 
        className="rounded-xl p-5 space-y-3"
        style={{
          background: 'var(--color-surface)',
          border: `1px solid ${form.glow}33`,
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-12 h-12 rounded-xl flex items-center justify-center text-xl font-bold"
            style={{ background: `${form.glow}33`, color: form.glow }}
          >
            {form.name.charAt(0) || '?'}
          </div>
          <div>
            <p className="font-semibold">{form.name || '이름 없음'}</p>
            <p className="text-sm text-[var(--color-text-muted)]">{form.fullName} · {form.age}세 · {form.role || '역할 없음'}</p>
          </div>
        </div>
        {form.desc && (
          <p className="text-sm text-[var(--color-text-secondary)] leading-relaxed">{form.desc}</p>
        )}
        {form.tags.length > 0 && (
          <div className="flex flex-wrap gap-1.5 pt-1">
            {form.tags.map(tag => (
              <span
                key={tag}
                className="px-2.5 py-1 rounded-full text-xs"
                style={{ background: `${form.glow}22`, color: form.glow }}
              >
                {tag}
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const actions = (
    <div className="flex gap-3 mt-8">
      {step > 1 && (
        <button
          type="button"
          onClick={() => { setError(''); setStep(s => s - 1); }}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold transition-colors"
          style={{ 
            background: 'var(--color-surface)',
            color: 'var(--color-text-secondary)',
            border: '1px solid rgba(255,255,255,0.06)',
          }}
        >
          이전
        </button>
      )}
      {step < 3 ? (
        <button
          type="button"
          onClick={handleNext}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98]"
          style={{ background: 'var(--color-brand-gradient)' }}
        >
          다음
        </button>
      ) : (
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 py-3.5 rounded-xl text-sm font-semibold text-white transition-all hover:scale-[1.02] active:scale-[0.98] disabled:opacity-50"
          style={{ background: 'var(--color-brand-gradient)' }}
        >
          {submitting ? '생성 중...' : '캐릭터 만들기'}
        </button>
      )}
    </div>
  );

  const errorMsg = error && (
    <p className="mt-4 text-sm text-red-400 bg-red-500/10 border border-red-500/20 rounded-xl px-4 py-3">
      {error}
    </p>
  );

  // Desktop Layout
  if (isDesktop) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-2xl mx-auto">
          {header}
          <div
            className="rounded-2xl p-8"
            style={{
              background: 'var(--color-surface)',
              border: '1px solid rgba(255,255,255,0.06)',
            }}
          >
            {stepIndicator}
            {step === 1 && step1Content}
            {step === 2 && step2Content}
            {step === 3 && step3Content}
            {errorMsg}
            {actions}
          </div>
        </div>
      </div>
    );
  }

  // Mobile Layout
  return (
    <div className="min-h-screen px-5 py-6">
      {header}
      {stepIndicator}
      {step === 1 && step1Content}
      {step === 2 && step2Content}
      {step === 3 && step3Content}
      {errorMsg}
      {actions}
    </div>
  );
}
