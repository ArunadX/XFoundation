import { useEffect, useMemo, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  CheckCircle2,
  Loader2,
  Minus,
  Plus,
  ShieldCheck,
  ShoppingBag,
  Sparkles,
  Tag,
  Trash2,
} from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import type {
  CartItem,
  CheckoutPayload,
  ConfirmationState,
  OrderRecord,
  PageRoute,
} from '../types/olympiad';
import {
  calculateCartPricing,
  generateReferenceId,
  getSuSCheckoutGuidance,
  validateCheckoutStep,
  type CheckoutErrors,
} from '../utils/olympiadLogic';
import {
  OobeAmbientStage,
  OobeSlideTransition,
} from '../components/MotionPrimitives';
import { SuSOobeAssistant, SuSOrb } from '../components/SuSOobeAssistant';

interface CheckoutPageProps {
  cartItems: CartItem[];
  onUpdateQuantity: (productId: string, delta: number) => void;
  onRemoveItem: (productId: string) => void;
  onNavigate: (page: PageRoute) => void;
  onCheckoutComplete: (
    order: OrderRecord,
    confirmation: ConfirmationState
  ) => Promise<void>;
}

const STEP_LABELS = ['Study Pack Bag', 'Recipient Details', 'Promo & Order'];

const PROVISIONING_PHASES = [
  'Verifying Question Bank & 8-Year PYP bundle pricing...',
  'Issuing official Order ID & recording items in Foundation Database...',
  'Syncing study material order to Cloud Firestore (x-olympiad-foundation)...',
];

export function CheckoutPage({
  cartItems,
  onUpdateQuantity,
  onRemoveItem,
  onNavigate,
  onCheckoutComplete,
}: CheckoutPageProps) {
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [direction, setDirection] = useState<1 | -1>(1);
  const [form, setForm] = useState<CheckoutPayload>({
    name: '',
    email: '',
    phone: '',
    city: '',
    guardianName: '',
    promoCode: '',
  });
  const [appliedPromo, setAppliedPromo] = useState('');
  const [promoNote, setPromoNote] = useState<string | null>(null);
  const [errors, setErrors] = useState<CheckoutErrors>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isProvisioning, setIsProvisioning] = useState(false);
  const [phaseIdx, setPhaseIdx] = useState(0);

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

  const effectivePromo =
    appliedPromo ||
    (form.promoCode.trim().toUpperCase() === 'FREEMATERIAL' ? 'FREEMATERIAL' : '');

  const pricing = calculateCartPricing(cartItems, effectivePromo);

  const liveGuidance = useMemo(
    () =>
      getSuSCheckoutGuidance({
        step,
        form,
        pricing,
        appliedPromo: effectivePromo,
      }),
    [step, form, pricing, effectivePromo]
  );

  const liveFieldValid = useMemo(() => {
    const phoneDigits = form.phone.replace(/\D/g, '').length;
    return {
      name: form.name.trim().length >= 2,
      email: /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim()),
      phone: phoneDigits >= 7 && phoneDigits <= 15,
      city: form.city.trim().length >= 2,
      guardianName: form.guardianName.trim().length >= 2,
    };
  }, [form]);

  const handleApplyPromo = () => {
    const code = form.promoCode.trim().toUpperCase();
    if (!code) {
      setAppliedPromo('');
      setPromoNote(null);
      return;
    }
    const test = calculateCartPricing(cartItems, code);
    if (test.promoValid) {
      setAppliedPromo(code);
      setPromoNote(
        test.promoRate >= 1
          ? `Promo ${code} applied — 100% off! All Question Banks & PYPs are ₹0.`
          : `Promo ${code} applied (${Math.round(test.promoRate * 100)}% off).`
      );
    } else {
      setAppliedPromo('');
      setPromoNote(
        'Promo code not recognized. Try FREEMATERIAL (100% Free), OLYMPIAD15, or SCHOLAR10.'
      );
    }
  };

  const goToStep = (target: 1 | 2 | 3) => {
    setDirection(target >= step ? 1 : -1);
    setStep(target);
  };

  const handleNextStep = () => {
    const stepValidation = validateCheckoutStep(step, form, cartItems.length);
    if (Object.keys(stepValidation).length > 0) {
      setErrors(stepValidation);
      return;
    }
    setErrors({});
    if (step < 3) {
      goToStep((step + 1) as 1 | 2 | 3);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cartItems.length === 0) return;
    if (step < 3) {
      handleNextStep();
      return;
    }

    const validation = validateCheckoutStep(3, form, cartItems.length);
    if (Object.keys(validation).length > 0) {
      setErrors(validation);
      goToStep(2);
      return;
    }

    setErrors({});
    setSubmitError(null);
    setIsProvisioning(true);

    const orderId = generateReferenceId('ORD', Date.now());
    const finalPricing = calculateCartPricing(cartItems, appliedPromo || form.promoCode);

    const order: OrderRecord = {
      ...form,
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
      city: form.city.trim(),
      guardianName: form.guardianName.trim(),
      promoCode: appliedPromo || form.promoCode.trim().toUpperCase(),
      orderId,
      createdAt: new Date().toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      }),
      items: cartItems.map((c) => ({
        id: c.product.id,
        title: c.product.title,
        olympiadCode: c.product.olympiadCode,
        category: c.product.category,
        chapterOrYears: c.product.chapterOrYears,
        unitPriceInr: c.product.unitPriceInr,
        quantity: c.quantity,
      })),
      pricing: finalPricing,
    };

    const confirmation: ConfirmationState = {
      type: 'order',
      referenceId: orderId,
      recipientName: order.name,
      recipientEmail: order.email,
      summaryLines: [
        `City: ${order.city} · Guardian: ${order.guardianName}`,
        ...order.items.map((item) => `${item.title} × ${item.quantity}`),
        ...(finalPricing.promoValid
          ? [
              `Promo Applied: ${order.promoCode} (${Math.round(
                finalPricing.promoRate * 100
              )}% Off)`,
            ]
          : []),
      ],
      totalInr: finalPricing.finalTotalInr,
    };

    try {
      await new Promise((resolve) => window.setTimeout(resolve, 1100));
      await onCheckoutComplete(order, confirmation);
    } catch (err) {
      console.error(err);
      setSubmitError(err instanceof Error ? err.message : String(err));
      setIsProvisioning(false);
    }
  };

  return (
    <section className="bg-[#06080D] py-10 lg:py-14">
      <div className="mx-auto max-w-6xl px-6">
        <button
          type="button"
          onClick={() => onNavigate('shop')}
          className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-300 hover:text-[#00F0FF] transition-colors cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
          <span>Back to Shop</span>
        </button>

        <div className="mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="font-mono text-xs font-semibold text-[#00F0FF]">
              GUIDED MATERIAL CHECKOUT BY SuS (INR ₹)
            </p>
            <h1 className="mt-1.5 font-display text-3xl sm:text-4xl font-bold tracking-tight text-white">
              Checkout &amp; Study Pack Setup
            </h1>
          </div>
          {cartItems.length > 0 && !isProvisioning && (
            <div className="rounded-lg border border-white/10 bg-[#0D111A] px-4 py-2 text-xs tabular-nums">
              <span className="text-slate-400">Bag Total ({pricing.totalItems}): </span>
              <span className="font-mono font-bold text-[#00F0FF]">
                ₹{pricing.finalTotalInr}
              </span>
            </div>
          )}
        </div>

        {cartItems.length === 0 && !isProvisioning ? (
          <div className="mt-8 rounded-2xl border border-white/10 bg-[#0D111A] p-12 text-center">
            <ShoppingBag className="mx-auto h-10 w-10 text-slate-500" aria-hidden="true" />
            <p className="mt-3 text-base font-semibold text-white">Your checkout bag is empty.</p>
            <p className="mt-1 text-xs text-slate-400">
              Add Chapter Question Banks or 8-Year PYP Bundles from the Shop to start guided checkout with SuS.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('shop')}
              className="neon-cta mt-5 rounded-lg px-5 py-2.5 text-xs font-semibold cursor-pointer"
            >
              Browse Study Material Shop
            </button>
          </div>
        ) : (
          <div className="mt-6">
            <OobeAmbientStage>
              <div className="p-6 sm:p-8 lg:p-10">
                {isProvisioning ? (
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
                        className="pointer-events-none absolute inset-3 rounded-full border border-[#B8FF00]/60"
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
                        SuS is finalizing your Study Pack order
                      </h2>
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={`chk-phase-${phaseIdx}`}
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
                    <SuSOobeAssistant
                      guidance={liveGuidance}
                      stepLabels={STEP_LABELS}
                      currentStep={step}
                      onJumpToStep={(target) => {
                        if (target <= step) {
                          goToStep(target as 1 | 2 | 3);
                        }
                      }}
                      contextTag="Study Material Checkout"
                    />

                    <form onSubmit={(e) => void handleSubmit(e)} noValidate className="mt-7">
                      <AnimatePresence mode="wait">
                        {step === 1 && (
                          <OobeSlideTransition
                            key="chk-step-1"
                            stepKey="chk-step-1"
                            direction={direction}
                          >
                            <div>
                              <div className="flex flex-wrap items-center justify-between gap-2">
                                <h2 className="font-display text-xl font-bold text-white">
                                  Review Study Packs &amp; Bundle Quantities
                                </h2>
                                <span className="font-mono text-xs text-[#B8FF00]">
                                  1 Bank = ₹100 · 2 = ₹100 · 10 = ₹500 | 1 PYP = ₹499 · 2 = ₹500
                                </span>
                              </div>

                              <ul className="mt-4 divide-y divide-white/10 rounded-xl border border-white/10 bg-[#080C15] px-5">
                                {cartItems.map((entry) => (
                                  <li
                                    key={entry.product.id}
                                    className="py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                                  >
                                    <div>
                                      <p className="font-mono text-[11px] text-[#00F0FF]">
                                        {entry.product.olympiadCode} ·{' '}
                                        {entry.product.category === 'question-bank'
                                          ? 'Question Bank (2 for ₹100 · 10 for ₹500)'
                                          : '8-Year PYP Bundle (2 for ₹500)'}
                                      </p>
                                      <p className="mt-0.5 text-sm font-semibold text-white">
                                        {entry.product.title}
                                      </p>
                                      <p className="text-xs text-slate-400">
                                        {entry.product.chapterOrYears}
                                      </p>
                                    </div>

                                    <div className="flex items-center gap-4">
                                      <div className="inline-flex items-center rounded-md border border-white/15 bg-[#06080D]">
                                        <button
                                          type="button"
                                          aria-label={`Decrease quantity of ${entry.product.title}`}
                                          onClick={() => onUpdateQuantity(entry.product.id, -1)}
                                          className="p-2 text-slate-300 hover:text-white cursor-pointer"
                                        >
                                          <Minus className="h-3.5 w-3.5" />
                                        </button>
                                        <span className="px-3.5 font-mono text-xs font-bold text-white tabular-nums">
                                          {entry.quantity}
                                        </span>
                                        <button
                                          type="button"
                                          aria-label={`Increase quantity of ${entry.product.title}`}
                                          onClick={() => onUpdateQuantity(entry.product.id, 1)}
                                          className="p-2 text-slate-300 hover:text-white cursor-pointer"
                                        >
                                          <Plus className="h-3.5 w-3.5" />
                                        </button>
                                      </div>

                                      <span className="font-mono text-xs text-slate-300 w-20 text-right tabular-nums">
                                        ₹{entry.product.unitPriceInr} ea
                                      </span>

                                      <button
                                        type="button"
                                        aria-label={`Remove ${entry.product.title}`}
                                        onClick={() => onRemoveItem(entry.product.id)}
                                        className="text-slate-400 hover:text-rose-400 cursor-pointer"
                                      >
                                        <Trash2 className="h-4 w-4" />
                                      </button>
                                    </div>
                                  </li>
                                ))}
                              </ul>
                            </div>
                          </OobeSlideTransition>
                        )}

                        {step === 2 && (
                          <OobeSlideTransition
                            key="chk-step-2"
                            stepKey="chk-step-2"
                            direction={direction}
                          >
                            <div>
                              <h2 className="font-display text-xl font-bold text-white">
                                Recipient &amp; Guardian Dispatch Details
                              </h2>
                              <p className="mt-1 text-xs text-slate-400">
                                Every validated detail gets a green SuS verification check.
                              </p>

                              <div className="mt-5 grid grid-cols-1 sm:grid-cols-2 gap-4">
                                <div>
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor="chk-name"
                                      className="block text-xs font-medium text-slate-200"
                                    >
                                      Recipient Name
                                    </label>
                                    {liveFieldValid.name && (
                                      <span className="inline-flex items-center gap-1 font-mono text-[11px] text-[#B8FF00]">
                                        <Check className="h-3 w-3" /> Ready
                                      </span>
                                    )}
                                  </div>
                                  <input
                                    id="chk-name"
                                    type="text"
                                    value={form.name}
                                    onChange={(e) => {
                                      setForm({ ...form, name: e.target.value });
                                      if (errors.name) setErrors({ ...errors, name: undefined });
                                    }}
                                    placeholder="Full name"
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
                                      htmlFor="chk-email"
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
                                    id="chk-email"
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => {
                                      setForm({ ...form, email: e.target.value });
                                      if (errors.email) setErrors({ ...errors, email: undefined });
                                    }}
                                    placeholder="name@example.in"
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
                                      htmlFor="chk-phone"
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
                                    id="chk-phone"
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
                                      htmlFor="chk-city"
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
                                    id="chk-city"
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

                                <div className="sm:col-span-2">
                                  <div className="flex items-center justify-between">
                                    <label
                                      htmlFor="chk-guardian"
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
                                    id="chk-guardian"
                                    type="text"
                                    value={form.guardianName}
                                    onChange={(e) => {
                                      setForm({ ...form, guardianName: e.target.value });
                                      if (errors.guardianName) {
                                        setErrors({ ...errors, guardianName: undefined });
                                      }
                                    }}
                                    placeholder="Parent or guardian full name"
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
                            key="chk-step-3"
                            stepKey="chk-step-3"
                            direction={direction}
                          >
                            <div className="space-y-6">
                              <div>
                                <h2 className="font-display text-xl font-bold text-white">
                                  Apply Promo Code &amp; Final Order Confirmation
                                </h2>
                                <p className="mt-1 text-xs text-slate-400">
                                  Review your itemized study packs and bundle waiver before submission.
                                </p>
                              </div>

                              <div className="rounded-xl border border-[#00F0FF]/25 bg-[#080D17] p-5">
                                <label
                                  htmlFor="chk-promo"
                                  className="flex items-center gap-1.5 text-xs font-semibold text-white"
                                >
                                  <Tag className="h-3.5 w-3.5 text-[#00F0FF]" aria-hidden="true" />
                                  <span>
                                    Promo Code (Use{' '}
                                    <span className="font-mono text-[#B8FF00]">
                                      FREEMATERIAL
                                    </span>{' '}
                                    for 100% Free Question Banks &amp; PYPs)
                                  </span>
                                </label>
                                <div className="mt-2.5 flex flex-col sm:flex-row gap-2">
                                  <input
                                    id="chk-promo"
                                    type="text"
                                    value={form.promoCode}
                                    onChange={(e) =>
                                      setForm({ ...form, promoCode: e.target.value })
                                    }
                                    placeholder="Try FREEMATERIAL or OLYMPIAD15"
                                    className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-3.5 py-2.5 font-mono text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                                  />
                                  <button
                                    type="button"
                                    onClick={handleApplyPromo}
                                    className="rounded-lg border border-[#00F0FF]/55 bg-[#00F0FF]/12 px-5 py-2.5 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors cursor-pointer"
                                  >
                                    Apply Promo
                                  </button>
                                </div>
                                {promoNote && (
                                  <motion.p
                                    initial={{ opacity: 0, y: 4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className={`mt-2 flex items-center gap-1.5 text-xs font-medium ${
                                      pricing.promoValid ? 'text-[#B8FF00]' : 'text-amber-300'
                                    }`}
                                  >
                                    <Sparkles className="h-3.5 w-3.5 shrink-0" />
                                    <span>{promoNote}</span>
                                  </motion.p>
                                )}
                              </div>

                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div className="rounded-xl border border-white/10 bg-[#080C15] p-5 text-xs space-y-2">
                                  <p className="font-mono font-semibold text-[#00F0FF]">
                                    DISPATCH PROFILE
                                  </p>
                                  <p className="text-sm font-semibold text-white">
                                    {form.name}
                                  </p>
                                  <p className="text-slate-300">
                                    {form.email} · {form.phone}
                                  </p>
                                  <p className="text-slate-300">
                                    City: {form.city} · Guardian: {form.guardianName}
                                  </p>
                                  <ul className="border-t border-white/10 pt-2 space-y-1 text-slate-300">
                                    {cartItems.map((it) => (
                                      <li key={it.product.id}>
                                        • {it.product.title} × {it.quantity}
                                      </li>
                                    ))}
                                  </ul>
                                </div>

                                <div className="rounded-xl border border-white/10 bg-[#080C15] p-5 text-xs space-y-2 tabular-nums">
                                  <p className="font-mono font-semibold text-[#B8FF00]">
                                    INR BILLING SUMMARY
                                  </p>
                                  {pricing.questionBankCount > 0 && (
                                    <div className="flex justify-between text-slate-300">
                                      <span>
                                        Question Banks ({pricing.questionBankCount} items)
                                      </span>
                                      <span className="font-mono">
                                        {pricing.questionBankBundleSavingsInr > 0 && (
                                          <s className="mr-2 text-slate-500">
                                            ₹{pricing.questionBankRawInr}
                                          </s>
                                        )}
                                        ₹{pricing.questionBankNetInr}
                                      </span>
                                    </div>
                                  )}
                                  {pricing.pypBundleCount > 0 && (
                                    <div className="flex justify-between text-slate-300">
                                      <span>
                                        8-Year PYP Bundles ({pricing.pypBundleCount} items)
                                      </span>
                                      <span className="font-mono">
                                        {pricing.pypBundleSavingsInr > 0 && (
                                          <s className="mr-2 text-slate-500">
                                            ₹{pricing.pypRawInr}
                                          </s>
                                        )}
                                        ₹{pricing.pypNetInr}
                                      </span>
                                    </div>
                                  )}
                                  {pricing.promoDiscountInr > 0 && (
                                    <div className="flex justify-between text-[#B8FF00]">
                                      <span>Promo ({effectivePromo})</span>
                                      <span className="font-mono">
                                        -₹{pricing.promoDiscountInr}
                                      </span>
                                    </div>
                                  )}
                                  <div className="flex justify-between border-t border-white/10 pt-2.5 text-base font-bold text-white">
                                    <span>Total Payable</span>
                                    <span className="font-mono text-[#00F0FF]">
                                      ₹{pricing.finalTotalInr}
                                    </span>
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
                              onClick={() => goToStep((step - 1) as 1 | 2 | 3)}
                              className="inline-flex items-center gap-1.5 rounded-lg border border-white/15 bg-[#0E131F] px-4 py-2.5 text-xs font-semibold text-slate-200 hover:border-white/35 cursor-pointer"
                            >
                              <ArrowLeft className="h-3.5 w-3.5" aria-hidden="true" />
                              <span>Back</span>
                            </button>
                          ) : (
                            <span className="text-xs text-slate-400">
                              24 working hours dispatch email guarantee
                            </span>
                          )}
                        </div>

                        <div>
                          {step < 3 ? (
                            <button
                              key="chk-next-btn"
                              type="button"
                              onClick={handleNextStep}
                              className="neon-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs sm:text-sm font-semibold cursor-pointer"
                            >
                              <span>Continue to Step {step + 1}</span>
                              <ArrowRight className="h-4 w-4" aria-hidden="true" />
                            </button>
                          ) : (
                            <button
                              key="chk-submit-btn"
                              type="submit"
                              className="neon-cta inline-flex items-center gap-2 rounded-lg px-6 py-3 text-xs sm:text-sm font-semibold cursor-pointer tabular-nums"
                            >
                              <span>
                                Confirm &amp; Provision Order · ₹{pricing.finalTotalInr}
                              </span>
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
        )}
      </div>
    </section>
  );
}
