import { useEffect, useState } from 'react';
import {
  AlertCircle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle2,
  Compass,
  Cpu,
  Flag,
  KeyRound,
  Layers,
  Lock,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Timer,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
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
  AretPypQuestion,
  AretQuestionStyle,
  AretTopic,
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

interface FullARETPageProps {
  onNavigate: (page: PageRoute) => void;
}

type FullAretTab = 'overview' | 'pyp-simulator' | 'deep-generator' | 'analytics';
type PypArchiveYear = '2025' | '2024' | '2023';

const ARET_UNLOCK_STORAGE_KEY = 'xof_aret_unlocked_v1';

const FULL_TOPICS: AretTopic[] = [
  'Mixed IXMO',
  'Number Systems & Theory',
  'Polynomials & Algebra',
  'Euclidean Geometry',
  'Combinatorics & Probability',
  'Logic & HOTS',
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

const MULTI_YEAR_PYP_PAPERS: Record<
  PypArchiveYear,
  { label: string; subtitle: string; questions: AretPypQuestion[] }
> = {
  '2025': {
    label: 'IXMO 2025 Championship Paper',
    subtitle: 'Official 2025 Diagnostic Sample · Negative Marking Active in Logic & Math',
    questions: ARET_IXMO_PYP_SET,
  },
  '2024': {
    label: 'IXMO 2024 National Archive',
    subtitle: 'Verified 2024 Round · Modular Arithmetic, Quadratics, Circles & Counting',
    questions: [
      {
        id: 'ixmo24-1',
        year: 'IXMO 2024',
        topic: 'Number Systems & Theory',
        section: 'Logic',
        marks: 1,
        negativeMarks: 1,
        prompt: 'What is the remainder when 3^2024 + 5^2024 is divided by 4?',
        options: ['0', '1', '2', '3'],
        correctIndex: 2,
        explanation:
          'Since 3 ≡ -1 (mod 4), 3^2024 ≡ (-1)^2024 ≡ 1 (mod 4). Since 5 ≡ 1 (mod 4), 5^2024 ≡ 1 (mod 4). Sum ≡ 1 + 1 = 2 (mod 4).',
      },
      {
        id: 'ixmo24-2',
        year: 'IXMO 2024',
        topic: 'Polynomials & Algebra',
        section: 'Mathematics',
        marks: 1.5,
        negativeMarks: 1,
        prompt: 'If x^2 - 7x + 1 = 0, compute the value of x^2 + 1/x^2.',
        options: ['45', '47', '49', '51'],
        correctIndex: 1,
        explanation:
          'Dividing by x gives x + 1/x = 7. Squaring both sides: x^2 + 2 + 1/x^2 = 49 => x^2 + 1/x^2 = 47.',
      },
      {
        id: 'ixmo24-3',
        year: 'IXMO 2024',
        topic: 'Euclidean Geometry',
        section: 'Advanced Mathematics',
        marks: 2,
        negativeMarks: 0,
        prompt:
          'A circle is inscribed inside a right triangle of legs 6 cm and 8 cm. What is the radius of the incircle?',
        options: ['1 cm', '2 cm', '2.5 cm', '3 cm'],
        correctIndex: 1,
        explanation:
          'Hypotenuse c = 10 cm. Inradius r = (a + b - c)/2 = (6 + 8 - 10)/2 = 2 cm.',
      },
      {
        id: 'ixmo24-4',
        year: 'IXMO 2024',
        topic: 'Combinatorics & Probability',
        section: 'HOTS (Higher Order Thinking)',
        marks: 4,
        negativeMarks: 0,
        prompt:
          'How many 4-digit even numbers greater than 4000 can be formed using {1, 2, 4, 5, 8} without repetition?',
        options: ['30', '36', '42', '48'],
        correctIndex: 2,
        explanation:
          'Leading digit ∈ {4, 5, 8}. Case 1: leads with 5 (units ∈ {2,4,8}): 3 × P(3,2) = 18. Case 2: leads with 4 or 8 (units has 2 remaining even choices): 2 × 2 × P(3,2) = 24. Total = 18 + 24 = 42.',
      },
    ],
  },
  '2023': {
    label: 'IXMO 2023 Honours Paper',
    subtitle: '2023 Final Selection Tier · Diophantine, Cyclic Quads & Graph Parity',
    questions: [
      {
        id: 'ixmo23-1',
        year: 'IXMO 2023',
        topic: 'Number Systems & Theory',
        section: 'Logic',
        marks: 1,
        negativeMarks: 1,
        prompt: 'How many positive integers n satisfy that 24 / (n - 1) is an integer?',
        options: ['6', '8', '10', '12'],
        correctIndex: 1,
        explanation:
          '24 = 2^3 × 3^1 has 8 positive divisors {1, 2, 3, 4, 6, 8, 12, 24}. Note negative divisors give n - 1 <= -1 => n <= 0 (not positive). So there are 8 positive integers n.',
      },
      {
        id: 'ixmo23-2',
        year: 'IXMO 2023',
        topic: 'Polynomials & Algebra',
        section: 'Mathematics',
        marks: 1.5,
        negativeMarks: 1,
        prompt: 'If a + b + c = 9 and ab + bc + ca = 26, find a^2 + b^2 + c^2.',
        options: ['25', '27', '29', '31'],
        correctIndex: 2,
        explanation: '(a+b+c)^2 - 2(ab+bc+ca) = 81 - 52 = 29.',
      },
      {
        id: 'ixmo23-3',
        year: 'IXMO 2023',
        topic: 'Euclidean Geometry',
        section: 'Advanced Mathematics',
        marks: 2,
        negativeMarks: 0,
        prompt:
          'The diagonals of a rhombus measure 14 cm and 48 cm. What is the perimeter of the rhombus?',
        options: ['88 cm', '96 cm', '100 cm', '104 cm'],
        correctIndex: 2,
        explanation:
          'Half-diagonals are 7 cm and 24 cm. Side = sqrt(7^2 + 24^2) = 25 cm. Perimeter = 4 × 25 = 100 cm.',
      },
      {
        id: 'ixmo23-4',
        year: 'IXMO 2023',
        topic: 'Combinatorics & Probability',
        section: 'HOTS (Higher Order Thinking)',
        marks: 4,
        negativeMarks: 0,
        prompt:
          'From 6 mathematicians and 4 physicists, a 4-member committee must include at least 2 mathematicians. How many committees are possible?',
        options: ['165', '185', '195', '205'],
        correctIndex: 1,
        explanation:
          'Total 4-member committees = C(10,4) = 210. Subtract committees with 0 math (C(4,4)=1) and 1 math (C(6,1)C(4,3)=24): 210 - 1 - 24 = 185.',
      },
    ],
  },
};

export function FullARETPage({ onNavigate }: FullARETPageProps) {
  const [isUnlocked, setIsUnlocked] = useState<boolean>(() => {
    try {
      return window.localStorage.getItem(ARET_UNLOCK_STORAGE_KEY) === '1';
    } catch {
      return false;
    }
  });
  const [accessInput, setAccessInput] = useState('');
  const [accessError, setAccessError] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<FullAretTab>('overview');
  const [gyroMode, setGyroMode] = useState<GyroMode>('harmonic');

  // Simulator State
  const [selectedYear, setSelectedYear] = useState<PypArchiveYear>('2025');
  const [pypAnswers, setPypAnswers] = useState<Record<string, number>>({});
  const [evaluation, setEvaluation] = useState<AretEvaluationResult | null>(null);
  const [simElapsedSec, setSimElapsedSec] = useState(0);
  const [simRunning, setSimRunning] = useState(false);

  // Deep Question Generator State (20–30 Questions per Response)
  const [topic, setTopic] = useState<AretTopic>('Mixed IXMO');
  const [difficulty, setDifficulty] = useState<AretDifficulty>('Olympiad Standard');
  const [style, setStyle] = useState<AretQuestionStyle>('Single-Choice MCQ');
  const [questionCount, setQuestionCount] = useState<20 | 25 | 30>(25);
  const [generatedQuestions, setGeneratedQuestions] = useState<AretGeneratedQuestion[]>([]);
  const [genAnswers, setGenAnswers] = useState<Record<string, number>>({});
  const [genChecked, setGenChecked] = useState<Record<string, boolean>>({});
  const [flaggedIds, setFlaggedIds] = useState<Record<string, boolean>>({});
  const [batchGraded, setBatchGraded] = useState(false);
  const [pageOffset, setPageOffset] = useState(0);
  const [isGenerating, setIsGenerating] = useState(false);

  // Analytics State
  const [analysis, setAnalysis] = useState<AretAnalysisResponse | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  useEffect(() => {
    if (!simRunning) return;
    const id = window.setInterval(() => {
      setSimElapsedSec((s) => s + 1);
    }, 1000);
    return () => window.clearInterval(id);
  }, [simRunning]);

  const handleUnlockSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validateAretAccessCode(accessInput)) {
      setAccessError(null);
      setIsUnlocked(true);
      try {
        window.localStorage.setItem(ARET_UNLOCK_STORAGE_KEY, '1');
      } catch {
        // Ignore storage errors
      }
      void trackFirebaseEvent('aret_full_suite_unlocked', { method: 'access_code' });
    } else {
      setAccessError('Access denied. Invalid access code.');
    }
  };

  const activePaper = MULTI_YEAR_PYP_PAPERS[selectedYear];

  const handleEvaluateSimulator = () => {
    setSimRunning(false);
    const result = evaluateAretPypPerformance(
      activePaper.questions,
      pypAnswers,
      SHOP_PRODUCTS
    );
    setEvaluation(result);
    void syncAretSessionToFirebase({
      sessionId: generateReferenceId('INQ', Date.now()),
      mode: 'full',
      evaluation: result,
    });
  };

  const handleGenerateDeepBatch = async () => {
    setIsGenerating(true);
    setGenAnswers({});
    setGenChecked({});
    setFlaggedIds({});
    setBatchGraded(false);
    setPageOffset(0);
    try {
      const data = await fetchJsonSafe<{ questions?: AretGeneratedQuestion[] }>(
        '/api/aret/generate',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            topic,
            difficulty,
            style,
            count: questionCount,
            weakTopics: evaluation?.weakTopics ?? [],
            evaluation,
          }),
        }
      );
      const questions =
        Array.isArray(data?.questions) && data.questions.length > 0
          ? data.questions
          : buildFallbackAretQuestions({
              topic,
              difficulty,
              style,
              count: questionCount,
              weakTopics: evaluation?.weakTopics ?? [],
            });
      setGeneratedQuestions(questions);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleGradeEntireBatch = () => {
    const nextChecked: Record<string, boolean> = {};
    for (const q of generatedQuestions) {
      nextChecked[q.id] = true;
    }
    setGenChecked(nextChecked);
    setBatchGraded(true);
  };

  const handleRunDeepAnalysis = async () => {
    const baseEval =
      evaluation ??
      evaluateAretPypPerformance(activePaper.questions, pypAnswers, SHOP_PRODUCTS);
    if (!evaluation) setEvaluation(baseEval);

    const answered = generatedQuestions.filter((q) => typeof genAnswers[q.id] === 'number');
    const customAccuracyPct =
      answered.length > 0
        ? Math.round(
            (answered.filter((q) => genAnswers[q.id] === q.correctIndex).length /
              answered.length) *
              100
          )
        : undefined;

    setIsAnalyzing(true);
    try {
      const data = await fetchJsonSafe<AretAnalysisResponse>('/api/aret/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          evaluation: baseEval,
          customAccuracyPct,
          customTopic: topic,
          customDifficulty: difficulty,
        }),
      });
      setAnalysis(
        data && data.aiNarrative
          ? data
          : buildFallbackAretAnalysis({
              evaluation: baseEval,
              customAccuracyPct,
              customTopic: topic,
              customDifficulty: difficulty,
            })
      );
    } finally {
      setIsAnalyzing(false);
    }
  };

  // Compute Mistake Vault items across both PYP simulator & Deep Batch
  const pypMistakes = evaluation
    ? activePaper.questions.filter(
        (q) => typeof pypAnswers[q.id] === 'number' && pypAnswers[q.id] !== q.correctIndex
      )
    : [];
  const genMistakes = generatedQuestions.filter(
    (q) =>
      genChecked[q.id] &&
      typeof genAnswers[q.id] === 'number' &&
      genAnswers[q.id] !== q.correctIndex
  );
  const genCorrectCount = generatedQuestions.filter(
    (q) => genChecked[q.id] && genAnswers[q.id] === q.correctIndex
  ).length;
  const genAnsweredCount = generatedQuestions.filter(
    (q) => typeof genAnswers[q.id] === 'number'
  ).length;

  const PAGE_SIZE = 10;
  const totalPages = Math.max(1, Math.ceil(generatedQuestions.length / PAGE_SIZE));
  const currentQuestions = generatedQuestions.slice(
    pageOffset * PAGE_SIZE,
    (pageOffset + 1) * PAGE_SIZE
  );

  const recommendedProducts = evaluation
    ? SHOP_PRODUCTS.filter((p) => evaluation.recommendedBankIds.includes(p.id))
    : [];

  if (!isUnlocked) {
    return (
      <section className="bg-[#06080D] py-16 lg:py-24">
        <div className="mx-auto max-w-2xl px-6">
          <button
            type="button"
            onClick={() => onNavigate('aret')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>Back to ARET Preview</span>
          </button>

          <motion.div
            initial={{ opacity: 0, y: 16, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.42, ease: [0.16, 1, 0.3, 1] }}
            className="relative mt-6 overflow-hidden rounded-2xl border border-[#B8FF00]/35 bg-[#0D111A] p-8 sm:p-10"
          >
            <div className="flex items-center gap-4">
              <div className="relative flex h-12 w-12 shrink-0 items-center justify-center">
                <svg viewBox="0 0 56 56" className="h-12 w-12" aria-hidden="true">
                  <motion.circle
                    cx="28"
                    cy="28"
                    r="23"
                    fill="none"
                    stroke="#B8FF00"
                    strokeWidth="1.5"
                    strokeDasharray="6 5"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 14, repeat: Infinity, ease: 'linear' }}
                    style={{ originX: '28px', originY: '28px' }}
                  />
                </svg>
                <Lock className="absolute h-4 w-4 text-[#B8FF00]" aria-hidden="true" />
              </div>
              <div className="font-mono text-xs font-semibold text-[#B8FF00]">
                FULL-FLEDGED ARET SUITE · ACCESS CODE REQUIRED
              </div>
            </div>
            <h1 className="mt-4 font-display text-3xl font-bold text-white">
              Enter ARET Access Code
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-slate-300">
              Full-Fledged ARET features Multi-Year IXMO PYP Simulators, Deep SuS Question Studio (20–30 questions per response), and Mistake Vault Analytics. Only the authorized access code is accepted.
            </p>

            <form onSubmit={handleUnlockSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="aret-full-gate-code"
                  className="block text-xs font-medium text-slate-300"
                >
                  ARET Access Code
                </label>
                <div className="mt-1.5 flex flex-col sm:flex-row gap-3">
                  <input
                    id="aret-full-gate-code"
                    type="text"
                    value={accessInput}
                    onChange={(e) => {
                      setAccessInput(e.target.value);
                      if (accessError) setAccessError(null);
                    }}
                    placeholder="Enter access code"
                    className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-4 py-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-[#B8FF00]"
                  />
                  <button
                    type="submit"
                    className="rounded-lg bg-[#B8FF00] px-6 py-3 text-xs font-semibold text-[#05080F] hover:bg-[#ccff40] transition-colors whitespace-nowrap cursor-pointer"
                  >
                    Unlock Full ARET
                  </button>
                </div>
                {accessError && (
                  <motion.p
                    initial={{ opacity: 0, x: -6 }}
                    animate={{ opacity: 1, x: [0, -5, 5, -3, 0] }}
                    transition={{ duration: 0.35 }}
                    role="alert"
                    className="mt-2 text-xs font-medium text-rose-400"
                  >
                    {accessError}
                  </motion.p>
                )}
              </div>
            </form>
          </motion.div>
        </div>
      </section>
    );
  }

  return (
    <section className="bg-[#06080D] py-10 lg:py-14">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <button
            type="button"
            onClick={() => onNavigate('aret')}
            className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
            <span>ARET Preview Page</span>
          </button>

          <span className="inline-flex items-center gap-1.5 rounded-md border border-[#B8FF00]/45 bg-[#B8FF00]/10 px-3 py-1 font-mono text-[11px] font-semibold text-[#B8FF00]">
            <ShieldCheck className="h-3.5 w-3.5" aria-hidden="true" />
            <span>FULL ARET SUITE UNLOCKED · SEPTEMBER 2026 PRO ARCHITECTURE</span>
          </span>
        </div>

        {/* Full SuS & ARET Flying & Neural Docking Intro */}
        <div className="mt-5">
          <SuSAretFullIntro focus="aret-full" />
        </div>

        {/* Full Suite Workspace Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.36, delay: 0.08, ease: [0.16, 1, 0.3, 1] }}
          className="mt-6 rounded-2xl border border-white/10 bg-[#0D111A] p-6 sm:p-8"
        >
          <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6">
            <div>
              <p className="font-mono text-xs font-semibold text-[#00F0FF]">
                AUTOMATED RESPONSIVE EDUCATIONAL TOOL · FULL EDITION
              </p>
              <h1 className="mt-2 font-display text-3xl sm:text-4xl font-bold text-white">
                ARET Pro Multi-Page Command Suite
              </h1>
              <p className="mt-2 max-w-2xl text-sm text-slate-300">
                Select any operational module below. Every batch generated in Deep Question Studio adapts dynamically to your PYP accuracy profile.
              </p>
            </div>

            <div className="grid grid-cols-3 gap-4 border-t lg:border-t-0 lg:border-l border-white/10 pt-4 lg:pt-0 lg:pl-6 text-xs tabular-nums">
              <div>
                <span className="text-slate-400">Batch Capacity</span>
                <p className="mt-1 font-mono text-lg font-bold text-[#B8FF00]">20–30 Qs</p>
              </div>
              <div>
                <span className="text-slate-400">PYP Archives</span>
                <p className="mt-1 font-mono text-lg font-bold text-[#00F0FF]">3 Years</p>
              </div>
              <div>
                <span className="text-slate-400">Starting Tier</span>
                <p className="mt-1 font-mono text-lg font-bold text-white">
                  ₹{ARET_LAUNCH_INFO.startingPriceInr.toLocaleString('en-IN')}
                </p>
              </div>
            </div>
          </div>

          {/* 4-Page Sub-Navigation with Animated Active Indicator */}
          <nav
            aria-label="Full ARET Suite Sections"
            className="mt-6 flex flex-wrap gap-2 border-t border-white/10 pt-5"
          >
            {(
              [
                { id: 'overview', label: '01. Overview & 3D Core', icon: Compass },
                { id: 'pyp-simulator', label: '02. Multi-Year IXMO PYP Simulator', icon: Timer },
                {
                  id: 'deep-generator',
                  label: '03. Deep Question Studio (20–30 Qs)',
                  icon: Cpu,
                },
                { id: 'analytics', label: '04. Analytics & Mistake Vault', icon: BarChart3 },
              ] as const
            ).map((tab) => {
              const Icon = tab.icon;
              const active = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={`relative inline-flex items-center gap-2 rounded-lg px-4 py-2.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'text-[#05080F]'
                      : 'border border-white/10 bg-[#080B12] text-slate-300 hover:border-[#00F0FF]/50 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="aret-full-tab-pill"
                      transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
                      className="absolute inset-0 rounded-lg bg-[#B8FF00]"
                    />
                  )}
                  <Icon className="relative z-10 h-3.5 w-3.5" aria-hidden="true" />
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </nav>
        </motion.div>

        {/* Sub-Page 1: Overview & Telemetry Core */}
        {activeTab === 'overview' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-8"
          >
            <div className="lg:col-span-7 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 flex flex-col justify-between">
                <div>
                  <Timer className="h-6 w-6 text-[#00F0FF]" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-lg font-bold text-white">
                    Multi-Year IXMO PYP Simulator
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Attempt timed 2025, 2024, and 2023 IXMO diagnostics with official section weights (+1/-1 Logic, +1.5/-1 Math, +2 Adv Math, +4 HOTS).
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('pyp-simulator')}
                  className="mt-5 self-start text-xs font-semibold text-[#00F0FF] hover:underline cursor-pointer"
                >
                  Launch PYP Simulator →
                </button>
              </div>

              <div className="rounded-xl border border-[#B8FF00]/35 bg-[#0D111A] p-6 flex flex-col justify-between">
                <div>
                  <Cpu className="h-6 w-6 text-[#B8FF00]" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-lg font-bold text-white">
                    Deep Question Studio (20–30 Qs)
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Generate 20, 25, or 30 Olympiad questions in one SuS response with Question Palette navigation, flags, and full-batch grading.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('deep-generator')}
                  className="mt-5 self-start text-xs font-semibold text-[#B8FF00] hover:underline cursor-pointer"
                >
                  Open 20–30 Q Studio →
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 flex flex-col justify-between">
                <div>
                  <BarChart3 className="h-6 w-6 text-[#00F0FF]" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-lg font-bold text-white">
                    Mistake Vault &amp; Analytics
                  </h2>
                  <p className="mt-2 text-xs leading-relaxed text-slate-300">
                    Inspect topic-by-topic accuracy, negative-mark bleed score, missed question derivations, and curated IXMO Chapter Bank picks.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setActiveTab('analytics')}
                  className="mt-5 self-start text-xs font-semibold text-[#00F0FF] hover:underline cursor-pointer"
                >
                  Inspect Analytics →
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 flex flex-col justify-between">
                <div>
                  <Layers className="h-6 w-6 text-slate-300" aria-hidden="true" />
                  <h2 className="mt-4 font-display text-lg font-bold text-white">
                    Current Session Telemetry
                  </h2>
                  <div className="mt-3 space-y-1.5 text-xs text-slate-300 tabular-nums">
                    <p>
                      PYP Evaluated:{' '}
                      <strong className="text-white">
                        {evaluation ? `${evaluation.netScore}/${evaluation.maxScore}` : 'Pending'}
                      </strong>
                    </p>
                    <p>
                      Deep Studio Batch:{' '}
                      <strong className="text-white">
                        {generatedQuestions.length > 0
                          ? `${generatedQuestions.length} Questions Loaded`
                          : 'Ready (20–30 Qs)'}
                      </strong>
                    </p>
                    <p>
                      Mistake Vault Items:{' '}
                      <strong className="text-amber-300">
                        {pypMistakes.length + genMistakes.length} Recorded
                      </strong>
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => onNavigate('shop')}
                  className="mt-5 self-start text-xs font-semibold text-slate-300 hover:text-white cursor-pointer"
                >
                  Browse IXMO Study Packs →
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 rounded-xl border border-white/10 bg-[#070A12] overflow-hidden flex flex-col">
              <Olympiad3DCanvas
                mode={gyroMode}
                accent="lime"
                className="h-[320px] w-full flex-1"
                label="Full ARET 3D Neural Diagnostic Core"
              />
              <div className="border-t border-white/10 bg-[#0A0E17] px-4 py-3 flex items-center justify-between gap-2">
                <span className="font-mono text-[11px] text-slate-400">
                  Full Engine Telemetry · Interactive
                </span>
                <div className="flex items-center gap-1.5">
                  {(['orbital', 'diagnostic', 'harmonic'] as GyroMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setGyroMode(m)}
                      className={`rounded px-2.5 py-1 text-[11px] font-medium capitalize cursor-pointer ${
                        gyroMode === m
                          ? 'bg-[#B8FF00] text-[#05080F] font-semibold'
                          : 'bg-[#121723] text-slate-300 hover:text-white'
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {/* Sub-Page 2: Multi-Year IXMO PYP Simulator */}
        {activeTab === 'pyp-simulator' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8"
          >
            <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-xs font-semibold text-[#00F0FF]">
                  MULTI-YEAR IXMO ARCHIVE SIMULATOR
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  {activePaper.label}
                </h2>
                <p className="mt-1 text-xs text-slate-300">{activePaper.subtitle}</p>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                {(['2025', '2024', '2023'] as PypArchiveYear[]).map((yr) => (
                  <button
                    key={yr}
                    type="button"
                    onClick={() => {
                      setSelectedYear(yr);
                      setEvaluation(null);
                      setPypAnswers({});
                      setSimElapsedSec(0);
                    }}
                    className={`rounded-lg px-3.5 py-2 text-xs font-mono font-semibold cursor-pointer ${
                      selectedYear === yr
                        ? 'bg-[#00F0FF] text-[#05080F]'
                        : 'border border-white/15 bg-[#06080D] text-slate-300 hover:text-white'
                    }`}
                  >
                    IXMO {yr}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setSimRunning((r) => !r)}
                  className="rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2 font-mono text-xs text-[#B8FF00] cursor-pointer tabular-nums"
                >
                  {simRunning ? 'Pause' : 'Start Timer'} ·{' '}
                  {String(Math.floor(simElapsedSec / 60)).padStart(2, '0')}:
                  {String(simElapsedSec % 60).padStart(2, '0')}
                </button>
                <button
                  type="button"
                  onClick={handleEvaluateSimulator}
                  className="neon-cta rounded-lg px-5 py-2 text-xs font-semibold cursor-pointer"
                >
                  Score Paper
                </button>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-6">
              {activePaper.questions.map((q, idx) => {
                const chosen = pypAnswers[q.id];
                return (
                  <article
                    key={q.id}
                    className="rounded-xl border border-white/10 bg-[#080B12] p-5"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono">
                      <span className="text-[#00F0FF]">
                        Q{idx + 1} · {q.year} · {q.topic}
                      </span>
                      <span className="text-slate-400">
                        +{q.marks}m / {q.negativeMarks > 0 ? `-${q.negativeMarks}m` : 'No neg'}
                      </span>
                    </div>
                    <h3 className="mt-2.5 text-sm font-semibold leading-relaxed text-white">
                      {q.prompt}
                    </h3>
                    {q.statements && (
                      <div className="mt-2 space-y-1 font-mono text-[11px] text-slate-300">
                        {q.statements.map((s) => (
                          <p key={s}>{s}</p>
                        ))}
                      </div>
                    )}
                    <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-2">
                      {q.options.map((opt, oIdx) => {
                        const letter = String.fromCharCode(65 + oIdx);
                        const selected = chosen === oIdx;
                        const isRight = oIdx === q.correctIndex;
                        let style = 'border-white/10 bg-[#111622] text-slate-200 hover:border-white/30';
                        if (evaluation) {
                          if (isRight) style = 'border-[#B8FF00]/70 bg-[#B8FF00]/10 text-white';
                          else if (selected) style = 'border-rose-400/70 bg-rose-500/10 text-rose-100';
                        } else if (selected) {
                          style = 'border-[#00F0FF] bg-[#00F0FF]/12 text-white';
                        }
                        return (
                          <button
                            key={letter}
                            type="button"
                            onClick={() =>
                              setPypAnswers((prev) => ({ ...prev, [q.id]: oIdx }))
                            }
                            className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs cursor-pointer ${style}`}
                          >
                            <span className="font-mono font-semibold text-[#00F0FF]">
                              ({letter})
                            </span>
                            <span className="flex-1">{opt}</span>
                          </button>
                        );
                      })}
                    </div>
                    {evaluation && (
                      <p className="mt-4 border-t border-white/10 pt-3 text-[11px] leading-relaxed text-slate-300">
                        <strong className="text-[#B8FF00]">Solution:</strong> {q.explanation}
                      </p>
                    )}
                  </article>
                );
              })}
            </div>

            {evaluation && (
              <div className="mt-6 flex flex-wrap items-center justify-between gap-4 rounded-xl border border-[#00F0FF]/35 bg-[#080B12] p-5 text-xs tabular-nums">
                <div>
                  <span className="text-slate-400">Evaluated Result:</span>{' '}
                  <strong className="font-mono text-base text-[#00F0FF]">
                    {evaluation.netScore} / {evaluation.maxScore}
                  </strong>{' '}
                  · Accuracy <strong className="text-white">{evaluation.accuracyPct}%</strong> ·
                  Estimated <strong className="text-[#B8FF00]">{evaluation.estimatedPercentile}th percentile</strong>
                </div>
                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => setActiveTab('deep-generator')}
                    className="rounded-lg bg-[#B8FF00] px-4 py-2 text-xs font-semibold text-[#05080F] cursor-pointer"
                  >
                    Drill Weak Topics (20–30 Qs) →
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('analytics')}
                    className="rounded-lg border border-white/15 px-4 py-2 text-xs font-semibold text-white cursor-pointer"
                  >
                    Open Mistake Vault →
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}

        {/* Sub-Page 3: SuS Deep Question Studio (20–30 Questions per Response) */}
        {activeTab === 'deep-generator' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-white/10 pb-5">
              <div>
                <p className="font-mono text-xs font-semibold text-[#B8FF00]">
                  DEEP QUESTION STUDIO · 20 TO 30 QUESTIONS PER RESPONSE
                </p>
                <h2 className="mt-1 font-display text-2xl font-bold text-white">
                  Full-Scale SuS Question Bank Generator
                </h2>
                <p className="mt-1 text-xs text-slate-300">
                  Generate complete 20, 25, or 30 question Olympiad practice sheets with paginated palette, review flags, and instant full-sheet scoring.
                </p>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div>
                <label htmlFor="full-topic" className="block text-xs font-medium text-slate-300">
                  Topic Focus
                </label>
                <select
                  id="full-topic"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value as AretTopic)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
                >
                  {FULL_TOPICS.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="full-diff" className="block text-xs font-medium text-slate-300">
                  Difficulty Tier
                </label>
                <select
                  id="full-diff"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as AretDifficulty)}
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
                <label htmlFor="full-style" className="block text-xs font-medium text-slate-300">
                  Question Style
                </label>
                <select
                  id="full-style"
                  value={style}
                  onChange={(e) => setStyle(e.target.value as AretQuestionStyle)}
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
                <label htmlFor="full-count" className="block text-xs font-medium text-slate-300">
                  Questions Per Response
                </label>
                <select
                  id="full-count"
                  value={questionCount}
                  onChange={(e) => setQuestionCount(Number(e.target.value) as 20 | 25 | 30)}
                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
                >
                  <option value={20}>20 Questions</option>
                  <option value={25}>25 Questions</option>
                  <option value={30}>30 Questions</option>
                </select>
              </div>
            </div>

            <div className="mt-5 flex flex-wrap items-center gap-3">
              <button
                type="button"
                disabled={isGenerating}
                onClick={() => void handleGenerateDeepBatch()}
                className="neon-cta inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold disabled:opacity-60 cursor-pointer"
              >
                <Cpu className="h-4 w-4" aria-hidden="true" />
                <span>
                  {isGenerating
                    ? `Generating ${questionCount} Questions via SuS...`
                    : `Generate ${questionCount} Questions via SuS`}
                </span>
              </button>

              {generatedQuestions.length > 0 && (
                <button
                  type="button"
                  onClick={handleGradeEntireBatch}
                  className="inline-flex items-center gap-2 rounded-lg border border-[#B8FF00]/55 bg-[#B8FF00]/10 px-5 py-2.5 text-xs font-semibold text-[#B8FF00] hover:bg-[#B8FF00] hover:text-[#05080F] transition-colors cursor-pointer"
                >
                  <CheckCircle2 className="h-4 w-4" aria-hidden="true" />
                  <span>Grade Full {generatedQuestions.length}-Question Sheet</span>
                </button>
              )}
            </div>

            {generatedQuestions.length > 0 && (
              <div className="mt-8 space-y-6 border-t border-white/10 pt-6">
                {/* Palette + Score HUD */}
                <div className="rounded-xl border border-white/10 bg-[#080B12] p-4 space-y-3">
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs tabular-nums">
                    <span className="font-mono font-semibold text-[#00F0FF]">
                      LOADED SET: {generatedQuestions.length} QUESTIONS · ANSWERED{' '}
                      {genAnsweredCount}/{generatedQuestions.length}
                    </span>
                    {batchGraded && (
                      <span className="font-mono font-semibold text-[#B8FF00]">
                        SCORE: {genCorrectCount} / {generatedQuestions.length} (
                        {Math.round((genCorrectCount / generatedQuestions.length) * 100)}%)
                      </span>
                    )}
                  </div>

                  <div className="flex flex-wrap gap-1.5">
                    {generatedQuestions.map((q, idx) => {
                      const answered = typeof genAnswers[q.id] === 'number';
                      const checked = Boolean(genChecked[q.id]);
                      const correct = checked && genAnswers[q.id] === q.correctIndex;
                      const wrong = checked && answered && !correct;
                      const flagged = Boolean(flaggedIds[q.id]);
                      const targetPage = Math.floor(idx / PAGE_SIZE);

                      let pillStyle = 'border-white/15 bg-[#111622] text-slate-300';
                      if (correct) pillStyle = 'border-[#B8FF00] bg-[#B8FF00]/20 text-[#B8FF00]';
                      else if (wrong) pillStyle = 'border-rose-400 bg-rose-500/20 text-rose-200';
                      else if (answered) pillStyle = 'border-[#00F0FF] bg-[#00F0FF]/15 text-[#00F0FF]';

                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => setPageOffset(targetPage)}
                          className={`relative h-8 w-9 rounded border font-mono text-[11px] font-semibold cursor-pointer ${pillStyle} ${
                            pageOffset === targetPage ? 'ring-1 ring-white/40' : ''
                          }`}
                        >
                          {idx + 1}
                          {flagged && (
                            <span className="absolute -top-1 -right-1 h-2 w-2 rounded-full bg-amber-400" />
                          )}
                        </button>
                      );
                    })}
                  </div>

                  <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-white/10 text-xs">
                    <div className="flex items-center gap-2">
                      {Array.from({ length: totalPages }).map((_, pIdx) => (
                        <button
                          key={pIdx}
                          type="button"
                          onClick={() => setPageOffset(pIdx)}
                          className={`rounded-md px-3 py-1 font-mono text-xs cursor-pointer ${
                            pageOffset === pIdx
                              ? 'bg-[#00F0FF] text-[#05080F] font-semibold'
                              : 'border border-white/10 bg-[#121723] text-slate-300'
                          }`}
                        >
                          Q{pIdx * PAGE_SIZE + 1}–
                          {Math.min((pIdx + 1) * PAGE_SIZE, generatedQuestions.length)}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Questions List for Current Page */}
                <div className="space-y-4">
                  {currentQuestions.map((gq, localIdx) => {
                    const globalIdx = pageOffset * PAGE_SIZE + localIdx;
                    const chosen = genAnswers[gq.id];
                    const checked = Boolean(genChecked[gq.id]);
                    const isFlagged = Boolean(flaggedIds[gq.id]);
                    return (
                      <article
                        key={gq.id}
                        className="rounded-xl border border-white/10 bg-[#080B12] p-5"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono">
                          <span className="text-[#B8FF00]">
                            Q{globalIdx + 1} of {generatedQuestions.length} · {gq.topic} ·{' '}
                            {gq.difficulty}
                          </span>
                          <button
                            type="button"
                            onClick={() =>
                              setFlaggedIds((prev) => ({ ...prev, [gq.id]: !isFlagged }))
                            }
                            className={`inline-flex items-center gap-1 rounded px-2 py-0.5 cursor-pointer ${
                              isFlagged
                                ? 'bg-amber-400/20 text-amber-300'
                                : 'text-slate-400 hover:text-white'
                            }`}
                          >
                            <Flag className="h-3 w-3" aria-hidden="true" />
                            <span>{isFlagged ? 'Flagged' : 'Flag'}</span>
                          </button>
                        </div>

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
                            let optStyle =
                              'border-white/10 bg-[#111622] text-slate-200 hover:border-white/30';
                            if (checked) {
                              if (isCorrect) {
                                optStyle = 'border-[#B8FF00]/70 bg-[#B8FF00]/10 text-white';
                              } else if (selected) {
                                optStyle = 'border-rose-400/70 bg-rose-500/10 text-rose-100';
                              }
                            } else if (selected) {
                              optStyle = 'border-[#00F0FF] bg-[#00F0FF]/12 text-white';
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
                                className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-xs cursor-pointer ${optStyle}`}
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
                            Check Q{globalIdx + 1}
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
              </div>
            )}
          </motion.div>
        )}

        {/* Sub-Page 4: In-Depth Analytics & Mistake Vault */}
        {activeTab === 'analytics' && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-8 space-y-6"
          >
            <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6 lg:p-8">
              <div className="flex flex-wrap items-center justify-between gap-4 border-b border-white/10 pb-5">
                <div>
                  <p className="font-mono text-xs font-semibold text-[#B8FF00]">
                    IN-DEPTH PERFORMANCE TELEMETRY &amp; MISTAKE VAULT
                  </p>
                  <h2 className="mt-1 font-display text-2xl font-bold text-white">
                    Deep Analytics Dashboard
                  </h2>
                </div>
                <button
                  type="button"
                  disabled={isAnalyzing}
                  onClick={() => void handleRunDeepAnalysis()}
                  className="neon-cta inline-flex items-center gap-2 rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
                >
                  <BarChart3 className="h-4 w-4" aria-hidden="true" />
                  <span>
                    {isAnalyzing
                      ? 'Generating Deep SuS Report...'
                      : 'Generate / Refresh SuS Diagnostic Report'}
                  </span>
                </button>
              </div>

              <div className="mt-6 grid grid-cols-2 lg:grid-cols-4 gap-4 text-xs tabular-nums">
                <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                  <span className="text-slate-400">PYP Net Score</span>
                  <p className="mt-1 font-mono text-xl font-bold text-[#00F0FF]">
                    {evaluation ? `${evaluation.netScore} / ${evaluation.maxScore}` : 'Not Scored'}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                  <span className="text-slate-400">Negative-Mark Bleed</span>
                  <p className="mt-1 font-mono text-xl font-bold text-rose-300">
                    {evaluation ? `-${evaluation.negativePenalty} marks` : '0 marks'}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                  <span className="text-slate-400">Deep Studio Solved</span>
                  <p className="mt-1 font-mono text-xl font-bold text-[#B8FF00]">
                    {genCorrectCount} / {generatedQuestions.length || 0}
                  </p>
                </div>
                <div className="rounded-lg border border-white/10 bg-[#080B12] p-4">
                  <span className="text-slate-400">Mistake Vault Entries</span>
                  <p className="mt-1 font-mono text-xl font-bold text-amber-300">
                    {pypMistakes.length + genMistakes.length}
                  </p>
                </div>
              </div>

              {analysis && (
                <div className="mt-6 rounded-xl border border-[#B8FF00]/35 bg-[#080B12] p-6">
                  <p className="font-mono text-xs font-semibold text-[#B8FF00]">
                    {analysis.readinessBadge}
                  </p>
                  <p className="mt-2 text-sm leading-relaxed text-slate-200">
                    {analysis.aiNarrative}
                  </p>
                  <ul className="mt-4 space-y-2 text-xs text-slate-300">
                    {analysis.studyPlan.map((step, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <Sparkles className="mt-0.5 h-3.5 w-3.5 shrink-0 text-[#B8FF00]" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Mistake Vault */}
              <div className="mt-6">
                <h3 className="font-display text-lg font-semibold text-white">
                  Mistake Vault ({pypMistakes.length + genMistakes.length})
                </h3>
                {pypMistakes.length + genMistakes.length === 0 ? (
                  <p className="mt-2 text-xs text-slate-400">
                    No incorrect checked questions recorded yet. Attempt and check questions in the Multi-Year PYP Simulator or Deep Question Studio to populate your Mistake Vault.
                  </p>
                ) : (
                  <div className="mt-4 space-y-3">
                    {pypMistakes.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-lg border border-rose-400/30 bg-[#080B12] p-4 text-xs"
                      >
                        <p className="font-mono text-rose-300">
                          {q.year} · {q.topic}
                        </p>
                        <p className="mt-1 font-semibold text-white">{q.prompt}</p>
                        <p className="mt-2 text-slate-300">{q.explanation}</p>
                      </div>
                    ))}
                    {genMistakes.map((q) => (
                      <div
                        key={q.id}
                        className="rounded-lg border border-rose-400/30 bg-[#080B12] p-4 text-xs"
                      >
                        <p className="font-mono text-rose-300">
                          Deep Studio · {q.topic} ({q.difficulty})
                        </p>
                        <p className="mt-1 font-semibold text-white">{q.prompt}</p>
                        <p className="mt-2 text-slate-300">{q.explanation}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {recommendedProducts.length > 0 && (
                <div className="mt-6 border-t border-white/10 pt-5">
                  <p className="text-xs font-semibold text-[#00F0FF]">
                    Recommended IXMO Question Banks &amp; PYP Packs (Use FREEMATERIAL at Checkout for ₹0)
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {recommendedProducts.map((p) => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => onNavigate('shop')}
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#121723] px-3.5 py-2 text-xs font-medium text-slate-200 hover:border-[#00F0FF] cursor-pointer"
                      >
                        <ShoppingBag className="h-3.5 w-3.5 text-[#00F0FF]" />
                        <span>{p.title}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}
      </div>
    </section>
  );
}
