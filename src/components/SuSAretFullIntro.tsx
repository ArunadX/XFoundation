import { useEffect, useState } from 'react';
import { ChevronDown, ChevronUp, Cpu, RotateCw, Sparkles } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  getSuSAretIntroPhases,
  type SuSAretIntroFocus,
} from '../utils/olympiadLogic';

interface SuSAretFullIntroProps {
  focus: SuSAretIntroFocus;
}

function isAutostartMode(): boolean {
  if (typeof window === 'undefined') return false;
  try {
    return new URLSearchParams(window.location.search).get('autostart') === '1';
  } catch {
    return false;
  }
}

/**
 * Full dual-entity flying & docking intro choreography for SuS and ARET.
 * Animates both SuS (orbital visor orb) and ARET (octagonal diagnostic gyro-core)
 * flying into formation and establishing a synchronized neural data bridge.
 * Pure compositor transforms/opacity/pathLength; zero blocking overlays.
 */
export function SuSAretFullIntro({ focus }: SuSAretFullIntroProps) {
  const spec = getSuSAretIntroPhases(focus);
  const [replaySeed, setReplaySeed] = useState(0);
  const [activePhase, setActivePhase] = useState<number>(() =>
    isAutostartMode() ? 3 : 0
  );
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (isAutostartMode() && replaySeed === 0) {
      setActivePhase(3);
      return;
    }
    setActivePhase(0);
    const t1 = window.setTimeout(() => setActivePhase(1), 950);
    const t2 = window.setTimeout(() => setActivePhase(2), 1950);
    const t3 = window.setTimeout(() => setActivePhase(3), 3050);
    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  }, [replaySeed, focus]);

  const handleReplay = () => {
    setCollapsed(false);
    setReplaySeed((s) => s + 1);
  };

  const currentPhase = spec.phases[activePhase] ?? spec.phases[3];

  return (
    <motion.section
      aria-label="SuS and ARET Dual Intelligence Introduction"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
      className="relative overflow-hidden rounded-2xl border border-[#00F0FF]/35 bg-[#070B13] p-5 sm:p-7"
    >
      {/* Animated corner brackets */}
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2.5 left-2.5 h-3.5 w-3.5 border-t-2 border-l-2 border-[#00F0FF]/75"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute top-2.5 right-2.5 h-3.5 w-3.5 border-t-2 border-r-2 border-[#B8FF00]/75"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2.5 left-2.5 h-3.5 w-3.5 border-b-2 border-l-2 border-[#00F0FF]/75"
      />
      <span
        aria-hidden="true"
        className="pointer-events-none absolute bottom-2.5 right-2.5 h-3.5 w-3.5 border-b-2 border-r-2 border-[#B8FF00]/75"
      />

      {/* Top Title & Playback Bar */}
      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <p className="font-mono text-[11px] font-semibold uppercase tracking-wider text-[#00F0FF]">
            {focus === 'sus'
              ? 'SuS × ARET DUAL FLIGHT INTRO · HELP-SERVICE CONSOLE'
              : focus === 'aret-full'
                ? 'ARET PRO × SuS DUAL FLIGHT INTRO · FULL SUITE'
                : 'ARET × SuS DUAL FLIGHT INTRO · DIAGNOSTIC PREVIEW'}
          </p>
          <h2 className="mt-1 font-display text-xl sm:text-2xl font-bold text-white">
            {spec.bannerTitle}
          </h2>
          <p className="mt-1 max-w-3xl text-xs sm:text-sm text-slate-300 leading-relaxed">
            {spec.bannerSubtitle}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <button
            type="button"
            onClick={handleReplay}
            className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-3.5 py-2 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors whitespace-nowrap cursor-pointer"
          >
            <RotateCw className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Replay Full Intro</span>
          </button>

          <button
            type="button"
            onClick={() => setCollapsed((v) => !v)}
            aria-expanded={!collapsed}
            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0D1320] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-white/35 transition-colors whitespace-nowrap cursor-pointer"
          >
            {collapsed ? (
              <>
                <ChevronDown className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Expand Stage</span>
              </>
            ) : (
              <>
                <ChevronUp className="h-3.5 w-3.5" aria-hidden="true" />
                <span>Minimize Stage</span>
              </>
            )}
          </button>
        </div>
      </div>

      <AnimatePresence initial={false}>
        {!collapsed && (
          <motion.div
            key={`intro-stage-${replaySeed}`}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.3, ease: [0.16, 1, 0.3, 1] }}
            className="overflow-hidden"
          >
            {/* Cinematic Dual-Entity Flight & Neural Docking Arena */}
            <div className="relative mt-5 overflow-hidden rounded-xl border border-white/10 bg-[#04070E] p-5 sm:p-7">
              {/* Subtle dual ambient radial halos */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -left-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(0,240,255,0.45), transparent 70%)',
                }}
              />
              <div
                aria-hidden="true"
                className="pointer-events-none absolute -right-16 top-1/2 h-56 w-56 -translate-y-1/2 rounded-full opacity-25 blur-3xl"
                style={{
                  background:
                    'radial-gradient(circle, rgba(184,255,0,0.42), transparent 70%)',
                }}
              />

              {/* Horizontal launch sweep line */}
              <motion.div
                aria-hidden="true"
                initial={{ y: -12, opacity: 0 }}
                animate={{ y: 240, opacity: [0, 0.5, 0] }}
                transition={{ duration: 1.4, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                className="pointer-events-none absolute inset-x-0 top-0 h-px bg-gradient-to-r from-[#00F0FF]/0 via-[#00F0FF] to-[#B8FF00]/0"
              />

              <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 items-center gap-6">
                {/* LEFT ENTITY: SuS Flying Orbital Companion */}
                <motion.div
                  initial={{ x: -96, y: 22, opacity: 0, scale: 0.78, rotate: -14 }}
                  animate={{
                    x: 0,
                    y: [0, -5, 0],
                    opacity: 1,
                    scale: currentPhase.emphasis === 'sus' ? 1.04 : 1,
                    rotate: 0,
                  }}
                  transition={{
                    x: { duration: 0.78, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.55 },
                    rotate: { duration: 0.85, ease: [0.16, 1, 0.3, 1] },
                    scale: { duration: 0.45 },
                    y: { duration: 3.4, repeat: Infinity, ease: 'easeInOut', delay: 0.75 },
                  }}
                  className="lg:col-span-4 flex flex-col items-center text-center"
                >
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <svg viewBox="0 0 128 128" className="h-32 w-32" aria-hidden="true">
                      <defs>
                        <radialGradient id="susFlightCoreGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#E0FFFF" />
                          <stop offset="45%" stopColor="#00F0FF" stopOpacity="0.85" />
                          <stop offset="100%" stopColor="#0369A1" stopOpacity="0.1" />
                        </radialGradient>
                      </defs>

                      {/* Outer Orbital Ring */}
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#00F0FF"
                        strokeOpacity="0.55"
                        strokeWidth="1.5"
                        strokeDasharray="16 8 6 8"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                        style={{ originX: '64px', originY: '64px' }}
                      />

                      {/* Counter-rotating telemetry arc */}
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="44"
                        fill="none"
                        stroke="#38BDF8"
                        strokeOpacity="0.7"
                        strokeWidth="2"
                        strokeDasharray="32 14"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
                        style={{ originX: '64px', originY: '64px' }}
                      />

                      {/* Inner Orb Sphere */}
                      <circle
                        cx="64"
                        cy="64"
                        r="30"
                        fill="url(#susFlightCoreGlow)"
                        stroke="#00F0FF"
                        strokeWidth="1.5"
                      />

                      {/* Visor Band */}
                      <rect
                        x="42"
                        y="55"
                        width="44"
                        height="16"
                        rx="8"
                        fill="#05080F"
                        stroke="#00F0FF"
                        strokeOpacity="0.65"
                        strokeWidth="1.2"
                      />

                      {/* Expressive Scanning Eyes */}
                      <motion.ellipse
                        cx="55"
                        cy="63"
                        rx="3.4"
                        ry="4"
                        fill="#00F0FF"
                        animate={{
                          scaleY: [1, 1, 0.15, 1, 1],
                          x: [0, 1.8, 0, -1.8, 0],
                        }}
                        transition={{
                          duration: 3.6,
                          repeat: Infinity,
                          times: [0, 0.44, 0.48, 0.52, 1],
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '55px', originY: '63px' }}
                      />
                      <motion.ellipse
                        cx="73"
                        cy="63"
                        rx="3.4"
                        ry="4"
                        fill="#00F0FF"
                        animate={{
                          scaleY: [1, 1, 0.15, 1, 1],
                          x: [0, 1.8, 0, -1.8, 0],
                        }}
                        transition={{
                          duration: 3.6,
                          repeat: Infinity,
                          times: [0, 0.44, 0.48, 0.52, 1],
                          ease: 'easeInOut',
                        }}
                        style={{ originX: '73px', originY: '63px' }}
                      />
                    </svg>
                  </div>

                  {/* SuS Acoustic Resonance Waveform */}
                  <div
                    className="mt-2 flex items-end justify-center gap-1 h-6"
                    aria-hidden="true"
                  >
                    {spec.susWaveform.map((ratio, idx) => (
                      <motion.span
                        key={idx}
                        animate={{
                          scaleY: [ratio * 0.45, ratio, ratio * 0.55],
                        }}
                        transition={{
                          duration: 1.25,
                          delay: idx * 0.08,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                        }}
                        style={{ height: '22px', originY: 1 }}
                        className="w-1 rounded-full bg-[#00F0FF]"
                      />
                    ))}
                  </div>

                  <p className="mt-2.5 font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <Sparkles className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                    <span>SuS Flight Core</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Systematic User Help-Service
                  </p>
                </motion.div>

                {/* CENTER: Dual Neural Bridge & Streaming Data Packets */}
                <div className="lg:col-span-4 flex flex-col items-center justify-center">
                  <svg
                    viewBox="0 0 280 104"
                    className="w-full max-w-[300px] h-24 overflow-visible"
                    aria-hidden="true"
                  >
                    {/* Base subtle track curves */}
                    <path
                      d="M 14 34 C 95 6, 185 6, 266 34"
                      fill="none"
                      stroke="rgba(0,240,255,0.18)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />
                    <path
                      d="M 266 70 C 185 98, 95 98, 14 70"
                      fill="none"
                      stroke="rgba(184,255,0,0.18)"
                      strokeWidth="1.5"
                      strokeDasharray="4 4"
                    />

                    {/* Active Animated Cyan Conduit (SuS -> ARET) */}
                    <motion.path
                      d="M 14 34 C 95 6, 185 6, 266 34"
                      fill="none"
                      stroke="#00F0FF"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0.25 }}
                      animate={{
                        pathLength: activePhase >= 2 ? 1 : activePhase >= 1 ? 0.55 : 0.2,
                        opacity: activePhase >= 2 ? 0.95 : 0.45,
                      }}
                      transition={{ duration: 0.75, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Active Animated Lime Conduit (ARET -> SuS) */}
                    <motion.path
                      d="M 266 70 C 185 98, 95 98, 14 70"
                      fill="none"
                      stroke="#B8FF00"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      initial={{ pathLength: 0, opacity: 0.25 }}
                      animate={{
                        pathLength: activePhase >= 2 ? 1 : activePhase >= 1 ? 0.45 : 0.15,
                        opacity: activePhase >= 2 ? 0.95 : 0.45,
                      }}
                      transition={{ duration: 0.85, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
                    />

                    {/* Terminal Docking Nodes */}
                    <circle cx="14" cy="34" r="3.5" fill="#00F0FF" />
                    <circle cx="266" cy="34" r="3.5" fill="#00F0FF" />
                    <circle cx="266" cy="70" r="3.5" fill="#B8FF00" />
                    <circle cx="14" cy="70" r="3.5" fill="#B8FF00" />

                    {/* Traveling Neural Pulses along horizontal bridge */}
                    <motion.circle
                      cx="14"
                      cy="19"
                      r="4"
                      fill="#E0FFFF"
                      animate={{
                        x: [0, 252],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 1.7,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 0.4,
                      }}
                    />
                    <motion.circle
                      cx="266"
                      cy="85"
                      r="4"
                      fill="#E8FF99"
                      animate={{
                        x: [0, -252],
                        opacity: [0, 1, 1, 0],
                      }}
                      transition={{
                        duration: 1.7,
                        repeat: Infinity,
                        ease: 'easeInOut',
                        delay: 1.1,
                      }}
                    />
                  </svg>

                  {/* Synchronized Neural Packets */}
                  <div className="mt-1 flex flex-wrap justify-center gap-1.5">
                    {spec.packets.map((pkt, idx) => {
                      const synced = activePhase >= 2 || idx === 0;
                      return (
                        <motion.span
                          key={pkt}
                          initial={{ opacity: 0.4, scale: 0.95 }}
                          animate={{
                            opacity: synced ? 1 : 0.55,
                            scale: activePhase === 2 && idx === 1 ? 1.05 : 1,
                          }}
                          transition={{ duration: 0.3 }}
                          className={`rounded-md border px-2.5 py-1 font-mono text-[10px] font-semibold ${
                            idx % 2 === 0
                              ? 'border-[#00F0FF]/40 bg-[#00F0FF]/10 text-[#00F0FF]'
                              : 'border-[#B8FF00]/40 bg-[#B8FF00]/10 text-[#B8FF00]'
                          }`}
                        >
                          {pkt}
                        </motion.span>
                      );
                    })}
                  </div>
                </div>

                {/* RIGHT ENTITY: ARET Flying Octagram Crystal Core */}
                <motion.div
                  initial={{ x: 96, y: -20, opacity: 0, scale: 0.78, rotate: 24 }}
                  animate={{
                    x: 0,
                    y: [0, 5, 0],
                    opacity: 1,
                    scale: currentPhase.emphasis === 'aret' ? 1.04 : 1,
                    rotate: 0,
                  }}
                  transition={{
                    x: { duration: 0.82, delay: 0.16, ease: [0.16, 1, 0.3, 1] },
                    opacity: { duration: 0.55, delay: 0.16 },
                    rotate: { duration: 0.9, delay: 0.16, ease: [0.16, 1, 0.3, 1] },
                    scale: { duration: 0.45 },
                    y: { duration: 3.6, repeat: Infinity, ease: 'easeInOut', delay: 0.95 },
                  }}
                  className="lg:col-span-4 flex flex-col items-center text-center"
                >
                  <div className="relative flex h-32 w-32 items-center justify-center">
                    <svg viewBox="0 0 128 128" className="h-32 w-32" aria-hidden="true">
                      <defs>
                        <radialGradient id="aretCrystalGlow" cx="50%" cy="50%" r="50%">
                          <stop offset="0%" stopColor="#F0FFC2" />
                          <stop offset="50%" stopColor="#B8FF00" stopOpacity="0.65" />
                          <stop offset="100%" stopColor="#3F6212" stopOpacity="0.1" />
                        </radialGradient>
                      </defs>

                      {/* Outer Precision Caliper Ring */}
                      <motion.circle
                        cx="64"
                        cy="64"
                        r="56"
                        fill="none"
                        stroke="#B8FF00"
                        strokeOpacity="0.55"
                        strokeWidth="1.5"
                        strokeDasharray="10 6 2 6"
                        animate={{ rotate: -360 }}
                        transition={{ duration: 18, repeat: Infinity, ease: 'linear' }}
                        style={{ originX: '64px', originY: '64px' }}
                      />

                      {/* Rotating Diamond Telemetry Frame */}
                      <motion.polygon
                        points="64,16 112,64 64,112 16,64"
                        fill="none"
                        stroke="#00F0FF"
                        strokeOpacity="0.55"
                        strokeWidth="1.4"
                        animate={{ rotate: 360 }}
                        transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                        style={{ originX: '64px', originY: '64px' }}
                      />

                      {/* Inner Octagonal Crystal Core */}
                      <motion.polygon
                        points="64,28 89,39 100,64 89,89 64,100 39,89 28,64 39,39"
                        fill="url(#aretCrystalGlow)"
                        stroke="#B8FF00"
                        strokeWidth="1.8"
                        animate={{ scale: [0.97, 1.03, 0.97] }}
                        transition={{ duration: 2.8, repeat: Infinity, ease: 'easeInOut' }}
                        style={{ originX: '64px', originY: '64px' }}
                      />

                      {/* Inner Facet Lines */}
                      <line
                        x1="64"
                        y1="28"
                        x2="64"
                        y2="100"
                        stroke="#B8FF00"
                        strokeOpacity="0.35"
                        strokeWidth="1"
                      />
                      <line
                        x1="28"
                        y1="64"
                        x2="100"
                        y2="64"
                        stroke="#B8FF00"
                        strokeOpacity="0.35"
                        strokeWidth="1"
                      />
                    </svg>

                    <div className="absolute inset-0 flex items-center justify-center">
                      <Cpu className="h-6 w-6 text-[#05080F]" aria-hidden="true" />
                    </div>
                  </div>

                  {/* ARET 12-Bar Diagnostic Spectrum */}
                  <div
                    className="mt-2 flex items-end justify-center gap-1 h-6"
                    aria-hidden="true"
                  >
                    {spec.aretSpectrum.map((ratio, idx) => (
                      <motion.span
                        key={idx}
                        animate={{
                          scaleY: [ratio * 0.45, ratio, ratio * 0.6],
                        }}
                        transition={{
                          duration: 1.4,
                          delay: idx * 0.06,
                          repeat: Infinity,
                          repeatType: 'reverse',
                          ease: 'easeInOut',
                        }}
                        style={{
                          height: '22px',
                          originY: 1,
                          backgroundColor: idx % 3 === 0 ? '#00F0FF' : '#B8FF00',
                        }}
                        className="w-1 rounded-full"
                      />
                    ))}
                  </div>

                  <p className="mt-2.5 font-display text-sm font-bold text-white flex items-center gap-1.5">
                    <Cpu className="h-3.5 w-3.5 text-[#B8FF00]" aria-hidden="true" />
                    <span>ARET Gyro Core</span>
                  </p>
                  <p className="mt-0.5 text-[11px] text-slate-400">
                    Sept 2026 Engine · Starting ₹1,299
                  </p>
                </motion.div>
              </div>
            </div>

            {/* Interactive 4-Phase Sequence Timeline */}
            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {spec.phases.map((phase, idx) => {
                const isActive = idx === activePhase;
                const isDone = idx < activePhase;
                const accentHex =
                  phase.emphasis === 'aret'
                    ? '#B8FF00'
                    : phase.emphasis === 'sus'
                      ? '#00F0FF'
                      : '#B8FF00';

                return (
                  <button
                    key={phase.id}
                    type="button"
                    onClick={() => setActivePhase(idx)}
                    className={`rounded-xl border p-3.5 text-left transition-colors cursor-pointer ${
                      isActive
                        ? 'border-[#00F0FF]/70 bg-[#0D1626]'
                        : isDone
                          ? 'border-[#B8FF00]/35 bg-[#0B121C]'
                          : 'border-white/10 bg-[#0A0E17] hover:border-white/25'
                    }`}
                  >
                    <p
                      className="font-mono text-[11px] font-semibold"
                      style={{ color: isActive || isDone ? accentHex : '#94A3B8' }}
                    >
                      {phase.title}
                    </p>
                    <p className="mt-1 text-[11px] leading-relaxed text-slate-300">
                      {phase.caption}
                    </p>
                    <div className="mt-2.5 h-1 w-full overflow-hidden rounded-full bg-white/10">
                      <motion.div
                        initial={{ scaleX: 0 }}
                        animate={{ scaleX: isDone ? 1 : isActive ? 1 : 0.15 }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        style={{ originX: 0, backgroundColor: accentHex }}
                        className="h-full w-full rounded-full"
                      />
                    </div>
                  </button>
                );
              })}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.section>
  );
}
