import { ArrowLeft, Calendar, Lock } from 'lucide-react';
import { motion } from 'motion/react';
import type { PageRoute } from '../types/olympiad';
import { CountdownClock } from '../components/CountdownClock';
import { getNextAdmitCardReleaseIso } from '../utils/olympiadLogic';

interface AdmitCardPageProps {
  onNavigate: (page: PageRoute) => void;
}

export function AdmitCardPage({ onNavigate }: AdmitCardPageProps) {
  const releaseTargetIso = getNextAdmitCardReleaseIso(Date.now());

  return (
    <section className="bg-[#06080D] py-12 lg:py-16">
      <div className="mx-auto max-w-4xl px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.38, ease: [0.16, 1, 0.3, 1] }}
          className="relative overflow-hidden mt-6 rounded-xl border border-white/10 bg-[#0D111A] p-8 lg:p-10"
        >
          <motion.span
            aria-hidden="true"
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ duration: 0.65, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
            style={{ originX: 0 }}
            className="pointer-events-none absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-amber-300 via-[#00F0FF] to-transparent"
          />

          <div className="flex items-center gap-3">
            <div className="relative flex h-10 w-10 shrink-0 items-center justify-center">
              <svg viewBox="0 0 48 48" className="h-10 w-10" aria-hidden="true">
                <motion.circle
                  cx="24"
                  cy="24"
                  r="19"
                  fill="none"
                  stroke="#FCD34D"
                  strokeOpacity="0.65"
                  strokeWidth="1.5"
                  strokeDasharray="5 4"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 16, repeat: Infinity, ease: 'linear' }}
                  style={{ originX: '24px', originY: '24px' }}
                />
              </svg>
              <Lock className="absolute h-4 w-4 text-amber-300" aria-hidden="true" />
            </div>
            <span className="text-xs font-semibold text-amber-300">
              Admit Cards Currently Unavailable
            </span>
          </div>

          <motion.h1
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.12 }}
            className="mt-4 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white"
          >
            Admit Card Portal Opens 10 November
          </motion.h1>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.38, delay: 0.18 }}
            className="mt-3 max-w-2xl text-sm leading-relaxed text-slate-300"
          >
            Official 2026 X Olympiad Foundation Admit Cards are currently unavailable for download. Admit cards will be available starting <strong className="text-white">10 November</strong>. Keep your Registration Reference ID ready once the portal unlocks.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.38, delay: 0.24 }}
            className="mt-8"
          >
            <div className="mb-3 flex items-center gap-2 text-xs font-medium text-[#00F0FF]">
              <Calendar className="h-4 w-4" aria-hidden="true" />
              <span>Countdown to 10 Nov Admit Card Release Window</span>
            </div>
            <CountdownClock targetIso={releaseTargetIso} />
          </motion.div>

          <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4 border-t border-white/10 pt-6 text-xs text-slate-300">
            <div>
              <h2 className="font-semibold text-white">Required at Release</h2>
              <p className="mt-1">
                Registration ID (e.g. XOF-2026-XXXX) and candidate email address used during enrollment.
              </p>
            </div>
            <div>
              <h2 className="font-semibold text-white">Haven&apos;t Registered Yet?</h2>
              <p className="mt-1">
                Enroll before the November closing deadlines to be included in the admit card batch.
              </p>
            </div>
          </div>

          <div className="mt-6 flex flex-wrap gap-3">
            <button
              type="button"
              onClick={() => onNavigate('registration')}
              className="neon-cta rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Go to Registration
            </button>
            <button
              type="button"
              onClick={() => onNavigate('dates')}
              className="rounded-lg border border-white/15 px-5 py-2.5 text-xs font-semibold text-slate-200 hover:border-[#00F0FF]/55 hover:text-[#00F0FF] transition-colors cursor-pointer"
            >
              Check Exam Dates
            </button>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
