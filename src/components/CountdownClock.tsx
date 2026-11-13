import { useEffect, useState } from 'react';
import { computeCountdown } from '../utils/olympiadLogic';

interface CountdownClockProps {
  targetIso: string;
  compact?: boolean;
}

export function CountdownClock({ targetIso, compact = false }: CountdownClockProps) {
  const [nowMs, setNowMs] = useState<number>(() => Date.now());

  useEffect(() => {
    const timer = window.setInterval(() => {
      setNowMs(Date.now());
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  const parts = computeCountdown(targetIso, nowMs);

  if (parts.expired) {
    return (
      <span className="font-mono text-xs font-semibold text-rose-400 tabular-nums">
        Window Closed
      </span>
    );
  }

  const d = String(parts.days).padStart(2, '0');
  const h = String(parts.hours).padStart(2, '0');
  const m = String(parts.minutes).padStart(2, '0');
  const s = String(parts.seconds).padStart(2, '0');

  if (compact) {
    return (
      <span className="font-mono text-xs font-semibold text-[#B8FF00] tabular-nums whitespace-nowrap">
        {d}d : {h}h : {m}m : {s}s
      </span>
    );
  }

  return (
    <div className="grid grid-cols-4 gap-3 tabular-nums">
      {[
        { value: d, label: 'Days' },
        { value: h, label: 'Hours' },
        { value: m, label: 'Minutes' },
        { value: s, label: 'Seconds' },
      ].map((unit) => (
        <div
          key={unit.label}
          className="rounded-lg border border-white/10 bg-[#06080D] px-3 py-3 text-center"
        >
          <span className="block font-mono text-2xl sm:text-3xl font-bold text-[#00F0FF]">
            {unit.value}
          </span>
          <span className="mt-1 block text-[11px] text-slate-400">{unit.label}</span>
        </div>
      ))}
    </div>
  );
}
