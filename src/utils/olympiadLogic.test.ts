import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateQuestionBankBundleInr,
  calculatePypBundleInr,
  calculateCartPricing,
  calculateRegistrationPricing,
  validateAretAccessCode,
  validateOlympiadRegistration,
  validateRegistrationStep,
  validateCheckoutForm,
  validateCheckoutStep,
  getSuSRegistrationGuidance,
  getSuSCheckoutGuidance,
  getSuSShopAdvisorHint,
  computeCountdown,
  getNextAdmitCardReleaseIso,
  findStudentResult,
  evaluateAretPypPerformance,
  buildFallbackAretQuestions,
  getConfirmationCelebrationSpec,
  getAretIntroSequenceSpec,
  buildSubscriberDocumentPayload,
  getSuSAretIntroPhases,
} from './olympiadLogic';
import {
  OLYMPIADS,
  SHOP_PRODUCTS,
  RESULTS_RECORDS,
  ARET_IXMO_PYP_SET,
} from '../data/olympiadData';

test('Question Bank pricing: 1=₹100, bundle of 2=₹100, bundle of 10=₹500', () => {
  assert.equal(calculateQuestionBankBundleInr(1).netInr, 100);
  assert.equal(calculateQuestionBankBundleInr(2).netInr, 100);
  assert.equal(calculateQuestionBankBundleInr(2).savingsInr, 100);
  assert.equal(calculateQuestionBankBundleInr(3).netInr, 200);
  assert.equal(calculateQuestionBankBundleInr(10).netInr, 500);
  assert.equal(calculateQuestionBankBundleInr(10).savingsInr, 500);
  assert.equal(calculateQuestionBankBundleInr(11).netInr, 600);
});

test('PYP Bundle pricing: 1=₹499, 2=₹500, 3=₹999', () => {
  assert.equal(calculatePypBundleInr(1).netInr, 499);
  assert.equal(calculatePypBundleInr(2).netInr, 500);
  assert.equal(calculatePypBundleInr(2).savingsInr, 498);
  assert.equal(calculatePypBundleInr(3).netInr, 999);
});

test('calculateCartPricing combines QB bundles, PYP bundles, OLYMPIAD15, and FREEMATERIAL (₹0)', () => {
  const qbProduct = SHOP_PRODUCTS.find(
    (p) => p.category === 'question-bank' && p.available
  )!;
  const pypProduct = SHOP_PRODUCTS.find(
    (p) => p.category === 'pyp-bundle' && p.available
  )!;

  const pricing = calculateCartPricing(
    [
      { product: qbProduct, quantity: 2 },
      { product: pypProduct, quantity: 2 },
    ],
    'OLYMPIAD15'
  );

  assert.equal(pricing.questionBankNetInr, 100);
  assert.equal(pricing.pypNetInr, 500);
  assert.equal(pricing.subtotalAfterBundlesInr, 600);
  assert.equal(pricing.promoValid, true);
  assert.equal(pricing.promoDiscountInr, 90);
  assert.equal(pricing.finalTotalInr, 510);

  const freeMaterial = calculateCartPricing(
    [
      { product: qbProduct, quantity: 10 },
      { product: pypProduct, quantity: 2 },
    ],
    'FREEMATERIAL'
  );
  assert.equal(freeMaterial.promoValid, true);
  assert.equal(freeMaterial.promoRate, 1);
  assert.equal(freeMaterial.finalTotalInr, 0);
});

test('FREEXOLYMPIAD coupon makes Registration 100% free (₹0) and validates strictly', () => {
  const standard = calculateRegistrationPricing(['ixmo', 'ixso'], OLYMPIADS, '');
  assert.equal(standard.finalFeeInr, 500);
  assert.equal(standard.couponValid, false);

  const freeReg = calculateRegistrationPricing(['ixmo', 'ixso', 'ixcompeto'], OLYMPIADS, 'FREEXOLYMPIAD');
  assert.equal(freeReg.rawFeeInr, 800);
  assert.equal(freeReg.discountInr, 800);
  assert.equal(freeReg.finalFeeInr, 0);
  assert.equal(freeReg.couponValid, true);
});

test('validateAretAccessCode accepts ONLY ARETCODESAMPLE and denies all other codes', () => {
  assert.equal(validateAretAccessCode('ARETCODESAMPLE'), true);
  assert.equal(validateAretAccessCode(' ARETCODESAMPLE '), true);
  assert.equal(validateAretAccessCode('aretcodesample'), false);
  assert.equal(validateAretAccessCode('FREEXOLYMPIAD'), false);
  assert.equal(validateAretAccessCode(''), false);
});

test('validateOlympiadRegistration enforces Grade 10-12 restriction on IXCompetO and validates fields', () => {
  const errors = validateOlympiadRegistration(
    {
      name: 'Riya Sharma',
      email: 'riya@example.in',
      phone: '9876543210',
      guardianName: 'Anil Sharma',
      age: '14',
      studentClass: '9',
      school: 'Delhi Public School',
      city: 'Ghaziabad',
      selectedOlympiadIds: ['ixcompeto'],
    },
    OLYMPIADS
  );
  assert.ok(errors.selectedOlympiadIds);

  const valid = validateOlympiadRegistration(
    {
      name: 'Riya Sharma',
      email: 'riya@example.in',
      phone: '9876543210',
      guardianName: 'Anil Sharma',
      age: '16',
      studentClass: '11',
      school: 'Delhi Public School',
      city: 'Ghaziabad',
      selectedOlympiadIds: ['ixmo', 'ixcompeto'],
    },
    OLYMPIADS
  );
  assert.deepEqual(valid, {});
});

test('validateCheckoutForm requires name, email, phone, city, and guardianName', () => {
  const errors = validateCheckoutForm({
    name: '',
    email: 'bad',
    phone: '12',
    city: '',
    guardianName: '',
    promoCode: '',
  });
  assert.ok(errors.name);
  assert.ok(errors.email);
  assert.ok(errors.phone);
  assert.ok(errors.city);
  assert.ok(errors.guardianName);
});

test('computeCountdown and getNextAdmitCardReleaseIso return active future countdown', () => {
  const now = new Date('2026-11-12T10:00:00Z').getTime();
  const nextRelease = getNextAdmitCardReleaseIso(now);
  const parts = computeCountdown(nextRelease, now);
  assert.equal(parts.expired, false);
  assert.ok(parts.days > 300);

  const seeded = findStudentResult('XOF-2026-1042', RESULTS_RECORDS, []);
  assert.ok(seeded);
});

test('evaluateAretPypPerformance calculates IXMO scores, negative penalties, and weak topics', () => {
  const allCorrectAnswers: Record<string, number> = {};
  for (const q of ARET_IXMO_PYP_SET) {
    allCorrectAnswers[q.id] = q.correctIndex;
  }
  const perfect = evaluateAretPypPerformance(
    ARET_IXMO_PYP_SET,
    allCorrectAnswers,
    SHOP_PRODUCTS
  );
  assert.equal(perfect.accuracyPct, 100);
  assert.equal(perfect.negativePenalty, 0);
  assert.equal(perfect.riskIndex, 'Low');
  assert.equal(perfect.weakTopics.length, 0);

  const mixedAnswers: Record<string, number> = {
    [ARET_IXMO_PYP_SET[0].id]: (ARET_IXMO_PYP_SET[0].correctIndex + 1) % 4,
    [ARET_IXMO_PYP_SET[1].id]: (ARET_IXMO_PYP_SET[1].correctIndex + 1) % 4,
    [ARET_IXMO_PYP_SET[2].id]: ARET_IXMO_PYP_SET[2].correctIndex,
    [ARET_IXMO_PYP_SET[3].id]: ARET_IXMO_PYP_SET[3].correctIndex,
  };
  const mixed = evaluateAretPypPerformance(
    ARET_IXMO_PYP_SET,
    mixedAnswers,
    SHOP_PRODUCTS
  );
  assert.equal(mixed.accuracyPct, 50);
  assert.equal(mixed.negativePenalty, 2);
  assert.equal(mixed.riskIndex, 'High');
  assert.equal(mixed.rawScore, 6);
  assert.equal(mixed.netScore, 4);
  assert.ok(mixed.weakTopics.includes('Number Systems & Theory'));
  assert.ok(mixed.weakTopics.includes('Polynomials & Algebra'));
  assert.ok(mixed.recommendedBankIds.length >= 2);
});

test('buildFallbackAretQuestions produces up to 30 distinct questions for Full ARET Suite', () => {
  const qs3 = buildFallbackAretQuestions({
    topic: 'Euclidean Geometry',
    difficulty: 'HOTS Challenge',
    style: 'Statement I & II Logic',
    count: 3,
    weakTopics: ['Euclidean Geometry'],
  });
  assert.equal(qs3.length, 3);
  assert.equal(qs3[0].topic, 'Euclidean Geometry');

  const qs25 = buildFallbackAretQuestions({
    topic: 'Mixed IXMO',
    difficulty: 'Olympiad Standard',
    style: 'Single-Choice MCQ',
    count: 25,
    weakTopics: ['Euclidean Geometry'],
  });
  assert.equal(qs25.length, 25);
  const uniquePrompts = new Set(qs25.map((q) => q.prompt));
  assert.equal(uniquePrompts.size, 25);

  const qs30 = buildFallbackAretQuestions({
    topic: 'Logic & HOTS',
    difficulty: 'HOTS Challenge',
    style: 'Multi-Step Conceptual',
    count: 30,
    weakTopics: [],
  });
  assert.equal(qs30.length, 30);
});

test('OOBE step validators and SuS guidance react accurately to form state', () => {
  const sampleForm = {
    name: 'Aarav Verma',
    email: 'aarav@example.in',
    phone: '9876543210',
    guardianName: 'Rajesh Verma',
    age: '14',
    studentClass: '9',
    school: 'DPS Ghaziabad',
    city: 'Ghaziabad',
    selectedOlympiadIds: ['ixmo', 'ixcompeto'] as const,
    couponCode: 'FREEXOLYMPIAD',
  };

  assert.deepEqual(validateRegistrationStep(1, { ...sampleForm, selectedOlympiadIds: ['ixmo', 'ixcompeto'] }, OLYMPIADS), {});
  assert.deepEqual(validateRegistrationStep(2, { ...sampleForm, selectedOlympiadIds: ['ixmo'] }, OLYMPIADS), {});
  assert.ok(
    validateRegistrationStep(3, { ...sampleForm, selectedOlympiadIds: ['ixcompeto'] }, OLYMPIADS)
      .selectedOlympiadIds
  );

  const warningGuidance = getSuSRegistrationGuidance({
    step: 3,
    form: { ...sampleForm, selectedOlympiadIds: ['ixcompeto'] },
    catalog: OLYMPIADS,
    couponApplied: '',
    finalFeeInr: 300,
  });
  assert.equal(warningGuidance.mood, 'warning');

  const freeGuidance = getSuSRegistrationGuidance({
    step: 4,
    form: { ...sampleForm, selectedOlympiadIds: ['ixmo'] },
    catalog: OLYMPIADS,
    couponApplied: 'FREEXOLYMPIAD',
    finalFeeInr: 0,
  });
  assert.equal(freeGuidance.mood, 'celebrate');

  const qb = SHOP_PRODUCTS.find((p) => p.category === 'question-bank' && p.available)!;
  const singleBankPricing = calculateCartPricing([{ product: qb, quantity: 1 }], '');
  const shopHint = getSuSShopAdvisorHint(singleBankPricing);
  assert.equal(shopHint.tone, 'hint');
  assert.ok(shopHint.headline.includes('2 for ₹100'));

  const chkGuidance = getSuSCheckoutGuidance({
    step: 1,
    form: { name: '', email: '', phone: '', city: '', guardianName: '', promoCode: '' },
    pricing: singleBankPricing,
    appliedPromo: '',
  });
  assert.equal(chkGuidance.mood, 'tip');
  assert.deepEqual(validateCheckoutStep(1, { name: '', email: '', phone: '', city: '', guardianName: '', promoCode: '' }, 1), {});
});

test('getConfirmationCelebrationSpec and getAretIntroSequenceSpec generate deterministic animation specs', () => {
  const freeOrderSpec = getConfirmationCelebrationSpec({
    type: 'order',
    referenceId: 'ORD-2026-9001',
    recipientName: 'Ananya',
    recipientEmail: 'ananya@example.in',
    summaryLines: ['Number Systems Question Bank × 1'],
    totalInr: 0,
  });
  assert.equal(freeOrderSpec.accent, 'lime');
  assert.equal(freeOrderSpec.waiverCelebration, true);
  assert.equal(freeOrderSpec.stampLabel, 'FEE WAIVED · VERIFIED');
  assert.equal(freeOrderSpec.particles.length, 18);
  assert.equal(freeOrderSpec.milestones[1].detail, 'Ref ORD-2026-9001');

  const regSpec = getConfirmationCelebrationSpec({
    type: 'registration',
    referenceId: 'XOF-2026-1234',
    recipientName: 'Rohan',
    recipientEmail: 'rohan@example.in',
    summaryLines: ['IXMO'],
    totalInr: 250,
  });
  assert.equal(regSpec.accent, 'cyan');
  assert.equal(regSpec.waiverCelebration, false);
  assert.equal(regSpec.stampLabel, 'SEAT RESERVED');

  const previewIntro = getAretIntroSequenceSpec('preview');
  const fullIntro = getAretIntroSequenceSpec('full');
  assert.equal(previewIntro.subsystems.length, 3);
  assert.equal(fullIntro.subsystems[1].metricLabel, '20–30 Qs');
  assert.equal(fullIntro.waveBars.length, 12);
});


test('getSuSAretIntroPhases builds 4 phase storyboard for sus, aret-preview, and aret-full', () => {
  const susSpec = getSuSAretIntroPhases('sus');
  assert.equal(susSpec.phases.length, 4);
  assert.equal(susSpec.phases[0].emphasis, 'sus');
  assert.equal(susSpec.phases[1].emphasis, 'aret');
  assert.equal(susSpec.packets.length, 3);

  const aretFullSpec = getSuSAretIntroPhases('aret-full');
  assert.ok(aretFullSpec.bannerTitle.includes('ARET Pro'));
  assert.equal(aretFullSpec.aretSpectrum.length, 12);
});

test('buildSubscriberDocumentPayload normalizes emailLower, strips undefined fields, and uppercases promos', () => {
  const doc = buildSubscriberDocumentPayload({
    type: 'order',
    referenceId: 'ORD-2026-5555',
    name: '  Aarav Mehta  ',
    email: 'AARAV@Example.IN ',
    city: 'Ghaziabad',
    couponOrPromo: 'freematerial',
    totalInr: 0,
    summary: 'Number Systems Question Bank x 1',
    itemsOrTracks: ['Number Systems Question Bank', ''],
  });
  assert.equal(doc.emailLower, 'aarav@example.in');
  assert.equal(doc.name, 'Aarav Mehta');
  assert.equal(doc.couponOrPromo, 'FREEMATERIAL');
  assert.equal(doc.phone, '');
  assert.deepEqual(doc.itemsOrTracks, ['Number Systems Question Bank']);
});

