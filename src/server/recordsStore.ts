import { mkdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import type {
  AretEvaluationResult,
  LeadInquiryRecord,
  OrderRecord,
  RegistrationRecord,
} from '../types/olympiad';

export interface AretStoredSession {
  sessionId: string;
  createdAt: string;
  email: string;
  evaluation: AretEvaluationResult;
  customTopic: string;
  customDifficulty: string;
  customStyle: string;
}

export interface FoundationDatabase {
  registrations: RegistrationRecord[];
  orders: OrderRecord[];
  inquiries: LeadInquiryRecord[];
  aretSessions: AretStoredSession[];
}

const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'xof-records.json');

const EMPTY_DB: FoundationDatabase = {
  registrations: [],
  orders: [],
  inquiries: [],
  aretSessions: [],
};

let writeQueue: Promise<void> = Promise.resolve();

async function ensureDbFile(): Promise<FoundationDatabase> {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    const raw = await readFile(DB_FILE, 'utf8');
    const parsed = JSON.parse(raw) as Partial<FoundationDatabase>;
    return {
      registrations: Array.isArray(parsed.registrations) ? parsed.registrations : [],
      orders: Array.isArray(parsed.orders) ? parsed.orders : [],
      inquiries: Array.isArray(parsed.inquiries) ? parsed.inquiries : [],
      aretSessions: Array.isArray(parsed.aretSessions) ? parsed.aretSessions : [],
    };
  } catch {
    await writeFile(DB_FILE, JSON.stringify(EMPTY_DB, null, 2), 'utf8');
    return { ...EMPTY_DB };
  }
}

async function mutateDb<T>(updater: (db: FoundationDatabase) => T): Promise<T> {
  let result!: T;
  const run = async () => {
    const db = await ensureDbFile();
    result = updater(db);
    await writeFile(DB_FILE, JSON.stringify(db, null, 2), 'utf8');
  };
  writeQueue = writeQueue.then(run, run);
  await writeQueue;
  return result;
}

export async function getRecordsSummary(): Promise<{
  registrationCount: number;
  orderCount: number;
  inquiryCount: number;
  aretSessionCount: number;
}> {
  const db = await ensureDbFile();
  return {
    registrationCount: db.registrations.length,
    orderCount: db.orders.length,
    inquiryCount: db.inquiries.length,
    aretSessionCount: db.aretSessions.length,
  };
}

export async function findRecordsByEmail(emailQuery: string): Promise<{
  registrations: RegistrationRecord[];
  orders: OrderRecord[];
  inquiries: LeadInquiryRecord[];
}> {
  const normalized = emailQuery.trim().toLowerCase();
  if (!normalized) {
    return { registrations: [], orders: [], inquiries: [] };
  }
  const db = await ensureDbFile();
  return {
    registrations: db.registrations.filter(
      (r) =>
        r.email.toLowerCase() === normalized ||
        r.registrationId.toLowerCase() === normalized
    ),
    orders: db.orders.filter(
      (o) =>
        o.email.toLowerCase() === normalized ||
        o.orderId.toLowerCase() === normalized
    ),
    inquiries: db.inquiries.filter(
      (i) =>
        i.email.toLowerCase() === normalized ||
        i.inquiryId.toLowerCase() === normalized
    ),
  };
}

export async function saveRegistration(
  record: RegistrationRecord
): Promise<RegistrationRecord> {
  return mutateDb((db) => {
    db.registrations.unshift(record);
    return record;
  });
}

export async function saveOrder(order: OrderRecord): Promise<OrderRecord> {
  return mutateDb((db) => {
    db.orders.unshift(order);
    return order;
  });
}

export async function saveInquiry(
  inquiry: LeadInquiryRecord
): Promise<LeadInquiryRecord> {
  return mutateDb((db) => {
    db.inquiries.unshift(inquiry);
    return inquiry;
  });
}

export async function saveAretSession(
  session: AretStoredSession
): Promise<AretStoredSession> {
  return mutateDb((db) => {
    db.aretSessions.unshift(session);
    return session;
  });
}
