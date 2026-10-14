import { ChevronLeft, ChevronRight } from 'lucide-react';
import Link from 'next/link';
import { cn } from '@/lib/cn';

export function Pagination({
  page,
  pageCount,
  searchParams,
  basePath = '/catalogo',
}: {
  page: number;
  pageCount: number;
  searchParams: Record<string, string | undefined>;
  basePath?: string;
}) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const params = new URLSearchParams();
    Object.entries(searchParams).forEach(([k, v]) => v && k !== 'pagina' && params.set(k, v));
    if (p > 1) params.set('pagina', String(p));
    const qs = params.toString();
    return qs ? `${basePath}?${qs}` : basePath;
  };
  const pages = Array.from({ length: pageCount }, (_, i) => i + 1).filter(
    (p) => p === 1 || p === pageCount || Math.abs(p - page) <= 1,
  );

  return (
    <nav className="mt-12 flex items-center justify-center gap-1.5" aria-label="Paginação">
      {page > 1 && (
        <Link href={href(page - 1)} className="grid size-10 place-items-center rounded-full border border-line text-muted hover:text-fg" aria-label="Página anterior">
          <ChevronLeft className="size-4" />
        </Link>
      )}
      {pages.map((p, i) => (
        <span key={p} className="flex items-center gap-1.5">
          {i > 0 && p - pages[i - 1]! > 1 && <span className="px-1 text-muted">…</span>}
          <Link
            href={href(p)}
            aria-current={p === page ? 'page' : undefined}
            className={cn(
              'grid size-10 place-items-center rounded-full text-sm font-semibold',
              p === page ? 'bg-gold-gradient text-ink' : 'border border-line text-muted hover:text-fg',
            )}
          >
            {p}
          </Link>
        </span>
      ))}
      {page < pageCount && (
        <Link href={href(page + 1)} className="grid size-10 place-items-center rounded-full border border-line text-muted hover:text-fg" aria-label="Página seguinte">
          <ChevronRight className="size-4" />
        </Link>
      )}
    </nav>
  );
}
