'use client';

import { LoaderCircle, Search, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useId, useRef, useState } from 'react';
import { cn } from '@/lib/cn';
import { formatPrice } from '@/lib/format';

interface SearchResult {
  id: string;
  name: string;
  slug: string;
  image: string | null;
  price: number;
  compareAtPrice: number | null;
  category: string | null;
  inStock: boolean;
}

/** Pesquisa instantânea com debounce, navegação por teclado e cancelamento de pedidos. */
export function SearchBox({ className, onNavigate }: { className?: string; onNavigate?: () => void }) {
  const router = useRouter();
  const listId = useId();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const term = query.trim();
    if (term.length < 2) return;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(term)}`, { signal: controller.signal });
        const data = (await res.json()) as { results: SearchResult[] };
        setResults(data.results ?? []);
        setActive(-1);
        setOpen(true);
      } catch (error) {
        if ((error as Error).name !== 'AbortError') setResults([]);
      } finally {
        if (!controller.signal.aborted) setLoading(false);
      }
    }, 220);
    return () => {
      controller.abort();
      clearTimeout(timer);
    };
  }, [query]);

  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      if (!wrapperRef.current?.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, []);

  const go = (href: string) => {
    setOpen(false);
    setQuery('');
    setResults([]);
    onNavigate?.();
    router.push(href);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const selected = results[active];
    if (selected) return go(`/produto/${selected.slug}`);
    if (query.trim().length >= 2) go(`/catalogo?q=${encodeURIComponent(query.trim())}`);
  };

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (!open || results.length === 0) return;
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setActive((i) => (i + 1) % results.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setActive((i) => (i <= 0 ? results.length - 1 : i - 1));
    } else if (e.key === 'Escape') {
      setOpen(false);
    }
  };

  const showPanel = open && query.trim().length >= 2;

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      <form onSubmit={onSubmit} role="search">
        <label htmlFor={`${listId}-input`} className="sr-only">
          Pesquisar produtos
        </label>
        <Search className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted" aria-hidden />
        <input
          id={`${listId}-input`}
          type="search"
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            if (e.target.value.trim().length < 2) setResults([]);
          }}
          onFocus={() => results.length > 0 && setOpen(true)}
          onKeyDown={onKeyDown}
          placeholder="Buscar camisas, tênis, perfumes…"
          autoComplete="off"
          role="combobox"
          aria-expanded={showPanel}
          aria-controls={listId}
          aria-autocomplete="list"
          className="input rounded-full pr-10 pl-10"
        />
        {loading ? (
          <LoaderCircle className="absolute top-1/2 right-3.5 size-4 -translate-y-1/2 animate-spin text-gold" aria-hidden />
        ) : (
          query && (
            <button
              type="button"
              onClick={() => {
                setQuery('');
                setResults([]);
              }}
              className="absolute top-1/2 right-3 -translate-y-1/2 rounded-full p-1 text-muted hover:text-fg"
              aria-label="Limpar pesquisa"
            >
              <X className="size-3.5" />
            </button>
          )
        )}
      </form>

      {showPanel && (
        <div className="absolute inset-x-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-line bg-surface shadow-2xl shadow-black/60">
          {results.length === 0 && !loading ? (
            <p className="px-4 py-6 text-center text-sm text-muted">Nenhum produto encontrado para “{query}”.</p>
          ) : (
            <ul id={listId} role="listbox" className="max-h-[60vh] overflow-y-auto py-1">
              {results.map((r, i) => (
                <li key={r.id} role="option" aria-selected={i === active}>
                  <Link
                    href={`/produto/${r.slug}`}
                    onClick={(e) => {
                      e.preventDefault();
                      go(`/produto/${r.slug}`);
                    }}
                    onMouseEnter={() => setActive(i)}
                    className={cn('flex items-center gap-3 px-3 py-2.5 transition', i === active && 'bg-white/5')}
                  >
                    <span className="relative size-12 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {r.image && <Image src={r.image} alt="" fill sizes="48px" className="object-cover" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-medium">{r.name}</span>
                      <span className="block text-xs text-muted">
                        {r.category}
                        {!r.inStock && ' · Esgotado'}
                      </span>
                    </span>
                    <span className="text-sm font-semibold text-gold-light">{formatPrice(r.price)}</span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={() => go(`/catalogo?q=${encodeURIComponent(query.trim())}`)}
            className="block w-full border-t border-line px-4 py-3 text-left text-xs font-semibold text-gold hover:bg-white/5"
          >
            Ver todos os resultados para “{query.trim()}” →
          </button>
        </div>
      )}
    </div>
  );
}
