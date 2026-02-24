import type { FC } from 'react';

interface Props {
  message?: string;
}

const LoadingSpinner: FC<Props> = ({ message = '생성 중...' }) => {
  return (
    <div className="flex flex-col items-center justify-center py-12 gap-4 fade-in">
      <div className="relative w-8 h-8">
        <div className="absolute inset-0 border-2 border-purple-500/20 rounded-full" />
        <div className="absolute inset-0 border-2 border-transparent border-t-purple-500 rounded-full animate-spin" />
      </div>
      <p className="text-sm text-[var(--color-text-dim)]">{message}</p>
    </div>
  );
};

export default LoadingSpinner;
