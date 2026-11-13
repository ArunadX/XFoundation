import { getApp, getApps, initializeApp, type FirebaseApp } from 'firebase/app';
import { getAnalytics, isSupported, logEvent, type Analytics } from 'firebase/analytics';
import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocFromServer,
  getDocs,
  getFirestore,
  query,
  serverTimestamp,
  setDoc,
  where,
  type Firestore,
} from 'firebase/firestore';
import type {
  AretEvaluationResult,
  LeadInquiryRecord,
  OrderRecord,
  RegistrationRecord,
} from '../types/olympiad';
import {
  buildSubscriberDocumentPayload,
  type SubscriberSubmissionInput,
} from '../utils/olympiadLogic';

const firebaseConfig = {
  apiKey: 'AIzaSyB9aOm6bvzpIMPzvh-t5t_1oAWhPW6E1qk',
  authDomain: 'x-olympiad-foundation.firebaseapp.com',
  projectId: 'x-olympiad-foundation',
  storageBucket: 'x-olympiad-foundation.firebasestorage.app',
  messagingSenderId: '901175391717',
  appId: '1:901175391717:web:7774df23eb60bb218c6b0c',
  measurementId: 'G-MNGVRLK556',
};

let firebaseApp: FirebaseApp | null = null;
let firestoreDb: Firestore | null = null;
let analyticsPromise: Promise<Analytics | null> | null = null;

/**
 * Firestore rejects any document payload containing `undefined` values at any nesting depth.
 * Recursively strip undefined properties and normalize nested arrays cleanly.
 */
export function stripUndefinedDeep<T>(value: T): T {
  if (Array.isArray(value)) {
    return value
      .filter((item) => item !== undefined)
      .map((item) => stripUndefinedDeep(item)) as unknown as T;
  }
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      if (v !== undefined) {
        out[k] = stripUndefinedDeep(v);
      }
    }
    return out as T;
  }
  return value;
}

function formatFirebaseError(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  try {
    return JSON.stringify(error);
  } catch {
    return String(error);
  }
}

export function getFirebaseClient(): { app: FirebaseApp; db: Firestore } | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!firebaseApp) {
      firebaseApp = getApps().length > 0 ? getApp() : initializeApp(firebaseConfig);
    }
    if (!firestoreDb) {
      firestoreDb = getFirestore(firebaseApp);
    }
    if (!analyticsPromise) {
      analyticsPromise = isSupported()
        .then((supported) => (supported && firebaseApp ? getAnalytics(firebaseApp) : null))
        .catch((err) => {
          console.error(err);
          return null;
        });
    }
    return { app: firebaseApp, db: firestoreDb };
  } catch (error) {
    console.error(error);
    return null;
  }
}

export async function validateFirebaseConnection(): Promise<boolean> {
  const ctx = getFirebaseClient();
  return Boolean(ctx);
}

export async function trackFirebaseEvent(
  eventName: string,
  params?: Record<string, string | number>
): Promise<void> {
  getFirebaseClient();
  if (!analyticsPromise) return;
  try {
    const analytics = await analyticsPromise;
    if (analytics) {
      logEvent(analytics, eventName, params);
    }
  } catch (error) {
    console.error(error);
  }
}

/**
 * Primary real Firestore submission helper writing directly to collection(db, 'subscribers') via addDoc.
 * Re-throws exact Firebase SDK error after logging via console.error(error).
 */
export async function submitToSubscribers(
  input: SubscriberSubmissionInput
): Promise<string> {
  const ctx = getFirebaseClient();
  if (!ctx) {
    const err = new Error('Firebase Firestore client is unavailable in this environment.');
    console.error(err);
    throw err;
  }

  const normalizedPayload = stripUndefinedDeep(buildSubscriberDocumentPayload(input));
  try {
    const docRef = await addDoc(collection(ctx.db, 'subscribers'), {
      ...normalizedPayload,
      createdAt: serverTimestamp(),
    });
    return docRef.id;
  } catch (error) {
    console.error(error);
    throw error;
  }
}

export async function syncRegistrationToFirebase(
  record: RegistrationRecord
): Promise<{ synced: boolean; subscriberId?: string; error?: string }> {
  const ctx = getFirebaseClient();
  if (!ctx) {
    const err = new Error('Firebase client unavailable');
    console.error(err);
    return { synced: false, error: err.message };
  }

  void trackFirebaseEvent('olympiad_registration_submitted', {
    registration_id: record.registrationId,
    total_fee_inr: record.totalFeeInr,
    coupon_code: record.couponCode || 'none',
    olympiads_count: record.selectedOlympiadIds.length,
  });

  try {
    const subscriberId = await submitToSubscribers({
      type: 'registration',
      referenceId: record.registrationId,
      name: record.name,
      email: record.email,
      phone: record.phone,
      city: record.city,
      guardianName: record.guardianName,
      school: record.school,
      studentClass: record.studentClass,
      couponOrPromo: record.couponCode,
      totalInr: record.totalFeeInr,
      summary: `Class ${record.studentClass} · ${record.olympiadNames.join(', ')}`,
      itemsOrTracks: record.olympiadNames,
    });

    return { synced: true, subscriberId };
  } catch (error) {
    console.error(error);
    return {
      synced: false,
      error: formatFirebaseError(error),
    };
  }
}

export async function syncOrderToFirebase(
  order: OrderRecord
): Promise<{ synced: boolean; subscriberId?: string; error?: string }> {
  const ctx = getFirebaseClient();
  if (!ctx) {
    const err = new Error('Firebase client unavailable');
    console.error(err);
    return { synced: false, error: err.message };
  }

  void trackFirebaseEvent('study_pack_order_submitted', {
    order_id: order.orderId,
    final_total_inr: order.pricing.finalTotalInr,
    promo_code: order.promoCode || 'none',
    items_count: order.pricing.totalItems,
  });

  try {
    const subscriberId = await submitToSubscribers({
      type: 'order',
      referenceId: order.orderId,
      name: order.name,
      email: order.email,
      phone: order.phone,
      city: order.city,
      guardianName: order.guardianName,
      couponOrPromo: order.promoCode,
      totalInr: order.pricing.finalTotalInr,
      summary: order.items.map((it) => `${it.title} x ${it.quantity}`).join(', '),
      itemsOrTracks: order.items.map((it) => `${it.olympiadCode}: ${it.title} x ${it.quantity}`),
    });

    return { synced: true, subscriberId };
  } catch (error) {
    console.error(error);
    return {
      synced: false,
      error: formatFirebaseError(error),
    };
  }
}

export async function syncInquiryToFirebase(
  inquiry: LeadInquiryRecord
): Promise<{ synced: boolean; subscriberId?: string; error?: string }> {
  const ctx = getFirebaseClient();
  if (!ctx) {
    const err = new Error('Firebase client unavailable');
    console.error(err);
    return { synced: false, error: err.message };
  }

  void trackFirebaseEvent('aret_inquiry_submitted', {
    inquiry_id: inquiry.inquiryId,
    city: inquiry.city,
  });

  try {
    const subscriberId = await submitToSubscribers({
      type: 'aret-waitlist',
      referenceId: inquiry.inquiryId,
      name: inquiry.name,
      email: inquiry.email,
      city: inquiry.city,
      summary: `${inquiry.interest} — ${inquiry.notes}`,
      itemsOrTracks: [inquiry.interest],
    });

    return { synced: true, subscriberId };
  } catch (error) {
    console.error(error);
    return {
      synced: false,
      error: formatFirebaseError(error),
    };
  }
}

export async function syncAretSessionToFirebase(session: {
  sessionId: string;
  mode: 'preview' | 'full';
  email?: string;
  evaluation: AretEvaluationResult;
}): Promise<void> {
  const ctx = getFirebaseClient();
  if (!ctx) return;

  void trackFirebaseEvent('aret_diagnostic_completed', {
    mode: session.mode,
    net_score: session.evaluation.netScore,
    accuracy_pct: session.evaluation.accuracyPct,
  });

  try {
    const cleanPayload = stripUndefinedDeep({
      sessionId: session.sessionId,
      mode: session.mode,
      email: session.email || '',
      evaluation: session.evaluation,
    });
    await setDoc(doc(ctx.db, 'aret_sessions', session.sessionId), {
      ...cleanPayload,
      syncedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(error);
  }
}

export async function fetchRecordsFromFirebase(emailOrId: string): Promise<{
  registrations: RegistrationRecord[];
  orders: OrderRecord[];
  inquiries: LeadInquiryRecord[];
}> {
  const empty = { registrations: [], orders: [], inquiries: [] };
  const ctx = getFirebaseClient();
  const normalized = emailOrId.trim().toLowerCase();
  const rawUpper = emailOrId.trim().toUpperCase();
  if (!ctx || !normalized) return empty;

  try {
    const regs: RegistrationRecord[] = [];
    const ords: OrderRecord[] = [];
    const inqs: LeadInquiryRecord[] = [];

    const isRefId =
      rawUpper.startsWith('XOF-') ||
      rawUpper.startsWith('ORD-') ||
      rawUpper.startsWith('INQ-');

    const subscriberQuery = isRefId
      ? query(collection(ctx.db, 'subscribers'), where('referenceId', '==', rawUpper))
      : query(collection(ctx.db, 'subscribers'), where('emailLower', '==', normalized));

    const snap = await getDocs(subscriberQuery);
    snap.forEach((docSnap) => {
      const data = docSnap.data() as Record<string, unknown>;
      const recordType = String(data.type ?? '');
      const referenceId = String(data.referenceId ?? docSnap.id);
      if (recordType === 'registration') {
        regs.push({
          registrationId: referenceId,
          createdAt: 'Synced via Firebase',
          name: String(data.name ?? ''),
          email: String(data.email ?? ''),
          phone: String(data.phone ?? ''),
          guardianName: String(data.guardianName ?? ''),
          age: '',
          studentClass: String(data.studentClass ?? ''),
          school: String(data.school ?? ''),
          city: String(data.city ?? ''),
          selectedOlympiadIds: [],
          couponCode: String(data.couponOrPromo ?? ''),
          olympiadNames: Array.isArray(data.itemsOrTracks)
            ? (data.itemsOrTracks as string[])
            : [],
          rawFeeInr: Number(data.totalInr ?? 0),
          discountInr: 0,
          totalFeeInr: Number(data.totalInr ?? 0),
        });
      } else if (recordType === 'order') {
        const finalTotal = Number(data.totalInr ?? 0);
        ords.push({
          orderId: referenceId,
          createdAt: 'Synced via Firebase',
          name: String(data.name ?? ''),
          email: String(data.email ?? ''),
          phone: String(data.phone ?? ''),
          city: String(data.city ?? ''),
          guardianName: String(data.guardianName ?? ''),
          promoCode: String(data.couponOrPromo ?? ''),
          items: Array.isArray(data.itemsOrTracks)
            ? (data.itemsOrTracks as string[]).map((label, idx) => ({
                id: `${referenceId}-${idx}`,
                title: label,
                olympiadCode: label.split(':')[0] || 'XOF',
                category: 'question-bank',
                chapterOrYears: '',
                unitPriceInr: 0,
                quantity: 1,
              }))
            : [],
          pricing: {
            questionBankCount: 0,
            questionBankRawInr: finalTotal,
            questionBankNetInr: finalTotal,
            questionBankBundleSavingsInr: 0,
            pypBundleCount: 0,
            pypRawInr: 0,
            pypNetInr: 0,
            pypBundleSavingsInr: 0,
            subtotalAfterBundlesInr: finalTotal,
            promoRate: 0,
            promoDiscountInr: 0,
            promoValid: Boolean(data.couponOrPromo),
            finalTotalInr: finalTotal,
            totalItems: Array.isArray(data.itemsOrTracks)
              ? data.itemsOrTracks.length
              : 1,
          },
        });
      } else if (recordType === 'aret-waitlist') {
        inqs.push({
          inquiryId: referenceId,
          createdAt: 'Synced via Firebase',
          name: String(data.name ?? ''),
          email: String(data.email ?? ''),
          city: String(data.city ?? ''),
          interest: Array.isArray(data.itemsOrTracks)
            ? String(data.itemsOrTracks[0] ?? 'ARET September 2026')
            : 'ARET September 2026',
          notes: String(data.summary ?? ''),
        });
      }
    });

    return { registrations: regs, orders: ords, inquiries: inqs };
  } catch (error) {
    console.error(error);
    return empty;
  }
}
