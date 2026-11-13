export type PageRoute =
  | 'home'
  | 'registration'
  | 'syllabus'
  | 'structure'
  | 'dates'
  | 'shop'
  | 'checkout'
  | 'admit-card'
  | 'news'
  | 'sus'
  | 'aret'
  | 'aret-full'
  | 'search'
  | 'confirmation';

export type OlympiadId = 'ixmo' | 'ixso' | 'ixeo' | 'ixco' | 'ixcompeto';

export type ExamStatus = 'Registration Open' | 'Closing Soon' | 'Upcoming';

export interface OlympiadSectionStructure {
  sectionName: string;
  questionCount: number;
  marksPerQuestion: number;
  totalMarks: number;
  negativeMarking: string;
}

export interface OlympiadExam {
  id: OlympiadId;
  code: string;
  name: string;
  shortName: string;
  eligibility: string;
  minClass: number;
  maxClass: number;
  feeInr: number;
  registrationClosingIso: string;
  registrationClosingLabel: string;
  examDateIso: string;
  examDateLabel: string;
  durationLabel: string;
  totalQuestions: number;
  totalMarks: number;
  status: ExamStatus;
  syllabusAnnounced: boolean;
  syllabusSummary: string;
  syllabusChapters: Array<{
    group: string;
    topics: string[];
  }>;
  sections: OlympiadSectionStructure[];
  negativeMarkingSummary: string;
}

export interface SamplePreviewQuestion {
  id: string;
  olympiadCode: string;
  olympiadName: string;
  sourceType: 'PYP Sample' | 'Question Bank Preview';
  prompt: string;
  passage?: string;
  statements?: string[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

export type ShopCategory = 'question-bank' | 'pyp-bundle';

export interface ShopProduct {
  id: string;
  title: string;
  olympiadId: OlympiadId;
  olympiadCode: string;
  category: ShopCategory;
  chapterOrYears: string;
  unitPriceInr: number;
  available: boolean;
  unavailableReason?: string;
  imageUrl: string;
}

export interface CartItem {
  product: ShopProduct;
  quantity: number;
}

export interface CartPricingBreakdown {
  totalItems: number;
  questionBankCount: number;
  pypBundleCount: number;
  questionBankRawInr: number;
  questionBankNetInr: number;
  questionBankBundleSavingsInr: number;
  pypRawInr: number;
  pypNetInr: number;
  pypBundleSavingsInr: number;
  subtotalAfterBundlesInr: number;
  promoRate: number;
  promoDiscountInr: number;
  promoValid: boolean;
  finalTotalInr: number;
}

export interface RegistrationPayload {
  name: string;
  email: string;
  phone: string;
  guardianName: string;
  age: string;
  studentClass: string;
  school: string;
  city: string;
  selectedOlympiadIds: OlympiadId[];
  couponCode?: string;
}

export interface RegistrationRecord extends RegistrationPayload {
  registrationId: string;
  createdAt: string;
  olympiadNames: string[];
  rawFeeInr?: number;
  discountInr?: number;
  totalFeeInr: number;
}

export interface CheckoutPayload {
  name: string;
  email: string;
  phone: string;
  city: string;
  guardianName: string;
  promoCode: string;
}

export interface OrderLineItem {
  id: string;
  title: string;
  olympiadCode: string;
  category: ShopCategory;
  chapterOrYears: string;
  unitPriceInr: number;
  quantity: number;
}

export interface OrderRecord extends CheckoutPayload {
  orderId: string;
  createdAt: string;
  items: OrderLineItem[];
  pricing: CartPricingBreakdown;
}

export interface LeadInquiryRecord {
  inquiryId: string;
  createdAt: string;
  name: string;
  email: string;
  city: string;
  interest: string;
  notes: string;
}

export interface PersistenceStatus {
  serverSaved: boolean;
  firebaseSynced: boolean;
  serverError?: string;
  firebaseError?: string;
}

export interface ConfirmationState {
  type: 'registration' | 'order';
  referenceId: string;
  recipientName: string;
  recipientEmail: string;
  summaryLines: string[];
  totalInr: number;
  persistenceStatus?: PersistenceStatus;
}

export interface StudentResult {
  rollNumber: string;
  studentName: string;
  school: string;
  city: string;
  olympiadCode: string;
  olympiadName: string;
  studentClass: string;
  totalScore: number;
  maxScore: number;
  percentile: number;
  nationalRank: number;
  award: string;
}

export interface NewsArticle {
  id: string;
  title: string;
  category: string;
  publishedDate: string;
  summary: string;
  body: string[];
}

export type AretTopic =
  | 'Mixed IXMO'
  | 'Number Systems & Theory'
  | 'Polynomials & Algebra'
  | 'Euclidean Geometry'
  | 'Combinatorics & Probability'
  | 'Logic & HOTS';

export type AretDifficulty = 'Foundation' | 'Olympiad Standard' | 'HOTS Challenge';

export type AretQuestionStyle =
  | 'Single-Choice MCQ'
  | 'Statement I & II Logic'
  | 'Multi-Step Conceptual';

export interface AretPypQuestion {
  id: string;
  year: string;
  topic: Exclude<AretTopic, 'Mixed IXMO'>;
  section: string;
  marks: number;
  negativeMarks: number;
  prompt: string;
  statements?: string[];
  options: string[];
  correctIndex: number;
  explanation: string;
}

export interface AretGeneratedQuestion {
  id: string;
  topic: string;
  difficulty: AretDifficulty;
  style: AretQuestionStyle;
  prompt: string;
  statements?: string[];
  options: string[];
  correctIndex: number;
  explanation: string;
  adaptiveReason: string;
}

export interface AretTopicBreakdown {
  topic: string;
  correct: number;
  total: number;
  accuracyPct: number;
}

export interface AretEvaluationResult {
  answeredCount: number;
  correctCount: number;
  wrongCount: number;
  rawScore: number;
  maxScore: number;
  negativePenalty: number;
  netScore: number;
  accuracyPct: number;
  estimatedPercentile: number;
  riskIndex: 'Low' | 'Moderate' | 'High';
  topicBreakdown: AretTopicBreakdown[];
  weakTopics: string[];
  recommendedBankIds: string[];
}

export interface AretAnalysisResponse {
  readinessBadge: string;
  aiNarrative: string;
  studyPlan: string[];
  source: 'gemini' | 'deterministic';
}

export interface SuSChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}
