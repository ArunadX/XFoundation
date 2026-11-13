import { ArrowLeft, Calendar, Clock } from 'lucide-react';
import { OLYMPIADS } from '../data/olympiadData';
import type { OlympiadId, PageRoute } from '../types/olympiad';
import { CountdownClock } from '../components/CountdownClock';
import { PageIntroHeader, SectionCardSweep } from '../components/MotionPrimitives';

interface DatesPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectOlympiadForRegistration: (id: OlympiadId) => void;
}

export function DatesPage({
  onNavigate,
  onSelectOlympiadForRegistration,
}: DatesPageProps) {
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
          kicker="2026 Examination Schedule"
          title="Olympiad Dates & Registration Countdowns"
          subtitle="Live countdown timers to registration closing for every X Olympiad Foundation examination."
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-6">
          {OLYMPIADS.map((exam, idx) => (
            <SectionCardSweep
              key={exam.id}
              index={idx}
              accent={idx % 2 === 0 ? 'cyan' : 'lime'}
              className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-7"
            >
              <div>
                <div className="flex items-center justify-between gap-3 text-xs">
                  <span className="font-mono font-semibold text-[#00F0FF]">
                    {exam.code} · {exam.eligibility}
                  </span>
                  <span className="text-slate-300 font-medium">{exam.status}</span>
                </div>

                <h2 className="mt-2 font-display text-xl font-bold text-white">
                  {exam.name}
                </h2>

                <div className="mt-4 grid grid-cols-2 gap-4 border-y border-white/10 py-4 text-xs tabular-nums">
                  <div>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Calendar className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                      <span>Examination Date</span>
                    </span>
                    <span className="mt-1 block font-mono text-sm font-semibold text-white">
                      {exam.examDateLabel}
                    </span>
                  </div>
                  <div>
                    <span className="flex items-center gap-1.5 text-slate-400">
                      <Clock className="h-3.5 w-3.5 text-[#B8FF00]" aria-hidden="true" />
                      <span>Registration Closes</span>
                    </span>
                    <span className="mt-1 block font-mono text-sm font-semibold text-white">
                      {exam.registrationClosingLabel}
                    </span>
                  </div>
                </div>

                <div className="mt-5">
                  <p className="mb-2.5 text-xs text-slate-400">
                    Time Remaining Until Registration Closes
                  </p>
                  <CountdownClock targetIso={exam.registrationClosingIso} />
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-5">
                <span className="font-mono text-sm font-semibold text-white tabular-nums">
                  Registration Fee: ₹{exam.feeInr}
                </span>
                <button
                  type="button"
                  onClick={() => onSelectOlympiadForRegistration(exam.id)}
                  className="neon-cta rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
                >
                  Register for {exam.code}
                </button>
              </div>
            </SectionCardSweep>
          ))}
        </div>
      </div>
    </section>
  );
}
