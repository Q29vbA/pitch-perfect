import { useState, useCallback, useRef } from 'react';
import { LEVELS } from '../utils/difficulty';
import { useAudioEngine } from '../hooks/useAudioEngine';
import WaveformVisualizer from './WaveformVisualizer';

interface Props {
  onGameEnd: (won: boolean, bestLevel: number, bestCents: number) => void;
}

type Phase = 'idle' | 'playing' | 'answering' | 'feedback';

export default function GameScreen({ onGameEnd }: Props) {
  const [level, setLevel] = useState(0);
  const [lives, setLives] = useState(3);
  const [phase, setPhase] = useState<Phase>('idle');
  const [feedbackMsg, setFeedbackMsg] = useState('');
  const [feedbackCorrect, setFeedbackCorrect] = useState(false);
  const [bestCents, setBestCents] = useState<number | null>(null);

  const roundRef = useRef<{ higherFirst: boolean; baseFreq: number; higherFreq: number } | null>(null);
  const { isPlaying, isSupported, analyser, play, playSingleTone, replayBoth } = useAudioEngine();

  const currentCents = LEVELS[level];

  const getToneFreqs = () => {
    if (!roundRef.current) return { tone1Freq: 0, tone2Freq: 0 };
    const { higherFirst, baseFreq, higherFreq } = roundRef.current;
    return {
      tone1Freq: higherFirst ? higherFreq : baseFreq,
      tone2Freq: higherFirst ? baseFreq : higherFreq,
    };
  };

  const playSequence = useCallback(async () => {
    if (phase === 'playing') return;
    setPhase('playing');
    setFeedbackMsg('');

    const result = await play(currentCents);
    roundRef.current = result;
    setPhase('answering');
  }, [phase, play, currentCents]);

  const replayLeft = useCallback(async () => {
    if (isPlaying || !roundRef.current) return;
    const { tone1Freq } = getToneFreqs();
    await playSingleTone(tone1Freq);
  }, [isPlaying, playSingleTone]);

  const replayRight = useCallback(async () => {
    if (isPlaying || !roundRef.current) return;
    const { tone2Freq } = getToneFreqs();
    await playSingleTone(tone2Freq);
  }, [isPlaying, playSingleTone]);

  const replayAll = useCallback(async () => {
    if (isPlaying || !roundRef.current) return;
    const { tone1Freq, tone2Freq } = getToneFreqs();
    await replayBoth(tone1Freq, tone2Freq);
  }, [isPlaying, replayBoth]);

  const handleAnswer = useCallback((choseLeftHigher: boolean) => {
    if (phase !== 'answering' || !roundRef.current || isPlaying) return;

    const correct = choseLeftHigher === roundRef.current.higherFirst;

    if (correct) {
      setFeedbackMsg('Correct!');
      setFeedbackCorrect(true);
      setBestCents((prev) => (prev === null ? currentCents : Math.min(prev, currentCents)));
      setPhase('feedback');

      setTimeout(() => {
        if (level + 1 >= LEVELS.length) {
          onGameEnd(true, level + 1, Math.min(currentCents, bestCents ?? currentCents));
        } else {
          setLevel((l) => l + 1);
          setPhase('idle');
          setFeedbackMsg('');
        }
      }, 1000);
    } else {
      const whichTone = roundRef.current.higherFirst ? 'Left' : 'Right';
      setFeedbackMsg(`Wrong – that was ${whichTone}`);
      setFeedbackCorrect(false);
      setPhase('feedback');

      const newLives = lives - 1;
      setLives(newLives);

      setTimeout(() => {
        if (newLives <= 0) {
          onGameEnd(false, level + 1, bestCents ?? currentCents);
        } else {
          setPhase('idle');
          setFeedbackMsg('');
        }
      }, 1500);
    }
  }, [phase, isPlaying, level, lives, currentCents, bestCents, onGameEnd]);

  if (!isSupported) {
    return (
      <div className="flex items-center justify-center min-h-screen px-4">
        <div className="text-center">
          <p className="text-xl text-red-400 mb-2">Audio Not Supported</p>
          <p className="text-neutral-400">
            Your browser doesn't support the Web Audio API. Please try a modern browser like Chrome, Firefox, or Safari.
          </p>
        </div>
      </div>
    );
  }

  const lifeIcons = Array.from({ length: 3 }, (_, i) => (
    <span key={i} className={`text-2xl transition-opacity duration-300 ${i < lives ? 'opacity-100' : 'opacity-25'}`}>
      {i < lives ? '♥' : '♡'}
    </span>
  ));

  return (
    <div className="flex flex-col items-center min-h-screen px-4 py-6 max-w-md mx-auto">
      {/* Top bar */}
      <div className="flex items-center justify-between w-full mb-8">
        <span className="text-sm font-medium tracking-wide text-neutral-400">
          Level <span className="text-teal">{level + 1}</span> / {LEVELS.length}
        </span>
        <div className="flex gap-1 text-red-400">
          {lifeIcons}
        </div>
      </div>

      {/* Waveform */}
      <div className="w-full mb-6 rounded-lg overflow-hidden bg-surface/50 border border-neutral-800">
        <WaveformVisualizer analyser={analyser} isPlaying={isPlaying} />
      </div>

      {/* Play button — idle state */}
      {phase === 'idle' && (
        <button
          onClick={playSequence}
          className="w-full py-4 rounded-xl font-semibold text-lg tracking-wide transition-all duration-200 bg-teal text-bg hover:bg-teal-dim active:scale-[0.98] cursor-pointer"
        >
          ▶ Play
        </button>
      )}

      {/* Playing indicator */}
      {phase === 'playing' && (
        <button
          disabled
          className="w-full py-4 rounded-xl font-semibold text-lg tracking-wide bg-neutral-800 text-neutral-500 cursor-not-allowed"
        >
          Playing…
        </button>
      )}

      {/* Tone panels — answering / feedback phases */}
      {(phase === 'answering' || phase === 'feedback') && (
        <>
          <div className="w-full grid grid-cols-2 gap-3 mb-3">
            {/* Left panel */}
            <div className="rounded-xl border border-neutral-700 bg-surface p-4 flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-neutral-400 tracking-wide">Left</span>
              <button
                onClick={replayLeft}
                disabled={phase !== 'answering' || isPlaying}
                className={`
                  w-full py-3 rounded-lg font-medium text-sm transition-all duration-200
                  ${phase === 'answering' && !isPlaying
                    ? 'bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20 cursor-pointer active:scale-[0.97]'
                    : 'bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                  }
                `}
              >
                ▶ Left
              </button>
            </div>

            {/* Right panel */}
            <div className="rounded-xl border border-neutral-700 bg-surface p-4 flex flex-col items-center gap-2">
              <span className="text-sm font-medium text-neutral-400 tracking-wide">Right</span>
              <button
                onClick={replayRight}
                disabled={phase !== 'answering' || isPlaying}
                className={`
                  w-full py-3 rounded-lg font-medium text-sm transition-all duration-200
                  ${phase === 'answering' && !isPlaying
                    ? 'bg-teal/10 text-teal border border-teal/30 hover:bg-teal/20 cursor-pointer active:scale-[0.97]'
                    : 'bg-neutral-800/50 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                  }
                `}
              >
                ▶ Right
              </button>
            </div>
          </div>

          {/* Replay both link */}
          {phase === 'answering' && !isPlaying && (
            <button
              onClick={replayAll}
              className="mb-2 text-sm text-teal/70 hover:text-teal transition-colors cursor-pointer"
            >
              ↺ Replay both
            </button>
          )}
        </>
      )}

      {/* Answer buttons */}
      <div
        className={`
          w-full grid grid-cols-2 gap-3 mt-4
          transition-all duration-300
          ${phase === 'answering' && !isPlaying ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
        `}
      >
        <button
          onClick={() => handleAnswer(true)}
          disabled={phase !== 'answering' || isPlaying}
          className="py-4 rounded-xl font-medium border border-neutral-700 bg-surface hover:border-teal hover:text-teal transition-all duration-200 cursor-pointer active:scale-[0.97]"
        >
          Left was higher
        </button>
        <button
          onClick={() => handleAnswer(false)}
          disabled={phase !== 'answering' || isPlaying}
          className="py-4 rounded-xl font-medium border border-neutral-700 bg-surface hover:border-teal hover:text-teal transition-all duration-200 cursor-pointer active:scale-[0.97]"
        >
          Right was higher
        </button>
      </div>

      {/* Feedback */}
      <div
        className={`
          mt-6 text-center font-medium text-lg
          transition-all duration-300
          ${feedbackMsg ? 'opacity-100' : 'opacity-0'}
          ${feedbackCorrect ? 'text-correct' : 'text-wrong'}
        `}
      >
        {feedbackMsg || '\u00A0'}
      </div>
    </div>
  );
}
