import { useMemo, useState } from 'react';
import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Calendar,
  Cpu,
  Newspaper,
  Search,
  ShoppingBag,
  Tag,
} from 'lucide-react';
import { motion } from 'motion/react';
import {
  ARET_LAUNCH_INFO,
  HOME_PREVIEW_QUESTIONS,
  NEWS_ITEMS,
  OLYMPIADS,
  RESULTS_RECORDS,
  SHOP_PRODUCTS,
} from '../data/olympiadData';
import { PageIntroHeader } from '../components/MotionPrimitives';
import type { OlympiadId, PageRoute } from '../types/olympiad';

interface SearchPageProps {
  onNavigate: (page: PageRoute) => void;
  onSelectOlympiadForRegistration: (id: OlympiadId) => void;
}

type SearchCategory =
  | 'all'
  | 'olympiads'
  | 'syllabus'
  | 'shop'
  | 'dates'
  | 'aret'
  | 'news';

interface SearchResultItem {
  id: string;
  category: Exclude<SearchCategory, 'all'>;
  tag: string;
  title: string;
  subtitle: string;
  meta: string;
  targetPage: PageRoute;
  olympiadId?: OlympiadId;
}

const CATEGORY_TABS: Array<{ id: SearchCategory; label: string }> = [
  { id: 'all', label: 'All Results' },
  { id: 'olympiads', label: 'Olympiads' },
  { id: 'syllabus', label: 'Syllabus Chapters' },
  { id: 'shop', label: 'Banks & 8-Yr PYPs' },
  { id: 'dates', label: 'Dates & Structure' },
  { id: 'aret', label: 'ARET & SuS' },
  { id: 'news', label: 'News & Results' },
];

const QUICK_SEARCHES = [
  'IXMO',
  'Polynomials',
  'PYP',
  'ARET',
  'Admit Card',
  'FREEXOLYMPIAD',
  'FREEMATERIAL',
];

export function SearchPage({
  onNavigate,
  onSelectOlympiadForRegistration,
}: SearchPageProps) {
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<SearchCategory>('all');

  const catalog = useMemo<SearchResultItem[]>(() => {
    const items: SearchResultItem[] = [];

    // 1. Olympiads & Schedules
    for (const exam of OLYMPIADS) {
      items.push({
        id: `exam-${exam.id}`,
        category: 'olympiads',
        tag: exam.code,
        title: exam.name,
        subtitle: `${exam.eligibility} · ${exam.syllabusSummary}`,
        meta: `Exam: ${exam.examDateLabel} · Fee ₹${exam.feeInr} (FREEXOLYMPIAD = ₹0)`,
        targetPage: 'registration',
        olympiadId: exam.id,
      });

      items.push({
        id: `date-${exam.id}`,
        category: 'dates',
        tag: `${exam.code} Schedule`,
        title: `${exam.code} Exam & Registration Deadline`,
        subtitle: `${exam.totalQuestions} Qs · ${exam.totalMarks} Marks · ${exam.durationLabel} · ${exam.negativeMarkingSummary}`,
        meta: `Closes ${exam.registrationClosingLabel} · Exam ${exam.examDateLabel}`,
        targetPage: 'dates',
      });

      for (const group of exam.syllabusChapters) {
        for (const topic of group.topics) {
          items.push({
            id: `syl-${exam.id}-${topic}`,
            category: 'syllabus',
            tag: `${exam.code} Syllabus`,
            title: topic,
            subtitle: `${exam.name} — ${group.group} chapter module`,
            meta: 'Chapter-wise Olympiad syllabus track',
            targetPage: 'syllabus',
          });
        }
      }
    }

    // 2. Shop Products (Chapter Question Banks & 8-Year PYPs)
    for (const prod of SHOP_PRODUCTS) {
      items.push({
        id: `shop-${prod.id}`,
        category: 'shop',
        tag: prod.category === 'pyp-bundle' ? '8-Yr PYP' : 'Question Bank',
        title: prod.title,
        subtitle: `${prod.olympiadCode} · ${prod.chapterOrYears}`,
        meta: prod.available
          ? `₹${prod.unitPriceInr} (Use FREEMATERIAL at Checkout for ₹0)`
          : prod.unavailableReason ?? 'Unavailable',
        targetPage: 'shop',
      });
    }

    // 3. ARET & SuS Diagnostics + Coupon Codes
    items.push(
      {
        id: 'aret-preview-entry',
        category: 'aret',
        tag: 'ARET Preview',
        title: 'ARET Preview — IXMO PYP Diagnostic (1 Free Try)',
        subtitle: ARET_LAUNCH_INFO.tagline,
        meta: 'Sept 2026 Launch · Starting ₹1,299 · Enter Access Code ARETCODESAMPLE for Full Suite',
        targetPage: 'aret',
      },
      {
        id: 'aret-full-entry',
        category: 'aret',
        tag: 'ARET Full Suite',
        title: 'Full-Fledged ARET Suite (Multi-Page · 20–30 Questions/Response)',
        subtitle:
          'Unlock with access code ARETCODESAMPLE for Multi-Year IXMO PYP Simulators, 20–30 Q SuS Studio, and Mistake Vault Analytics.',
        meta: 'Access Code: ARETCODESAMPLE',
        targetPage: 'aret-full',
      },
      {
        id: 'sus-help-entry',
        category: 'aret',
        tag: 'SuS Help-Service',
        title: 'SuS — Systematic User Help-Service',
        subtitle:
          'Ask live questions about Olympiad dates, syllabus chapters, bundle pricing, coupons FREEXOLYMPIAD / FREEMATERIAL, and ARET.',
        meta: '24/7 Portal Query Assistant',
        targetPage: 'sus',
      },
      {
        id: 'coupon-reg-free',
        category: 'olympiads',
        tag: 'Coupon Code',
        title: 'FREEXOLYMPIAD — Free Olympiad Registration Coupon',
        subtitle:
          'Enter FREEXOLYMPIAD on the Olympiad Registration form to waive 100% of enrollment fees across all selected tracks.',
        meta: 'Applies to Registration Form · Total ₹0',
        targetPage: 'registration',
      },
      {
        id: 'coupon-mat-free',
        category: 'shop',
        tag: 'Promo Code',
        title: 'FREEMATERIAL — Free PYP Bundles & Question Banks Code',
        subtitle:
          'Enter FREEMATERIAL at Checkout to make all 8-Year PYP bundles and Chapter-Wise Question Banks ₹0.',
        meta: 'Applies at Shop Checkout · Total ₹0',
        targetPage: 'checkout',
      }
    );

    for (const prev of HOME_PREVIEW_QUESTIONS) {
      items.push({
        id: `sample-${prev.id}`,
        category: 'aret',
        tag: `${prev.olympiadCode} Sample`,
        title: `${prev.olympiadCode} ${prev.sourceType}`,
        subtitle: prev.prompt,
        meta: prev.olympiadName,
        targetPage: 'home',
      });
    }

    // 4. News & Top Results
    for (const article of NEWS_ITEMS) {
      items.push({
        id: `news-${article.id}`,
        category: 'news',
        tag: article.category,
        title: article.title,
        subtitle: article.summary,
        meta: article.publishedDate,
        targetPage: article.category === 'Admit Card' ? 'admit-card' : 'news',
      });
    }

    for (const res of RESULTS_RECORDS) {
      items.push({
        id: `res-${res.rollNumber}`,
        category: 'news',
        tag: 'Verified Result',
        title: `${res.studentName} (${res.rollNumber})`,
        subtitle: `${res.olympiadCode} · ${res.studentClass} · ${res.school}, ${res.city}`,
        meta: `Score ${res.totalScore}/${res.maxScore} · Rank #${res.nationalRank} (${res.award})`,
        targetPage: 'news',
      });
    }

    return items;
  }, []);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return catalog.filter((item) => {
      if (category !== 'all' && item.category !== category) return false;
      if (!q) return true;
      return (
        item.title.toLowerCase().includes(q) ||
        item.subtitle.toLowerCase().includes(q) ||
        item.tag.toLowerCase().includes(q) ||
        item.meta.toLowerCase().includes(q)
      );
    });
  }, [catalog, category, query]);

  const getIcon = (cat: SearchResultItem['category']) => {
    switch (cat) {
      case 'olympiads':
        return Tag;
      case 'syllabus':
        return BookOpen;
      case 'shop':
        return ShoppingBag;
      case 'dates':
        return Calendar;
      case 'aret':
        return Cpu;
      case 'news':
        return Newspaper;
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

        <PageIntroHeader
          kicker="Portal Index & Instant Lookup"
          title="Search X Olympiad Foundation"
          subtitle="Find Olympiads, syllabus chapters, Question Banks, 8-Year PYP bundles, exam schedules, ARET modules, coupon codes, and official circulars in one place."
        />

        {/* Search Input + Quick Chips */}
        <div className="mt-8 rounded-2xl border border-white/10 bg-[#0D111A] p-5 sm:p-6">
          <div className="relative">
            <label htmlFor="portal-search-input" className="sr-only">
              Search Olympiads, syllabus, Question Banks, PYPs, dates, news, and ARET
            </label>
            <Search
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#00F0FF]"
              aria-hidden="true"
            />
            <input
              id="portal-search-input"
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search IXMO, Polynomials, 8-Year PYP, ARETCODESAMPLE, FREEXOLYMPIAD, FREEMATERIAL..."
              className="w-full rounded-xl border border-white/15 bg-[#06080D] py-3.5 pl-12 pr-4 text-sm sm:text-base text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
            />
          </div>

          <div className="mt-4 flex flex-wrap items-center gap-2">
            <span className="text-[11px] font-mono text-slate-400">Quick Filters:</span>
            {QUICK_SEARCHES.map((chip) => (
              <button
                key={chip}
                type="button"
                onClick={() => setQuery(chip)}
                className="rounded-md border border-white/10 bg-[#121723] px-2.5 py-1 text-[11px] font-mono text-slate-200 hover:border-[#00F0FF] hover:text-[#00F0FF] transition-colors cursor-pointer"
              >
                {chip}
              </button>
            ))}
            {query && (
              <button
                type="button"
                onClick={() => setQuery('')}
                className="ml-auto text-xs font-medium text-slate-400 hover:text-white cursor-pointer"
              >
                Clear Query
              </button>
            )}
          </div>

          {/* Category Filter Tabs */}
          <div className="mt-5 flex flex-wrap items-center gap-2 border-t border-white/10 pt-4">
            {CATEGORY_TABS.map((tab) => {
              const active = category === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setCategory(tab.id)}
                  className={`relative rounded-lg px-3.5 py-1.5 text-xs font-semibold transition-colors whitespace-nowrap cursor-pointer ${
                    active
                      ? 'text-[#05080F]'
                      : 'border border-white/10 bg-[#080B12] text-slate-300 hover:text-white'
                  }`}
                >
                  {active && (
                    <motion.span
                      layoutId="search-tab-pill"
                      transition={{ type: 'spring', stiffness: 420, damping: 34 }}
                      className="absolute inset-0 rounded-lg bg-[#00F0FF]"
                    />
                  )}
                  <span className="relative z-10">{tab.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Results Count */}
        <div className="mt-6 flex items-center justify-between text-xs text-slate-400">
          <span className="tabular-nums">
            Showing <strong className="text-white">{filtered.length}</strong> result(s)
            {query.trim() ? ` for "${query.trim()}"` : ''}
          </span>
        </div>

        {/* Results Grid */}
        {filtered.length === 0 ? (
          <div className="mt-4 rounded-xl border border-white/10 bg-[#0D111A] p-10 text-center">
            <p className="text-base font-semibold text-white">No matching entries found.</p>
            <p className="mt-1 text-xs text-slate-400">
              Try searching for IXMO, IXSO, Geometry, PYP, ARET, or Ask SuS directly.
            </p>
            <button
              type="button"
              onClick={() => onNavigate('sus')}
              className="neon-cta mt-4 rounded-lg px-5 py-2 text-xs font-semibold cursor-pointer"
            >
              Ask SuS Help-Service
            </button>
          </div>
        ) : (
          <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((item, idx) => {
              const Icon = getIcon(item.category);
              return (
                <motion.article
                  key={item.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.24, delay: Math.min(idx * 0.02, 0.16) }}
                  whileHover={{ y: -2 }}
                  className="flex flex-col justify-between rounded-xl border border-white/10 bg-[#0D111A] p-5 hover:border-[#00F0FF]/45 transition-colors"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono text-[11px] font-semibold text-[#00F0FF]">
                        {item.tag}
                      </span>
                      <Icon className="h-4 w-4 text-slate-400" aria-hidden="true" />
                    </div>
                    <h2 className="mt-2.5 font-display text-base font-semibold text-white">
                      {item.title}
                    </h2>
                    <p className="mt-1.5 text-xs leading-relaxed text-slate-300">
                      {item.subtitle}
                    </p>
                  </div>

                  <div className="mt-4 border-t border-white/10 pt-3 flex items-center justify-between gap-3">
                    <span className="text-[11px] text-slate-400 tabular-nums line-clamp-1">
                      {item.meta}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        if (item.olympiadId) {
                          onSelectOlympiadForRegistration(item.olympiadId);
                        } else {
                          onNavigate(item.targetPage);
                        }
                      }}
                      className="inline-flex items-center gap-1 text-xs font-semibold text-[#B8FF00] hover:underline whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <span>Open</span>
                      <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" />
                    </button>
                  </div>
                </motion.article>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
