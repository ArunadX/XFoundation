import { useState } from 'react';
import { ArrowLeft, BookMarked, Check, Lock, Plus, Search, ShoppingBag } from 'lucide-react';
import { motion } from 'motion/react';
import { SHOP_PRODUCTS } from '../data/olympiadData';
import type {
  CartItem,
  OlympiadId,
  PageRoute,
  ShopCategory,
  ShopProduct,
} from '../types/olympiad';
import { calculateCartPricing, getSuSShopAdvisorHint } from '../utils/olympiadLogic';
import { SuSOrb } from '../components/SuSOobeAssistant';
import { MetricCardIntro, PageIntroHeader } from '../components/MotionPrimitives';

interface ShopPageProps {
  cartItems: CartItem[];
  onAddToCart: (product: ShopProduct) => void;
  onNavigate: (page: PageRoute) => void;
}

function ProductCover({ product }: { product: ShopProduct }) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <div className="flex aspect-[4/3] w-full flex-col items-center justify-center gap-2 bg-gradient-to-br from-[#101827] to-[#06080D] p-6 text-center">
        <BookMarked className="h-8 w-8 text-[#00F0FF]" aria-hidden="true" />
        <span className="font-display text-sm font-semibold text-white">
          {product.olympiadCode}
        </span>
      </div>
    );
  }

  return (
    <img
      src={product.imageUrl}
      alt={product.title}
      referrerPolicy="no-referrer"
      onError={() => setFailed(true)}
      className={`aspect-[4/3] w-full object-cover ${!product.available ? 'opacity-45 grayscale' : ''}`}
    />
  );
}

export function ShopPage({ cartItems, onAddToCart, onNavigate }: ShopPageProps) {
  const [categoryFilter, setCategoryFilter] = useState<ShopCategory | 'all'>('all');
  const [olympiadFilter, setOlympiadFilter] = useState<OlympiadId | 'all'>('all');
  const [searchQuery, setSearchQuery] = useState('');

  const pricing = calculateCartPricing(cartItems, '');
  const susAdvisor = getSuSShopAdvisorHint(pricing);

  const visibleProducts = SHOP_PRODUCTS.filter((item) => {
    if (categoryFilter !== 'all' && item.category !== categoryFilter) {
      return false;
    }
    if (olympiadFilter !== 'all' && item.olympiadId !== olympiadFilter) {
      return false;
    }
    const q = searchQuery.trim().toLowerCase();
    if (q) {
      return (
        item.title.toLowerCase().includes(q) ||
        item.chapterOrYears.toLowerCase().includes(q) ||
        item.olympiadCode.toLowerCase().includes(q)
      );
    }
    return true;
  });

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
          kicker="Official Study Material Store (INR ₹)"
          title="Chapter Question Banks & 8-Year PYP Bundles"
          subtitle="Select chapter-wise question banks (without preview) or 8-year Previous Year Paper bundles. Bundle discounts apply automatically in your checkout bag."
          rightSlot={
            <button
              type="button"
              onClick={() => onNavigate('checkout')}
              className="neon-cta inline-flex items-center gap-2.5 rounded-lg px-5 py-3 text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer tabular-nums"
            >
              <ShoppingBag className="h-4 w-4" aria-hidden="true" />
              <span>
                Checkout ({pricing.totalItems}) · ₹{pricing.finalTotalInr}
              </span>
            </button>
          }
        />

        {/* Bundle Pricing Rules Banner */}
        <div className="mt-7 grid grid-cols-1 md:grid-cols-3 gap-4 text-xs tabular-nums">
          <MetricCardIntro index={0} accent="cyan">
            <p className="font-semibold text-[#00F0FF]">
              Chapter-Wise Question Bank Bundle Pricing
            </p>
            <p className="mt-1 text-slate-300">
              1 Question Bank = ₹100 · Bundle of 2 = ₹100 · Bundle of 10 = ₹500 (IXEO &amp; IXCO banks unavailable)
            </p>
          </MetricCardIntro>
          <MetricCardIntro index={1} accent="lime">
            <p className="font-semibold text-[#B8FF00]">
              Last 8 Years PYP Bundle Pricing
            </p>
            <p className="mt-1 text-slate-300">
              1 PYP Bundle = ₹499 · Bundle of 2 PYP Packs = ₹500
            </p>
          </MetricCardIntro>
          <MetricCardIntro index={2} accent="lime">
            <p className="font-semibold text-white">
              Free Material Coupon Code
            </p>
            <p className="mt-1 text-slate-300">
              Apply <span className="font-mono font-semibold text-[#B8FF00]">FREEMATERIAL</span> at Checkout to get all PYP Bundles &amp; Question Banks for ₹0.
            </p>
          </MetricCardIntro>
        </div>

        {/* Live Interactive SuS Study Pack Advisor */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`mt-5 rounded-xl border p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
            susAdvisor.tone === 'celebrate'
              ? 'border-[#B8FF00]/55 bg-[#B8FF00]/8'
              : susAdvisor.tone === 'hint'
                ? 'border-[#00F0FF]/55 bg-[#0C1424]'
                : 'border-white/10 bg-[#0D111A]'
          }`}
        >
          <div className="flex items-start sm:items-center gap-3.5">
            <SuSOrb
              mood={
                susAdvisor.tone === 'celebrate'
                  ? 'celebrate'
                  : susAdvisor.tone === 'hint'
                    ? 'tip'
                    : 'welcome'
              }
              size={44}
            />
            <div className="text-xs">
              <p className="font-mono font-semibold text-[#00F0FF]">
                SuS LIVE SHOP ASSISTANT
              </p>
              <p className="mt-0.5 text-sm font-bold text-white">
                {susAdvisor.headline}
              </p>
              <p className="mt-0.5 text-slate-300">{susAdvisor.subtext}</p>
            </div>
          </div>

          {pricing.totalItems > 0 && (
            <button
              type="button"
              onClick={() => onNavigate('checkout')}
              className="neon-cta self-start sm:self-auto rounded-lg px-4 py-2.5 text-xs font-semibold whitespace-nowrap shrink-0 cursor-pointer"
            >
              Start Guided Checkout →
            </button>
          )}
        </motion.div>

        {/* Filters */}
        <div className="mt-8 flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-white/10 pb-5">
          <div className="flex flex-wrap items-center gap-2">
            {(
              [
                { id: 'all', label: 'All Products' },
                { id: 'question-bank', label: 'Chapter Question Banks' },
                { id: 'pyp-bundle', label: 'Last 8 Years PYP Bundles' },
              ] as const
            ).map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setCategoryFilter(tab.id)}
                className={`rounded-md px-3.5 py-1.5 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                  categoryFilter === tab.id
                    ? 'bg-[#00F0FF] text-[#05080F]'
                    : 'border border-white/10 bg-[#0D111A] text-slate-300 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            ))}

            <label htmlFor="shop-olympiad-filter" className="sr-only">
              Filter by Olympiad
            </label>
            <select
              id="shop-olympiad-filter"
              value={olympiadFilter}
              onChange={(e) => setOlympiadFilter(e.target.value as OlympiadId | 'all')}
              className="rounded-md border border-white/15 bg-[#0D111A] px-3 py-1.5 text-xs font-medium text-slate-200 focus:border-[#00F0FF]"
            >
              <option value="all">All Olympiads</option>
              <option value="ixmo">IXMO (Math)</option>
              <option value="ixso">IXSO (Science)</option>
              <option value="ixeo">IXEO (English)</option>
              <option value="ixco">IXCO (Cyber)</option>
              <option value="ixcompeto">IXCompetO (Grades 10–12)</option>
            </select>
          </div>

          <div className="relative w-full lg:w-72">
            <label htmlFor="shop-search" className="sr-only">
              Search question banks and PYP bundles
            </label>
            <Search
              className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400"
              aria-hidden="true"
            />
            <input
              id="shop-search"
              type="search"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search chapter or Olympiad..."
              className="w-full rounded-lg border border-white/15 bg-[#0D111A] py-2 pl-9 pr-3 text-sm text-white placeholder:text-slate-500 focus:border-[#00F0FF]"
            />
          </div>
        </div>

        {/* Product Grid */}
        <div className="mt-8 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleProducts.map((product, idx) => {
            const inCart = cartItems.find((c) => c.product.id === product.id);
            return (
              <motion.article
                key={product.id}
                initial={{ opacity: 0, y: 14 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.08 }}
                transition={{
                  duration: 0.3,
                  delay: Math.min(idx * 0.03, 0.18),
                  ease: [0.16, 1, 0.3, 1],
                }}
                whileHover={{ y: -4 }}
                className="flex flex-col overflow-hidden rounded-xl border border-white/10 bg-[#0D111A] transition-colors duration-200 hover:border-[#00F0FF]/45"
              >
                <div className="bg-[#121723]">
                  <ProductCover product={product} />
                </div>

                <div className="flex flex-1 flex-col justify-between p-6">
                  <div>
                    <div className="text-xs text-slate-400 flex items-center gap-2">
                      <span className="font-mono font-semibold text-[#00F0FF]">
                        {product.olympiadCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>
                        {product.category === 'question-bank'
                          ? 'Chapter Question Bank'
                          : '8-Year PYP Bundle'}
                      </span>
                    </div>

                    <h2 className="mt-2 font-display text-lg font-semibold text-white">
                      {product.title}
                    </h2>
                    <p className="mt-1 text-xs text-slate-400">{product.chapterOrYears}</p>
                  </div>

                  <div className="mt-6 flex items-center justify-between gap-4 border-t border-white/10 pt-4">
                    <div>
                      <span className="block text-[11px] text-slate-400">
                        {product.category === 'question-bank'
                          ? 'Bundle: 2 for ₹100 · 10 for ₹500'
                          : 'Bundle: 2 for ₹500'}
                      </span>
                      <span className="font-mono text-lg font-bold text-white tabular-nums">
                        {product.available ? `₹${product.unitPriceInr}` : 'Unavailable'}
                      </span>
                    </div>

                    {!product.available ? (
                      <button
                        type="button"
                        disabled
                        className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-[#121723] px-3.5 py-2 text-xs font-medium text-slate-500 cursor-not-allowed whitespace-nowrap shrink-0"
                      >
                        <Lock className="h-3.5 w-3.5" aria-hidden="true" />
                        <span>Not Available</span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => onAddToCart(product)}
                        className={`inline-flex items-center gap-1.5 rounded-lg px-4 py-2 text-xs font-semibold whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                          inCart
                            ? 'border border-[#B8FF00]/60 bg-[#B8FF00]/15 text-[#B8FF00] hover:bg-[#B8FF00] hover:text-[#05080F]'
                            : 'neon-cta'
                        }`}
                      >
                        {inCart ? (
                          <>
                            <Check className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>In Bag ({inCart.quantity})</span>
                          </>
                        ) : (
                          <>
                            <Plus className="h-3.5 w-3.5" aria-hidden="true" />
                            <span>Add to Bag</span>
                          </>
                        )}
                      </button>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </div>
      </div>
    </section>
  );
}
