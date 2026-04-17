import { useRef, useCallback, useState } from 'react';

interface PlayResult {
  higherFirst: boolean;
  baseFreq: number;
  higherFreq: number;
}

interface AudioEngine {
  isPlaying: boolean;
  isSupported: boolean;
  analyser: AnalyserNode | null;
  play: (cents: number) => Promise<PlayResult>;
  playSingleTone: (freq: number) => Promise<void>;
  replayBoth: (tone1Freq: number, tone2Freq: number) => Promise<void>;
}

export function useAudioEngine(): AudioEngine {
  const ctxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [analyserState, setAnalyserState] = useState<AnalyserNode | null>(null);
  const [isSupported] = useState(() => typeof AudioContext !== 'undefined' || typeof (window as any).webkitAudioContext !== 'undefined');

  const getContext = useCallback(() => {
    if (!ctxRef.current) {
      const Ctx = window.AudioContext || (window as any).webkitAudioContext;
      ctxRef.current = new Ctx();
      analyserRef.current = ctxRef.current.createAnalyser();
      analyserRef.current.fftSize = 2048;
      analyserRef.current.connect(ctxRef.current.destination);
      setAnalyserState(analyserRef.current);
    }
    return ctxRef.current;
  }, []);

  const playTone = useCallback((ctx: AudioContext, freq: number, startTime: number) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.value = freq;

    // Envelope: 50ms fade-in, sustain, 80ms fade-out. Total = 1.2s
    const fadeIn = 0.05;
    const fadeOut = 0.08;
    const duration = 1.2;

    gain.gain.setValueAtTime(0, startTime);
    gain.gain.linearRampToValueAtTime(0.3, startTime + fadeIn);
    gain.gain.setValueAtTime(0.3, startTime + duration - fadeOut);
    gain.gain.linearRampToValueAtTime(0, startTime + duration);

    osc.connect(gain);
    gain.connect(analyserRef.current!);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }, []);

  const play = useCallback(async (cents: number): Promise<PlayResult> => {
    const ctx = getContext();

    // iOS Safari: resume on user gesture
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    setIsPlaying(true);

    const baseFreq = 180 + Math.random() * (600 - 180);
    const higherFreq = baseFreq * Math.pow(2, cents / 1200);
    const higherFirst = Math.random() < 0.5;

    const now = ctx.currentTime + 0.05;
    const tone1Freq = higherFirst ? higherFreq : baseFreq;
    const tone2Freq = higherFirst ? baseFreq : higherFreq;

    playTone(ctx, tone1Freq, now);
    playTone(ctx, tone2Freq, now + 1.2 + 0.6); // 1.2s tone + 0.6s gap

    // Total time: 1.2 + 0.6 + 1.2 = 3.0 seconds
    const totalTime = 3.0;

    return new Promise((resolve) => {
      setTimeout(() => {
        setIsPlaying(false);
        resolve({ higherFirst, baseFreq, higherFreq });
      }, totalTime * 1000);
    });
  }, [getContext, playTone]);

  const playSingleTone = useCallback(async (freq: number): Promise<void> => {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    setIsPlaying(true);
    const now = ctx.currentTime + 0.05;
    playTone(ctx, freq, now);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsPlaying(false);
        resolve();
      }, 1200);
    });
  }, [getContext, playTone]);

  const replayBoth = useCallback(async (tone1Freq: number, tone2Freq: number): Promise<void> => {
    const ctx = getContext();
    if (ctx.state === 'suspended') {
      await ctx.resume();
    }
    setIsPlaying(true);
    const now = ctx.currentTime + 0.05;
    playTone(ctx, tone1Freq, now);
    playTone(ctx, tone2Freq, now + 1.2 + 0.6);
    return new Promise((resolve) => {
      setTimeout(() => {
        setIsPlaying(false);
        resolve();
      }, 3000);
    });
  }, [getContext, playTone]);

  return {
    isPlaying,
    isSupported,
    analyser: analyserState,
    play,
    playSingleTone,
    replayBoth,
  };
}
