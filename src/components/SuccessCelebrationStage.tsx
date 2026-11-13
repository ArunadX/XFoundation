import { useState } from 'react';
import { CheckCircle2, Home, Mail, RotateCw, ShieldCheck } from 'lucide-react';
import { motion } from 'motion/react';
import type { ConfirmationState, PageRoute } from '../types/olympiad';
import { getConfirmationCelebrationSpec } from '../utils/olympiadLogic';
import { SuSOrb } from './SuSOobeAssistant';

interface SuccessCelebrationStageProps {
  confirmation: ConfirmationState | null;
  secondsLeft: number;
  onNavigate: (page: PageRoute) => void;
}

/**
 * Multi-stage detailed confirmation and checkout success animation:
 * 1. Expanding dual-tone concentric shockwave + deterministic 18-particle burst
 * 2. SVG circular seal & animated checkmark vector stroke
 * 3. Corner bracket lock-in + holographic light sweep + verified stamp pop
 * 4. Milestone pipeline + 10-second linear countdown gauge
 */
export function SuccessCelebrationStage({
  confirmation,
  secondsLeft,
  onNavigate,
}: SuccessCelebrationStageProps) {
  const [replayCount, setReplayCount] = useState(0);
  const spec = getConfirmationCelebrationSpec(confirmation);
  const accentHex = spec.accent === 'lime' ? '#B8FF00' : '#00F0FF';
  const progressFraction = Math.max(0, Math.min(1, secondsLeft / 10));

  return (
    <motion.div
      key={`celebration-${confirmation?.referenceId ?? 'none'}-${replayCount}`}
      initial={{ opacity: 0, y: 18, scale: 0.965 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border bg-[#0A0F1A] p-6 sm:p-8 lg:p-10 shadow-2xl"
      style={{
        borderColor:
          spec.accent === 'lime'
            ? 'rgba(184, 255, 0, 0.55)'
            : 'rgba(0, 240, 255, 0.5)',
      }}
    >
      {/* Single-pass diagonal specular receipt sheen */}
      <motion.div
        aria-hidden="true"
        initial={{ x: '-120%', opacity: 0 }}
        animate={{ x: '220%', opacity: [0, 0.35, 0] }}
        transition={{ duration: 1.35, delay: 0.28, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute inset-y-0 left-0 w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/15 to-transparent"
      />

      {/* Ambient radial celebration halo */}
      <motion.div
        aria-hidden="true"
        initial={{ opacity: 0, scale: 0.6 }}
        animate={{ opacity: [0, 0.45, 0.24], scale: [0.7, 1.12, 1] }}
        transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
        className="pointer-events-none absolute -top-24 left-1/2 -translate-x-1/2 h-72 w-72 rounded-full blur-3xl"
        style={{
          background:
            spec.accent === 'lime'
              ? 'radial-gradient(circle, rgba(184,255,0,0.28), transparent 70%)'
              : 'radial-gradient(circle, rgba(0,240,255,0.28), transparent 70%)',
        }}
      />

      {/* Animated corner lock brackets */}
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, x: -12, y: -12 }}
        animate={{ opacity: 0.9, x: 0, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="pointer-events-none absolute top-3 left-3 h-4 w-4 border-t-2 border-l-2"
        style={{ borderColor: accentHex }}
      />
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, x: 12, y: -12 }}
        animate={{ opacity: 0.9, x: 0, y: 0 }}
        transition={{ duration: 0.45, delay: 0.12 }}
        className="pointer-events-none absolute top-3 right-3 h-4 w-4 border-t-2 border-r-2"
        style={{ borderColor: accentHex }}
      />
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, x: -12, y: 12 }}
        animate={{ opacity: 0.9, x: 0, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18 }}
        className="pointer-events-none absolute bottom-3 left-3 h-4 w-4 border-b-2 border-l-2"
        style={{ borderColor: accentHex }}
      />
      <motion.span
        aria-hidden="true"
        initial={{ opacity: 0, x: 12, y: 12 }}
        animate={{ opacity: 0.9, x: 0, y: 0 }}
        transition={{ duration: 0.45, delay: 0.18 }}
        className="pointer-events-none absolute bottom-3 right-3 h-4 w-4 border-b-2 border-r-2"
        style={{ borderColor: accentHex }}
      />

      {/* Stage 1: Hero Vector Seal + Particle Burst + Header */}
      <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-5">
        <div className="flex items-center gap-5">
          <div className="relative flex h-20 w-20 shrink-0 items-center justify-center">
            {/* Expanding concentric shockwaves */}
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0.4, opacity: 0.9 }}
              animate={{ scale: 2.15, opacity: 0 }}
              transition={{ duration: 0.95, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 rounded-full border-2"
              style={{ borderColor: accentHex }}
            />
            <motion.span
              aria-hidden="true"
              initial={{ scale: 0.35, opacity: 0.85 }}
              animate={{ scale: 1.75, opacity: 0 }}
              transition={{ duration: 0.85, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
              className="pointer-events-none absolute inset-0 rounded-full border border-[#00F0FF]"
            />

            {/* Deterministic 18-shard confetti particle burst */}
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center" aria-hidden="true">
              {spec.particles.map((p) => (
                <motion.span
                  key={p.id}
                  initial={{ x: 0, y: 0, scale: 0, opacity: 1, rotate: 0 }}
                  animate={{
                    x: p.dx,
                    y: p.dy,
                    scale: [0, 1.2, 0.4],
                    opacity: [0, 1, 0],
                    rotate: p.rotate,
                  }}
                  transition={{
                    duration: 0.95,
                    delay: p.delay,
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  style={{ backgroundColor: p.color }}
                  className={
                    p.shape === 'diamond'
                      ? 'absolute h-2 w-2 rotate-45 rounded-[1px]'
                      : p.shape === 'bar'
                        ? 'absolute h-1 w-3 rounded-full'
                        : 'absolute h-1.5 w-1.5 rounded-full'
                  }
                />
              ))}
            </div>

            {/* Precision SVG Seal & Drawn Checkmark */}
            <svg viewBox="0 0 88 88" className="h-20 w-20" aria-hidden="true">
              <motion.circle
                cx="44"
                cy="44"
                r="38"
                fill="none"
                stroke="#00F0FF"
                strokeOpacity="0.45"
                strokeWidth="1.5"
                strokeDasharray="6 6"
                initial={{ rotate: 0, opacity: 0 }}
                animate={{ rotate: 360, opacity: 1 }}
                transition={{
                  opacity: { duration: 0.4 },
                  rotate: { duration: 16, repeat: Infinity, ease: 'linear' },
                }}
                style={{ originX: '44px', originY: '44px' }}
              />
              <motion.circle
                cx="44"
                cy="44"
                r="31"
                fill={accentHex}
                fillOpacity="0.1"
                stroke={accentHex}
                strokeWidth="2.5"
                initial={{ pathLength: 0, opacity: 0.4 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.55, delay: 0.05, ease: [0.16, 1, 0.3, 1] }}
              />
              <motion.path
                d="M31 44.5 L40 53.5 L58 35"
                fill="none"
                stroke={accentHex}
                strokeWidth="4"
                strokeLinecap="round"
                strokeLinejoin="round"
                initial={{ pathLength: 0 }}
                animate={{ pathLength: 1 }}
                transition={{ duration: 0.38, delay: 0.32, ease: [0.34, 1.56, 0.64, 1] }}
              />
            </svg>
          </div>

          <div>
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.16 }}
              className="flex items-center gap-2 text-sm font-semibold"
              style={{ color: accentHex }}
            >
              <CheckCircle2 className="h-4 w-4 shrink-0" aria-hidden="true" />
              <span>
                {confirmation?.type === 'order'
                  ? 'Order Submitted Successfully'
                  : 'Olympiad Registration Submitted Successfully'}
              </span>
            </motion.div>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 0.35, delay: 0.24 }}
              className="mt-1 text-xs text-slate-400"
            >
              SuS has completed verification, sealed your receipt, and queued dispatch.
            </motion.p>
          </div>
        </div>

        {/* Official Verified Stamp Reveal + SuS Avatar */}
        <div className="flex items-center gap-3 self-start sm:self-center">
          <motion.div
            initial={{ opacity: 0, scale: 1.75, rotate: -14 }}
            animate={{ opacity: 1, scale: 1, rotate: -3 }}
            transition={{
              duration: 0.42,
              delay: 0.46,
              ease: [0.34, 1.56, 0.64, 1],
            }}
            className="rounded-md border px-3 py-1.5 font-mono text-[11px] font-bold tracking-wider"
            style={{
              borderColor: accentHex,
              color: accentHex,
              backgroundColor:
                spec.accent === 'lime'
                  ? 'rgba(184, 255, 0, 0.1)'
                  : 'rgba(0, 240, 255, 0.1)',
            }}
          >
            {spec.stampLabel}
          </motion.div>
          <SuSOrb mood="celebrate" size={40} />
        </div>
      </div>

      {/* Stage 2: Hero Confirmation Headline */}
      <motion.h1
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.26, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 mt-6 font-display text-2xl sm:text-3xl font-bold tracking-tight text-white leading-snug"
      >
        You will be contacted via email within 24 working hours.
      </motion.h1>

      {/* 3-Step Animated Verification Pipeline */}
      <div className="relative z-10 mt-6 grid grid-cols-1 sm:grid-cols-3 gap-3">
        {spec.milestones.map((m, idx) => (
          <motion.div
            key={m.label}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.32,
              delay: 0.36 + idx * 0.09,
              ease: [0.16, 1, 0.3, 1],
            }}
            className="rounded-xl border border-white/10 bg-[#070B14] px-4 py-3 text-xs"
          >
            <div className="flex items-center gap-1.5 font-semibold text-[#B8FF00]">
              <ShieldCheck className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
              <span>{m.label}</span>
            </div>
            <p className="mt-1 font-mono text-[11px] leading-snug text-slate-300">{m.detail}</p>
          </motion.div>
        ))}
      </div>

      {/* Stage 3: Staggered Itemized Receipt Summary */}
      {confirmation && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, delay: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="relative z-10 mt-6 space-y-3 border-y border-white/10 py-5 text-sm"
        >
          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.5 }}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-slate-400">Reference ID</span>
            <span className="font-mono font-semibold text-[#00F0FF]">
              {confirmation.referenceId}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.56 }}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-slate-400">Recipient</span>
            <span className="font-medium text-white">{confirmation.recipientName}</span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.62 }}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-slate-400 flex items-center gap-1.5">
              <Mail className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
              <span>Contact Email</span>
            </span>
            <span className="font-mono text-xs text-slate-200">
              {confirmation.recipientEmail}
            </span>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.25, delay: 0.68 }}
            className="flex flex-wrap items-center justify-between gap-2"
          >
            <span className="text-slate-400">Total Amount</span>
            <span className="font-mono font-semibold text-[#B8FF00] tabular-nums">
              ₹{confirmation.totalInr}
              {spec.waiverCelebration ? ' (100% Waived)' : ''}
            </span>
          </motion.div>

          <div className="pt-2 space-y-1 text-xs text-slate-300">
            {confirmation.summaryLines.map((line, i) => (
              <motion.p
                key={i}
                initial={{ opacity: 0, x: -6 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.24, delay: 0.72 + i * 0.05 }}
              >
                {line}
              </motion.p>
            ))}
          </div>
        </motion.div>
      )}

      {/* Stage 4: Linear Countdown Progress Gauge & Actions */}
      <div className="relative z-10 mt-6 space-y-3">
        <div className="h-1.5 w-full overflow-hidden rounded-full bg-white/10" aria-hidden="true">
          <div
            className="h-full w-full rounded-full transition-transform duration-700 ease-linear"
            style={{
              backgroundColor: accentHex,
              transformOrigin: 'left center',
              transform: `scaleX(${progressFraction})`,
            }}
          />
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="font-mono text-xs text-[#00F0FF] tabular-nums" role="status">
            Redirecting to Home page in {secondsLeft} second{secondsLeft === 1 ? '' : 's'}...
          </p>

          <div className="flex flex-wrap items-center gap-2.5">
            <button
              type="button"
              onClick={() => setReplayCount((c) => c + 1)}
              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0E131F] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-colors whitespace-nowrap cursor-pointer"
            >
              <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Replay Animation</span>
            </button>
            <button
              type="button"
              onClick={() => onNavigate('home')}
              className="neon-cta inline-flex items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
            >
              <Home className="h-3.5 w-3.5" aria-hidden="true" />
              <span>Return to Home Now</span>
            </button>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
