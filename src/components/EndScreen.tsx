import { useState } from 'react';
import { LEVELS, centsToPercentile } from '../utils/difficulty';

interface Props {
  won: boolean;
  bestLevel: number;
  bestCents: number;
  onPlayAgain: () => void;
}

export default function EndScreen({ won, bestLevel, bestCents, onPlayAgain }: Props) {
  const [copied, setCopied] = useState(false);

  const percentile = centsToPercentile(bestCents);
  const shareText = `🎵 Pitch Perfect
I can distinguish tones as close as ${bestCents} cents apart - better than ${100 - percentile}% of people!
My best level: ${bestLevel} / ${LEVELS.length}
Try it yourself → https://q29vba.github.io/pitch-perfect/`;

  const handleShare = async () => {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      try {
        await navigator.clipboard.writeText(shareText);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
        return;
      } catch {
        // fall through to prompt fallback
      }
    }
    window.prompt('Copy this text to share:', shareText);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-screen px-4 py-8 max-w-md mx-auto text-center">
      {/* Title */}
      <h1 className="text-3xl font-bold mb-2">
        {won ? (
          <span className="text-teal">You Won!</span>
        ) : (
          <span className="text-wrong">Game Over</span>
        )}
      </h1>

      <p className="text-neutral-400 mb-8">
        {won ? 'You cleared all levels - incredible ears!' : 'You ran out of lives.'}
      </p>

      {/* Stats */}
      <div className="w-full bg-surface rounded-xl border border-neutral-800 p-6 mb-8 space-y-4">
        <div className="flex justify-between">
          <span className="text-neutral-400">Best level reached</span>
          <span className="font-semibold text-teal">
            Level {bestLevel} / {LEVELS.length}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Smallest difference</span>
          <span className="font-semibold">{bestCents} cents</span>
        </div>
        <div className="flex justify-between">
          <span className="text-neutral-400">Your ranking</span>
          <span className="font-semibold text-teal">Top {percentile}%</span>
        </div>
      </div>

      {/* Share */}
      <button
        onClick={handleShare}
        className="w-full py-4 rounded-xl font-semibold text-lg bg-surface border border-neutral-700 hover:border-teal hover:text-teal transition-all duration-200 cursor-pointer active:scale-[0.98] mb-3"
      >
        {copied ? 'Copied!' : 'Share Result'}
      </button>

      {/* Play Again */}
      <button
        onClick={onPlayAgain}
        className="w-full py-4 rounded-xl font-semibold text-lg bg-teal text-bg hover:bg-teal-dim transition-all duration-200 cursor-pointer active:scale-[0.98]"
      >
        Play Again
      </button>
    </div>
  );
}
