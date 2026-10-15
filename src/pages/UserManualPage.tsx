import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom';
import { BookOpen, ChevronLeft, ChevronRight, Menu, Printer, Search, X } from 'lucide-react';
import { usePlatformAuth } from '../context/PlatformAuthContext';
import { manualChapters } from '../content/manual';
import { MarkdownRenderer } from '../components/docs/MarkdownRenderer';
import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

const cn = (...a: Parameters<typeof clsx>) => twMerge(clsx(a));

const BASE = '/documentation/user-manual';

export const UserManualPage: React.FC = () => {
  const { user } = usePlatformAuth();
  const { chapter } = useParams<{ chapter?: string }>();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [navOpen, setNavOpen] = useState(false);
  const [outline, setOutline] = useState<{ id: string; text: string; level: number }[]>([]);
  const contentRef = useRef<HTMLDivElement>(null);

  const index = manualChapters.findIndex((c) => c.slug === chapter);
  const current = index >= 0 ? manualChapters[index] : undefined;

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return manualChapters;
    return manualChapters.filter((c) => c.title.toLowerCase().includes(q) || c.content.toLowerCase().includes(q));
  }, [query]);

  const groups = useMemo(() => {
    const map = new Map<string, typeof manualChapters>();
    filtered.forEach((c) => map.set(c.group, [...(map.get(c.group) || []), c]));
    return Array.from(map.entries());
  }, [filtered]);

  useEffect(() => {
    window.scrollTo({ top: 0 });
    setNavOpen(false);
    const el = contentRef.current;
    if (!el) return;
    setOutline(
      Array.from(el.querySelectorAll('h2[id], h3[id]')).map((h) => ({
        id: h.id,
        text: h.textContent || '',
        level: h.tagName === 'H2' ? 2 : 3,
      }))
    );
  }, [chapter]);

  if (!current) return <Navigate to={`${BASE}/${manualChapters[0].slug}`} replace />;

  const prev = manualChapters[index - 1];
  const next = manualChapters[index + 1];

  const sidebar = (
    <nav className="space-y-5">
      <div className="relative">
        <Search className="absolute left-3 top-2.5 h-4 w-4 text-slate-500" />
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search the manual..."
          className="w-full rounded-xl border border-slate-800 bg-slate-900 py-2 pl-9 pr-3 text-sm focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-100"
        />
      </div>
      {groups.length === 0 && <p className="px-1 text-sm text-slate-400">No chapters match "{query}".</p>}
      {groups.map(([group, items]) => (
        <div key={group}>
          <p className="mb-1.5 px-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">{group}</p>
          <ul className="space-y-0.5">
            {items.map((c) => (
              <li key={c.slug}>
                <Link
                  to={`${BASE}/${c.slug}`}
                  className={cn(
                    'block rounded-lg px-2.5 py-1.5 text-[13px] leading-snug transition-colors',
                    c.slug === current.slug ? 'bg-indigo-600/20 border border-indigo-500/30 font-semibold text-indigo-200' : 'text-slate-300 hover:bg-slate-800'
                  )}
                >
                  <span className="block">{c.title}</span>
                  {c.roles && user && !c.roles.includes(user.role) && (
                    <span className="mt-0.5 block text-[10px] font-normal text-amber-400/80">Not available to your role</span>
                  )}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      ))}
    </nav>
  );

  return (
    <div className="pb-10">
      <div className="mb-5 flex items-center justify-between gap-3 print:hidden">
        <div className="flex items-center gap-2 text-sm text-slate-400">
          <BookOpen className="h-4 w-4 text-indigo-400" />
          <span className="font-semibold text-white">Staff User Manual</span>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setNavOpen(true)} className="lg:hidden inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800">
            <Menu className="mr-1.5 h-4 w-4" /> Chapters
          </button>
          <button onClick={() => window.print()} className="inline-flex items-center rounded-lg border border-slate-700 bg-slate-900 px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-slate-800">
            <Printer className="mr-1.5 h-4 w-4" /> Print / PDF
          </button>
        </div>
      </div>

      <div className="flex gap-8">
        <aside className="hidden w-64 shrink-0 lg:block print:hidden">
          <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto pr-1">{sidebar}</div>
        </aside>

        {navOpen && (
          <div className="fixed inset-0 z-50 lg:hidden">
            <div className="absolute inset-0 bg-slate-950/70" onClick={() => setNavOpen(false)} />
            <div className="absolute inset-y-0 left-0 w-80 max-w-[85%] overflow-y-auto bg-slate-900 p-4 shadow-xl">
              <button
                className="mb-3 rounded-lg p-1.5 text-slate-400 hover:bg-slate-800"
                onClick={() => setNavOpen(false)}
                aria-label="Close chapters"
              >
                <X className="h-5 w-5" />
              </button>
              {sidebar}
            </div>
          </div>
        )}

        <article className="min-w-0 flex-1 rounded-2xl border border-slate-800 bg-slate-900/60 p-5 sm:p-8 print:border-0 print:p-0">
          <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-indigo-400">{current.group}</p>
          {current.roles && (
            <p className="mb-4 text-xs text-slate-400">
              Screen available to: <span className="font-mono text-slate-300">{current.roles.join(', ')}</span>
            </p>
          )}
          <div ref={contentRef}>
            <MarkdownRenderer content={current.content} />
          </div>
          <div className="mt-10 flex items-stretch justify-between gap-3 border-t border-slate-800 pt-5 print:hidden">
            {prev ? (
              <button
                onClick={() => navigate(`${BASE}/${prev.slug}`)}
                className="flex max-w-[48%] items-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-left text-sm hover:bg-slate-800"
              >
                <ChevronLeft className="h-4 w-4 shrink-0" />
                <span>
                  <span className="block text-[11px] text-slate-400">Previous</span>
                  <span className="font-semibold text-white">{prev.title}</span>
                </span>
              </button>
            ) : (
              <span />
            )}
            {next && (
              <button
                onClick={() => navigate(`${BASE}/${next.slug}`)}
                className="flex max-w-[48%] items-center gap-2 rounded-xl border border-slate-800 px-4 py-3 text-right text-sm hover:bg-slate-800"
              >
                <span>
                  <span className="block text-[11px] text-slate-400">Next</span>
                  <span className="font-semibold text-white">{next.title}</span>
                </span>
                <ChevronRight className="h-4 w-4 shrink-0" />
              </button>
            )}
          </div>
        </article>

        {outline.length > 0 && (
          <aside className="hidden w-56 shrink-0 xl:block print:hidden">
            <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-y-auto">
              <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-slate-400">On this page</p>
              <ul className="space-y-1 border-l border-slate-800">
                {outline.map((o) => (
                  <li key={o.id}>
                    <a
                      href={`#${o.id}`}
                      onClick={(e) => {
                        e.preventDefault();
                        document.getElementById(o.id)?.scrollIntoView({ behavior: 'smooth' });
                      }}
                      className={cn('block py-0.5 text-xs leading-snug text-slate-400 hover:text-indigo-300', o.level === 3 ? 'pl-6' : 'pl-3')}
                    >
                      {o.text}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          </aside>
        )}
      </div>
    </div>
  );
};
