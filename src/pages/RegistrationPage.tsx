import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Sparkles,
  Tag,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { OLYMPIADS } from '../data/olympiadData';
import type {
  ConfirmationState,
  OlympiadId,
  PageRoute,
  RegistrationPayload,
  RegistrationRecord,
} from '../types/olympiad';
import {
  calculateRegistrationPricing,
  generateReferenceId,
  getSuSRegistrationGuidance,
  REGISTRATION_FREE_COUPON,
  validateRegistrationStep,
  type RegistrationErrors,
} from '../utils/olympiadLogic';
import {
  OobeAmbientStage,
  OobeSlideTransition,
} from '../components/MotionPrimitives';
import { SuSOobeAssistant, SuSOrb } from '../components/SuSOobeAssistant';

interface RegistrationPageProps {
  preselectedOlympiadId: OlympiadId | null;
  registrations: RegistrationRecord[];
  onNavigate: (page: PageRoute) => void;
  onRegistrationComplete: (
    record: RegistrationRecord,
    confirmation: ConfirmationState
  ) => Promise<void>;
}

const INITIAL_FORM: RegistrationPayload = {
  name: '',
  email: '',
  phone: '',
  guardianName: '',
  age: '',
  studentClass: '9',
  school: '',
  city: '',
  selectedOlympiadIds: ['ixmo'],
  couponCode: '',
};

const STEP_LABELS = [
  'Track Choice',
  'Identity',
  'School & Class',
  'Review & Submit',
];

const PROVISIONING_PHASES = [
  'Locking your selected 2026 X Olympiad seat(s)...',
  'Generating official Reference ID & saving to Foundation Database...',
  'Syncing enrollment record with Cloud Firestore (x-olympiad-foundation)...',
];

export function RegistrationPage({
  preselectedOlympiadId,
  registrations,
  onNavigate,
  onRegistrationComplete,
}: RegistrationPageProps) {
  const [form, setForm] = useState<RegistrationPayload>(INITIAL_FORM);
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [appliedCoupon, setAppliedCoupon] = useState('');
  const [couponNote, setCouponNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<RegistrationErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);

  useEffect(() => {
    if (preselectedOlympiadId) {
      setForm((prev) => ({
        ...prev,
        selectedOlympiadIds: prev.selectedOlympiadIds.includes(preselectedOlympiadId)
          ? prev.selectedOlympiadIds
          : [...prev.selectedOlympiadIds, preselectedOlympiadId],
      }));
    }
  }, [preselectedOlympiadId]);

  useEffect(() => {
    if (!isProvisioning) {
      setPhaseIdx(0);
      return;
    }
    const timer = window.setInterval(() => {
      setPhaseIdx((prev) => (prev < PROVISIONING_PHASES.length - 1 ? prev + 1 : prev));
    }, 520);
    return () => window.clearInterval(timer);
  }, [isProvisioning]);

  const activeCoupon =
    appliedCoupon ||
    (form.couponCode?.trim().toUpperCase() === REGISTRATION_FREE_COUPON
      ? REGISTRATION_FREE_COUPON
      : '');

  const feePricing = calculateRegistrationPricing(
    form.selectedOlympiadIds,
    OLYMPIADS,
    activeCoupon
  );
  const totalFeeInr = feePricing.finalFeeInr;

  const liveGuidance = useMemo(
    () =>
      getSuSRegistrationGuidance({
        step,
        form,
        catalog: OLYMPIADS,
        couponApplied: feePricing.couponApplied,
        finalFeeInr: totalFeeInr,
      }),
    [step, form, feePricing.couponApplied, totalFeeInr]
  );

  // Compute live validation indicators per input field
  const liveFieldValid = useMemo(() => {
    return {
      name: form.name.trim().length >= 2,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
      phone: (() => {
        const d = form.phone.replace(/\D/g, '').length;
        return d >= 7 && d <= 15;
      })(),
      guardianName: form.guardianName.trim().length >= 2,
      age: (() => {
        const n = Number(form.age);
        return Boolean(form.age.trim()) && !Number.isNaN(n) && n >= 8 && n <= 20;
      })(),
      school: form.school.trim().length >= 2,
      city: form.city.trim().length >= 2,
    };
  }, [form]);

  const handleApplyCoupon = () => {
    const code = (form.couponCode ?? '').trim().toUpperCase();
    if (!code) {
      setAppliedCoupon('');
      setCouponNote(null);
      return;
    }
    if (code === REGISTRATION_FREE_COUPON) {
      setAppliedCoupon(code);
      setCouponNote(
        `Coupon ${REGISTRATION_FREE_COUPON} applied — 100% registration fee waived (₹0).`
      );
    } else {
      setAppliedCoupon('');
      setCouponNote(
        `Coupon code not recognized. Use ${REGISTRATION_FREE_COUPON} for free registration.`
      );
    }
  };

  const toggleOlympiad = (id: OlympiadId) => {
    setForm((prev) => {
      const exists = prev.selectedOlympiadIds.includes(id);
      return {
        ...prev,
        selectedOlympiadIds: exists
          ? prev.selectedOlympiadIds.filter((item) => item !== id)
          : [...prev.selectedOlympiadIds, id],
      };
    });
    if (errors.selectedOlympiadIds) {
      setErrors((prev) => ({ ...prev, selectedOlympiadIds: undefined }));
    }
  };

  const goToStep = (target: 1 | 2 | 3 | 4) => {
    setDirection(target >= step ? 1 : -1);
    setStep(target);
  };

  const handleNextStep = () => {
    const stepValidation = validateRegistrationStep(step, form, OLYMPIADS);
    if (Object.keys(stepValidation).length > 0) {
      setErrors(stepValidation);
      return;
    }
    setErrors({});
    if (step < 4) {
      goToStep((step + 1) as 1 | 2 | 3 | 4);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (step < 4) {
      handleNextStep();
      return;
    }
    const validation = validateRegistrationStep(4, form, OLYMPIADS);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      if (validation.selectedOlympiadIds) {
        goToStep(validation.selectedOlympiadIds.includes('Classes') ? 3 : 1);
      } else if (
        validation.name ||
        validation.email ||
        validation.phone ||
        validation.guardianName
      ) {
        goToStep(2);
      } else if (
        validation.age ||
        validation.studentClass ||
        validation.school ||
        validation.city
      ) {
        goToStep(3);
      }
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsProvisioning(true);

    const regId = generateReferenceId('XOF', Date.now() + registrations.length * 137);
    const olympiadNames = OLYMPIADS.filter((o) =>
      form.selectedOlympiadIds.includes(o.id)
    ).map((o) => `${o.code} — ${o.name}`);

    const finalPricing = calculateRegistrationPricing(
      form.selectedOlympiadIds,
      OLYMPIADS,
      appliedCoupon || form.couponCode || ''
    );

    const record: RegistrationRecord = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      guardianName: form.guardianName.trim(),
      age: form.age.trim(),
      school: form.school.trim(),
      city: form.city.trim(),
      couponCode: finalPricing.couponApplied || '',
      registrationId: regId,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      olympiadNames,
      rawFeeInr: finalPricing.rawFeeInr,
      discountInr: finalPricing.discountInr,
      totalFeeInr: finalPricing.finalFeeInr,
    };

    const confirmation: ConfirmationState = {
      type: 'registration',
      referenceId: regId,
      recipientName: record.name,
      recipientEmail: record.email,
      summaryLines: [
        `Class ${record.studentClass} · Age ${record.age} · ${record.school}, ${record.city}`,
        `Guardian: ${record.guardianName}`,
        `Enrolled: ${olympiadNames.join(', ')}`,
        ...(finalPricing.couponValid
          ? [`Coupon Applied: ${finalPricing.couponApplied} (100% Fee Waiver)`]
          : []),
      ],
      totalInr: finalPricing.finalFeeInr,
    };

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      await onRegistrationComplete(record, confirmation);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : String(err));
      setIsProvisioning(false);
    }
  };

  const classNum = Number(form.studentClass);

  return (
    <section className="bg-[#06080D] py-10 lg:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <button
          type="button"
          onClick={() => onNavigate('home')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Home</span>
        </button>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold text-[#00F0FF]">
              GUIDED SETUP BY SuS · 2026 CYCLE
            </p>
            <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Olympiad Registration
            </h1>
          </div>
          <div className="rounded-lg border border-white/10 bg-[#0D111A] px-4 py-2 text-xs tabular-nums">
            <span className="text-slate-400">Live Fee Estimate: </span>
            <span className="font-mono font-bold text-[#00F0FF]">₹{totalFeeInr}</span>
            {feePricing.discountInr > 0 && (
              <span className="ml-2 font-mono text-[#B8FF00]">
                (Saved ₹{feePricing.discountInr})
              </span>
            )}
          </div>
        </div>

        {/* Main Cinematic OOBE Stage */}
        <div className="mt-6">
          <OobeAmbientStage>
            <div className="p-6 sm:p-8 lg:p-10">
              {isProvisioning ? (
                /* Movie-like Windows OOBE Provisioning Screen */
                <motion.div
                  initial={{ opacity: 0, scale: 0.98 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="py-10 sm:py-14 text-center max-w-lg mx-auto space-y-6"
                  role="status"
                  aria-live="polite"
                >
                  <div className="relative mx-auto flex h-28 w-28 items-center justify-center">
                    <svg viewBox="0 0 112 112" className="h-28 w-28" aria-hidden="true">
                      <circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke="rgba(255,255,255,0.08)"
                        strokeWidth="3"
                      />
                      <motion.circle
                        cx="56"
                        cy="56"
                        r="48"
                        fill="none"
                        stroke={phaseIdx >= PROVISIONING_PHASES.length - 1 ? '#B8FF00' : '#00F0FF'}
                        strokeWidth="3"
                        strokeLinecap="round"
                        initial={{ pathLength: 0.15, rotate: -90 }}
                        animate={{
                          pathLength: (phaseIdx + 1) / PROVISIONING_PHASES.length,
                          rotate: -90,
                        }}
                        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
                        style={{ originX: '56px', originY: '56px' }}
                      />
                    </svg>
                    <motion.span
                      aria-hidden="true"
                      animate={{ scale: [1, 1.35], opacity: [0.45, 0] }}
                      transition={{ duration: 1.1, repeat: Infinity, ease: 'easeOut' }}
                      className="pointer-events-none absolute inset-3 rounded-full border border-[#00F0FF]/60"
                    />
                    <div className="absolute inset-0 flex items-center justify-center">
                      <SuSOrb mood="celebrate" size={68} />
                    </div>
                  </div>
                  <div>
                    <p className="font-mono text-xs font-semibold uppercase tracking-widest text-[#B8FF00]">
                      Just a moment
                    </p>
                    <h2 className="mt-2 font-display text-2xl sm:text-3xl font-bold text-white">
                      SuS is setting up your Olympiad seat
                    </h2>
                    <AnimatePresence mode="wait">
                      <motion.p
                        key={`phase-${phaseIdx}`}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -8 }}
                        className="mt-3 text-sm text-[#00F0FF]"
                      >
                        {PROVISIONING_PHASES[phaseIdx]}
                      </motion.p>
                    </AnimatePresence>
                  </div>

                  <div className="space-y-2.5 text-left rounded-xl border border-white/10 bg-[#060910] p-4 text-xs">
                    {PROVISIONING_PHASES.map((phase, idx) => {
                      const done = idx < phaseIdx;
                      const active = idx === phaseIdx;
                      return (
                        <motion.div
                          key={phase}
                          initial={{ opacity: 0, x: -8 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: idx * 0.08 }}
                          className="flex items-center gap-2.5"
                        >
                          {done ? (
                            <CheckCircle2 className="h-4 w-4 shrink-0 text-[#B8FF00]" />
                          ) : active ? (
                            <Loader2 className="h-4 w-4 shrink-0 animate-spin text-[#00F0FF]" />
                          ) : (
                            <span className="h-4 w-4 shrink-0 rounded-full border border-white/20" />
                          )}
                          <span
                            className={
                              done
                                ? 'text-[#B8FF00]'
                                : active
                                  ? 'text-white font-medium'
                                  : 'text-slate-500'
                            }
                          >
                            {phase}
                          </span>
                        </motion.div>
                      );
                    })}
                  </div>
                </motion.div>
              ) : (
                <>
                  {/* Continuous Interactive SuS Companion Header */}
                  <SuSOobeAssistant
                    guidance={liveGuidance}
                    stepLabels={STEP_LABELS}
                    currentStep={step}
                    onJumpToStep={(target) => {
                      if (target <= step) {
                        goToStep(target as 1 | 2 | 3 | 4);
                      }
                    }}
                    contextTag="Olympiad Registration"
                  />

                  <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-7">
                    <AnimatePresence mode="wait">
                      {step === 1 && (
                        <OobeSlideTransition
                          key="reg-step-1"
                          stepKey="reg-step-1"
                          direction={direction}
                        >
                          <div>
                            <div className="flex flex-wrap items-center justify-between gap-2">
                              <h2 className="font-display text-xl font-bold text-white">
                                Choose Your 2026 Olympiad Tracks
                              </h2>
                              <span className="font-mono text-xs text-slate-400">
                                Multiple tracks allowed · Fee calculated automatically
                              </span>
                            </div>

                            <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                              {OLYMPIADS.map((exam) => {
                                const checked = form.selectedOlympiadIds.includes(exam.id);
                                const isCompeto = exam.id === 'ixcompeto';
                                return (
                                  <motion.label
                                    key={exam.id}
                                    whileHover={{ y: -2 }}
                                    whileTap={{ scale: 0.99 }}
                                    className={`relative flex items-start gap-3.5 rounded-xl border p-4 text-sm transition-colors cursor-pointer ${
                                      checked
                                        ? 'border-[#00F0FF] bg-[#00F0FF]/10 text-white'
                                        : 'border-white/10 bg-[#101624] text-slate-300 hover:border-white/25'
                                    }`}
                                  >
                                    <input
                                      type="checkbox"
                                      checked={checked}
                                      onChange={() => toggleOlympiad(exam.id)}
                                      className="mt-1 h-4 w-4 accent-[#00F0FF]"
                                    />
                                    <div className="flex-1 min-w-0">
                                      <div className="flex items-center justify-between gap-2">
                                        <span className="font-display font-bold text-white">
                                          {exam.code}
                                        </span>
                                        <span className="font-mono text-xs font-bold text-[#B8FF00] tabular-nums">
                                          ₹{exam.feeInr}
                                        </span>
                                      </div>
                                      <p className="text-xs font-medium text-slate-200">
                                        {exam.name}
                                      </p>
                                      <p className="mt-1.5 text-[11px] text-slate-400 tabular-nums">
                                        {exam.eligibility} · Exam {exam.examDateLabel}
                                      </p>
                                      <div className="mt-2 flex items-center gap-2 text-[11px]">
                                        {checked ? (
                                          <span className="inline-flex items-center gap-1 font-semibold text-[#B8FF00]">
                                            <Check className="h-3 w-3" />
                                            Track Selected
                                          </span>
                                        ) : isCompeto ? (
                                          <span className="inline-flex items-center gap-1 text-amber-300">
                                            <AlertTriangle className="h-3 w-3" />
                                            Strictly Grades 10–12
                                          </span>
                                        ) : (
                                          <span className="text-slate-400">
                                            Closes {exam.registrationClosingLabel}
                                          </span>
                                        )}
                                      </div>
                                    </div>
                                  </motion.label>
                                );
                              })}
                            </div>

                            {errors.selectedOlympiadIds && (
                              <p role="alert" className="mt-3 text-xs font-medium text-rose-400">
                                {errors.selectedOlympiadIds}
                              </p>
                            )}
                          </div>
                        </OobeSlideTransition>
                      )}

                      {step === 2 && (
                        <OobeSlideTransition
                          key="reg-step-2"
                          stepKey="reg-step-2"
                          direction={direction}
                        >
                          <div>
                            <h2 className="font-display text-xl font-bold text-white">
                              Candidate &amp; Guardian Particulars
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                              SuS marks each verified field with a green check as you type.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-name"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    Candidate Full Name
                                  </label>
                                  {liveFieldValid.name && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Ready
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-name"
                                  type="text"
                                  value={form.name}
                                  onChange={(e) => {
                                    setForm({ ...form, name: e.target.value });
                                    if (errors.name) setErrors({ ...errors, name: undefined });
                                  }}
                                  placeholder="Aarav Verma"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.name
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.name && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.name}
                                  </p>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-email"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    Email Address
                                  </label>
                                  {liveFieldValid.email && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Valid Email
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-email"
                                  type="email"
                                  value={form.email}
                                  onChange={(e) => {
                                    setForm({ ...form, email: e.target.value });
                                    if (errors.email) setErrors({ ...errors, email: undefined });
                                  }}
                                  placeholder="student@example.in"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.email
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.email && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.email}
                                  </p>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-phone"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    Phone Number
                                  </label>
                                  {liveFieldValid.phone && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Verified
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-phone"
                                  type="tel"
                                  value={form.phone}
                                  onChange={(e) => {
                                    setForm({ ...form, phone: e.target.value });
                                    if (errors.phone) setErrors({ ...errors, phone: undefined });
                                  }}
                                  placeholder="+91 98765 43210"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.phone
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.phone && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.phone}
                                  </p>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-guardian"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    Guardian&apos;s Name
                                  </label>
                                  {liveFieldValid.guardianName && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Verified
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-guardian"
                                  type="text"
                                  value={form.guardianName}
                                  onChange={(e) => {
                                    setForm({ ...form, guardianName: e.target.value });
                                    if (errors.guardianName) {
                                      setErrors({ ...errors, guardianName: undefined });
                                    }
                                  }}
                                  placeholder="Parent or guardian name"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.guardianName
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.guardianName && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.guardianName}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </OobeSlideTransition>
                      )}

                      {step === 3 && (
                        <OobeSlideTransition
                          key="reg-step-3"
                          stepKey="reg-step-3"
                          direction={direction}
                        >
                          <div>
                            <h2 className="font-display text-xl font-bold text-white">
                              Academic Profile &amp; Examination City
                            </h2>
                            <p className="mt-1 text-xs text-slate-400">
                              SuS validates your grade level against every chosen Olympiad rule.
                            </p>

                            <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-age"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    Candidate Age (8–20)
                                  </label>
                                  {liveFieldValid.age && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Valid Age
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-age"
                                  type="number"
                                  min={8}
                                  max={20}
                                  value={form.age}
                                  onChange={(e) => {
                                    setForm({ ...form, age: e.target.value });
                                    if (errors.age) setErrors({ ...errors, age: undefined });
                                  }}
                                  placeholder="14"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.age
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.age && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.age}
                                  </p>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-class"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    Current Class
                                  </label>
                                  {classNum < 10 &&
                                  form.selectedOlympiadIds.includes('ixcompeto') ? (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-amber-300">
                                      <AlertTriangle className="h-3 w-3" /> IXCompetO needs 10–12
                                    </span>
                                  ) : (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Eligible
                                    </span>
                                  )}
                                </div>
                                <select
                                  id="reg-class"
                                  value={form.studentClass}
                                  onChange={(e) => {
                                    setForm({ ...form, studentClass: e.target.value });
                                    if (errors.selectedOlympiadIds) {
                                      setErrors({ ...errors, selectedOlympiadIds: undefined });
                                    }
                                  }}
                                  className="mt-1.5 w-full rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 text-sm text-white focus:border-[#00F0FF]"
                                >
                                  {['5', '6', '7', '8', '9', '10', '11', '12'].map((cls) => (
                                    <option key={cls} value={cls}>
                                      Class {cls}
                                    </option>
                                  ))}
                                </select>
                                {errors.selectedOlympiadIds && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.selectedOlympiadIds}
                                  </p>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-school"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    School Name
                                  </label>
                                  {liveFieldValid.school && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Verified
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-school"
                                  type="text"
                                  value={form.school}
                                  onChange={(e) => {
                                    setForm({ ...form, school: e.target.value });
                                    if (errors.school) setErrors({ ...errors, school: undefined });
                                  }}
                                  placeholder="Delhi Public School"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.school
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.school && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.school}
                                  </p>
                                )}
                              </div>

                              <div>
                                <div className="flex items-center justify-between">
                                  <label
                                    htmlFor="reg-city"
                                    className="block text-xs font-medium text-slate-200"
                                  >
                                    City
                                  </label>
                                  {liveFieldValid.city && (
                                    <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                      <Check className="h-3 w-3" /> Verified
                                    </span>
                                  )}
                                </div>
                                <input
                                  id="reg-city"
                                  type="text"
                                  value={form.city}
                                  onChange={(e) => {
                                    setForm({ ...form, city: e.target.value });
                                    if (errors.city) setErrors({ ...errors, city: undefined });
                                  }}
                                  placeholder="Ghaziabad"
                                  className={`mt-1.5 w-full rounded-lg border bg-[#06080D] px-3.5 py-2.5 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF] ${
                                    liveFieldValid.city
                                      ? 'border-[#B8FF00]/50'
                                      : 'border-white/15'
                                  }`}
                                />
                                {errors.city && (
                                  <p role="alert" className="mt-1 text-xs text-rose-400">
                                    {errors.city}
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </OobeSlideTransition>
                      )}

                      {step === 4 && (
                        <OobeSlideTransition
                          key="reg-step-4"
                          stepKey="reg-step-4"
                          direction={direction}
                        >
                          <div className="space-y-6">
                            <div>
                              <h2 className="font-display text-xl font-bold text-white">
                                Apply Coupon &amp; Confirm Registration
                              </h2>
                              <p className="mt-1 text-xs text-slate-400">
                                Verify your candidate dossier before SuS saves your seat to both Database &amp; Cloud.
                              </p>
                            </div>

                            {/* Coupon Field with Celebration Banner */}
                            <div className="rounded-xl border border-[#00F0FF]/25 bg-[#080D17] p-5">
                              <label
                                htmlFor="reg-coupon"
                                className="flex items-center gap-1.5 text-xs font-semibold text-white"
                              >
                                <Tag className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                                <span>
                                  Coupon Code (Enter{' '}
                                  <span className="font-mono text-[#B8FF00]">
                                    FREEXOLYMPIAD
                                  </span>{' '}
                                  for 100% Free Registration)
                                </span>
                              </label>
                              <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
                                <input
                                  id="reg-coupon"
                                  type="text"
                                  value={form.couponCode ?? ''}
                                  onChange={(e) =>
                                    setForm({ ...form, couponCode: e.target.value })
                                  }
                                  placeholder="Enter FREEXOLYMPIAD"
                                  className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                                />
                                <button
                                  type="button"
                                  onClick={handleApplyCoupon}
                                  className="rounded-lg border border-[#00F0FF]/55 bg-[#00F0FF]/12 px-5 py-2.5 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors cursor-pointer whitespace-nowrap"
                                >
                                  Apply Coupon
                                </button>
                              </div>
                              {couponNote && (
                                <motion.p
                                  initial={{ opacity: 0, y: 4 }}
                                  animate={{ opacity: 1, y: 0 }}
                                  className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                                    feePricing.couponValid
                                      ? 'text-[#B8FF00]'
                                      : 'text-amber-300'
                                  }`}
                                >
                                  <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                  <span>{couponNote}</span>
                                </motion.p>
                              )}
                            </div>

                            {/* Final Dossier Summary */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                              <div className="rounded-xl border border-white/10 bg-[#080C15] p-5 text-xs space-y-2">
                                <p className="font-mono font-semibold text-[#00F0FF]">
                                  CANDIDATE SUMMARY
                                </p>
                                <p className="text-sm font-semibold text-white">
                                  {form.name} (Class {form.studentClass} · Age {form.age})
                                </p>
                                <p className="text-slate-300">{form.email} · {form.phone}</p>
                                <p className="text-slate-300">
                                  Guardian: {form.guardianName}
                                </p>
                                <p className="text-slate-400">
                                  {form.school}, {form.city}
                                </p>
                              </div>

                              <div className="rounded-xl border border-white/10 bg-[#080C15] p-5 text-xs space-y-2 tabular-nums">
                                <p className="font-mono font-semibold text-[#B8FF00]">
                                  FEE &amp; ENROLLMENT LEDGER
                                </p>
                                <div className="flex justify-between text-slate-300">
                                  <span>
                                    Tracks ({form.selectedOlympiadIds.map((id) => id.toUpperCase()).join(', ')})
                                  </span>
                                  <span className="font-mono">₹{feePricing.rawFeeInr}</span>
                                </div>
                                {feePricing.discountInr > 0 && (
                                  <div className="flex justify-between text-[#B8FF00]">
                                    <span>Waiver ({feePricing.couponApplied})</span>
                                    <span className="font-mono">-₹{feePricing.discountInr}</span>
                                  </div>
                                )}
                                <div className="flex justify-between border-t border-white/10 pt-2.5 text-base font-bold text-white">
                                  <span>Total Payable</span>
                                  <span className="font-mono text-[#00F0FF]">₹{totalFeeInr}</span>
                                </div>
                                <p className="pt-1 flex items-center gap-1.5 text-[11px] text-slate-400">
                                  <ShieldCheck className="h-3.5 w-3.5 text-[#00F0FF]" />
                                  <span>Saves to XOF Database &amp; Firebase Firestore</span>
                                </p>
                              </div>
                            </div>
                          </div>
                        </OobeSlideTransition>
                      )}
                    </AnimatePresence>

                    {submitError && (
                      <div
                        role="alert"
                        className="mt-6 flex items-start gap-3 rounded-xl border border-rose-500/45 bg-rose-950/40 p-4 text-xs text-rose-100"
                      >
                        <AlertTriangle
                          className="mt-0.5 h-4 w-4 shrink-0 text-rose-400"
                          aria-hidden="true"
                        />
                        <div>
                          <p className="font-semibold text-rose-300">
                            Firebase Firestore Submission Error
                          </p>
                          <p className="mt-1 font-mono text-[11px] leading-relaxed text-rose-200 break-words">
                            {submitError}
                          </p>
                        </div>
                      </div>
                    )}

                    {/* OOBE Stage Controls */}
                    <div className="mt-8 flex flex-wrap items-center justify-between gap-4 border-t border-white/10 pt-5">
                      <div>
                        {step > 1 ? (
                          <button
                            type="button"
                            onClick={() => goToStep((step - 1) as 1 | 2 | 3 | 4)}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0E131F] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-white/35 cursor-pointer"
                          >
                            <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Back</span>
                          </button>
                        ) : (
                          <span className="text-xs text-slate-400">
                            Admit cards release from 10 Nov · 24h email response
                          </span>
                        )}
                      </div>

                      <div>
                        {step < 4 ? (
                          <button
                            key="reg-next-btn"
                            type="button"
                            onClick={handleNextStep}
                            className="neon-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs sm:text-sm font-semibold cursor-pointer"
                          >
                            <span>Continue to Step {step + 1}</span>
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        ) : (
                          <button
                            key="reg-submit-btn"
                            type="submit"
                            className="neon-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs sm:text-sm font-semibold cursor-pointer tabular-nums"
                          >
                            <span>Complete Registration · ₹{totalFeeInr}</span>
                            <ArrowRight className="h-4 w-4" aria-hidden="true" />
                          </button>
                        )}
                      </div>
                    </div>
                  </form>
                </>
              )}
            </div>
          </OobeAmbientStage>
        </div>

        {/* Browser Submitted Registrations Ledger */}
        {registrations.length > 0 && (
          <div className="mt-8 rounded-xl border border-white/10 bg-[#0D111A] p-6">
            <h2 className="font-display text-base font-semibold text-white">
              Recent Registrations on This Device ({registrations.length})
            </h2>
            <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {registrations.slice(0, 6).map((reg) => (
                <div
                  key={reg.registrationId}
                  className="rounded-lg border border-white/10 bg-[#080B12] p-4 text-xs"
                >
                  <div className="flex justify-between font-mono">
                    <span className="font-semibold text-[#00F0FF]">
                      {reg.registrationId}
                    </span>
                    <span className="text-[#B8FF00]">₹{reg.totalFeeInr}</span>
                  </div>
                  <p className="mt-1 font-medium text-white">
                    {reg.name} (Class {reg.studentClass})
                  </p>
                  <p className="mt-0.5 text-slate-300">{reg.olympiadNames.join(', ')}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
