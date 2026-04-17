import { useRef, useEffect } from 'react';

interface Props {
  analyser: AnalyserNode | null;
  isPlaying: boolean;
}

export default function WaveformVisualizer({ analyser, isPlaying }: Props) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      ctx.scale(dpr, dpr);
    };
    resize();
    window.addEventListener('resize', resize);

    const bufferLength = analyser ? analyser.frequencyBinCount : 1024;
    const dataArray = new Uint8Array(bufferLength);

    let phase = 0;

    const draw = () => {
      animRef.current = requestAnimationFrame(draw);

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      if (analyser && isPlaying) {
        // Live waveform from analyser
        analyser.getByteTimeDomainData(dataArray);

        ctx.lineWidth = 2;
        ctx.strokeStyle = '#00d4b4';
        ctx.shadowColor = '#00d4b4';
        ctx.shadowBlur = 8;
        ctx.beginPath();

        const sliceWidth = width / bufferLength;
        let x = 0;

        for (let i = 0; i < bufferLength; i++) {
          const v = dataArray[i] / 128.0;
          const y = (v * height) / 2;

          if (i === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
          x += sliceWidth;
        }

        ctx.lineTo(width, height / 2);
        ctx.stroke();
        ctx.shadowBlur = 0;
      } else {
        // Idle: gentle sine wave animation
        phase += 0.02;
        ctx.lineWidth = 1.5;
        ctx.strokeStyle = 'rgba(0, 212, 180, 0.25)';
        ctx.beginPath();

        for (let x = 0; x <= width; x++) {
          const y =
            height / 2 +
            Math.sin((x / width) * Math.PI * 4 + phase) * 6 +
            Math.sin((x / width) * Math.PI * 2 + phase * 0.7) * 4;

          if (x === 0) {
            ctx.moveTo(x, y);
          } else {
            ctx.lineTo(x, y);
          }
        }

        ctx.stroke();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(animRef.current);
      window.removeEventListener('resize', resize);
    };
  }, [analyser, isPlaying]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-24 sm:h-32"
    />
  );
}
