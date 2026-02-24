import type { FC } from 'react';

interface Props {
  onStart: () => void;
  loading: boolean;
}

const TitleScreen: FC<Props> = ({ onStart, loading }) => {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 fade-in">
      <div className="text-center space-y-6 max-w-sm">
        {/* Title */}
        <h1 className="text-4xl font-bold tracking-tight">
          못참아
        </h1>
        <p className="text-sm text-[var(--color-text-dim)] leading-relaxed">
          친구 장덕희의 집을 방문한 여름방학.<br />
          그의 가족과 여자친구 사이에서<br />
          당신의 선택이 모든 것을 바꾼다.
        </p>

        {/* Character preview */}
        <div className="flex justify-center gap-4 text-xs text-[var(--color-text-dim)]">
          <span>정숙(41)</span>
          <span>은혜(22)</span>
          <span>미나(22)</span>
          <span>덕희(20)</span>
        </div>

        {/* Start button */}
        <button
          onClick={onStart}
          disabled={loading}
          className={`px-8 py-3 rounded-full text-sm font-medium transition-all duration-300 ${
            loading
              ? 'bg-purple-500/20 text-purple-300 cursor-wait'
              : 'bg-purple-600 hover:bg-purple-500 text-white active:scale-95'
          }`}
        >
          {loading ? '준비 중...' : '시작하기'}
        </button>

        {/* Info */}
        <p className="text-[10px] text-[var(--color-text-dim)]">
          AI가 상황과 대사를 실시간으로 생성합니다<br />
          캐릭터의 감정이 선택에 따라 변화합니다
        </p>
      </div>
    </div>
  );
};

export default TitleScreen;
