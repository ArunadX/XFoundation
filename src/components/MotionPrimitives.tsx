import type { ReactNode } from 'react';
import { motion } from 'motion/react';

export function PageTransition({
  routeKey,
  children,
}: {
  routeKey: string;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={routeKey}
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function MotionReveal({
  children,
  delay = 0,
  className = '',
}: {
  children: ReactNode;
  delay?: number;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{ duration: 0.36, delay, ease: [0.16, 1, 0.3, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function MotionCard({
  children,
  className = '',
  index = 0,
}: {
  children: ReactNode;
  className?: string;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.1 }}
      transition={{
        duration: 0.3,
        delay: Math.min(index * 0.04, 0.28),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -3 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

export function OobeSlideTransition({
  stepKey,
  direction,
  children,
}: {
  stepKey: number | string;
  direction: 1 | -1;
  children: ReactNode;
}) {
  return (
    <motion.div
      key={stepKey}
      initial={{ opacity: 0, x: direction * 36, scale: 0.99 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: direction * -36, scale: 0.99 }}
      transition={{ duration: 0.2, ease: [0.16, 1, 0.3, 1] }}
    >
      {children}
    </motion.div>
  );
}

export function OobeAmbientStage({ children }: { children: ReactNode }) {
  return (
    <div className="relative overflow-hidden rounded-2xl border border-[#00F0FF]/25 bg-[#090D16] shadow-2xl">
      {/* Subtle animated OOBE atmospheric gradient sweep */}
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: [0.22, 0.42, 0.22],
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 7, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -top-28 -right-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(0,240,255,0.22),transparent_68%)] blur-2xl"
      />
      <motion.div
        aria-hidden="true"
        animate={{
          opacity: [0.14, 0.3, 0.14],
          scale: [1.04, 0.96, 1.04],
        }}
        transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut' }}
        className="pointer-events-none absolute -bottom-28 -left-24 h-72 w-72 rounded-full bg-[radial-gradient(circle,rgba(184,255,0,0.16),transparent_68%)] blur-2xl"
      />
      <div className="relative z-10">{children}</div>
    </div>
  );
}

export function PageIntroHeader({
  kicker,
  title,
  subtitle,
  kickerColor = 'text-[#00F0FF]',
  rightSlot,
}: {
  kicker: string;
  title: string;
  subtitle?: string;
  kickerColor?: string;
  rightSlot?: ReactNode;
}) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.25 }}
      className="mt-4"
    >
      <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
        <div className="max-w-2xl">
          <motion.p
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.34, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
            className={`text-xs font-medium tracking-wide ${kickerColor}`}
          >
            {kicker}
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.42, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            className="mt-2 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
            style={{ textWrap: 'balance' }}
          >
            {title}
          </motion.h1>
          {subtitle && (
            <motion.p
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.16, ease: [0.16, 1, 0.3, 1] }}
              className="mt-2 text-sm text-slate-300 leading-relaxed"
            >
              {subtitle}
            </motion.p>
          )}
        </div>
        {rightSlot && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="shrink-0"
          >
            {rightSlot}
          </motion.div>
        )}
      </div>

      {/* Precision hairline rule sweep */}
      <motion.div
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        animate={{ scaleX: 1 }}
        transition={{ duration: 0.6, delay: 0.14, ease: [0.16, 1, 0.3, 1] }}
        style={{ originX: 0 }}
        className="mt-5 h-px w-full bg-gradient-to-r from-[#00F0FF]/55 via-white/15 to-transparent"
      />
    </motion.div>
  );
}

export function MetricCardIntro({
  index = 0,
  accent = 'cyan',
  children,
  className = '',
}: {
  index?: number;
  accent?: 'cyan' | 'lime' | 'neutral';
  children: ReactNode;
  className?: string;
}) {
  const accentBar =
    accent === 'lime'
      ? 'bg-gradient-to-r from-[#B8FF00] via-[#B8FF00]/40 to-transparent'
      : accent === 'cyan'
        ? 'bg-gradient-to-r from-[#00F0FF] via-[#00F0FF]/40 to-transparent'
        : 'bg-gradient-to-r from-white/40 to-transparent';

  return (
    <motion.div
      initial={{ opacity: 0, y: 14, scale: 0.985 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, amount: 0.15 }}
      transition={{
        duration: 0.36,
        delay: Math.min(index * 0.06, 0.28),
        ease: [0.16, 1, 0.3, 1],
      }}
      whileHover={{ y: -2 }}
      className={`relative overflow-hidden rounded-lg bg-[#0D111A] border border-white/10 px-5 py-4 ${className}`}
    >
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.15 }}
        transition={{
          duration: 0.55,
          delay: 0.14 + Math.min(index * 0.07, 0.3),
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ originX: 0 }}
        className={`pointer-events-none absolute top-0 left-0 right-0 h-[2px] ${accentBar}`}
      />
      {children}
    </motion.div>
  );
}

export function SectionCardSweep({
  index = 0,
  children,
  className = '',
  accent = 'cyan',
}: {
  index?: number;
  children: ReactNode;
  className?: string;
  accent?: 'cyan' | 'lime';
}) {
  return (
    <motion.article
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.08 }}
      transition={{
        duration: 0.36,
        delay: Math.min(index * 0.05, 0.25),
        ease: [0.16, 1, 0.3, 1],
      }}
      className={`relative overflow-hidden ${className}`}
    >
      <motion.span
        aria-hidden="true"
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true, amount: 0.08 }}
        transition={{
          duration: 0.55,
          delay: 0.12 + Math.min(index * 0.05, 0.25),
          ease: [0.16, 1, 0.3, 1],
        }}
        style={{ originX: 0 }}
        className={`pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] ${
          accent === 'lime'
            ? 'bg-gradient-to-r from-[#B8FF00]/75 via-[#B8FF00]/20 to-transparent'
            : 'bg-gradient-to-r from-[#00F0FF]/70 via-[#00F0FF]/15 to-transparent'
        }`}
      />
      {children}
    </motion.article>
  );
}


