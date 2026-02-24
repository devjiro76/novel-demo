import type { FC } from 'react';
import type { Choice } from '../types';

interface Props {
  choices: Choice[];
  onChoose: (index: number) => void;
  disabled: boolean;
}

const ACTION_CATEGORY_COLORS: Record<string, string> = {
  care: 'border-green-500/30 hover:border-green-500/60',
  comfort: 'border-green-500/30 hover:border-green-500/60',
  protect: 'border-green-500/30 hover:border-green-500/60',
  charm: 'border-green-500/30 hover:border-green-500/60',
  flirt: 'border-pink-500/30 hover:border-pink-500/60',
  seduce: 'border-pink-500/30 hover:border-pink-500/60',
  confess: 'border-pink-500/30 hover:border-pink-500/60',
  touch: 'border-pink-500/30 hover:border-pink-500/60',
  tease: 'border-yellow-500/30 hover:border-yellow-500/60',
  joke: 'border-yellow-500/30 hover:border-yellow-500/60',
  ignore: 'border-red-500/30 hover:border-red-500/60',
  provoke: 'border-red-500/30 hover:border-red-500/60',
  manipulate: 'border-red-500/30 hover:border-red-500/60',
  confront: 'border-red-500/30 hover:border-red-500/60',
  distance: 'border-gray-500/30 hover:border-gray-500/60',
  submit: 'border-gray-500/30 hover:border-gray-500/60',
};

function getChoiceColor(choice: Choice): string {
  const action = choice.targets[0]?.actionName ?? '';
  return ACTION_CATEGORY_COLORS[action] ?? 'border-purple-500/30 hover:border-purple-500/60';
}

const ChoiceList: FC<Props> = ({ choices, onChoose, disabled }) => {
  return (
    <div className="space-y-2 slide-up">
      {choices.map((choice, i) => (
        <button
          key={i}
          onClick={() => onChoose(i)}
          disabled={disabled}
          className={`w-full text-left px-4 py-3 rounded-lg border bg-[var(--color-surface-2)] transition-all duration-200 ${
            disabled
              ? 'opacity-50 cursor-not-allowed border-white/5'
              : `cursor-pointer ${getChoiceColor(choice)} hover:bg-white/5 active:scale-[0.98]`
          }`}
        >
          <div className="text-sm font-medium">{choice.text}</div>
          <div className="mt-1 text-xs text-[var(--color-text-dim)]">{choice.subtext}</div>
        </button>
      ))}
    </div>
  );
};

export default ChoiceList;
