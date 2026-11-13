import { useState } from 'react';
import { ArrowLeft, BookOpen, Clock, ArrowRight } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OLYMPIADS } from '../data/olympiadData';
import { PageIntroHeader } from '../components/MotionPrimitives';
import type { OlympiadId, PageRoute } from '../types/olympiad';

interface SyllabusPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectOlympiadForRegistration: (id: OlympiadId) => void;
}

export function SyllabusPage({
  onNavigate,
  onSelectOlympiadForRegistration,
}: SyllabusPageProps) {
  const [selectedId, setSelectedId] = useState<OlympiadId>('ixmo');
  const activeExam = OLYMPIADS.find((o) => o.id === selectedId) ?? OLYMPIADS[0];

  return (
    <section className="bg-[#06080D] py-12 lg:py-16">
      <div className="mx-auto max-w-7xl px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <PageIntroHeader
          kicker="Official Curriculum Directory"
          title="Olympiad Syllabus (2026)"
          subtitle="Select an Olympiad track to inspect verified chapter topics or view pending syllabus notices."
          rightSlot={
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => onNavigate('structure')}
                className="rounded-lg border border-white/15 bg-[#0D111A] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#00F0FF]/55 hover:text-[#00F0FF] transition-colors cursor-pointer"
              >
                View Exam Structure
              </button>
              <button
                type="button"
                onClick={() => onNavigate('shop')}
                className="neon-cta rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
              >
                Shop Chapter Banks (₹100)
              </button>
            </div>
          }
        />

        {/* Olympiad Tabs */}
        <div
          role="tablist"
          aria-label="Select Olympiad syllabus"
          className="mt-7 flex flex-wrap items-center gap-2 border-b border-white/10 pb-5"
        >
          {OLYMPIADS.map((exam) => {
            const active = exam.id === activeExam.id;
            return (
              <button
                key={exam.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => setSelectedId(exam.id)}
                className={`relative rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  active
                    ? 'text-[#05080F]'
                    : 'border border-white/10 bg-[#0D111A] text-slate-300 hover:text-white'
                }`}
              >
                {active && (
                  <motion.span
                    layoutId="syllabus-tab-pill"
                    transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                    className="absolute inset-0 rounded-lg bg-[#00F0FF]"
                  />
                )}
                <span className="relative z-10">{exam.code} · {exam.shortName}</span>
              </button>
            );
          })}
        </div>

        {/* Active Syllabus Content */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeExam.id}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-8 overflow-hidden rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8"
          >
            <motion.span
              aria-hidden="true"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.48, ease: [0.16, 1, 0.3, 1] }}
              style={{ originX: 0 }}
              className="pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-[#00F0FF]/80 via-[#B8FF00]/40 to-transparent"
            />
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-6">
              <div>
                <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 tabular-nums">
                  <span className="font-mono text-[#00F0FF]">{activeExam.code}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeExam.eligibility}</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeExam.totalQuestions} Questions / {activeExam.totalMarks} Marks</span>
                  <span aria-hidden="true">·</span>
                  <span>{activeExam.durationLabel}</span>
                </div>
                <h2 className="mt-1.5 font-display text-2xl font-bold text-white">
                  {activeExam.name}
                </h2>
                <p className="mt-2 max-w-3xl text-sm text-slate-300">
                  {activeExam.syllabusSummary}
                </p>
              </div>

              <button
                type="button"
                onClick={() => onSelectOlympiadForRegistration(activeExam.id)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-4 py-2.5 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
              >
                <span>Register for {activeExam.code}</span>
                <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>

            {activeExam.syllabusAnnounced ? (
              <div className="mt-8 grid grid-cols-1 md:grid-cols-3 gap-8">
                {activeExam.syllabusChapters.map((group, gIdx) => (
                  <motion.div
                    key={group.group}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.28, delay: 0.06 + gIdx * 0.05 }}
                    className="space-y-4"
                  >
                    <div className="flex items-center gap-2 border-b border-white/10 pb-3">
                      <BookOpen className="h-4 w-4 text-[#00F0FF]" aria-hidden="true" />
                      <h3 className="font-display text-base font-semibold text-white">
                        {group.group}
                      </h3>
                    </div>
                    <ul className="space-y-2.5 text-sm text-slate-200">
                      {group.topics.map((topic, idx) => (
                        <li key={topic} className="flex items-baseline gap-2.5">
                          <span className="font-mono text-xs text-[#B8FF00] tabular-nums">
                            {String(idx + 1).padStart(2, '0')}
                          </span>
                          <span>{topic}</span>
                        </li>
                      ))}
                    </ul>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="mt-8 rounded-lg border border-amber-400/30 bg-[#06080D] p-6">
                <div className="flex items-center gap-2 text-sm font-semibold text-amber-300">
                  <Clock className="h-4 w-4" aria-hidden="true" />
                  <span>Topic-Wise Syllabus Not Yet Announced</span>
                </div>
                <p className="mt-2 text-sm text-slate-300 leading-relaxed">
                  The Academic Council has not yet published the granular chapter list for {activeExam.name}. You can inspect the complete section-wise marks distribution and negative marking rules on the Structure page, or prepare using the Last 8 Years PYP Bundle in the Shop.
                </p>
                <div className="mt-4 flex flex-wrap gap-3">
                  <button
                    type="button"
                    onClick={() => onNavigate('structure')}
                    className="rounded-lg border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-4 py-2 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors cursor-pointer"
                  >
                    Inspect {activeExam.code} Structure
                  </button>
                  <button
                    type="button"
                    onClick={() => onNavigate('shop')}
                    className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-slate-200 hover:border-white/35 cursor-pointer"
                  >
                    View 8-Year PYP Bundles
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </section>
  );
}
