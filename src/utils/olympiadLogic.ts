import type {
  AretDifficulty,
  AretEvaluationResult,
  AretGeneratedQuestion,
  AretPypQuestion,
  AretQuestionStyle,
  AretTopic,
  CartItem,
  CartPricingBreakdown,
  CheckoutPayload,
  ConfirmationState,
  OlympiadExam,
  OlympiadId,
  RegistrationPayload,
  RegistrationRecord,
  ShopProduct,
  StudentResult,
} from '../types/olympiad';

const PROMO_CODES: Record<string, number> = {
  OLYMPIAD15: 0.15,
  SCHOLAR10: 0.1,
  XOF10: 0.1,
  FREEMATERIAL: 1,
};

export const REGISTRATION_FREE_COUPON = 'FREEXOLYMPIAD';
export const ARET_ACCESS_CODE = 'ARETCODESAMPLE';

export function validateAretAccessCode(code: string): boolean {
  return code.trim() === ARET_ACCESS_CODE;
}

/**
 * Question Bank Bundle Pricing:
 * - 1 question bank = ₹100
 * - Bundle of 2 = ₹100
 * - Bundle of 10 = ₹500
 */
export function calculateQuestionBankBundleInr(count: number): {
  rawInr: number;
  netInr: number;
  savingsInr: number;
} {
  const safeCount = Math.max(0, Math.floor(count));
  const rawInr = safeCount * 100;
  const bundlesOf10 = Math.floor(safeCount / 10);
  const remAfter10 = safeCount % 10;
  const bundlesOf2 = Math.floor(remAfter10 / 2);
  const singles = remAfter10 % 2;
  const netInr = bundlesOf10 * 500 + bundlesOf2 * 100 + singles * 100;
  return {
    rawInr,
    netInr,
    savingsInr: Math.max(0, rawInr - netInr),
  };
}

/**
 * 8-Year PYP Bundle Pricing:
 * - 1 PYP bundle = ₹499
 * - 2 PYP bundles = ₹500
 */
export function calculatePypBundleInr(count: number): {
  rawInr: number;
  netInr: number;
  savingsInr: number;
} {
  const safeCount = Math.max(0, Math.floor(count));
  const rawInr = safeCount * 499;
  const pairs = Math.floor(safeCount / 2);
  const singles = safeCount % 2;
  const netInr = pairs * 500 + singles * 499;
  return {
    rawInr,
    netInr,
    savingsInr: Math.max(0, rawInr - netInr),
  };
}

export function calculateCartPricing(
  items: CartItem[],
  promoCode: string
): CartPricingBreakdown {
  let questionBankCount = 0;
  let pypBundleCount = 0;

  for (const item of items) {
    if (!item.product.available) continue;
    if (item.product.category === 'question-bank') {
      questionBankCount += item.quantity;
    } else {
      pypBundleCount += item.quantity;
    }
  }

  const qb = calculateQuestionBankBundleInr(questionBankCount);
  const pyp = calculatePypBundleInr(pypBundleCount);
  const subtotalAfterBundlesInr = qb.netInr + pyp.netInr;

  const normalizedPromo = promoCode.trim().toUpperCase();
  const promoRate = PROMO_CODES[normalizedPromo] ?? 0;
  const promoValid = promoRate > 0;
  const promoDiscountInr = Math.round(subtotalAfterBundlesInr * promoRate);
  const finalTotalInr = Math.max(0, subtotalAfterBundlesInr - promoDiscountInr);

  return {
    totalItems: questionBankCount + pypBundleCount,
    questionBankCount,
    pypBundleCount,
    questionBankRawInr: qb.rawInr,
    questionBankNetInr: qb.netInr,
    questionBankBundleSavingsInr: qb.savingsInr,
    pypRawInr: pyp.rawInr,
    pypNetInr: pyp.netInr,
    pypBundleSavingsInr: pyp.savingsInr,
    subtotalAfterBundlesInr,
    promoRate,
    promoDiscountInr,
    promoValid,
    finalTotalInr,
  };
}

export type RegistrationErrors = Partial<Record<keyof RegistrationPayload, string>>;

export function validateOlympiadRegistration(
  payload: RegistrationPayload,
  catalog: OlympiadExam[]
): RegistrationErrors {
  const errors: RegistrationErrors = {};

  if (!payload.name.trim() || payload.name.trim().length < 2) {
    errors.name = 'Enter candidate full name (at least 2 characters).';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  const phoneDigits = payload.phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Enter a valid phone number (7 to 15 digits).';
  }
  if (!payload.guardianName.trim() || payload.guardianName.trim().length < 2) {
    errors.guardianName = 'Enter parent or guardian full name.';
  }

  const ageNum = Number(payload.age);
  if (!payload.age.trim() || Number.isNaN(ageNum) || ageNum < 8 || ageNum > 20) {
    errors.age = 'Enter a valid candidate age between 8 and 20.';
  }

  const classNum = Number(payload.studentClass);
  if (!payload.studentClass || Number.isNaN(classNum) || classNum < 1 || classNum > 12) {
    errors.studentClass = 'Select a valid class (Grades 5–12).';
  }

  if (!payload.school.trim() || payload.school.trim().length < 2) {
    errors.school = 'Enter the candidate school name.';
  }
  if (!payload.city.trim() || payload.city.trim().length < 2) {
    errors.city = 'Enter the city.';
  }

  if (!payload.selectedOlympiadIds || payload.selectedOlympiadIds.length === 0) {
    errors.selectedOlympiadIds = 'Select at least one Olympiad.';
  } else if (!errors.studentClass) {
    const selectedExams = catalog.filter((exam) =>
      payload.selectedOlympiadIds.includes(exam.id)
    );
    const ineligible = selectedExams.find(
      (exam) => classNum < exam.minClass || classNum > exam.maxClass
    );
    if (ineligible) {
      errors.selectedOlympiadIds = `${ineligible.name} is open for Classes ${ineligible.minClass} to ${ineligible.maxClass}.`;
    }
  }

  return errors;
}

export type CheckoutErrors = Partial<Record<keyof CheckoutPayload, string>>;

export function validateCheckoutForm(payload: CheckoutPayload): CheckoutErrors {
  const errors: CheckoutErrors = {};

  if (!payload.name.trim() || payload.name.trim().length < 2) {
    errors.name = 'Enter recipient full name.';
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(payload.email.trim())) {
    errors.email = 'Enter a valid email address.';
  }
  const phoneDigits = payload.phone.replace(/\D/g, '');
  if (phoneDigits.length < 7 || phoneDigits.length > 15) {
    errors.phone = 'Enter a valid phone number.';
  }
  if (!payload.city.trim() || payload.city.trim().length < 2) {
    errors.city = 'Enter your city.';
  }
  if (!payload.guardianName.trim() || payload.guardianName.trim().length < 2) {
    errors.guardianName = 'Enter guardian full name.';
  }

  return errors;
}

export function calculateRegistrationFeeInr(
  selectedIds: OlympiadId[],
  catalog: OlympiadExam[]
): number {
  const uniqueIds = Array.from(new Set(selectedIds));
  return catalog
    .filter((exam) => uniqueIds.includes(exam.id))
    .reduce((sum, exam) => sum + exam.feeInr, 0);
}

export function calculateRegistrationPricing(
  selectedIds: OlympiadId[],
  catalog: OlympiadExam[],
  couponCode = ''
): {
  rawFeeInr: number;
  couponApplied: string;
  couponValid: boolean;
  discountInr: number;
  finalFeeInr: number;
} {
  const rawFeeInr = calculateRegistrationFeeInr(selectedIds, catalog);
  const normalized = couponCode.trim().toUpperCase();
  const couponValid = normalized === REGISTRATION_FREE_COUPON;
  const discountInr = couponValid ? rawFeeInr : 0;
  const finalFeeInr = Math.max(0, rawFeeInr - discountInr);
  return {
    rawFeeInr,
    couponApplied: couponValid ? REGISTRATION_FREE_COUPON : '',
    couponValid,
    discountInr,
    finalFeeInr,
  };
}

export interface CountdownParts {
  days: number;
  hours: number;
  minutes: number;
  seconds: number;
  expired: boolean;
}

export function computeCountdown(targetIso: string, nowMs: number): CountdownParts {
  const targetMs = new Date(targetIso).getTime();
  const diff = targetMs - nowMs;
  if (Number.isNaN(targetMs) || diff <= 0) {
    return { days: 0, hours: 0, minutes: 0, seconds: 0, expired: true };
  }

  const totalSeconds = Math.floor(diff / 1000);
  const days = Math.floor(totalSeconds / 86400);
  const hours = Math.floor((totalSeconds % 86400) / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  return { days, hours, minutes, seconds, expired: false };
}

/**
 * Admit card release window is 10 Nov.
 * If 10 Nov of the current year has already passed on the system clock,
 * compute countdown to the next upcoming 10 Nov window so the countdown stays live.
 */
export function getNextAdmitCardReleaseIso(nowMs: number): string {
  const now = new Date(nowMs);
  const year = now.getUTCFullYear();
  const thisYearRelease = new Date(`${year}-11-10T09:00:00+05:30`);
  if (nowMs < thisYearRelease.getTime()) {
    return thisYearRelease.toISOString();
  }
  return new Date(`${year + 1}-11-10T09:00:00+05:30`).toISOString();
}

export function findStudentResult(
  query: string,
  seededResults: StudentResult[],
  registrations: RegistrationRecord[]
): StudentResult | null {
  const normalized = query.trim().toLowerCase();
  if (!normalized) return null;

  const exactRoll = seededResults.find(
    (r) => r.rollNumber.toLowerCase() === normalized
  );
  if (exactRoll) return exactRoll;

  const nameMatch = seededResults.find((r) =>
    r.studentName.toLowerCase().includes(normalized)
  );
  if (nameMatch) return nameMatch;

  const regMatch = registrations.find(
    (reg) =>
      reg.registrationId.toLowerCase() === normalized ||
      reg.name.toLowerCase().includes(normalized)
  );

  if (regMatch) {
    return {
      rollNumber: regMatch.registrationId,
      studentName: regMatch.name,
      school: regMatch.school,
      city: regMatch.city,
      olympiadCode: regMatch.selectedOlympiadIds.map((id) => id.toUpperCase()).join(' / '),
      olympiadName: regMatch.olympiadNames.join(', '),
      studentClass: `Class ${regMatch.studentClass}`,
      totalScore: 0,
      maxScore: 100,
      percentile: 0,
      nationalRank: 0,
      award: 'Registered — Admit Card Pending (10 Nov)',
    };
  }

  return null;
}

export function generateReferenceId(prefix: 'XOF' | 'ORD' | 'INQ', seed: number): string {
  const suffix = String(1000 + (Math.abs(Math.floor(seed)) % 9000));
  return `${prefix}-2026-${suffix}`;
}

const TOPIC_TO_SHOP_BANK_IDS: Record<string, string[]> = {
  'Number Systems & Theory': ['qb-ixmo-1', 'qb-ixmo-3'],
  'Polynomials & Algebra': ['qb-ixmo-2', 'qb-ixmo-4', 'qb-ixmo-5'],
  'Euclidean Geometry': ['qb-ixmo-6', 'qb-ixmo-7', 'qb-ixmo-8'],
  'Combinatorics & Probability': ['qb-ixmo-9'],
};

/**
 * Pure ARET IXMO PYP Evaluation engine:
 * Scores candidate choices with IXMO section-accurate marks & negative marking,
 * calculates accuracy, negative-marking risk index, topic breakdown, weak topics,
 * and recommended IXMO Question Banks.
 */
export function evaluateAretPypPerformance(
  questions: AretPypQuestion[],
  selectedAnswers: Record<string, number>,
  shopProducts: ShopProduct[]
): AretEvaluationResult {
  let answeredCount = 0;
  let correctCount = 0;
  let wrongCount = 0;
  let rawScore = 0;
  let maxScore = 0;
  let negativePenalty = 0;

  const topicMap = new Map<string, { correct: number; total: number }>();

  for (const q of questions) {
    maxScore += q.marks;
    const entry = topicMap.get(q.topic) ?? { correct: 0, total: 0 };
    entry.total += 1;

    const chosen = selectedAnswers[q.id];
    if (typeof chosen === 'number') {
      answeredCount += 1;
      if (chosen === q.correctIndex) {
        correctCount += 1;
        rawScore += q.marks;
        entry.correct += 1;
      } else {
        wrongCount += 1;
        negativePenalty += q.negativeMarks;
      }
    }

    topicMap.set(q.topic, entry);
  }

  const netScore = Math.max(0, Number((rawScore - negativePenalty).toFixed(2)));
  const totalQuestions = Math.max(1, questions.length);
  const accuracyPct = Math.round((correctCount / totalQuestions) * 100);
  const netRatio = maxScore > 0 ? netScore / maxScore : 0;
  const estimatedPercentile = Number(
    Math.min(99.8, Math.max(38, 42 + netRatio * 56.5)).toFixed(1)
  );

  const riskIndex: 'Low' | 'Moderate' | 'High' =
    negativePenalty >= 2 ? 'High' : negativePenalty > 0 ? 'Moderate' : 'Low';

  const topicBreakdown = Array.from(topicMap.entries()).map(([topic, counts]) => ({
    topic,
    correct: counts.correct,
    total: counts.total,
    accuracyPct: Math.round((counts.correct / Math.max(1, counts.total)) * 100),
  }));

  const weakTopics = topicBreakdown
    .filter((item) => item.accuracyPct < 100)
    .sort((a, b) => a.accuracyPct - b.accuracyPct)
    .map((item) => item.topic);

  const availableIds = new Set(shopProducts.filter((p) => p.available).map((p) => p.id));
  const recommendedSet = new Set<string>();
  const targetTopics =
    weakTopics.length > 0 ? weakTopics : ['Combinatorics & Probability', 'Euclidean Geometry'];
  for (const t of targetTopics) {
    for (const id of TOPIC_TO_SHOP_BANK_IDS[t] ?? []) {
      if (availableIds.has(id)) recommendedSet.add(id);
    }
  }
  if (availableIds.has('pyp-ixmo-8yr')) {
    recommendedSet.add('pyp-ixmo-8yr');
  }

  return {
    answeredCount,
    correctCount,
    wrongCount,
    rawScore,
    maxScore,
    negativePenalty,
    netScore,
    accuracyPct,
    estimatedPercentile,
    riskIndex,
    topicBreakdown,
    weakTopics,
    recommendedBankIds: Array.from(recommendedSet).slice(0, 4),
  };
}

const FALLBACK_QUESTION_BANK: Record<
  Exclude<AretTopic, 'Mixed IXMO'>,
  Array<{
    prompt: string;
    statements?: string[];
    options: string[];
    correctIndex: number;
    explanation: string;
  }>
> = {
  'Number Systems & Theory': [
    {
      prompt: 'How many positive integers n <= 100 satisfy gcd(n, 12) = 1?',
      options: ['24', '33', '34', '40'],
      correctIndex: 1,
      explanation:
        'Using Euler totient φ(12) = 4 numbers per block of 12. Across 8 full blocks (1..96), there are 32 coprime integers, plus 97 in {97,98,99,100}, giving 33.',
    },
    {
      prompt: 'If a positive integer N leaves remainder 3 when divided by 5 and remainder 2 when divided by 7, what is the smallest such N?',
      options: ['18', '23', '30', '38'],
      correctIndex: 1,
      explanation:
        'Checking numbers ≡ 3 (mod 5): 3, 8, 13, 18, 23. Dividing 23 by 7 leaves remainder 2, so the smallest N is 23.',
    },
    {
      prompt: 'What is the remainder when 2^100 is divided by 7?',
      options: ['1', '2', '4', '6'],
      correctIndex: 1,
      explanation: 'Since 2^3 = 8 ≡ 1 (mod 7), 2^100 = (2^3)^33 × 2 ≡ 1 × 2 = 2 (mod 7).',
    },
    {
      prompt: 'Find the highest power of 5 that divides 65!.',
      options: ['13', '14', '15', '16'],
      correctIndex: 2,
      explanation: 'By Legendre formula: floor(65/5) + floor(65/25) = 13 + 2 = 15.',
    },
    {
      prompt: 'How many positive divisors does 360 have?',
      options: ['18', '20', '24', '30'],
      correctIndex: 2,
      explanation: '360 = 2^3 × 3^2 × 5^1, so τ(360) = (3+1)(2+1)(1+1) = 24.',
    },
    {
      prompt: 'What is the units digit of 17^2026?',
      options: ['1', '3', '7', '9'],
      correctIndex: 3,
      explanation: 'Units digits of powers of 7 cycle every 4: 7, 9, 3, 1. Since 2026 ≡ 2 (mod 4), the units digit is 9.',
    },
  ],
  'Polynomials & Algebra': [
    {
      prompt: 'If P(x) = x^3 - 6x^2 + 11x - 6, what is the sum of the reciprocals of its roots?',
      options: ['11 / 6', '6 / 11', '1', '5 / 6'],
      correctIndex: 0,
      explanation:
        'By Vieta formulas, r1r2 + r2r3 + r3r1 = 11 and r1r2r3 = 6. Dividing gives 1/r1 + 1/r2 + 1/r3 = 11/6.',
    },
    {
      prompt: 'For real numbers a, b satisfying a + b = 8 and a^2 + b^2 = 34, compute ab.',
      options: ['12', '15', '18', '20'],
      correctIndex: 1,
      explanation: '(a + b)^2 = a^2 + b^2 + 2ab => 64 = 34 + 2ab => ab = 15.',
    },
    {
      prompt: 'If x + 1/x = 4, find the value of x^2 + 1/x^2.',
      options: ['12', '14', '16', '18'],
      correctIndex: 1,
      explanation: 'Squaring both sides gives x^2 + 2 + 1/x^2 = 16 => x^2 + 1/x^2 = 14.',
    },
    {
      prompt: 'The quadratic x^2 - kx + 16 = 0 has equal real roots. What are the possible values of k?',
      options: ['±4', '±8', '±12', '±16'],
      correctIndex: 1,
      explanation: 'Discriminant Δ = k^2 - 64 = 0 => k = ±8.',
    },
    {
      prompt: 'If P(x) leaves remainder 5 when divided by (x - 2), and P(x) = x^3 - ax + 7, find a.',
      options: ['3', '4', '5', '6'],
      correctIndex: 2,
      explanation: 'By Remainder Theorem, P(2) = 8 - 2a + 7 = 5 => 2a = 10 => a = 5.',
    },
    {
      prompt: 'If log_2(x) + log_2(x - 2) = 3, solve for real x.',
      options: ['2', '3', '4', '6'],
      correctIndex: 2,
      explanation: 'log_2(x(x - 2)) = 3 => x^2 - 2x - 8 = 0 => (x - 4)(x + 2) = 0; since x > 2, x = 4.',
    },
  ],
  'Euclidean Geometry': [
    {
      prompt:
        'A circle of radius 10 cm has a chord of length 16 cm. What is the perpendicular distance from the center to the chord?',
      options: ['4 cm', '5 cm', '6 cm', '8 cm'],
      correctIndex: 2,
      explanation:
        'The perpendicular bisects the chord into two 8 cm segments. By Pythagoras: d = sqrt(10^2 - 8^2) = 6 cm.',
    },
    {
      prompt:
        'In cyclic quadrilateral ABCD, ∠A = (3x + 10)° and ∠C = (2x + 20)°. Find the value of x.',
      options: ['25', '30', '35', '40'],
      correctIndex: 1,
      explanation:
        'Opposite angles of a cyclic quadrilateral sum to 180°: 5x + 30 = 180 => x = 30.',
    },
    {
      prompt: 'What is the area of an equilateral triangle with side length 8 cm?',
      options: ['8√3 sq cm', '12√3 sq cm', '16√3 sq cm', '32√3 sq cm'],
      correctIndex: 2,
      explanation: 'Area = (√3 / 4) × 8^2 = 16√3 sq cm.',
    },
    {
      prompt: 'Two tangents from an external point P to a circle of radius 5 cm have length 12 cm each. Find OP.',
      options: ['13 cm', '14 cm', '15 cm', '17 cm'],
      correctIndex: 0,
      explanation: 'Radius is perpendicular to tangent at contact point, so OP = sqrt(5^2 + 12^2) = 13 cm.',
    },
    {
      prompt: 'In ΔABC, DE is parallel to BC with AD = 3, DB = 6, and AE = 4. Find EC.',
      options: ['6', '8', '9', '12'],
      correctIndex: 1,
      explanation: 'By Basic Proportionality Theorem, AD/DB = AE/EC => 3/6 = 4/EC => EC = 8.',
    },
    {
      prompt: 'Find the sum of all interior angles of a regular decagon (10-sided polygon).',
      options: ['1080°', '1260°', '1440°', '1620°'],
      correctIndex: 2,
      explanation: 'Interior angle sum = (n - 2) × 180° = 8 × 180° = 1440°.',
    },
  ],
  'Combinatorics & Probability': [
    {
      prompt:
        'How many distinct 3-digit numbers can be formed using digits {1, 2, 3, 4, 5} with no digit repeated?',
      options: ['24', '60', '100', '125'],
      correctIndex: 1,
      explanation: '5 × 4 × 3 = 60 distinct 3-digit numbers.',
    },
    {
      prompt:
        'Two cards are drawn simultaneously from a standard 52-card deck. What is the probability both are Aces?',
      options: ['1 / 221', '1 / 169', '3 / 221', '1 / 1326'],
      correctIndex: 0,
      explanation: 'C(4, 2) / C(52, 2) = 6 / 1326 = 1 / 221.',
    },
    {
      prompt: 'In how many ways can 5 students be seated around a circular table?',
      options: ['24', '60', '120', '720'],
      correctIndex: 0,
      explanation: 'Circular permutations of n objects = (n - 1)! = 4! = 24.',
    },
    {
      prompt: 'How many distinct words can be formed by rearranging the letters of "LEVEL"?',
      options: ['15', '30', '60', '120'],
      correctIndex: 1,
      explanation: '5! / (2! × 2!) = 120 / 4 = 30.',
    },
    {
      prompt: 'A coin is tossed 4 times. What is the probability of obtaining at least 1 Head?',
      options: ['1 / 16', '7 / 16', '15 / 16', '3 / 4'],
      correctIndex: 2,
      explanation: 'P(at least 1 Head) = 1 - P(all Tails) = 1 - (1/16) = 15/16.',
    },
    {
      prompt: 'How many diagonals does a convex 9-sided polygon have?',
      options: ['18', '27', '36', '45'],
      correctIndex: 1,
      explanation: 'Diagonals = n(n - 3)/2 = 9 × 6 / 2 = 27.',
    },
  ],
  'Logic & HOTS': [
    {
      prompt: 'In a sequence where a_1 = 2 and a_{n+1} = 2a_n + 1, what is the value of a_5?',
      options: ['31', '47', '63', '95'],
      correctIndex: 1,
      explanation: 'a_1 = 2, a_2 = 5, a_3 = 11, a_4 = 23, a_5 = 47.',
    },
    {
      prompt: 'A clock shows 3:15. What is the acute angle between the hour and minute hands?',
      options: ['0°', '5°', '7.5°', '15°'],
      correctIndex: 2,
      explanation: 'Minute hand at 90°. Hour hand at 90° + 15 × 0.5° = 97.5°. Angle = 7.5°.',
    },
    {
      prompt: 'How many subsets of {1, 2, 3, 4, 5} contain the element 3?',
      options: ['8', '12', '16', '31'],
      correctIndex: 2,
      explanation: 'Fix element 3, choose any subset of remaining 4 elements: 2^4 = 16.',
    },
    {
      prompt: 'If 3^x = 81 and 2^y = 32, find the value of x^y - y^x.',
      options: ['399', '400', '412', '499'],
      correctIndex: 0,
      explanation: 'x = 4 and y = 5, so 4^5 - 5^4 = 1024 - 625 = 399.',
    },
    {
      prompt: 'Four friends finish a race: Ananya beats Kabir, Rohan finishes behind Kabir, and Meera beats Ananya. Who finishes second?',
      options: ['Meera', 'Ananya', 'Kabir', 'Rohan'],
      correctIndex: 1,
      explanation: 'Order from 1st to 4th: Meera > Ananya > Kabir > Rohan, so Ananya finishes second.',
    },
    {
      prompt: 'What is the missing term in the Olympiad series: 3, 10, 29, 66, 127, ?.',
      options: ['196', '210', '218', '224'],
      correctIndex: 2,
      explanation: 'Pattern is n^3 + 2 for n = 1..6: 6^3 + 2 = 216 + 2 = 218.',
    },
  ],
};

export function buildFallbackAretQuestions(params: {
  topic: AretTopic;
  difficulty: AretDifficulty;
  style: AretQuestionStyle;
  count: number;
  weakTopics: string[];
}): AretGeneratedQuestion[] {
  const targetCount = Math.min(30, Math.max(2, params.count));
  const allTopics: Array<Exclude<AretTopic, 'Mixed IXMO'>> = [
    'Number Systems & Theory',
    'Polynomials & Algebra',
    'Euclidean Geometry',
    'Combinatorics & Probability',
    'Logic & HOTS',
  ];

  const prioritizedTopics: Array<Exclude<AretTopic, 'Mixed IXMO'>> =
    params.topic === 'Mixed IXMO'
      ? Array.from(
          new Set([
            ...params.weakTopics.filter(
              (t): t is Exclude<AretTopic, 'Mixed IXMO'> => t in FALLBACK_QUESTION_BANK
            ),
            ...allTopics,
          ])
        )
      : [
          params.topic,
          ...allTopics.filter((t) => t !== params.topic),
        ];

  const orderedPool: Array<{
    topic: Exclude<AretTopic, 'Mixed IXMO'>;
    template: (typeof FALLBACK_QUESTION_BANK)[Exclude<AretTopic, 'Mixed IXMO'>][number];
  }> = [];

  // Interleave primary topic first, then fill cleanly up to 30 unique questions without repeats
  if (params.topic !== 'Mixed IXMO') {
    for (const template of FALLBACK_QUESTION_BANK[params.topic]) {
      orderedPool.push({ topic: params.topic, template });
    }
  }
  const maxBankLen = 6;
  for (let round = 0; round < maxBankLen; round++) {
    for (const t of prioritizedTopics) {
      if (params.topic !== 'Mixed IXMO' && t === params.topic) continue;
      const item = FALLBACK_QUESTION_BANK[t][round];
      if (item) orderedPool.push({ topic: t, template: item });
    }
  }

  const results: AretGeneratedQuestion[] = [];
  for (let i = 0; i < targetCount; i++) {
    const entry = orderedPool[i % orderedPool.length];
    results.push({
      id: `sus-gen-${i + 1}`,
      topic: entry.topic,
      difficulty: params.difficulty,
      style: params.style,
      prompt: entry.template.prompt,
      statements:
        params.style === 'Statement I & II Logic'
          ? entry.template.statements ?? [
              `I. Apply ${entry.topic} foundational identities cleanly.`,
              `II. Verify boundary constraints under ${params.difficulty} scoring.`,
            ]
          : entry.template.statements,
      options: entry.template.options,
      correctIndex: entry.template.correctIndex,
      explanation: entry.template.explanation,
      adaptiveReason:
        params.weakTopics.includes(entry.topic)
          ? `Calibrated by SuS to reinforce detected gap in ${entry.topic} (${params.difficulty}).`
          : `Custom ${params.difficulty} challenge generated for ${entry.topic}.`,
    });
  }

  return results;
}

export type OobeMood = 'welcome' | 'happy' | 'tip' | 'warning' | 'celebrate';

export interface SuSMarker {
  label: string;
  status: 'ok' | 'warn' | 'hint';
}

export interface SuSOobeGuidance {
  mood: OobeMood;
  stepTitle: string;
  headline: string;
  message: string;
  markers: SuSMarker[];
}

export function validateRegistrationStep(
  step: 1 | 2 | 3 | 4,
  payload: RegistrationPayload,
  catalog: OlympiadExam[]
): RegistrationErrors {
  if (step === 1) {
    return !payload.selectedOlympiadIds || payload.selectedOlympiadIds.length === 0
      ? { selectedOlympiadIds: 'Select at least one Olympiad.' }
      : {};
  }
  const full = validateOlympiadRegistration(payload, catalog);
  if (step === 2) {
    const out: RegistrationErrors = {};
    if (full.name) out.name = full.name;
    if (full.email) out.email = full.email;
    if (full.phone) out.phone = full.phone;
    if (full.guardianName) out.guardianName = full.guardianName;
    return out;
  }
  if (step === 3) {
    const out: RegistrationErrors = {};
    if (full.age) out.age = full.age;
    if (full.studentClass) out.studentClass = full.studentClass;
    if (full.school) out.school = full.school;
    if (full.city) out.city = full.city;
    if (full.selectedOlympiadIds) out.selectedOlympiadIds = full.selectedOlympiadIds;
    return out;
  }
  return full;
}

export function validateCheckoutStep(
  step: 1 | 2 | 3,
  payload: CheckoutPayload,
  cartItemCount: number
): CheckoutErrors {
  if (step === 1) {
    return cartItemCount > 0 ? {} : { name: 'Add at least one study material pack.' };
  }
  if (step === 2) {
    return validateCheckoutForm(payload);
  }
  return validateCheckoutForm(payload);
}

export function getSuSRegistrationGuidance(params: {
  step: 1 | 2 | 3 | 4;
  form: RegistrationPayload;
  catalog: OlympiadExam[];
  couponApplied: string;
  finalFeeInr: number;
}): SuSOobeGuidance {
  const { step, form, catalog, couponApplied, finalFeeInr } = params;
  const stepErrors = validateRegistrationStep(step, form, catalog);
  const selectedExams = catalog.filter((e) =>
    form.selectedOlympiadIds.includes(e.id)
  );
  const classNum = Number(form.studentClass);
  const hasIxCompetoMismatch =
    !Number.isNaN(classNum) &&
    classNum < 10 &&
    form.selectedOlympiadIds.includes('ixcompeto');

  if (step === 1) {
    const count = selectedExams.length;
    if (count === 0) {
      return {
        mood: 'warning',
        stepTitle: 'Step 1 · Select Olympiad Tracks',
        headline: 'Choose at least one Olympiad track to begin.',
        message:
          'Hi! I am SuS. Tap one or more cards below to pick your 2026 X Olympiads — IXMO, IXSO, IXEO, IXCO (Classes 5–12) or IXCompetO (Grades 10–12).',
        markers: [
          { label: '0 tracks selected', status: 'warn' },
          { label: 'Hint: Use code FREEXOLYMPIAD on Step 4', status: 'hint' },
        ],
      };
    }
    return {
      mood: 'welcome',
      stepTitle: 'Step 1 · Track Selection Ready',
      headline: `${count} Olympiad${count > 1 ? 's' : ''} locked in (${selectedExams.map((e) => e.code).join(' + ')}).`,
      message:
        count >= 2
          ? 'Great ambition! Combining Mathematics & Science builds cross-disciplinary confidence. Click Next when ready for Candidate Identity.'
          : 'Solid choice! You can also select multiple tracks right here, or proceed to Step 2 to introduce yourself.',
      markers: [
        { label: `${selectedExams.map((e) => e.code).join(', ')} selected`, status: 'ok' },
        ...(hasIxCompetoMismatch
          ? [{ label: 'IXCompetO requires Grades 10–12 (update Class on Step 3)', status: 'warn' as const }]
          : [{ label: 'Eligibility check ready', status: 'ok' as const }]),
      ],
    };
  }

  if (step === 2) {
    const nameOk = !stepErrors.name;
    const emailOk = !stepErrors.email;
    const phoneOk = !stepErrors.phone;
    const guardianOk = !stepErrors.guardianName;
    const readyCount = [nameOk, emailOk, phoneOk, guardianOk].filter(Boolean).length;

    return {
      mood: readyCount === 4 ? 'happy' : 'tip',
      stepTitle: 'Step 2 · Candidate & Guardian Identity',
      headline:
        readyCount === 4
          ? `Nice to meet you, ${form.name.trim().split(' ')[0]}! Identity verified.`
          : `Filling candidate contact details (${readyCount}/4 verified)...`,
      message:
        readyCount === 4
          ? 'Your official Admit Card alert (opening 10 Nov) and 24-hour confirmation email will be routed to this inbox and guardian record.'
          : 'Enter the candidate name, active email, valid phone number, and parent/guardian name — watch every field turn green as you go!',
      markers: [
        { label: 'Candidate Name', status: nameOk ? 'ok' : 'hint' },
        { label: 'Active Email', status: emailOk ? 'ok' : 'hint' },
        { label: 'Phone Number', status: phoneOk ? 'ok' : 'hint' },
        { label: 'Guardian Name', status: guardianOk ? 'ok' : 'hint' },
      ],
    };
  }

  if (step === 3) {
    const ageOk = !stepErrors.age;
    const schoolOk = !stepErrors.school;
    const cityOk = !stepErrors.city;
    const classEligible = !stepErrors.selectedOlympiadIds;

    if (hasIxCompetoMismatch) {
      return {
        mood: 'warning',
        stepTitle: 'Step 3 · Eligibility Alert',
        headline: `Heads up! Class ${form.studentClass} is not eligible for IXCompetO.`,
        message:
          'IXCompetO is strictly open for Grades 10 to 12. Either select Class 10, 11, or 12 here, or switch tracks back on Step 1.',
        markers: [
          { label: 'IXCompetO requires Class 10–12', status: 'warn' },
          { label: `School ${schoolOk ? 'verified' : 'needed'}`, status: schoolOk ? 'ok' : 'hint' },
          { label: `City ${cityOk ? 'verified' : 'needed'}`, status: cityOk ? 'ok' : 'hint' },
        ],
      };
    }

    const readyCount = [ageOk, schoolOk, cityOk, classEligible].filter(Boolean).length;
    return {
      mood: readyCount === 4 ? 'happy' : 'tip',
      stepTitle: 'Step 3 · School, Age & Academic Class',
      headline:
        readyCount === 4
          ? `Class ${form.studentClass} eligibility confirmed across ${selectedExams.map((e) => e.code).join(', ')}!`
          : 'Tell SuS your age, grade level, school, and city.',
      message:
        readyCount === 4
          ? 'Your exam paper difficulty tier is mapped to your class. One final review & coupon step left!'
          : 'I verify candidate age (8–20) and class eligibility automatically against every Olympiad you picked.',
      markers: [
        { label: `Class ${form.studentClass} Eligible`, status: classEligible ? 'ok' : 'warn' },
        { label: 'Age (8–20)', status: ageOk ? 'ok' : 'hint' },
        { label: 'School Name', status: schoolOk ? 'ok' : 'hint' },
        { label: 'City', status: cityOk ? 'ok' : 'hint' },
      ],
    };
  }

  // Step 4
  const isFree = couponApplied === REGISTRATION_FREE_COUPON || finalFeeInr === 0;
  return {
    mood: isFree ? 'celebrate' : 'tip',
    stepTitle: 'Step 4 · Waiver Coupon & Final Provisioning',
    headline: isFree
      ? `Fee waived to ₹0 via ${REGISTRATION_FREE_COUPON}! Ready for launch.`
      : `Final Review: Total Fee ₹${finalFeeInr}. Got a coupon?`,
    message: isFree
      ? 'Awesome! Your 100% registration waiver is active. Click Complete Registration and I will record your seat in both XOF Database and Cloud Firestore.'
      : 'Tip from SuS: Enter coupon code FREEXOLYMPIAD below and hit Apply for a 100% free registration waiver, or submit directly as is.',
    markers: [
      { label: `${selectedExams.length} Track${selectedExams.length > 1 ? 's' : ''} Verified`, status: 'ok' },
      { label: isFree ? 'FREEXOLYMPIAD Waiver Active (₹0)' : `Payable: ₹${finalFeeInr}`, status: isFree ? 'ok' : 'hint' },
      { label: '24h Email Confirmation Ready', status: 'ok' },
    ],
  };
}

export function getSuSCheckoutGuidance(params: {
  step: 1 | 2 | 3;
  form: CheckoutPayload;
  pricing: CartPricingBreakdown;
  appliedPromo: string;
}): SuSOobeGuidance {
  const { step, form, pricing, appliedPromo } = params;

  if (step === 1) {
    const qbRemainder = pricing.questionBankCount % 2;
    const pypRemainder = pricing.pypBundleCount % 2;
    const totalSavings =
      pricing.questionBankBundleSavingsInr + pricing.pypBundleSavingsInr;

    if (qbRemainder === 1 && pricing.questionBankCount < 10) {
      return {
        mood: 'tip',
        stepTitle: 'Step 1 · Smart Bundle Check',
        headline: 'Quick SuS Savings Tip: Add 1 more Question Bank for ₹0 extra!',
        message: `You currently have ${pricing.questionBankCount} Question Bank${pricing.questionBankCount > 1 ? 's' : ''}. Since 2 Question Banks cost ₹100 (same as 1!), tapping +1 gives you a bonus chapter bank at zero extra cost.`,
        markers: [
          { label: `${pricing.questionBankCount} Question Bank(s)`, status: 'hint' },
          { label: '2 Banks = ₹100 · 10 Banks = ₹500', status: 'hint' },
          ...(totalSavings > 0
            ? [{ label: `Saving ₹${totalSavings} via bundles`, status: 'ok' as const }]
            : []),
        ],
      };
    }

    if (pypRemainder === 1) {
      return {
        mood: 'tip',
        stepTitle: 'Step 1 · PYP Bundle Value Alert',
        headline: 'Only ₹1 more unlocks a 2nd 8-Year PYP Bundle!',
        message:
          '1 PYP Bundle is ₹499, while 2 PYP Bundles cost ₹500 total (saving ₹498). Tap +1 if you want another Olympiad 8-Year PYP archive for just ₹1.',
        markers: [
          { label: `${pricing.pypBundleCount} PYP Bundle(s)`, status: 'hint' },
          { label: '2 PYP Bundles = ₹500 total', status: 'hint' },
        ],
      };
    }

    return {
      mood: totalSavings > 0 ? 'happy' : 'welcome',
      stepTitle: 'Step 1 · Study Material Bag Verified',
      headline:
        totalSavings > 0
          ? `Bundle optimization active — saving ₹${totalSavings} automatically!`
          : `All ${pricing.totalItems} study material pack(s) ready in your bag.`,
      message:
        'Review quantities below. When your study pack lineup looks great, click Next to enter recipient details.',
      markers: [
        { label: `${pricing.totalItems} Pack(s) Ready`, status: 'ok' },
        ...(totalSavings > 0
          ? [{ label: `₹${totalSavings} Bundle Savings`, status: 'ok' as const }]
          : []),
      ],
    };
  }

  if (step === 2) {
    const errs = validateCheckoutForm(form);
    const checks = [
      { label: 'Recipient Name', ok: !errs.name },
      { label: 'Email', ok: !errs.email },
      { label: 'Phone', ok: !errs.phone },
      { label: 'City', ok: !errs.city },
      { label: 'Guardian Name', ok: !errs.guardianName },
    ];
    const done = checks.filter((c) => c.ok).length;
    return {
      mood: done === 5 ? 'happy' : 'tip',
      stepTitle: 'Step 2 · Recipient & Dispatch Details',
      headline:
        done === 5
          ? `All 5 recipient fields verified for ${form.city.trim()}!`
          : `Completing dispatch profile (${done}/5 verified)...`,
      message:
        done === 5
          ? 'Your study pack order receipt and activation instructions will be emailed within 24 working hours. Click Next for Promo Codes!'
          : 'Fill in Recipient Name, Email, Phone Number, City, and Guardian Name — watch every SuS checkmark light up green.',
      markers: checks.map((c) => ({
        label: c.label,
        status: c.ok ? 'ok' : 'hint',
      })),
    };
  }

  // Step 3
  const isFree = pricing.finalTotalInr === 0 || appliedPromo === 'FREEMATERIAL';
  return {
    mood: isFree ? 'celebrate' : 'tip',
    stepTitle: 'Step 3 · Promo Code & Final Checkout',
    headline: isFree
      ? `FREEMATERIAL unlocked — Total payable dropped to ₹0!`
      : `Final Total: ₹${pricing.finalTotalInr}. Have promo code FREEMATERIAL?`,
    message: isFree
      ? 'Zero-rupee waiver applied! Click Confirm & Provision Order so I can save your order items to both XOF Database and Cloud Firestore.'
      : 'Apply FREEMATERIAL for 100% free study packs (or OLYMPIAD15 / SCHOLAR10), then hit Confirm & Provision Order.',
    markers: [
      { label: `${pricing.totalItems} Study Pack(s)`, status: 'ok' },
      {
        label: isFree
          ? '100% Promo Waiver Active (₹0)'
          : `Total ₹${pricing.finalTotalInr}`,
        status: isFree ? 'ok' : 'hint',
      },
      { label: 'Database + Cloud Sync Ready', status: 'ok' },
    ],
  };
}

export function getSuSShopAdvisorHint(pricing: CartPricingBreakdown): {
  tone: 'welcome' | 'hint' | 'celebrate';
  headline: string;
  subtext: string;
} {
  if (pricing.totalItems === 0) {
    return {
      tone: 'welcome',
      headline: 'SuS Study Pack Advisor: Build your Olympiad prep bundle',
      subtext:
        'Pick Chapter Question Banks (1 for ₹100 · 2 for ₹100 · 10 for ₹500) or 8-Year PYP Bundles (1 for ₹499 · 2 for ₹500). IXEO & IXCO banks are unavailable.',
    };
  }
  const savings = pricing.questionBankBundleSavingsInr + pricing.pypBundleSavingsInr;
  if (pricing.questionBankCount % 2 === 1 && pricing.questionBankCount < 10) {
    return {
      tone: 'hint',
      headline: `Add 1 more Question Bank to get 2 for ₹100 free bundle bonus!`,
      subtext: `Current bag: ${pricing.questionBankCount} Bank(s) + ${pricing.pypBundleCount} PYP Bundle(s). Use FREEMATERIAL at Guided Checkout for ₹0.`,
    };
  }
  if (pricing.pypBundleCount % 2 === 1) {
    return {
      tone: 'hint',
      headline: `Add 1 more 8-Year PYP Bundle for just ₹1 extra (2 PYP Bundles = ₹500)!`,
      subtext: `You save ₹498 immediately vs buying singles. Apply FREEMATERIAL on Checkout for 100% off.`,
    };
  }
  return {
    tone: 'celebrate',
    headline:
      savings > 0
        ? `Bundle Optimized! You are saving ₹${savings} across ${pricing.totalItems} packs.`
        : `${pricing.totalItems} packs queued — ready for Guided OOBE Checkout.`,
    subtext: `Total before promo: ₹${pricing.finalTotalInr}. Enter FREEMATERIAL on Checkout Step 3 to waive 100% of material fees.`,
  };
}

export interface CelebrationParticle {
  id: number;
  dx: number;
  dy: number;
  rotate: number;
  color: '#B8FF00' | '#00F0FF' | '#FFFFFF';
  shape: 'diamond' | 'bar' | 'dot';
  delay: number;
}

export interface ConfirmationCelebrationSpec {
  accent: 'lime' | 'cyan';
  stampLabel: string;
  headlineBadge: string;
  waiverCelebration: boolean;
  milestones: Array<{ label: string; detail: string }>;
  particles: CelebrationParticle[];
}

export function getConfirmationCelebrationSpec(
  confirmation: ConfirmationState | null
): ConfirmationCelebrationSpec {
  const isOrder = confirmation?.type === 'order';
  const waiverCelebration = Boolean(confirmation && confirmation.totalInr === 0);
  const accent: 'lime' | 'cyan' = isOrder || waiverCelebration ? 'lime' : 'cyan';

  const colors: Array<'#B8FF00' | '#00F0FF' | '#FFFFFF'> = [
    '#B8FF00',
    '#00F0FF',
    '#FFFFFF',
  ];
  const shapes: Array<'diamond' | 'bar' | 'dot'> = ['diamond', 'bar', 'dot'];

  const particles: CelebrationParticle[] = Array.from({ length: 18 }, (_, i) => {
    const angleRad = (i * 20 * Math.PI) / 180;
    const radius = 84 + (i % 3) * 24;
    return {
      id: i,
      dx: Math.round(Math.cos(angleRad) * radius),
      dy: Math.round(Math.sin(angleRad) * radius),
      rotate: (i % 2 === 0 ? 1 : -1) * (45 + i * 18),
      color: colors[i % colors.length],
      shape: shapes[i % shapes.length],
      delay: Number((0.06 + (i % 6) * 0.03).toFixed(2)),
    };
  });

  return {
    accent,
    stampLabel: waiverCelebration
      ? 'FEE WAIVED · VERIFIED'
      : isOrder
        ? 'ORDER SEALED'
        : 'SEAT RESERVED',
    headlineBadge: isOrder
      ? 'Study Material Order Confirmed'
      : 'Olympiad Enrollment Confirmed',
    waiverCelebration,
    milestones: [
      {
        label: 'Verified',
        detail: isOrder ? 'Bundle & Promo Validated' : 'Eligibility & Seat Locked',
      },
      {
        label: 'Recorded',
        detail: confirmation?.referenceId
          ? `Ref ${confirmation.referenceId}`
          : 'Foundation Database Synced',
      },
      {
        label: 'Email Queued',
        detail: 'Dispatch within 24 working hrs',
      },
    ],
    particles,
  };
}

export interface AretIntroSequenceSpec {
  mode: 'preview' | 'full';
  kicker: string;
  subsystems: Array<{
    id: string;
    title: string;
    subtitle: string;
    metricLabel: string;
    accent: 'lime' | 'cyan';
  }>;
  waveBars: number[];
}

export function getAretIntroSequenceSpec(
  mode: 'preview' | 'full'
): AretIntroSequenceSpec {
  const isFull = mode === 'full';
  return {
    mode,
    kicker: isFull
      ? 'FULL-FLEDGED MULTI-PAGE ARCHITECTURE · ACCESS VERIFIED'
      : 'ADAPTIVE DIAGNOSTIC ARCHITECTURE · SEPTEMBER 2026 LAUNCH',
    subsystems: [
      {
        id: 'pyp-evaluator',
        title: isFull ? 'Multi-Year PYP Archive' : 'IXMO PYP Benchmark',
        subtitle: isFull
          ? '2025, 2024 & 2023 timed exam papers'
          : '4-section official scoring & negative penalty index',
        metricLabel: isFull ? '3 Papers' : '1 Free Try',
        accent: 'cyan',
      },
      {
        id: 'sus-synthesis',
        title: 'SuS Adaptive Engine',
        subtitle: isFull
          ? '20–30 Olympiad questions generated per batch'
          : 'Topic, difficulty & style-calibrated question preview',
        metricLabel: isFull ? '20–30 Qs' : 'Adaptive',
        accent: 'lime',
      },
      {
        id: 'mistake-vault',
        title: isFull ? 'Deep Mistake Vault' : 'Performance Analytics',
        subtitle: isFull
          ? 'Topic accuracy breakdown & derivation audit'
          : 'Percentile estimate & targeted Chapter Bank picks',
        metricLabel: 'Live Audit',
        accent: 'cyan',
      },
    ],
    waveBars: [0.35, 0.62, 0.48, 0.86, 0.72, 0.94, 0.58, 0.81, 0.66, 0.9, 0.5, 0.76],
  };
}

export type SuSAretIntroFocus = 'sus' | 'aret-preview' | 'aret-full';

export interface SuSAretIntroPhase {
  step: number;
  id: 'sus-wake' | 'aret-dock' | 'neural-link' | 'ready';
  title: string;
  caption: string;
  emphasis: 'sus' | 'aret' | 'both';
}

export interface SuSAretIntroSpec {
  focus: SuSAretIntroFocus;
  bannerTitle: string;
  bannerSubtitle: string;
  phases: SuSAretIntroPhase[];
  packets: string[];
  susWaveform: number[];
  aretSpectrum: number[];
}

export function getSuSAretIntroPhases(focus: SuSAretIntroFocus): SuSAretIntroSpec {
  const bannerTitle =
    focus === 'sus'
      ? 'SuS & ARET Dual Intelligence Link'
      : focus === 'aret-full'
        ? 'ARET Pro & SuS Deep Studio Architecture'
        : 'ARET & SuS Live Diagnostic Synchronization';

  const bannerSubtitle =
    focus === 'sus'
      ? 'SuS (Systematic User Help-Service) flies online alongside the ARET reasoning core to guide Olympiad dates, syllabus rules, bundle pricing, and custom diagnostics.'
      : focus === 'aret-full'
        ? 'SuS and the full-fledged ARET engine dock together to deliver multi-year IXMO archives, 20–30 adaptive questions per batch, and mistake vault analytics.'
        : 'Watch SuS and ARET calibrate together: PYP performance flows across the link to synthesize custom questions and your September 2026 readiness report.';

  return {
    focus,
    bannerTitle,
    bannerSubtitle,
    phases: [
      {
        step: 1,
        id: 'sus-wake',
        title: '01. SuS Flight & Orbit',
        caption: 'SuS glides into formation and loads 2026 Olympiad schedules, syllabus chapters & rules.',
        emphasis: 'sus',
      },
      {
        step: 2,
        id: 'aret-dock',
        title: '02. ARET Core Docking',
        caption: 'ARET octagram crystal docks with IXMO 4-section weights and negative-marking matrices.',
        emphasis: 'aret',
      },
      {
        step: 3,
        id: 'neural-link',
        title: '03. Dual Bridge Sync',
        caption: 'SuS streams prompt parameters to ARET while ARET returns weak-topic diagnostic vectors.',
        emphasis: 'both',
      },
      {
        step: 4,
        id: 'ready',
        title: '04. Interactive Session Ready',
        caption:
          focus === 'sus'
            ? 'Ask SuS any query below or pick a starter prompt to begin immediately.'
            : 'Attempt the IXMO PYP benchmark below or enter access code ARETCODESAMPLE.',
        emphasis: 'both',
      },
    ],
    packets: ['IXMO PYP Matrix', 'Topic & Style Params', 'Diagnostic Insights'],
    susWaveform: [0.42, 0.85, 0.58, 0.96, 0.7, 0.9, 0.48, 0.78],
    aretSpectrum: [0.38, 0.64, 0.52, 0.88, 0.74, 0.95, 0.62, 0.84, 0.68, 0.92, 0.54, 0.8],
  };
}

export interface SubscriberSubmissionInput {
  type: 'registration' | 'order' | 'aret-waitlist';
  referenceId: string;
  name: string;
  email: string;
  phone?: string;
  city?: string;
  guardianName?: string;
  school?: string;
  studentClass?: string;
  couponOrPromo?: string;
  totalInr?: number;
  summary: string;
  itemsOrTracks: string[];
}

export function buildSubscriberDocumentPayload(
  input: SubscriberSubmissionInput
): Record<string, string | number | string[]> {
  return {
    type: input.type,
    referenceId: input.referenceId.trim(),
    name: input.name.trim(),
    email: input.email.trim(),
    emailLower: input.email.trim().toLowerCase(),
    phone: (input.phone ?? '').trim(),
    city: (input.city ?? '').trim(),
    guardianName: (input.guardianName ?? '').trim(),
    school: (input.school ?? '').trim(),
    studentClass: (input.studentClass ?? '').trim(),
    couponOrPromo: (input.couponOrPromo ?? '').trim().toUpperCase(),
    totalInr: typeof input.totalInr === 'number' ? input.totalInr : 0,
    summary: input.summary.trim(),
    itemsOrTracks: input.itemsOrTracks.filter((x) => typeof x === 'string' && x.trim().length > 0),
    source: 'x-olympiad-foundation-web',
  };
}


