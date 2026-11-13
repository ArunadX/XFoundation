import { useState } from 'react';
import { ArrowLeft, Award, Database, Newspaper, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { NEWS_ITEMS, RESULTS_RECORDS } from '../data/olympiadData';
import type {
  LeadInquiryRecord,
  NewsArticle,
  OrderRecord,
  PageRoute,
  RegistrationRecord,
} from '../types/olympiad';
import { findStudentResult } from '../utils/olympiadLogic';
import { fetchRecordsFromFirebase } from '../lib/firebase';
import { PageIntroHeader, SectionCardSweep } from '../components/MotionPrimitives';

interface NewsPageProps {
  registrations: RegistrationRecord[];
  orders: OrderRecord[];
  onNavigate: (page: PageRoute) => void;
}

interface LookupResponse {
  registrations: RegistrationRecord[];
  orders: OrderRecord[];
  inquiries: LeadInquiryRecord[];
}

function dedupeByKey<T>(items: T[], getKey: (item: T) => string): T[] {
  const seen = new Set<string>();
  const out: T[] = [];
  for (const item of items) {
    const k = getKey(item);
    if (!seen.has(k)) {
      seen.add(k);
      out.push(item);
    }
  }
  return out;
}

export function NewsPage({ registrations, orders, onNavigate }: NewsPageProps) {
  const [newsCategory, setNewsCategory] = useState('all');
  const [activeArticle, setActiveArticle] = useState<NewsArticle | null>(null);
  const [lookupQuery, setLookupQuery] = useState('XOF-2026-1042');

  const [recordEmail, setRecordEmail] = useState('');
  const [recordResults, setRecordResults] = useState<LookupResponse | null>(null);
  const [recordLoading, setRecordLoading] = useState(false);

  const categories = ['all', ...Array.from(new Set(NEWS_ITEMS.map((n) => n.category)))];
  const visibleNews =
    newsCategory === 'all'
      ? NEWS_ITEMS
      : NEWS_ITEMS.filter((item) => item.category === newsCategory);

  const matchedResult = findStudentResult(lookupQuery, RESULTS_RECORDS, registrations);

  const handleRecordLookup = async (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = recordEmail.trim().toLowerCase();
    if (!trimmed) return;

    setRecordLoading(true);
    try {
      const [apiOutcome, fbOutcome] = await Promise.allSettled([
        fetch(`/api/records?email=${encodeURIComponent(trimmed)}`).then((r) =>
          r.ok ? (r.json() as Promise<LookupResponse>) : null
        ),
        fetchRecordsFromFirebase(trimmed),
      ]);

      const apiData = apiOutcome.status === 'fulfilled' && apiOutcome.value ? apiOutcome.value : null;
      const fbData = fbOutcome.status === 'fulfilled' ? fbOutcome.value : null;

      const localRegs = registrations.filter(
        (r) =>
          r.email.toLowerCase() === trimmed ||
          r.registrationId.toLowerCase() === trimmed
      );
      const localOrders = orders.filter(
        (o) =>
          o.email.toLowerCase() === trimmed ||
          o.orderId.toLowerCase() === trimmed
      );

      setRecordResults({
        registrations: dedupeByKey(
          [...(apiData?.registrations ?? []), ...(fbData?.registrations ?? []), ...localRegs],
          (r) => r.registrationId
        ),
        orders: dedupeByKey(
          [...(apiData?.orders ?? []), ...(fbData?.orders ?? []), ...localOrders],
          (o) => o.orderId
        ),
        inquiries: dedupeByKey(
          [...(apiData?.inquiries ?? []), ...(fbData?.inquiries ?? [])],
          (i) => i.inquiryId
        ),
      });
    } finally {
      setRecordLoading(false);
    }
  };

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

        {/* Highlight Banner for Admit Cards & Sample Papers */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.28 }}
          className="mt-6 rounded-xl border border-[#00F0FF]/40 bg-[#0D1522] p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
        >
          <div>
            <p className="font-mono text-xs font-semibold text-[#00F0FF]">
              PRIORITY PORTAL NOTICE
            </p>
            <p className="mt-1 text-sm sm:text-base font-semibold text-white">
              Admit Cards will be announced soon and official Sample Papers will be shared soon.
            </p>
          </div>
          <button
            type="button"
            onClick={() => onNavigate('admit-card')}
            className="neon-cta self-start sm:self-auto rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap cursor-pointer"
          >
            Admit Card Countdown
          </button>
        </motion.div>

        <PageIntroHeader
          kicker="Foundation Dispatch"
          title="News & Official Announcements"
          subtitle="Examination schedules, upcoming Admit Card and Sample Paper circulars, ARET launch news, and bundle updates."
        />

        <div className="mt-8 grid grid-cols-1 lg:grid-cols-12 gap-10">
          {/* News & Official Circulars */}
          <div className="lg:col-span-7 space-y-6">
            <div className="flex flex-wrap items-center gap-1.5">
              {categories.map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setNewsCategory(cat)}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                    newsCategory === cat
                      ? 'bg-[#00F0FF] text-[#05080F] font-semibold'
                      : 'border border-white/10 bg-[#0D111A] text-slate-300 hover:text-white'
                  }`}
                >
                  {cat === 'all' ? 'All Updates' : cat}
                </button>
              ))}
            </div>

            <div className="space-y-4">
              {visibleNews.map((item, idx) => (
                <SectionCardSweep
                  key={item.id}
                  index={idx}
                  accent={item.category === 'Admit Card' ? 'lime' : 'cyan'}
                  className="rounded-xl border border-white/10 bg-[#0D111A] p-6 hover:border-[#00F0FF]/35 transition-colors"
                >
                  <div className="text-xs text-slate-400 flex items-center gap-2 tabular-nums">
                    <span className="text-[#00F0FF]">{item.category}</span>
                    <span aria-hidden="true">·</span>
                    <span>{item.publishedDate}</span>
                  </div>
                  <h2 className="mt-2 font-display text-lg font-semibold text-white">
                    {item.title}
                  </h2>
                  <p className="mt-2 text-sm leading-relaxed text-slate-300">{item.summary}</p>
                  <button
                    type="button"
                    onClick={() => setActiveArticle(item)}
                    className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-[#00F0FF] hover:underline cursor-pointer"
                  >
                    <Newspaper className="h-3.5 w-3.5" aria-hidden="true" />
                    <span>Read Full Notice</span>
                  </button>
                </SectionCardSweep>
              ))}
            </div>
          </div>

          {/* Results & Saved Submission / Order Lookup Sidebar */}
          <div className="lg:col-span-5 space-y-8">
            <div className="space-y-4">
              <div>
                <p className="text-xs font-medium tracking-wide text-[#00F0FF]">
                  Verification Portal
                </p>
                <h2 className="mt-2 font-display text-2xl font-bold tracking-tight text-white">
                  Results &amp; Rank Lookup
                </h2>
                <p className="mt-1 text-sm text-slate-300">
                  Verify past results or check the enrollment status of a newly issued Registration ID.
                </p>
              </div>

              <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6">
                <label htmlFor="news-result-lookup" className="block text-xs font-medium text-slate-300">
                  Roll Number or Candidate Name
                </label>
                <div className="relative mt-2">
                  <Search
                    className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
                    aria-hidden="true"
                  />
                  <input
                    id="news-result-lookup"
                    type="text"
                    value={lookupQuery}
                    onChange={(e) => setLookupQuery(e.target.value)}
                    placeholder="e.g. XOF-2026-1042"
                    className="w-full rounded-lg border border-white/15 bg-[#06080D] py-2.5 pl-9 pr-3 font-mono text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                  />
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
                  <span className="text-slate-400">Sample Roll IDs:</span>
                  {RESULTS_RECORDS.map((r) => (
                    <button
                      key={r.rollNumber}
                      type="button"
                      onClick={() => setLookupQuery(r.rollNumber)}
                      className="font-mono text-[#00F0FF] hover:underline cursor-pointer"
                    >
                      {r.rollNumber}
                    </button>
                  ))}
                </div>

                {matchedResult ? (
                  <div className="mt-6 border-t border-white/10 pt-5 space-y-4">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <p className="font-mono text-xs text-[#00F0FF]">
                          {matchedResult.rollNumber} · {matchedResult.olympiadCode}
                        </p>
                        <h3 className="mt-1 font-display text-lg font-bold text-white">
                          {matchedResult.studentName}
                        </h3>
                        <p className="text-xs text-slate-300">
                          {matchedResult.school} · {matchedResult.city} · {matchedResult.studentClass}
                        </p>
                      </div>
                      <span className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8FF00]">
                        <Award className="h-4 w-4" aria-hidden="true" />
                        <span>{matchedResult.award}</span>
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-3 border-t border-white/10 pt-4 text-xs tabular-nums">
                      <div>
                        <span className="block text-slate-400">Score</span>
                        <span className="font-mono text-base font-bold text-white">
                          {matchedResult.totalScore}/{matchedResult.maxScore}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Percentile</span>
                        <span className="font-mono text-base font-bold text-[#00F0FF]">
                          {matchedResult.percentile > 0 ? `${matchedResult.percentile}%` : 'Pending'}
                        </span>
                      </div>
                      <div>
                        <span className="block text-slate-400">Rank</span>
                        <span className="font-mono text-base font-bold text-[#B8FF00]">
                          {matchedResult.nationalRank > 0 ? `#${matchedResult.nationalRank}` : 'Pending'}
                        </span>
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="mt-6 border-t border-white/10 pt-5 text-xs text-slate-400">
                    No matching scorecard found for &ldquo;{lookupQuery}&rdquo;.
                  </p>
                )}
              </div>
            </div>

            {/* Persisted Registrations & Orders Record Lookup by Email */}
            <div className="rounded-xl border border-white/10 bg-[#0D111A] p-6">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#B8FF00]">
                <Database className="h-4 w-4" aria-hidden="true" />
                <span>Saved Registrations &amp; Order Details</span>
              </div>
              <p className="mt-1.5 text-xs text-slate-300">
                Enter your email or Reference ID to view stored Olympiad registrations, study pack items ordered, and inquiries.
              </p>

              <form onSubmit={(e) => void handleRecordLookup(e)} className="mt-3 flex gap-2">
                <label htmlFor="record-email-lookup" className="sr-only">
                  Email or Reference ID
                </label>
                <input
                  id="record-email-lookup"
                  type="text"
                  value={recordEmail}
                  onChange={(e) => setRecordEmail(e.target.value)}
                  placeholder="student@example.in or ORD-2026-..."
                  className="flex-1 rounded-lg border border-white/15 bg-[#06080D] px-3 py-2 text-xs text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
                />
                <button
                  type="submit"
                  disabled={recordLoading}
                  className="rounded-lg border border-[#00F0FF]/45 bg-[#00F0FF]/10 px-3.5 py-2 text-xs font-semibold text-[#00F0FF] hover:bg-[#00F0FF] hover:text-[#05080F] transition-colors cursor-pointer"
                >
                  {recordLoading ? 'Checking...' : 'Lookup'}
                </button>
              </form>

              {recordResults && (
                <div className="mt-4 border-t border-white/10 pt-4 space-y-4 text-xs">
                  {recordResults.registrations.length === 0 &&
                  recordResults.orders.length === 0 &&
                  recordResults.inquiries.length === 0 ? (
                    <p className="text-slate-400">
                      No stored registrations, orders, or inquiries found for &ldquo;{recordEmail}&rdquo;.
                    </p>
                  ) : (
                    <>
                      {recordResults.registrations.map((reg) => (
                        <div key={reg.registrationId} className="rounded-lg bg-[#080B12] border border-white/10 p-3.5 space-y-1">
                          <div className="flex justify-between font-mono text-[#00F0FF]">
                            <span>{reg.registrationId}</span>
                            <span>₹{reg.totalFeeInr}</span>
                          </div>
                          <p className="font-semibold text-white">
                            {reg.name} · Class {reg.studentClass} · {reg.city}
                          </p>
                          <p className="text-slate-300">{reg.olympiadNames.join(', ')}</p>
                        </div>
                      ))}

                      {recordResults.orders.map((ord) => (
                        <div key={ord.orderId} className="rounded-lg bg-[#080B12] border border-white/10 p-3.5 space-y-1.5">
                          <div className="flex justify-between font-mono text-[#B8FF00]">
                            <span>{ord.orderId}</span>
                            <span>₹{ord.pricing.finalTotalInr}</span>
                          </div>
                          <p className="font-semibold text-white">
                            {ord.name} · {ord.city} (Guardian: {ord.guardianName})
                          </p>
                          <ul className="space-y-0.5 text-slate-300">
                            {ord.items.map((it) => (
                              <li key={it.id}>
                                • {it.title} ({it.olympiadCode}) × {it.quantity}
                              </li>
                            ))}
                          </ul>
                        </div>
                      ))}

                      {recordResults.inquiries.map((inq) => (
                        <div key={inq.inquiryId} className="rounded-lg bg-[#080B12] border border-white/10 p-3.5 space-y-1">
                          <div className="flex justify-between font-mono text-[#00F0FF]">
                            <span>{inq.inquiryId}</span>
                            <span>{inq.createdAt}</span>
                          </div>
                          <p className="font-semibold text-white">{inq.interest}</p>
                          <p className="text-slate-300">{inq.notes}</p>
                        </div>
                      ))}
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {activeArticle && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            role="dialog"
            aria-modal="true"
            aria-labelledby="news-dialog-title"
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm"
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.94, y: 12 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: 8 }}
              transition={{ duration: 0.24, ease: [0.16, 1, 0.3, 1] }}
              className="w-full max-w-xl rounded-xl border border-[#00F0FF]/40 bg-[#0D111A] p-6 sm:p-8 shadow-2xl"
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 pb-4">
                <div>
                  <p className="text-xs text-[#00F0FF]">
                    {activeArticle.category} · {activeArticle.publishedDate}
                  </p>
                  <h2 id="news-dialog-title" className="mt-1 font-display text-xl font-bold text-white">
                    {activeArticle.title}
                  </h2>
                </div>
                <button
                  type="button"
                  aria-label="Close notice"
                  onClick={() => setActiveArticle(null)}
                  className="rounded-lg border border-white/15 p-2 text-slate-300 hover:border-[#00F0FF] hover:text-white cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
              <div className="mt-5 space-y-3 text-sm leading-relaxed text-slate-200">
                {activeArticle.body.map((p, idx) => (
                  <p key={idx}>{p}</p>
                ))}
              </div>
              <div className="mt-6 flex justify-end border-t border-white/10 pt-4">
                <button
                  type="button"
                  onClick={() => setActiveArticle(null)}
                  className="neon-cta rounded-lg px-4 py-2 text-xs font-semibold cursor-pointer"
                >
                  Close Notice
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  );
}
