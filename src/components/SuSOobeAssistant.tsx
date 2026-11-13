import { useState } from 'react';
import {
  AlertTriangle,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Send,
  Sparkles,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  buildSuSFallbackReply,
  fetchJsonSafe,
  type OobeMood,
  type SuSOobeGuidance,
} from '../utils/olympiadLogic';

interface SuSOobeAssistantProps {
  guidance: SuSOobeGuidance;
  stepLabels: string[];
  currentStep: number;
  onJumpToStep?: (stepIndex: number) => void;
  contextTag: 'Olympiad Registration' | 'Study Material Checkout';
}

const MOOD_COLORS: Record<
  OobeMood,
  { ring: string; inner: string; accent: string; border: string }
> = {
  welcome: {
    ring: '#00F0FF',
    inner: '#0EA5E9',
    accent: 'text-[#00F0FF]',
    border: 'border-[#00F0FF]/35',
  },
  happy: {
    ring: '#B8FF00',
    inner: '#22C55E',
    accent: 'text-[#B8FF00]',
    border: 'border-[#B8FF00]/45',
  },
  tip: {
    ring: '#00F0FF',
    inner: '#38BDF8',
    accent: 'text-[#00F0FF]',
    border: 'border-[#00F0FF]/35',
  },
  warning: {
    ring: '#FBBF24',
    inner: '#F59E0B',
    accent: 'text-amber-300',
    border: 'border-amber-400/50',
  },
  celebrate: {
    ring: '#B8FF00',
    inner: '#00F0FF',
    accent: 'text-[#B8FF00]',
    border: 'border-[#B8FF00]/60',
  },
};

export function SuSOrb({ mood, size = 56 }: { mood: OobeMood; size?: number }) {
  const palette = MOOD_COLORS[mood];
  return (
    <div
      className="relative flex shrink-0 items-center justify-center"
      style={{ width: size, height: size }}
      aria-hidden="true"
    >
      {/* Outer breathing halo */}
      <motion.div
        animate={{
          scale: mood === 'celebrate' ? [1, 1.22, 1] : [1, 1.12, 1],
          opacity: [0.35, 0.72, 0.35],
        }}
        transition={{
          duration: mood === 'warning' ? 1.4 : 2.6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        className="absolute inset-0 rounded-full blur-md"
        style={{
          background: `radial-gradient(circle, ${palette.ring}55, transparent 70%)`,
        }}
      />

      {/* Rotating segmented SVG vector ring */}
      <motion.svg
        width={size}
        height={size}
        viewBox="0 0 64 64"
        animate={{ rotate: 360 }}
        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
        className="relative z-10"
      >
        <circle
          cx="32"
          cy="32"
          r="27"
          fill="none"
          stroke={palette.ring}
          strokeWidth="2.5"
          strokeDasharray="34 10 14 10"
          strokeOpacity="0.85"
        />
        <circle
          cx="32"
          cy="32"
          r="20"
          fill="none"
          stroke={palette.inner}
          strokeWidth="2"
          strokeDasharray="18 8"
          strokeOpacity="0.7"
        />
      </motion.svg>

      {/* Responsive core dot */}
      <motion.div
        animate={{ scale: [0.92, 1.08, 0.92] }}
        transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute z-20 h-4 w-4 rounded-full shadow-lg"
        style={{
          background: `radial-gradient(circle, #FFFFFF 10%, ${palette.ring} 70%)`,
        }}
      />
    </div>
  );
}

export function SuSOobeAssistant({
  guidance,
  stepLabels,
  currentStep,
  onJumpToStep,
  contextTag,
}: SuSOobeAssistantProps) {
  const palette = MOOD_COLORS[guidance.mood];
  const [askOpen, setAskOpen] = useState(false);
  const [question, setQuestion] = useState('');
  const [reply, setReply] = useState<string | null>(null);
  const [asking, setAsking] = useState(false);

  const handleQuickAsk = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = question.trim();
    if (!trimmed || asking) return;
    setAsking(true);
    try {
      const data = await fetchJsonSafe<{ reply?: string }>('/api/sus/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: `[Candidate currently in ${contextTag}, ${guidance.stepTitle}] ${trimmed}`,
        }),
      });
      setReply(data?.reply?.trim() || buildSuSFallbackReply(trimmed));
      setQuestion('');
    } catch {
      setReply(buildSuSFallbackReply(trimmed));
    } finally {
      setAsking(false);
    }
  };

  return (
    <div className="space-y-5">
      {/* OOBE Step Timeline Track */}
      <nav aria-label="Setup steps" className="border-b border-white/10 pb-4">
        <ol className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {stepLabels.map((label, idx) => {
            const stepNum = idx + 1;
            const isActive = stepNum === currentStep;
            const isCompleted = stepNum < currentStep;
            return (
              <li key={label}>
                <button
                  type="button"
                  disabled={!onJumpToStep || stepNum > currentStep}
                  onClick={() => onJumpToStep?.(stepNum)}
                  className={`w-full flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-all ${
                    isActive
                      ? 'border-[#00F0FF] bg-[#00F0FF]/12 text-white font-semibold'
                      : isCompleted
                        ? 'border-[#B8FF00]/40 bg-[#B8FF00]/5 text-[#B8FF00] hover:border-[#B8FF00] cursor-pointer'
                        : 'border-white/10 bg-[#0D121D] text-slate-500 cursor-default'
                  }`}
                >
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full font-mono text-[11px] font-bold ${
                      isActive
                        ? 'bg-[#00F0FF] text-[#05080F]'
                        : isCompleted
                          ? 'bg-[#B8FF00] text-[#05080F]'
                          : 'border border-white/15 text-slate-400'
                    }`}
                  >
                    {isCompleted ? <Check className="h-3 w-3" /> : stepNum}
                  </span>
                  <span className="truncate">{label}</span>
                </button>
              </li>
            );
          })}
        </ol>
      </nav>

      {/* Interactive Talking SuS Guide Box */}
      <div
        className={`rounded-xl border ${palette.border} bg-[#0C1320]/95 p-4 sm:p-5 transition-colors`}
      >
        <div className="flex flex-col sm:flex-row sm:items-start gap-4">
          <div className="flex items-center gap-3 sm:block">
            <SuSOrb mood={guidance.mood} size={52} />
            <span
              className={`sm:hidden font-mono text-[11px] font-semibold uppercase tracking-wider ${palette.accent}`}
            >
              SuS · {guidance.stepTitle}
            </span>
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <span
                className={`hidden sm:inline font-mono text-[11px] font-semibold uppercase tracking-wider ${palette.accent}`}
              >
                SuS Live Assistant · {guidance.stepTitle}
              </span>
              <button
                type="button"
                onClick={() => setAskOpen((v) => !v)}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:underline cursor-pointer"
              >
                <MessageSquare className="h-3.5 w-3.5" aria-hidden="true" />
                <span>{askOpen ? 'Hide Quick Ask' : 'Ask SuS a Question'}</span>
              </button>
            </div>

            <motion.div
              key={guidance.headline}
              initial={{ opacity: 0.72, y: 3 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.16, ease: 'easeOut' }}
              className="min-h-[3.5rem]"
            >
              <p className="mt-1 font-display text-base sm:text-lg font-bold text-white">
                {guidance.headline}
              </p>
              <p className="mt-1 text-xs sm:text-sm leading-relaxed text-slate-300">
                {guidance.message}
              </p>
            </motion.div>

            {/* Live Verification Markings & Signs */}
            <div className="mt-3 flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 pt-3 text-xs">
              {guidance.markers.map((marker) => (
                <div key={marker.label} className="inline-flex items-center gap-1.5">
                  {marker.status === 'ok' ? (
                    <CheckCircle2
                      className="h-3.5 w-3.5 shrink-0 text-[#B8FF00]"
                      aria-hidden="true"
                    />
                  ) : marker.status === 'warn' ? (
                    <AlertTriangle
                      className="h-3.5 w-3.5 shrink-0 text-amber-400"
                      aria-hidden="true"
                    />
                  ) : (
                    <ArrowRight
                      className="h-3.5 w-3.5 shrink-0 text-[#00F0FF]"
                      aria-hidden="true"
                    />
                  )}
                  <span
                    className={
                      marker.status === 'ok'
                        ? 'text-[#B8FF00] font-medium'
                        : marker.status === 'warn'
                          ? 'text-amber-300 font-medium'
                          : 'text-slate-300'
                    }
                  >
                    {marker.label}
                  </span>
                </div>
              ))}
            </div>

            {/* Optional Inline Ask SuS Box */}
            <AnimatePresence>
              {askOpen && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="overflow-hidden"
                >
                  <form
                    onSubmit={(e) => void handleQuickAsk(e)}
                    className="mt-3 flex gap-2 border-t border-white/10 pt-3"
                  >
                    <label htmlFor="sus-inline-question" className="sr-only">
                      Ask SuS a quick question
                    </label>
                    <input
                      id="sus-inline-question"
                      type="text"
                      value={question}
                      onChange={(e) => setQuestion(e.target.value)}
                      placeholder="Ask SuS about eligibility, bundles, coupons, or exam dates..."
                      className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                    />
                    <button
                      type="submit"
                      disabled={asking || !question.trim()}
                      className="neon-cta inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold disabled:opacity-45 cursor-pointer"
                    >
                      {asking ? (
                        <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      ) : (
                        <Send className="h-3.5 w-3.5" />
                      )}
                      <span>Ask</span>
                    </button>
                  </form>
                  {reply && (
                    <div className="mt-2.5 flex items-start gap-2 rounded-lg border border-[#00F0FF]/25 bg-[#070B13] p-3 text-xs leading-relaxed text-slate-200">
                      <Sparkles
                        className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#00F0FF]"
                        aria-hidden="true"
                      />
                      <p>{reply}</p>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
