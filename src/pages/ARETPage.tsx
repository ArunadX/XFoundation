import { useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BarChart3,
  CheckCircle2,
  Cpu,
  KeyRound,
  Lock,
  Mail,
  ShoppingBag,
  Sliders,
  Sparkles,
  AlertCircle,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ARET_IXMO_PYP_SET,
  ARET_LAUNCH_INFO,
  SHOP_PRODUCTS,
} from '../data/olympiadData';
import type {
  AretAnalysisResponse,
  AretDifficulty,
  AretEvaluationResult,
  AretGeneratedQuestion,
  AretQuestionStyle,
  AretTopic,
  LeadInquiryRecord,
  PageRoute,
} from '../types/olympiad';
import {
  buildFallbackAretAnalysis,
  buildFallbackAretQuestions,
  evaluateAretPypPerformance,
  fetchJsonSafe,
  generateReferenceId,
  validateAretAccessCode,
} from '../utils/olympiadLogic';
import { syncAretSessionToFirebase, trackFirebaseEvent } from '../lib/firebase';
import { Olympiad3DCanvas, type GyroMode } from '../components/Olympiad3DCanvas';
import { SuSAretFullIntro } from '../components/SuSAretFullIntro';
import { SectionCardSweep } from '../components/MotionPrimitives';

interface ARETPageProps {
  onNavigate: (page: PageRoute) => void;
  onInquirySaved: (inquiry: LeadInquiryRecord) => Promise<void>;
}

const PREVIEW_USED_KEY = 'xof_aret_preview_used_v1';
const FULL_UNLOCKED_KEY = 'xof_aret_unlocked_v1';

const TOPICS: AretTopic[] = [
  'Mixed IXMO',
  'Number Systems & Theory',
  'Polynomials & Algebra',
  'Euclidean Geometry',
  'Combinatorics & Probability',
];

const DIFFICULTIES: AretDifficulty[] = [
  'Foundation',
  'Olympiad Standard',
  'HOTS Challenge',
];

const STYLES: AretQuestionStyle[] = [
  'Single-Choice MCQ',
  'Statement I & II Logic',
  'Multi-Step Conceptual',
];

export function ARETPage({ onNavigate, onInquirySaved }: ARETPageProps) {
  const [gyroMode, setGyroMode] = useState<GyroMode>('diagnostic');

  // 1-Free-Try Preview Lock State (locks on reload after 1 try OR when a step is attempted a second time)
  const [persistedLock, setPersistedLock] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(PREVIEW_USED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [evalTryDone, setEvalTryDone] = useState(false);
  const [genTryDone, setGenTryDone] = useState(false);
  const [analyzeTryDone, setAnalyzeTryDone] = useState(false);

  // Full ARET Access Code State (accepts ONLY ARETCODESAMPLE)
  const [fullUnlocked, setFullUnlocked] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(FULL_UNLOCKED_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [accessCode, setAccessCode] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);

  // Stage 1: IXMO PYP Assessment
  const [pypAnswers, setPypAnswers] = useState<Record<string, number>>({});
  const [evaluation, setEvaluation] = useState<AretEvaluationResult | null>(null);

  // Stage 2: SuS Custom Question Generator Options & Choices
  const [customTopic, setCustomTopic] = useState<AretTopic>('Mixed IXMO');
  const [customDifficulty, setCustomDifficulty] =
    useState<AretDifficulty>('Olympiad Standard');
  const [customStyle, setCustomStyle] =
    useState<AretQuestionStyle>('Single-Choice MCQ');
  const [customCount, setCustomCount] = useState<number>(3);
  const [generatedQuestions, setGeneratedQuestions] = useState<
    AretGeneratedQuestion[]
  >([]);
  const [genAnswers, setGenAnswers] = useState<Record<string, number>>({});
  const [genChecked, setGenChecked] = useState<Record<string, boolean>>({});
  const [isGenerating, setIsGenerating] = useState(false);

  // Stage 3: In-Depth Analysis
  const [analysis, setAnalysis] = useState<AretAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // September 2026 Early-Access Waitlist Form (persisted in database)
  const [waitlistName, setWaitlistName] = useState('');
  const [waitlistEmail, setWaitlistEmail] = useState('');
  const [waitlistCity, setWaitlistCity] = useState('');
  const [waitlistStatus, setWaitlistStatus] = useState<string | null>(null);
  const [waitlistError, setWaitlistError] = useState<string | null>(null);

  const markPreviewConsumed = () => {
    try {
      window.localStorage.setItem(PREVIEW_USED_KEY, '1');
    } catch {
      // Ignore storage failures
    }
  };

  const handleAccessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAretAccessCode(accessCode)) {
      setAccessError(null);
      setFullUnlocked(true);
      try {
        window.localStorage.setItem(FULL_UNLOCKED_KEY, '1');
      } catch {
        // Ignore storage failures
      }
      void trackFirebaseEvent('aret_full_suite_unlocked', { source: 'preview_gate' });
      onNavigate('aret-full');
    } else {
      setAccessError(
        'Access denied. Invalid ARET access code — only the authorized access code is accepted.'
      );
    }
  };

  const handleEvaluatePyp = () => {
    if (persistedLock || evalTryDone) {
      setPersistedLock(true);
      markPreviewConsumed();
      return;
    }
    const result = evaluateAretPypPerformance(
      ARET_IXMO_PYP_SET,
      pypAnswers,
      SHOP_PRODUCTS
    );
    setEvaluation(result);
    setAnalysis(null);
    setEvalTryDone(true);
    markPreviewConsumed();
    if (result.weakTopics.length > 0 && customTopic === 'Mixed IXMO') {
      const firstWeak = result.weakTopics[0] as AretTopic;
      if (TOPICS.includes(firstWeak)) {
        setCustomTopic(firstWeak);
      }
    }
    void syncAretSessionToFirebase({
      sessionId: generateReferenceId('INQ', Date.now()),
      mode: 'preview',
      email: waitlistEmail || undefined,
      evaluation: result,
    });
  };

  const handleGenerateCustom = async () => {
    if (persistedLock || genTryDone) {
      setPersistedLock(true);
      markPreviewConsumed();
      return;
    }
    setIsGenerating(true);
    setGenAnswers({});
    setGenChecked({});
    try {
      const data = await fetchJsonSafe<{ questions?: AretGeneratedQuestion[] }>(
        '/api/aret/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic: customTopic,
            difficulty: customDifficulty,
            style: customStyle,
            count: customCount,
            weakTopics: evaluation?.weakTopics ?? [],
            email: waitlistEmail,
            evaluation,
          }),
        }
      );
      const questions =
        Array.isArray(data?.questions) && data.questions.length > 0
          ? data.questions
          : buildFallbackAretQuestions({
              topic: customTopic,
              difficulty: customDifficulty,
              style: customStyle,
              count: customCount,
              weakTopics: evaluation?.weakTopics ?? [],
            });
      setGeneratedQuestions(questions);
      setGenTryDone(true);
      markPreviewConsumed();
    } finally {
      setIsGenerating(false);
    }
  };

  const handleRunAnalysis = async () => {
    if (persistedLock || analyzeTryDone) {
      setPersistedLock(true);
      markPreviewConsumed();
      return;
    }
    const currentEval =
      evaluation ??
      evaluateAretPypPerformance(ARET_IXMO_PYP_SET, pypAnswers, SHOP_PRODUCTS);
    if (!evaluation) setEvaluation(currentEval);

    const answeredGen = generatedQuestions.filter(
      (q) => typeof genAnswers[q.id] === 'number'
    );
    const customAccuracyPct =
      answeredGen.length > 0
        ? Math.round(
            (answeredGen.filter((q) => genAnswers[q.id] === q.correctIndex)
              .length /
              answeredGen.length) *
              100
          )
        : undefined;

    setIsAnalyzing(true);
    try {
      const data = await fetchJsonSafe<AretAnalysisResponse>('/api/aret/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: currentEval,
          customAccuracyPct,
          customTopic,
          customDifficulty,
        }),
      });
      const resolved =
        data && data.aiNarrative
          ? data
          : buildFallbackAretAnalysis({
              evaluation: currentEval,
              customAccuracyPct,
              customTopic,
              customDifficulty,
            });
      setAnalysis(resolved);
      setAnalyzeTryDone(true);
      setPersistedLock(true);
      markPreviewConsumed();
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleWaitlistSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setWaitlistError(null);
    setWaitlistStatus(null);

    if (!waitlistName.trim() || waitlistName.trim().length < 2) {
      setWaitlistError('Enter your full name.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(waitlistEmail.trim())) {
      setWaitlistError('Enter a valid email address.');
      return;
    }

    const inquiry: LeadInquiryRecord = {
      inquiryId: generateReferenceId('INQ', Date.now()),
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      name: waitlistName.trim(),
      email: waitlistEmail.trim(),
      city: waitlistCity.trim() || 'India',
      interest: 'ARET September 2026 Launch (Starting at ₹1,299)',
      notes: evaluation
        ? `Previewed IXMO PYP (${evaluation.netScore}/${evaluation.maxScore}) · Focus: ${customTopic}`
        : `Requested early access for ARET (${customTopic}, ${customDifficulty})`,
    };

    try {
      await onInquirySaved(inquiry);
      try {
        await fetch('/api/inquiries', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(inquiry),
        });
      } catch {
        // Secondary local log fallback non-fatal after Firebase write succeeds
      }
      setWaitlistStatus(
        `Saved to Firebase subscribers (${inquiry.inquiryId}). Early-access updates for ARET Sept 2026 will be sent to ${inquiry.email}.`
      );
      setWaitlistName('');
      setWaitlistCity('');
    } catch (err) {
      console.error(err);
      setWaitlistError(err instanceof Error ? err.message : String(err));
    }
  };

  const recommendedProducts = evaluation
    ? SHOP_PRODUCTS.filter((p) => evaluation.recommendedBankIds.includes(p.id))
    : [];

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

        {/* Full Interactive SuS & ARET Flying & Neural Docking Intro */}
        <div className="mt-5">
          <SuSAretFullIntro focus="aret-preview" />
        </div>

        {/* Hero Showcase: ARET September 2026 Launch + Interactive 3D Diagnostic Core */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 grid grid-cols-1 lg:grid-cols-12 gap-8 items-stretch rounded-2xl border border-[#B8FF00]/30 bg-[#0D111A] p-6 sm:p-8 lg:p-10"
        >
          <div className="lg:col-span-7 flex flex-col justify-between">
            <div>
              <motion.p
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.32, delay: 0.14 }}
                className="font-mono text-xs font-semibold text-[#B8FF00]"
              >
                NEW LAUNCH · {ARET_LAUNCH_INFO.launchWindow.toUpperCase()} · STARTING AT ₹
                {ARET_LAUNCH_INFO.startingPriceInr.toLocaleString('en-IN')}
              </motion.p>
              <motion.h1
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.42, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="mt-3 font-display text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight text-white leading-[1.08]"
              >
                ARET — Automated Responsive Educational Tool
              </motion.h1>
              <motion.p
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.38, delay: 0.26 }}
                className="mt-4 text-sm sm:text-base leading-relaxed text-slate-300"
              >
                {ARET_LAUNCH_INFO.tagline}
              </motion.p>
            </div>

            <div className="mt-8 grid grid-cols-1 sm:grid-cols-3 gap-4 border-t border-white/10 pt-6 text-xs tabular-nums">
              {[
                { label: 'Launch Window', value: 'September 2026', color: 'text-white' },
                { label: 'Pricing Tiers', value: 'Starting ₹1,299', color: 'text-[#B8FF00]' },
                { label: 'Powered By', value: 'SuS Intelligence', color: 'text-[#00F0FF]' },
              ].map((stat, idx) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.32, delay: 0.3 + idx * 0.07 }}
                >
                  <span className="text-slate-400">{stat.label}</span>
                  <p className={`mt-1 font-display text-lg font-bold ${stat.color}`}>
                    {stat.value}
                  </p>
                </motion.div>
              ))}
            </div>
          </div>

          <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.45, delay: 0.18, ease: [0.16, 1, 0.3, 1] }}
            className="lg:col-span-5 flex flex-col rounded-xl border border-white/10 bg-[#070A12] overflow-hidden"
          >
            <Olympiad3DCanvas
              mode={gyroMode}
              accent="lime"
              className="h-[260px] sm:h-[290px] w-full"
              label="ARET 3D Diagnostic Telemetry Core"
            />
            <div className="border-t border-white/10 bg-[#0A0E17] px-4 py-3 flex items-center justify-between gap-2">
              <span className="font-mono text-[11px] text-slate-400">
                3D Core · Drag to Inspect
              </span>
              <div className="flex items-center gap-1.5">
                {(['orbital', 'diagnostic', 'harmonic'] as GyroMode[]).map(
                  (modeOption) => (
                    <button
                      key={modeOption}
                      type="button"
                      onClick={() => setGyroMode(modeOption)}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize transition-colors cursor-pointer ${
                        gyroMode === modeOption
                          ? 'bg-[#B8FF00] text-[#05080F] font-semibold'
                          : 'bg-[#121723] text-slate-300 hover:text-white'
                      }`}
                    >
                      {modeOption}
                    </button>
                  )
                )}
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Full-Fledged ARET Access Gate (Accepts ONLY ARETCODESAMPLE) */}
        <SectionCardSweep
          index={1}
          accent="cyan"
          className="mt-8 rounded-2xl border border-[#00F0FF]/35 bg-[#0D111A] p-6 sm:p-7"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div className="max-w-xl">
              <div className="inline-flex items-center gap-2 font-mono text-xs font-semibold text-[#00F0FF]">
                <KeyRound className="h-4 w-4" aria-hidden="true" />
                <span>PAGE 2 · FULL-FLEDGED ARET SUITE ACCESS</span>
              </div>
              <h2 className="mt-2 font-display text-xl sm:text-2xl font-bold text-white">
                Have an ARET Access Code? Open the Full Multi-Page Suite
              </h2>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                Preview mode stops after 1 free diagnostic try. Enter your authorized ARET access code to unlock Multi-Year IXMO PYP Simulators, 20–30 Questions per response in SuS Deep Studio, and Mistake Vault Analytics.
              </p>
            </div>

            {fullUnlocked ? (
              <div className="flex flex-wrap items-center gap-3">
                <span className="font-mono text-xs text-[#B8FF00]">Access Verified</span>
                <button
                  type="button"
                  onClick={() => onNavigate('aret-full')}
                  className="inline-flex items-center gap-2 rounded-lg bg-[#B8FF00] px-5 py-3 text-xs font-semibold text-[#05080F] hover:bg-[#ccff40] transition-colors cursor-pointer whitespace-nowrap"
                >
                  <span>Enter Full ARET Suite</span>
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </button>
              </div>
            ) : (
              <form
                onSubmit={handleAccessSubmit}
                className="w-full lg:w-auto lg:min-w-[410px]"
              >
                <label
                  htmlFor="aret-access-code"
                  className="block text-xs font-medium text-slate-300"
                >
                  ARET Access Code
                </label>
                <div className="mt-1.5 flex gap-2">
                  <input
                    id="aret-access-code"
                    type="text"
                    value={accessCode}
                    onChange={(e) => {
                      setAccessCode(e.target.value);
                      if (accessError) setAccessError(null);
                    }}
                    placeholder="Enter access code"
                    className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                  />
                  <button
                    type="submit"
                    className="neon-cta rounded-lg px-5 py-2.5 text-xs font-semibold whitespace-nowrap cursor-pointer"
                  >
                    Unlock Full Suite
                  </button>
                </div>
                {accessError && (
                  <p role="alert" className="mt-2 text-xs font-medium text-rose-400">
                    {accessError}
                  </p>
                )}
              </form>
            )}
          </div>
        </SectionCardSweep>

        {/* 1-Try Preview Lock Notice */}
        {persistedLock && (
          <div
            role="status"
            className="mt-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 rounded-xl border border-amber-400/45 bg-amber-500/10 p-5 text-xs"
          >
            <div className="flex items-start gap-3">
              <Lock className="mt-0.5 h-4 w-4 shrink-0 text-amber-300" aria-hidden="true" />
              <div>
                <p className="font-semibold text-amber-200">
                  Preview Limit Reached (1 / 1 Free Preview Try Used)
                </p>
                <p className="mt-1 text-slate-300">
                  This ARET preview stops working after 1 try. Enter your authorized access code above to continue in the Full-Fledged ARET Suite (with 20–30 questions per response).
                </p>
              </div>
            </div>
            {fullUnlocked && (
              <button
                type="button"
                onClick={() => onNavigate('aret-full')}
                className="rounded-lg bg-[#B8FF00] px-4 py-2 font-semibold text-[#05080F] whitespace-nowrap cursor-pointer"
              >
                Open Full ARET Suite →
              </button>
            )}
          </div>
        )}

        {/* Interactive Preview Step 1: IXMO PYP Evaluation */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mt-8 rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8"
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="font-mono text-xs font-semibold text-[#00F0FF]">
                STEP 01 · IXMO PYP DIAGNOSTIC BENCHMARK (1 FREE TRY PREVIEW)
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                Attempt IXMO Previous Year Paper Sample Set
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                ARET judges your accuracy, topic mastery, and negative-marking risk (-1 applies in Logic &amp; Mathematics) from your IXMO PYP attempt.
              </p>
            </div>
            <button
              type="button"
              disabled={persistedLock || evalTryDone}
              onClick={handleEvaluatePyp}
              className="neon-cta self-start sm:self-auto rounded-lg px-5 py-2.5 text-xs font-semibold whitespace-nowrap disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              {persistedLock || evalTryDone
                ? 'Preview Evaluation Used (1/1)'
                : 'Evaluate IXMO Performance'}
            </button>
          </div>

          <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
            {ARET_IXMO_PYP_SET.map((q, qIndex) => {
              const selected = pypAnswers[q.id];
              return (
                <SectionCardSweep
                  key={q.id}
                  index={qIndex}
                  accent={qIndex % 2 === 0 ? 'cyan' : 'lime'}
                  className="rounded-xl border border-white/10 bg-[#080B12] p-5 flex flex-col justify-between"
                >
                  <div>
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-[#00F0FF]">
                        Q{qIndex + 1} · {q.year} · {q.topic}
                      </span>
                      <span className="text-slate-400 tabular-nums">
                        +{q.marks}m {q.negativeMarks > 0 ? `/ -${q.negativeMarks}m` : '/ No neg'}
                      </span>
                    </div>
                    <h3 className="mt-3 text-sm font-semibold leading-relaxed text-white">
                      {q.prompt}
                    </h3>
                    {q.statements && (
                      <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                        {q.statements.map((st) => (
                          <p key={st}>{st}</p>
                        ))}
                      </div>
                    )}

                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2" role="radiogroup" aria-label={`IXMO PYP Question ${qIndex + 1}`}>
                      {q.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const isSelected = selected === idx;
                        const showResult = evaluation !== null;
                        const isRight = idx === q.correctIndex;

                        let style =
                          'border-white/10 bg-[#111622] text-slate-200 hover:border-white/30';
                        if (showResult) {
                          if (isRight) {
                            style = 'border-[#B8FF00]/70 bg-[#B8FF00]/10 text-white';
                          } else if (isSelected) {
                            style = 'border-rose-400/70 bg-rose-500/10 text-rose-100';
                          }
                        } else if (isSelected) {
                          style = 'border-[#00F0FF] bg-[#00F0FF]/12 text-white';
                        }

                        return (
                          <button
                            key={letter}
                            type="button"
                            role="radio"
                            aria-checked={isSelected}
                            disabled={persistedLock && evaluation === null}
                            onClick={() =>
                              setPypAnswers((prev) => ({ ...prev, [q.id]: idx }))
                            }
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors disabled:opacity-50 cursor-pointer ${style}`}
                          >
                            <span className="font-mono font-semibold text-[#00F0FF]">
                              ({letter})
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {evaluation && (
                    <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-300">
                      <strong className="text-[#B8FF00]">Solution:</strong> {q.explanation}
                    </p>
                  )}
                </SectionCardSweep>
              );
            })}
          </div>

          {evaluation && (
            <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 border-t border-white/10 pt-6 text-xs tabular-nums">
              <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                <span className="text-slate-400">Net IXMO Score</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#00F0FF]">
                  {evaluation.netScore} / {evaluation.maxScore}
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                <span className="text-slate-400">Accuracy &amp; Percentile</span>
                <p className="mt-1 font-mono text-xl font-bold text-[#B8FF00]">
                  {evaluation.accuracyPct}% · {evaluation.estimatedPercentile}th
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                <span className="text-slate-400">Negative Risk Index</span>
                <p className="mt-1 font-mono text-xl font-bold text-white">
                  {evaluation.riskIndex} (-{evaluation.negativePenalty}m)
                </p>
              </div>
              <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                <span className="text-slate-400">Detected Weak Topics</span>
                <p className="mt-1 text-sm font-semibold text-amber-300">
                  {evaluation.weakTopics.length > 0
                    ? evaluation.weakTopics.join(', ')
                    : 'All Evaluated Topics Mastered'}
                </p>
              </div>
            </div>
          )}
        </motion.div>

        {/* Interactive Preview Step 2: SuS Custom Question Generator */}
        <div className="mt-8 rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
            <div>
              <p className="font-mono text-xs font-semibold text-[#B8FF00]">
                STEP 02 · MADE POSSIBLE WITH SuS
              </p>
              <h2 className="mt-1 font-display text-2xl font-bold text-white">
                Custom Adaptive Question Generator (Preview)
              </h2>
              <p className="mt-1 text-xs text-slate-300">
                Configure topic, difficulty tier, question style, and question count (2–4 Qs in preview; 20–30 Qs per response in Full ARET Suite).
              </p>
            </div>
            <Sliders className="h-5 w-5 text-[#00F0FF] shrink-0" aria-hidden="true" />
          </div>

          <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label htmlFor="aret-topic" className="block text-xs font-medium text-slate-300">
                Topic Focus
              </label>
              <select
                id="aret-topic"
                value={customTopic}
                onChange={(e) => setCustomTopic(e.target.value as AretTopic)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
              >
                {TOPICS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="aret-difficulty" className="block text-xs font-medium text-slate-300">
                Difficulty Tier
              </label>
              <select
                id="aret-difficulty"
                value={customDifficulty}
                onChange={(e) => setCustomDifficulty(e.target.value as AretDifficulty)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
              >
                {DIFFICULTIES.map((d) => (
                  <option key={d} value={d}>
                    {d}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="aret-style" className="block text-xs font-medium text-slate-300">
                Question Style
              </label>
              <select
                id="aret-style"
                value={customStyle}
                onChange={(e) => setCustomStyle(e.target.value as AretQuestionStyle)}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label htmlFor="aret-count" className="block text-xs font-medium text-slate-300">
                Question Count
              </label>
              <select
                id="aret-count"
                value={customCount}
                onChange={(e) => setCustomCount(Number(e.target.value))}
                className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
              >
                {[2, 3, 4].map((c) => (
                  <option key={c} value={c}>
                    {c} Questions
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="mt-5 flex flex-wrap items-center gap-3">
            <button
              type="button"
              disabled={isGenerating || persistedLock || genTryDone}
              onClick={() => void handleGenerateCustom()}
              className="neon-cta inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <Cpu className="h-4 w-4" aria-hidden="true" />
              <span>
                {isGenerating
                  ? 'Generating Custom Set via SuS...'
                  : persistedLock || genTryDone
                    ? 'Preview Generator Used (1/1)'
                    : 'Generate Custom Questions via SuS'}
              </span>
            </button>

            <button
              type="button"
              disabled={isAnalyzing || persistedLock || analyzeTryDone}
              onClick={() => void handleRunAnalysis()}
              className="inline-flex items-center gap-2 rounded-lg border border-[#B8FF00]/55 bg-[#B8FF00]/10 px-5 py-2.5 text-xs font-semibold text-[#B8FF00] hover:bg-[#B8FF00] hover:text-[#05080F] transition-colors disabled:opacity-45 disabled:cursor-not-allowed cursor-pointer"
            >
              <BarChart3 className="h-4 w-4" aria-hidden="true" />
              <span>
                {isAnalyzing
                  ? 'Computing In-Depth Analysis...'
                  : persistedLock || analyzeTryDone
                    ? 'Preview Analysis Used (1/1)'
                    : 'Run In-Depth Analysis'}
              </span>
            </button>
          </div>

          {generatedQuestions.length > 0 && (
            <div className="mt-6 space-y-4 border-t border-white/10 pt-6">
              {generatedQuestions.map((gq, i) => {
                const chosen = genAnswers[gq.id];
                const checked = Boolean(genChecked[gq.id]);
                return (
                  <article
                    key={gq.id}
                    className="rounded-xl border border-white/10 bg-[#080B12] p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                      <span className="text-[#B8FF00]">
                        SuS Custom #{i + 1} · {gq.topic} · {gq.difficulty}
                      </span>
                      <span className="text-slate-400">{gq.style}</span>
                    </div>
                    <p className="mt-1.5 text-[11px] text-[#00F0FF]">{gq.adaptiveReason}</p>
                    <h3 className="mt-2.5 text-sm font-semibold leading-relaxed text-white">
                      {gq.prompt}
                    </h3>
                    {gq.statements && (
                      <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                        {gq.statements.map((st) => (
                          <p key={st}>{st}</p>
                        ))}
                      </div>
                    )}

                    <div className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {gq.options.map((opt, idx) => {
                        const letter = String.fromCharCode(65 + idx);
                        const selected = chosen === idx;
                        const isCorrect = idx === gq.correctIndex;
                        let style =
                          'border-white/10 bg-[#111622] text-slate-200 hover:border-white/30';
                        if (checked) {
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
                            onClick={() => {
                              if (!checked) {
                                setGenAnswers((prev) => ({ ...prev, [gq.id]: idx }));
                              }
                            }}
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs transition-colors cursor-pointer ${style}`}
                          >
                            <span className="font-mono font-semibold text-[#00F0FF]">
                              ({letter})
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-3 flex items-center gap-3">
                      <button
                        type="button"
                        disabled={typeof chosen !== 'number' || checked}
                        onClick={() =>
                          setGenChecked((prev) => ({ ...prev, [gq.id]: true }))
                        }
                        className="rounded-md border border-[#00F0FF]/50 bg-[#00F0FF]/10 px-3.5 py-1.5 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] disabled:opacity-45 cursor-pointer"
                      >
                        Check Answer
                      </button>
                      {checked && (
                        <span className="inline-flex items-center gap-1.5 text-xs font-medium">
                          {chosen === gq.correctIndex ? (
                            <>
                              <CheckCircle2 className="h-3.5 w-3.5 text-[#B8FF00]" />
                              <span className="text-[#B8FF00]">Correct</span>
                            </>
                          ) : (
                            <>
                              <AlertCircle className="h-3.5 w-3.5 text-rose-400" />
                              <span className="text-rose-300">
                                Answer: ({String.fromCharCode(65 + gq.correctIndex)})
                              </span>
                            </>
                          )}
                        </span>
                      )}
                    </div>

                    {checked && (
                      <p className="mt-3 border-t border-white/10 pt-2.5 text-xs text-slate-300">
                        {gq.explanation}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>
          )}
        </div>

        {/* Interactive Preview Step 3: In-Depth Performance Analysis & Recommendations */}
        {analysis && evaluation && (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-[#B8FF00]/45 bg-[#0D111A] p-6 lg:p-8"
          >
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 pb-4">
              <div>
                <p className="font-mono text-xs font-semibold text-[#B8FF00]">
                  STEP 03 · ARET IN-DEPTH DIAGNOSTIC REPORT
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  {analysis.readinessBadge}
                </h2>
              </div>
              <span className="font-mono text-xs text-[#00F0FF]">
                Estimated IXMO Percentile: {evaluation.estimatedPercentile}%
              </span>
            </div>

            <p className="mt-4 text-sm leading-relaxed text-slate-200">
              {analysis.aiNarrative}
            </p>

            <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="rounded-lg border border-white/10 bg-[#080B12] p-5">
                <h3 className="font-display text-sm font-semibold text-white">
                  Topic-Level Accuracy Breakdown
                </h3>
                <div className="mt-4 space-y-3 text-xs tabular-nums">
                  {evaluation.topicBreakdown.map((item, idx) => (
                    <div key={item.topic}>
                      <div className="flex justify-between text-slate-300">
                        <span>{item.topic}</span>
                        <span className="font-mono text-[#00F0FF]">
                          {item.correct}/{item.total} ({item.accuracyPct}%)
                        </span>
                      </div>
                      <div className="mt-1.5 h-2 w-full rounded-full bg-[#131926] overflow-hidden">
                        <motion.div
                          initial={{ scaleX: 0 }}
                          animate={{ scaleX: Math.max(0.06, item.accuracyPct / 100) }}
                          transition={{
                            duration: 0.65,
                            delay: 0.1 + idx * 0.08,
                            ease: [0.16, 1, 0.3, 1],
                          }}
                          style={{ originX: 0 }}
                          className="h-full w-full rounded-full bg-[#00F0FF]"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-lg border border-white/10 bg-[#080B12] p-5">
                <h3 className="font-display text-sm font-semibold text-white">
                  Personalized SuS Action Plan
                </h3>
                <ul className="mt-3 space-y-2.5 text-xs leading-relaxed text-slate-300">
                  {analysis.studyPlan.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8FF00]" />
                      <span>{step}</span>
                    </li>
                  ))}
                </ul>

                {recommendedProducts.length > 0 && (
                  <div className="mt-5 border-t border-white/10 pt-4">
                    <p className="text-[11px] font-semibold text-[#00F0FF]">
                      Recommended IXMO Study Packs
                    </p>
                    <div className="mt-2 flex flex-wrap gap-2">
                      {recommendedProducts.map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          onClick={() => onNavigate('shop')}
                          className="inline-flex items-center gap-1.5 rounded-md border border-white/15 bg-[#121723] px-3 py-1.5 text-[11px] font-medium text-slate-200 hover:border-[#00F0FF] hover:text-white cursor-pointer"
                        >
                          <ShoppingBag className="h-3 w-3 text-[#00F0FF]" />
                          <span>{p.title}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </motion.div>
        )}

        {/* Early-Access September 2026 Enrollment Waitlist */}
        <div className="mt-10 rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
            <div className="lg:col-span-5">
              <p className="font-mono text-xs font-semibold text-[#B8FF00]">
                SEPTEMBER 2026 LAUNCH · STARTING AT ₹1,299
              </p>
              <h2 className="mt-2 font-display text-2xl font-bold text-white">
                Reserve Early Access for ARET
              </h2>
              <p className="mt-2 text-xs leading-relaxed text-slate-300">
                Leave your email to receive the September 2026 ARET rollout circular, IXMO PYP diagnostic onboarding, and Foundation pricing alerts.
              </p>
            </div>

            <form
              onSubmit={(e) => void handleWaitlistSubmit(e)}
              noValidate
              className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-3 gap-3 items-end"
            >
              <div>
                <label htmlFor="aret-wl-name" className="block text-xs font-medium text-slate-300">
                  Name
                </label>
                <input
                  id="aret-wl-name"
                  type="text"
                  value={waitlistName}
                  onChange={(e) => setWaitlistName(e.target.value)}
                  placeholder="Candidate name"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-[#06080D] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                />
              </div>
              <div>
                <label htmlFor="aret-wl-email" className="block text-xs font-medium text-slate-300">
                  Email
                </label>
                <input
                  id="aret-wl-email"
                  type="email"
                  value={waitlistEmail}
                  onChange={(e) => setWaitlistEmail(e.target.value)}
                  placeholder="name@example.in"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-[#06080D] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                />
              </div>
              <div>
                <label htmlFor="aret-wl-city" className="block text-xs font-medium text-slate-300">
                  City
                </label>
                <input
                  id="aret-wl-city"
                  type="text"
                  value={waitlistCity}
                  onChange={(e) => setWaitlistCity(e.target.value)}
                  placeholder="Ghaziabad"
                  className="mt-1 w-full rounded-lg border border-white/15 bg-[#06080D] px-3 py-2 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                />
              </div>

              <div className="sm:col-span-3 flex flex-wrap items-center justify-between gap-3 pt-1">
                <div className="text-xs max-w-xl">
                  {waitlistError && (
                    <span role="alert" className="font-mono text-rose-400 break-words">
                      Firebase Error: {waitlistError}
                    </span>
                  )}
                  {waitlistStatus && (
                    <span role="status" className="text-[#B8FF00]">
                      {waitlistStatus}
                    </span>
                  )}
                </div>
                <button
                  type="submit"
                  className="neon-cta inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <Mail className="h-3.5 w-3.5" aria-hidden="true" />
                  <span>Notify Me · Sept 2026 Launch</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
}
