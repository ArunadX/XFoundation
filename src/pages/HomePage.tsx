import { useState } from 'react';
import {
  ArrowRight,
  BookOpen,
  Bot,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Cpu,
  FileCheck2,
  Layers,
  Newspaper,
  Search,
  ShoppingBag,
  AlertCircle,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import {
  ARET_LAUNCH_INFO,
  FOUNDATION_INFO,
  HOME_PREVIEW_QUESTIONS,
  OLYMPIADS,
} from '../data/olympiadData';
import type { OlympiadId, PageRoute } from '../types/olympiad';
import { CountdownClock } from '../components/CountdownClock';
import { Olympiad3DCanvas, type GyroMode } from '../components/Olympiad3DCanvas';
import {
  MetricCardIntro,
  MotionReveal,
  SectionCardSweep,
} from '../components/MotionPrimitives';

interface HomePageProps {
  registeredCount: number;
  cartItemCount: number;
  onNavigate: (page: PageRoute) => void;
  onSelectOlympiadForRegistration: (id: OlympiadId) => void;
}

const GRID_MAIN_MENU: Array<{
  page: PageRoute;
  title: string;
  subtitle: string;
  actionLabel: string;
  icon: typeof ClipboardCheck;
  highlight?: 'cyan' | 'lime';
}> = [
  {
    page: 'registration',
    title: 'Registration',
    subtitle: 'Enroll for IXMO, IXSO, IXEO, IXCO & Grades 10–12 Track (FREEXOLYMPIAD = Free).',
    actionLabel: 'Open Registration',
    icon: ClipboardCheck,
  },
  {
    page: 'syllabus',
    title: 'Syllabus',
    subtitle: 'Explore chapter-wise syllabus topics for IXMO & IXSO and official track notices.',
    actionLabel: 'View Syllabus',
    icon: BookOpen,
  },
  {
    page: 'structure',
    title: 'Structure',
    subtitle: 'Inspect 50-question section distributions, mark weights, and negative marking rules.',
    actionLabel: 'Inspect Structure',
    icon: Layers,
  },
  {
    page: 'dates',
    title: 'Dates',
    subtitle: 'Track exam dates and live registration closing countdown timers for all Olympiads.',
    actionLabel: 'See Schedule',
    icon: Calendar,
  },
  {
    page: 'shop',
    title: 'Shop',
    subtitle: 'Chapter Question Banks (₹100, 2/₹100, 10/₹500) & 8-Yr PYPs (FREEMATERIAL = Free).',
    actionLabel: 'Browse Shop',
    icon: ShoppingBag,
  },
  {
    page: 'admit-card',
    title: 'Admit Card',
    subtitle: 'Admit cards will be announced soon (10 Nov window). View release countdown.',
    actionLabel: 'Check Countdown',
    icon: FileCheck2,
  },
  {
    page: 'news',
    title: 'News',
    subtitle: 'Admit Card & Sample Paper announcements, results verification, and record lookup.',
    actionLabel: 'Read News & Results',
    icon: Newspaper,
  },
  {
    page: 'sus',
    title: 'SuS Help-Service',
    subtitle: 'Systematic User Help-Service for instant answers on dates, rules, and bundles.',
    actionLabel: 'Ask SuS Now',
    icon: Bot,
    highlight: 'cyan',
  },
  {
    page: 'aret',
    title: 'ARET Preview & Full',
    subtitle: 'Automated Responsive Educational Tool · 1 Free Try Preview + Code-Gated Full Suite.',
    actionLabel: 'Launch ARET',
    icon: Cpu,
    highlight: 'lime',
  },
  {
    page: 'search',
    title: 'Search Portal',
    subtitle: 'Search chapters, Olympiads, 8-Year PYPs, exam dates, news, and coupon codes.',
    actionLabel: 'Open Search',
    icon: Search,
  },
];

export function HomePage({
  registeredCount,
  cartItemCount,
  onNavigate,
  onSelectOlympiadForRegistration,
}: HomePageProps) {
  const [gyroMode, setGyroMode] = useState<GyroMode>('orbital');
  const [selectedPreviewId, setSelectedPreviewId] = useState<string>(
    HOME_PREVIEW_QUESTIONS[0].id
  );
  const [selectedOptions, setSelectedOptions] = useState<Record<string, number>>({});
  const [checkedIds, setCheckedIds] = useState<Record<string, boolean>>({});

  const activePreview =
    HOME_PREVIEW_QUESTIONS.find((q) => q.id === selectedPreviewId) ??
    HOME_PREVIEW_QUESTIONS[0];

  const chosenOption = selectedOptions[activePreview.id];
  const isChecked = Boolean(checkedIds[activePreview.id]);

  return (
    <div>
      {/* 1. Hero & About Section with Interactive 3D Gyroscope Core */}
      <section className="border-b border-white/10 bg-[#06080D]">
        <div className="mx-auto max-w-7xl px-6 pt-12 pb-14 lg:pt-16 lg:pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-stretch">
            <div className="lg:col-span-6 flex flex-col justify-between py-2">
              <div>
                <motion.p
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.35, delay: 0.04, ease: [0.16, 1, 0.3, 1] }}
                  className="text-sm font-medium tracking-wide text-[#00F0FF]"
                >
                  Founded {FOUNDATION_INFO.foundedYear} · {FOUNDATION_INFO.headquarters}
                </motion.p>
                <motion.h1
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.48, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-4 font-display font-bold tracking-tight text-white leading-[1.08]"
                  style={{
                    fontSize: 'clamp(2.25rem, 4vw, 3.6rem)',
                    textWrap: 'balance',
                  }}
                >
                  Fostering Young Minds Across Global Olympiads.
                </motion.h1>
                <motion.p
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.42, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
                  className="mt-5 max-w-xl text-base leading-relaxed text-slate-300"
                >
                  {FOUNDATION_INFO.aboutLead}
                </motion.p>
              </div>

              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.24, ease: [0.16, 1, 0.3, 1] }}
                className="mt-8 flex flex-wrap items-center gap-3.5"
              >
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => onNavigate('registration')}
                  className="neon-cta inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <span>Register for 2026 Olympiads</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  type="button"
                  onClick={() => onNavigate('aret')}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#B8FF00]/50 bg-[#B8FF00]/10 px-5 py-3 text-sm font-semibold text-[#B8FF00] hover:bg-[#B8FF00] hover:text-[#05080F] transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  <Cpu className="h-4 w-4" aria-hidden="true" />
                  <span>Preview ARET · ₹1,299</span>
                </motion.button>
              </motion.div>
            </div>

            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.48, delay: 0.12, ease: [0.16, 1, 0.3, 1] }}
              className="relative lg:col-span-6 flex flex-col overflow-hidden rounded-xl border border-[#00F0FF]/25 bg-[#070A12]"
            >
              {/* Animated precision viewport brackets on 3D frame */}
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, x: -8, y: -8 }}
                animate={{ opacity: 0.75, x: 0, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="pointer-events-none absolute top-2.5 left-2.5 z-10 h-3 w-3 border-t-2 border-l-2 border-[#00F0FF]"
              />
              <motion.span
                aria-hidden="true"
                initial={{ opacity: 0, x: 8, y: -8 }}
                animate={{ opacity: 0.75, x: 0, y: 0 }}
                transition={{ duration: 0.4, delay: 0.25 }}
                className="pointer-events-none absolute top-2.5 right-2.5 z-10 h-3 w-3 border-t-2 border-r-2 border-[#00F0FF]"
              />
              <Olympiad3DCanvas
                mode={gyroMode}
                accent="cyan"
                className="h-[290px] sm:h-[340px] w-full flex-1"
                label="Interactive 3D X Olympiad Foundation Polyhedron Core"
              />
              <div className="border-t border-white/10 bg-[#0D111A] px-4 sm:px-5 py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                <div className="text-[11px] sm:text-xs text-slate-300 flex flex-wrap items-center gap-x-2">
                  <span className="font-mono text-[#00F0FF]">3D Core</span>
                  <span aria-hidden="true" className="text-slate-600">·</span>
                  <span>
                    {registeredCount > 0
                      ? `${registeredCount} Submitted`
                      : 'Drag to Rotate'}
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  {(['orbital', 'diagnostic', 'harmonic'] as GyroMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGyroMode(m)}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                        gyroMode === m
                          ? 'bg-[#00F0FF] text-[#05080F] font-semibold'
                          : 'bg-[#121723] text-slate-300 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <div className="mt-10 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/10 pt-8">
            <MetricCardIntro index={0} accent="neutral">
              <p className="text-xs text-slate-400">Established</p>
              <p className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
                2018 · Ghaziabad
              </p>
            </MetricCardIntro>
            <MetricCardIntro index={1} accent="cyan">
              <p className="text-xs text-slate-400">2026 Tracks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-white tabular-nums">
                5 Olympiads
              </p>
            </MetricCardIntro>
            <MetricCardIntro index={2} accent="cyan">
              <p className="text-xs text-slate-400">Chapter Banks</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#00F0FF] tabular-nums">
                ₹100 / Bank
              </p>
            </MetricCardIntro>
            <MetricCardIntro index={3} accent="lime">
              <p className="text-xs text-slate-400">ARET Sept 2026</p>
              <p className="mt-1 font-display text-2xl font-semibold text-[#B8FF00] tabular-nums">
                From ₹1,299
              </p>
            </MetricCardIntro>
          </div>
        </div>
      </section>

      {/* 2. Grid-Based Main Menu & Quick Links (10 Tiles including SuS & ARET) */}
      <section aria-labelledby="main-menu-heading" className="border-b border-white/10 bg-[#080B12] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#00F0FF]">
                Foundation Portal Navigation
              </p>
              <h2 id="main-menu-heading" className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
                Main Menu &amp; Quick Links
              </h2>
            </div>
            <p className="text-xs text-slate-400">
              Dedicated pages for Registration, Study Packs, SuS Help-Service &amp; ARET
            </p>
          </div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
            {GRID_MAIN_MENU.map((tile, index) => {
              const Icon = tile.icon;
              const badgeSuffix =
                tile.page === 'checkout' && cartItemCount > 0
                  ? ` (${cartItemCount})`
                  : '';
              const borderClass =
                tile.highlight === 'lime'
                  ? 'border-[#B8FF00]/35 hover:border-[#B8FF00]'
                  : tile.highlight === 'cyan'
                    ? 'border-[#00F0FF]/35 hover:border-[#00F0FF]'
                    : 'border-white/10 hover:border-[#00F0FF]/55';
              return (
                <motion.button
                  key={tile.page}
                  type="button"
                  initial={{ opacity: 0, y: 12 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, amount: 0.1 }}
                  transition={{
                    duration: 0.28,
                    delay: Math.min(index * 0.03, 0.25),
                    ease: [0.16, 1, 0.3, 1],
                  }}
                  whileHover={{ y: -3 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => onNavigate(tile.page)}
                  className={`group flex flex-col justify-between rounded-xl border bg-[#0D111A] p-5 text-left transition-colors duration-200 cursor-pointer ${borderClass}`}
                >
                  <div>
                    <div className="flex items-center justify-between">
                      <span className="font-mono text-xs text-slate-400 tabular-nums">
                        {String(index + 1).padStart(2, '0')}
                      </span>
                      <Icon
                        className={`h-5 w-5 transition-colors ${
                          tile.highlight === 'lime'
                            ? 'text-[#B8FF00]'
                            : 'text-[#00F0FF] group-hover:text-[#B8FF00]'
                        }`}
                        aria-hidden="true"
                      />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold text-white">
                      {tile.title}
                      {badgeSuffix}
                    </h3>
                    <p className="mt-2 text-xs leading-relaxed text-slate-300">
                      {tile.subtitle}
                    </p>
                  </div>

                  <div
                    className={`mt-5 flex items-center gap-1.5 text-xs font-semibold group-hover:translate-x-0.5 transition-transform ${
                      tile.highlight === 'lime' ? 'text-[#B8FF00]' : 'text-[#00F0FF]'
                    }`}
                  >
                    <span>{tile.actionLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                  </div>
                </motion.button>
              );
            })}
          </div>

          {/* Dual Spotlight Ads: ARET Sept 2026 Launch + Study Pack Bundles */}
          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
            <MotionReveal className="rounded-xl border border-[#B8FF00]/35 bg-gradient-to-r from-[#0E1812] via-[#0D111A] to-[#0D1522] p-6 flex flex-col justify-between gap-5">
              <div>
                <p className="text-xs font-mono font-semibold text-[#B8FF00]">
                  SEPTEMBER 2026 LAUNCH · STARTING AT ₹{ARET_LAUNCH_INFO.startingPriceInr.toLocaleString('en-IN')}
                </p>
                <h3 className="mt-1.5 font-display text-xl font-bold text-white">
                  ARET — Automated Responsive Educational Tool
                </h3>
                <p className="mt-1.5 text-sm text-slate-300">
                  Evaluates your IXMO PYP performance, generates custom questions with your chosen options via SuS, and builds an in-depth analysis report.
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-3">
                <button
                  type="button"
                  onClick={() => onNavigate('aret')}
                  className="rounded-lg bg-[#B8FF00] px-4 py-2.5 text-xs font-semibold text-[#05080F] hover:bg-[#ccff40] transition-colors cursor-pointer"
                >
                  Open ARET Preview
                </button>
                <button
                  type="button"
                  onClick={() => onNavigate('sus')}
                  className="rounded-lg border border-white/15 px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-colors cursor-pointer"
                >
                  Ask SuS Help-Service
                </button>
              </div>
            </MotionReveal>

            <MotionReveal delay={0.08} className="rounded-xl border border-[#00F0FF]/35 bg-gradient-to-r from-[#0D1522] via-[#0D111A] to-[#0E1812] p-6 flex flex-col justify-between gap-5">
              <div>
                <p className="text-xs font-mono font-semibold text-[#00F0FF]">
                  2026 ACADEMIC BUNDLE SPOTLIGHT
                </p>
                <h3 className="mt-1.5 font-display text-xl font-bold text-white">
                  Save up to 50% on Chapter Question Banks &amp; 8-Year PYPs
                </h3>
                <p className="mt-1.5 text-sm text-slate-300 tabular-nums">
                  1 Bank ₹100 · Bundle of 2 for ₹100 · Bundle of 10 for ₹500 · Any 2 Last-8-Years PYP Bundles for ₹500.
                </p>
              </div>
              <div>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="neon-cta rounded-lg px-5 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Visit Study Pack Shop
                </button>
              </div>
            </MotionReveal>
          </div>
        </div>
      </section>

      {/* 3. Question Banks & Previous Year Papers Preview */}
      <section aria-labelledby="samples-preview-heading" className="border-b border-white/10 bg-[#06080D] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#00F0FF]">
                Sample Question Previews
              </p>
              <h2 id="samples-preview-heading" className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
                Question Banks &amp; Previous Year Papers
              </h2>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Test authentic sample problems drawn from IXMO, IXSO, IXEO, and IXCO previous year papers. Full sample papers will be shared soon.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('syllabus')}
                className="rounded-lg border border-white/15 bg-[#0D111A] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors cursor-pointer"
              >
                Explore Full Syllabus
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="neon-cta rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Shop 8-Year PYP Bundles
              </button>
            </div>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-4 space-y-2.5">
              {HOME_PREVIEW_QUESTIONS.map((item) => {
                const isActive = item.id === activePreview.id;
                return (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => setSelectedPreviewId(item.id)}
                    className={`w-full rounded-xl border p-4 text-left transition-all cursor-pointer ${
                      isActive
                        ? 'border-[#00F0FF]/65 bg-[#0D1522]'
                        : 'border-white/10 bg-[#0D111A] hover:border-white/25'
                    }`}
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono font-semibold text-[#00F0FF]">
                        {item.olympiadCode}
                      </span>
                      <span className="text-slate-400">{item.sourceType}</span>
                    </div>
                    <p className="mt-1.5 text-sm font-semibold text-white">
                      {item.olympiadName}
                    </p>
                  </button>
                );
              })}
            </div>

            <div className="lg:col-span-8 rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8 overflow-hidden">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activePreview.id}
                  initial={{ opacity: 0, x: 14 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -14 }}
                  transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
                >
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-white/10 pb-4 text-xs">
                    <span className="font-mono font-semibold text-[#00F0FF]">
                      {activePreview.olympiadCode} · {activePreview.sourceType}
                    </span>
                    <span className="text-slate-400">{activePreview.olympiadName}</span>
                  </div>

                  {activePreview.passage && (
                    <blockquote className="mt-5 rounded-lg bg-[#06080D] border border-white/10 p-4 text-sm italic leading-relaxed text-slate-200">
                      “{activePreview.passage}”
                    </blockquote>
                  )}

                  <h3 className="mt-5 text-base sm:text-lg font-semibold leading-relaxed text-white">
                    {activePreview.prompt}
                  </h3>

                  {activePreview.statements && (
                    <div className="mt-3 space-y-1 font-mono text-xs text-slate-300">
                      {activePreview.statements.map((st) => (
                        <p key={st}>{st}</p>
                      ))}
                    </div>
                  )}

                  <div className="mt-5 space-y-2.5" role="radiogroup" aria-label="Sample preview answer choices">
                    {activePreview.options.map((opt, idx) => {
                      const letter = String.fromCharCode(65 + idx);
                      const selected = chosenOption === idx;
                      const isCorrect = idx === activePreview.correctIndex;

                      let style = 'border-white/10 bg-[#121723] text-slate-200 hover:border-white/30';
                      if (isChecked) {
                        if (isCorrect) {
                          style = 'border-[#B8FF00]/70 bg-[#B8FF00]/10 text-white';
                        } else if (selected) {
                          style = 'border-rose-400/70 bg-rose-500/10 text-rose-100';
                        }
                      } else if (selected) {
                        style = 'border-[#00F0FF] bg-[#00F0FF]/12 text-white';
                      }

                      return (
                        <button
                          key={letter}
                          type="button"
                          role="radio"
                          aria-checked={selected}
                          onClick={() => {
                            if (!isChecked) {
                              setSelectedOptions((prev) => ({
                                ...prev,
                                [activePreview.id]: idx,
                              }));
                            }
                          }}
                          className={`flex w-full items-center gap-3 rounded-lg border px-4 py-2.5 text-left text-sm transition-colors cursor-pointer ${style}`}
                        >
                          <span className="font-mono text-xs font-semibold text-[#00F0FF]">
                            ({letter})
                          </span>
                          <span className="flex-1">{opt}</span>
                        </button>
                      );
                    })}
                  </div>

                  <div className="mt-6 flex flex-wrap items-center gap-3">
                    {!isChecked ? (
                      <button
                        type="button"
                        disabled={typeof chosenOption !== 'number'}
                        onClick={() =>
                          setCheckedIds((prev) => ({ ...prev, [activePreview.id]: true }))
                        }
                        className={`rounded-lg px-5 py-2.5 text-xs font-semibold transition-colors ${
                          typeof chosenOption === 'number'
                            ? 'neon-cta cursor-pointer'
                            : 'border border-white/15 bg-[#121723] text-slate-400 cursor-not-allowed'
                        }`}
                      >
                        Verify Answer
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => {
                          setCheckedIds((prev) => ({ ...prev, [activePreview.id]: false }));
                          setSelectedOptions((prev) => {
                            const next = { ...prev };
                            delete next[activePreview.id];
                            return next;
                          });
                        }}
                        className="rounded-lg border border-white/20 bg-[#121723] px-4 py-2 text-xs font-semibold text-white hover:border-[#00F0FF] cursor-pointer"
                      >
                        Reset Preview
                      </button>
                    )}
                  </div>

                  {isChecked && (
                    <motion.div
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.24 }}
                      className="mt-5 rounded-lg border border-white/10 bg-[#06080D] p-4 text-sm"
                    >
                      <div className="flex items-center gap-2 font-semibold">
                        {chosenOption === activePreview.correctIndex ? (
                          <>
                            <CheckCircle2 className="h-4 w-4 text-[#B8FF00]" aria-hidden="true" />
                            <span className="text-[#B8FF00]">Correct</span>
                          </>
                        ) : (
                          <>
                            <AlertCircle className="h-4 w-4 text-rose-400" aria-hidden="true" />
                            <span className="text-rose-300">
                              Correct Answer: ({String.fromCharCode(65 + activePreview.correctIndex)})
                            </span>
                          </>
                        )}
                      </div>
                      <p className="mt-2 text-xs leading-relaxed text-slate-300">
                        {activePreview.explanation}
                      </p>
                    </motion.div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </div>
        </div>
      </section>

      {/* 4. Schedule & Registration Closing Countdowns on Home */}
      <section aria-labelledby="home-dates-heading" className="bg-[#080B12] py-16">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
            <div>
              <p className="text-xs font-medium tracking-wide text-[#00F0FF]">
                2026 Examination Schedule
              </p>
              <h2 id="home-dates-heading" className="mt-2 font-display text-3xl font-bold tracking-tight text-white">
                Olympiad Dates &amp; Closing Countdowns
              </h2>
            </div>
            <button
              type="button"
              onClick={() => onNavigate('dates')}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:underline self-start sm:self-auto cursor-pointer"
            >
              <span>Full Dates &amp; Countdowns Page</span>
              <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
            </button>
          </div>

          <div className="mt-8 overflow-x-auto rounded-xl border border-white/10 bg-[#0D111A]">
            <table className="w-full min-w-[760px] text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-xs font-medium text-slate-400">
                  <th className="px-5 py-4">Olympiad</th>
                  <th className="px-5 py-4">Exam Date</th>
                  <th className="px-5 py-4">Registration Closes</th>
                  <th className="px-5 py-4">Closing Countdown</th>
                  <th className="px-5 py-4 text-right">Register</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/8 text-sm">
                {OLYMPIADS.map((exam) => (
                  <tr key={exam.id} className="hover:bg-white/[0.02] transition-colors">
                    <td className="px-5 py-4">
                      <div className="font-semibold text-white">{exam.name}</div>
                      <div className="mt-0.5 text-xs text-slate-400 tabular-nums">
                        <span className="font-mono text-[#00F0FF]">{exam.code}</span> · {exam.eligibility}
                      </div>
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-white tabular-nums whitespace-nowrap">
                      {exam.examDateLabel}
                    </td>
                    <td className="px-5 py-4 font-mono text-xs text-slate-300 tabular-nums whitespace-nowrap">
                      {exam.registrationClosingLabel}
                    </td>
                    <td className="px-5 py-4 whitespace-nowrap">
                      <CountdownClock targetIso={exam.registrationClosingIso} compact />
                    </td>
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => onSelectOlympiadForRegistration(exam.id)}
                        className="rounded-md border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-3 py-1.5 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors cursor-pointer"
                      >
                        Register
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
