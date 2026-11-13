import { useState } from 'react';
import { Menu, X } from 'lucide-react';
import type { PageRoute } from '../types/olympiad';

interface NavbarProps {
  currentPage: PageRoute;
  cartItemCount: number;
  onNavigate: (page: PageRoute) => void;
}

const TOP_NAV_LINKS: Array<{ page: PageRoute; label: string }> = [
  { page: 'dates', label: 'Dates' },
  { page: 'syllabus', label: 'Syllabus' },
  { page: 'shop', label: 'Shop' },
  { page: 'sus', label: 'SuS' },
  { page: 'aret', label: 'ARET' },
  { page: 'search', label: 'Search' },
];

const MOBILE_ALL_LINKS: Array<{ page: PageRoute; label: string }> = [
  { page: 'home', label: 'Home' },
  { page: 'search', label: 'Search Portal' },
  { page: 'registration', label: 'Registration' },
  { page: 'dates', label: 'Dates' },
  { page: 'syllabus', label: 'Syllabus' },
  { page: 'structure', label: 'Structure' },
  { page: 'shop', label: 'Shop' },
  { page: 'admit-card', label: 'Admit Card' },
  { page: 'news', label: 'News & Results' },
  { page: 'sus', label: 'SuS Help-Service' },
  { page: 'aret', label: 'ARET Preview' },
  { page: 'aret-full', label: 'Full ARET Suite' },
  { page: 'checkout', label: 'Checkout' },
];

export function Navbar({ currentPage, cartItemCount, onNavigate }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleLinkClick = (page: PageRoute) => {
    setMobileOpen(false);
    onNavigate(page);
  };

  return (
    <header className="sticky top-0 z-40 border-b border-white/10 bg-[#06080D]/95">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 lg:gap-6 px-4 sm:px-6 py-3.5 sm:py-4">
        {/* Zone 1: Single-line Brand Wordmark */}
        <a
          href="#/"
          onClick={(e) => {
            e.preventDefault();
            handleLinkClick('home');
          }}
          className="font-display text-base sm:text-lg font-bold tracking-tight text-white whitespace-nowrap shrink-0 hover:text-[#00F0FF] transition-colors"
        >
          X Olympiad Foundation
        </a>

        {/* Zone 2: 6 concise single-line nav links including Search */}
        <nav aria-label="Primary" className="hidden lg:flex items-center gap-5 xl:gap-7">
          {TOP_NAV_LINKS.map((item) => {
            const active =
              currentPage === item.page ||
              (item.page === 'aret' && currentPage === 'aret-full');
            return (
              <a
                key={item.page}
                href={`#/${item.page}`}
                onClick={(e) => {
                  e.preventDefault();
                  handleLinkClick(item.page);
                }}
                aria-current={active ? 'page' : undefined}
                className={`text-sm font-medium transition-colors whitespace-nowrap shrink-0 py-1 border-b ${
                  active
                    ? 'text-[#00F0FF] border-[#00F0FF]'
                    : 'text-slate-300 border-transparent hover:text-[#00F0FF] hover:border-[#00F0FF]/50'
                }`}
              >
                {item.label}
                {item.page === 'shop' && cartItemCount > 0 ? ` (${cartItemCount})` : ''}
              </a>
            );
          })}
        </nav>

        {/* Zone 3: 1 Primary Action + Mobile toggle */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <button
            type="button"
            onClick={() => handleLinkClick('registration')}
            className="neon-cta rounded-lg px-3 py-1.5 sm:px-4 sm:py-2 text-xs sm:text-sm font-semibold whitespace-nowrap shrink-0 cursor-pointer"
          >
            <span className="sm:hidden">Register</span>
            <span className="hidden sm:inline">Register Now</span>
          </button>

          <button
            type="button"
            aria-label={mobileOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={mobileOpen}
            onClick={() => setMobileOpen((prev) => !prev)}
            className="lg:hidden inline-flex items-center justify-center rounded-lg border border-white/15 bg-[#0D111A] p-2 text-slate-200 hover:border-[#00F0FF]/50 hover:text-[#00F0FF] transition-colors cursor-pointer"
          >
            {mobileOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <nav
          aria-label="Mobile navigation"
          className="lg:hidden border-t border-white/10 bg-[#0A0E17] px-6 py-4"
        >
          <div className="grid grid-cols-2 gap-2">
            {MOBILE_ALL_LINKS.map((item) => {
              const active = currentPage === item.page;
              return (
                <a
                  key={item.page}
                  href={`#/${item.page}`}
                  onClick={(e) => {
                    e.preventDefault();
                    handleLinkClick(item.page);
                  }}
                  className={`rounded-md px-3 py-2 text-sm font-medium transition-colors ${
                    active
                      ? 'bg-[#00F0FF]/15 text-[#00F0FF]'
                      : 'text-slate-200 hover:text-[#00F0FF]'
                  }`}
                >
                  {item.label}
                  {item.page === 'shop' && cartItemCount > 0 ? ` (${cartItemCount})` : ''}
                </a>
              );
            })}
          </div>
        </nav>
      )}
    </header>
  );
}
