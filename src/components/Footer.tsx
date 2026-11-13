import type { PageRoute } from '../types/olympiad';
import { FOUNDATION_INFO } from '../data/olympiadData';

interface FooterProps {
  onNavigate: (page: PageRoute) => void;
}

const FOOTER_LINKS: Array<{ page: PageRoute; label: string }> = [
  { page: 'home', label: 'Home' },
  { page: 'search', label: 'Search' },
  { page: 'registration', label: 'Registration' },
  { page: 'syllabus', label: 'Syllabus' },
  { page: 'structure', label: 'Structure' },
  { page: 'dates', label: 'Dates' },
  { page: 'shop', label: 'Shop' },
  { page: 'admit-card', label: 'Admit Card' },
  { page: 'news', label: 'News' },
  { page: 'sus', label: 'SuS Help-Service' },
  { page: 'aret', label: 'ARET Preview' },
  { page: 'aret-full', label: 'ARET Full Suite' },
];

export function Footer({ onNavigate }: FooterProps) {
  return (
    <footer className="border-t border-white/10 bg-[#05070B] py-12">
      <div className="mx-auto max-w-7xl px-6 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
        <div>
          <p className="font-display text-base font-bold text-white">
            {FOUNDATION_INFO.name}
          </p>
          <p className="mt-1 text-xs text-slate-400">
            Founded {FOUNDATION_INFO.foundedYear} · {FOUNDATION_INFO.headquarters} · {FOUNDATION_INFO.email}
          </p>
        </div>

        <nav aria-label="Footer navigation" className="flex flex-wrap items-center gap-5 text-xs text-slate-300">
          {FOOTER_LINKS.map((item) => (
            <a
              key={item.page}
              href={`#/${item.page}`}
              onClick={(e) => {
                e.preventDefault();
                onNavigate(item.page);
              }}
              className="hover:text-[#00F0FF] transition-colors whitespace-nowrap"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  );
}
