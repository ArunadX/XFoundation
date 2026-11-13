import { ArrowLeft, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { OLYMPIADS } from '../data/olympiadData';
import type { OlympiadId, PageRoute } from '../types/olympiad';
import { PageIntroHeader, SectionCardSweep } from '../components/MotionPrimitives';

interface StructurePageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectOlympiadForRegistration: (id: OlympiadId) => void;
}

export function StructurePage({
  onNavigate,
  onSelectOlympiadForRegistration,
}: StructurePageProps) {
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
          kicker="Official Paper Pattern & Weightage"
          title="Olympiad Exam Structure"
          subtitle="Complete question counts, per-section mark allocations, duration, and negative marking rules for every 2026 X Olympiad."
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('syllabus')}
              className="rounded-lg border border-white/15 bg-[#0D111A] px-4 py-2 text-xs font-semibold text-slate-200 hover:border-[#00F0FF]/55 hover:text-[#00F0FF] transition-colors cursor-pointer"
            >
              View Syllabus Topics
            </button>
          }
        />

        <div className="mt-8 space-y-8">
          {OLYMPIADS.map((exam, idx) => (
            <SectionCardSweep
              key={exam.id}
              index={idx}
              accent={idx % 2 === 0 ? 'cyan' : 'lime'}
              className="rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8"
            >
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <div className="text-xs text-slate-400 flex flex-wrap items-center gap-2 tabular-nums">
                    <span className="font-mono font-semibold text-[#00F0FF]">{exam.code}</span>
                    <span aria-hidden="true">·</span>
                    <span>Total {exam.totalQuestions} Questions</span>
                    <span aria-hidden="true">·</span>
                    <span>Time: {exam.durationLabel}</span>
                    <span aria-hidden="true">·</span>
                    <span className="text-[#B8FF00] font-semibold">
                      Grand Total: {exam.totalMarks} Marks
                    </span>
                  </div>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    {exam.name}
                  </h2>
                </div>

                <button
                  type="button"
                  onClick={() => onSelectOlympiadForRegistration(exam.id)}
                  className="rounded-lg border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-4 py-2 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors whitespace-nowrap shrink-0 self-start md:self-auto cursor-pointer"
                >
                  Register for {exam.code}
                </button>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="w-full min-w-[620px] text-left border-collapse">
                  <thead>
                    <tr className="border-b border-white/10 text-xs font-medium text-slate-400">
                      <th className="py-3 pr-4">Section</th>
                      <th className="py-3 px-4">Questions</th>
                      <th className="py-3 px-4">Marks / Question</th>
                      <th className="py-3 px-4">Section Marks</th>
                      <th className="py-3 pl-4">Negative Marking</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/8 text-sm tabular-nums">
                    {exam.sections.map((sec) => {
                      const hasPenalty = sec.negativeMarking.startsWith('-1');
                      return (
                        <tr key={sec.sectionName}>
                          <td className="py-3.5 pr-4 font-medium text-white">
                            {sec.sectionName}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-200">
                            {sec.questionCount}
                          </td>
                          <td className="py-3.5 px-4 font-mono text-slate-200">
                            {sec.marksPerQuestion}
                          </td>
                          <td className="py-3.5 px-4 font-mono font-semibold text-[#00F0FF]">
                            {sec.totalMarks}
                          </td>
                          <td className="py-3.5 pl-4">
                            {hasPenalty ? (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-300">
                                <AlertTriangle className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{sec.negativeMarking}</span>
                              </span>
                            ) : (
                              <span className="inline-flex items-center gap-1.5 text-xs font-medium text-[#B8FF00]">
                                <CheckCircle2 className="h-3.5 w-3.5" aria-hidden="true" />
                                <span>{sec.negativeMarking}</span>
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <p className="mt-4 text-xs text-slate-300 border-t border-white/10 pt-4">
                {exam.negativeMarkingSummary}
              </p>
            </SectionCardSweep>
          ))}
        </div>
      </div>
    </section>
  );
}
