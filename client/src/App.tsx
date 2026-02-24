import { useState, useCallback, useRef } from 'react';
import type {
  GamePhase,
  Choice,
  CharacterStatus,
  CharacterReaction,
  TurnRecord,
  TurnChooseResponse,
} from './types';
import { startGame, getNextTurn, submitChoice, resetGame, setGameId } from './api/client';
import TitleScreen from './ui/TitleScreen';
import GameHeader from './ui/GameHeader';
import SituationView from './ui/SituationView';
import ChoiceList from './ui/ChoiceList';
import ReactionCard from './ui/ReactionCard';
import StoryLog from './ui/StoryLog';
import LoadingSpinner from './ui/LoadingSpinner';
import ConversationView from './ui/ConversationView';

export default function App() {
  const [phase, setPhase] = useState<GamePhase>('title');
  const [error, setError] = useState<string | null>(null);

  // Current turn data
  const [chapter, setChapter] = useState(1);
  const [turnCount, setTurnCount] = useState(0);
  const [situation, setSituation] = useState('');
  const [location, setLocation] = useState('');
  const [characters, setCharacters] = useState<CharacterStatus[]>([]);
  const [choices, setChoices] = useState<Choice[]>([]);
  const [reactions, setReactions] = useState<CharacterReaction[]>([]);
  const [relationships, setRelationships] = useState<Record<string, number>>({});

  // History
  const [history, setHistory] = useState<TurnRecord[]>([]);
  const lastChoiceText = useRef('');

  // Conversation state
  const [conversationTarget, setConversationTarget] = useState<TurnChooseResponse['conversationAvailable']>(undefined);

  // ---- Start game ----
  const handleStart = useCallback(async () => {
    setPhase('loading');
    setError(null);
    try {
      const data = await startGame();
      setChapter(data.chapter);
      setTurnCount(data.turnCount);
      setSituation(data.situation);
      setLocation(data.location);
      setCharacters(data.characters);
      setChoices(data.choices);
      setRelationships({
        jeongsuk: 0,
        eunhye: 0,
        mina: -10,
        jeongjung: 0,
        deokhui: 30,
      });
      setPhase('situation');
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }, []);

  // ---- Choose ----
  const handleChoose = useCallback(
    async (index: number) => {
      setPhase('reacting');
      setError(null);
      lastChoiceText.current = choices[index]?.text ?? '';

      try {
        const data = await submitChoice(index, situation, choices);

        setReactions(data.reactions);
        setChapter(data.chapter);
        setTurnCount(data.turnCount);
        setRelationships(data.relationships);
        setConversationTarget(data.conversationAvailable);
        setPhase('reaction');
      } catch (err) {
        setError((err as Error).message);
        setPhase('error');
      }
    },
    [choices, situation],
  );

  // ---- Next turn ----
  const handleNext = useCallback(async () => {
    // Save current turn to history
    setHistory((prev) => [
      ...prev,
      {
        turn: turnCount,
        situation,
        location,
        choiceText: lastChoiceText.current,
        reactions,
      },
    ]);

    setPhase('loading');
    setError(null);

    try {
      const data = await getNextTurn();
      setSituation(data.situation);
      setLocation(data.location);
      setCharacters(data.characters);
      setChoices(data.choices);
      setChapter(data.chapter);
      setTurnCount(data.turnCount);
      setReactions([]);
      setPhase('situation');
    } catch (err) {
      setError((err as Error).message);
      setPhase('error');
    }
  }, [turnCount, situation, location, reactions]);

  // ---- Reset ----
  const handleReset = useCallback(async () => {
    try {
      await resetGame();
    } catch {
      // ignore
    }
    setGameId(null);
    setPhase('title');
    setHistory([]);
    setReactions([]);
    setRelationships({});
    setError(null);
  }, []);

  // ---- Title screen ----
  if (phase === 'title') {
    return <TitleScreen onStart={handleStart} loading={false} />;
  }

  // ---- Main game UI ----
  return (
    <div className="min-h-screen flex flex-col">
      <GameHeader
        chapter={chapter}
        turnCount={turnCount}
        relationships={relationships}
        onReset={handleReset}
      />

      <main className="flex-1 max-w-lg mx-auto w-full px-4 py-6 space-y-6">
        {/* Error */}
        {phase === 'error' && error && (
          <div className="rounded-lg bg-red-500/10 border border-red-500/20 px-4 py-3 text-sm text-red-400 fade-in">
            <p className="font-medium">오류 발생</p>
            <p className="mt-1 text-xs">{error}</p>
            <button
              onClick={handleReset}
              className="mt-2 text-xs underline hover:text-red-300"
            >
              처음부터 다시 시작
            </button>
          </div>
        )}

        {/* Loading */}
        {(phase === 'loading' || phase === 'reacting') && (
          <LoadingSpinner
            message={phase === 'reacting' ? '캐릭터가 반응하고 있습니다...' : 'AI가 상황을 생성하고 있습니다...'}
          />
        )}

        {/* Situation + Choices */}
        {phase === 'situation' && (
          <>
            <SituationView
              situation={situation}
              location={location}
              characters={characters}
            />
            <ChoiceList
              choices={choices}
              onChoose={handleChoose}
              disabled={false}
            />
          </>
        )}

        {/* Reactions */}
        {phase === 'reaction' && (
          <>
            {/* Show what player chose */}
            <div className="text-sm text-[var(--color-accent)] border-l-2 border-[var(--color-accent)] pl-3 fade-in">
              {lastChoiceText.current}
            </div>

            {/* Reaction cards */}
            <div className="space-y-3">
              {reactions.map((r, i) => (
                <ReactionCard key={r.characterId} reaction={r} index={i} />
              ))}
            </div>

            {/* Conversation invite or Next turn button */}
            {conversationTarget ? (
              <div
                className="space-y-2 slide-up"
                style={{ animationDelay: `${reactions.length * 150 + 200}ms`, animationFillMode: 'both' }}
              >
                <button
                  onClick={() => setPhase('conversation')}
                  className="w-full py-3 rounded-lg bg-pink-600 hover:bg-pink-500 text-sm font-medium transition-all active:scale-[0.98]"
                >
                  {conversationTarget.displayName}와(과) 대화하기
                </button>
                <button
                  onClick={handleNext}
                  className="w-full py-2 rounded-lg border border-white/10 text-xs text-[var(--color-text-dim)] hover:border-white/20 hover:text-[var(--color-text-secondary)] transition-all"
                >
                  건너뛰고 다음 상황으로
                </button>
              </div>
            ) : (
              <button
                onClick={handleNext}
                className="w-full py-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-sm font-medium transition-all active:scale-[0.98] slide-up"
                style={{ animationDelay: `${reactions.length * 150 + 200}ms`, animationFillMode: 'both' }}
              >
                다음 상황으로
              </button>
            )}
          </>
        )}

        {/* Conversation */}
        {phase === 'conversation' && conversationTarget && (
          <ConversationView
            characterId={conversationTarget.characterId}
            displayName={conversationTarget.displayName}
            tierCrossed={conversationTarget.tierCrossed}
            situation={situation}
            onEnd={() => {
              setConversationTarget(undefined);
              handleNext();
            }}
          />
        )}

        {/* Story log */}
        {phase !== 'loading' && (
          <StoryLog records={history} />
        )}
      </main>
    </div>
  );
}
