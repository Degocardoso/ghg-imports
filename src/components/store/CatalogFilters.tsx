'use client';

import { SlidersHorizontal, X } from 'lucide-react';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { useState, useTransition } from 'react';
import { cn } from '@/lib/cn';
import { GENDER_LABEL } from '@/lib/constants';
import { GENDERS, type CategoryNode } from '@/types';

const SORTS = [
  { value: 'relevancia', label: 'Relevância' },
  { value: 'novidades', label: 'Novidades' },
  { value: 'menor-preco', label: 'Menor preço' },
  { value: 'maior-preco', label: 'Maior preço' },
] as const;

function useQueryUpdater() {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const [pending, startTransition] = useTransition();

  const update = (changes: Record<string, string | null>) => {
    const next = new URLSearchParams(params.toString());
    for (const [key, value] of Object.entries(changes)) {
      if (value === null || value === '') next.delete(key);
      else next.set(key, value);
    }
    next.delete('pagina');
    startTransition(() => router.push(`${pathname}?${next.toString()}`, { scroll: false }));
  };
  return { params, update, pending };
}

export function SortSelect() {
  const { params, update, pending } = useQueryUpdater();
  return (
    <label className="flex items-center gap-2 text-sm text-muted">
      <span className="hidden sm:inline">Ordenar por</span>
      <select
        value={params.get('ordem') ?? 'relevancia'}
        onChange={(e) => update({ ordem: e.target.value === 'relevancia' ? null : e.target.value })}
        className={cn('input w-auto rounded-full py-2 pr-8', pending && 'opacity-60')}
      >
        {SORTS.map((s) => (
          <option key={s.value} value={s.value}>
            {s.label}
          </option>
        ))}
      </select>
    </label>
  );
}

export function CatalogFilters({ categories, sizes }: { categories: CategoryNode[]; sizes: string[] }) {
  const { params, update, pending } = useQueryUpdater();
  const [mobileOpen, setMobileOpen] = useState(false);
  const [min, setMin] = useState(params.get('min') ?? '');
  const [max, setMax] = useState(params.get('max') ?? '');

  const categoria = params.get('categoria');
  const genero = params.get('genero');
  const tamanho = params.get('tamanho');
  const disponivel = params.get('disponivel') === '1';
  const activeCount = [categoria, genero, tamanho, params.get('min'), params.get('max'), disponivel ? '1' : null].filter(Boolean).length;

  const panel = (
    <div className={cn('space-y-7', pending && 'pointer-events-none opacity-60')}>
      <FilterGroup title="Categorias">
        <ul className="space-y-1">
          <li>
            <Chip active={!categoria} onClick={() => update({ categoria: null, tamanho: null })}>
              Todas
            </Chip>
          </li>
          {categories.map((cat) => (
            <li key={cat.id}>
              <Chip active={categoria === cat.slug} onClick={() => update({ categoria: cat.slug, tamanho: null })}>
                {cat.name}
              </Chip>
              {cat.children.length > 0 &&
                (categoria === cat.slug || cat.children.some((c) => c.slug === categoria)) && (
                  <ul className="mt-1 ml-3 space-y-1 border-l border-line pl-2">
                    {cat.children.map((sub) => (
                      <li key={sub.id}>
                        <Chip small active={categoria === sub.slug} onClick={() => update({ categoria: sub.slug, tamanho: null })}>
                          {sub.name}
                        </Chip>
                      </li>
                    ))}
                  </ul>
                )}
            </li>
          ))}
        </ul>
      </FilterGroup>

      <FilterGroup title="Gênero">
        <div className="flex flex-wrap gap-2">
          {GENDERS.map((g) => (
            <Pill key={g} active={genero === g} onClick={() => update({ genero: genero === g ? null : g })}>
              {GENDER_LABEL[g]}
            </Pill>
          ))}
        </div>
      </FilterGroup>

      {sizes.length > 0 && (
        <FilterGroup title="Tamanho / Numeração / Volume">
          <div className="flex flex-wrap gap-2">
            {sizes.map((s) => (
              <Pill key={s} active={tamanho === s} onClick={() => update({ tamanho: tamanho === s ? null : s })}>
                {s}
              </Pill>
            ))}
          </div>
        </FilterGroup>
      )}

      <FilterGroup title="Faixa de preço (R$)">
        <form
          className="flex items-center gap-2"
          onSubmit={(e) => {
            e.preventDefault();
            update({ min: min || null, max: max || null });
          }}
        >
          <input inputMode="numeric" value={min} onChange={(e) => setMin(e.target.value.replace(/\D/g, ''))} placeholder="Mín." className="input py-2" aria-label="Preço mínimo" />
          <span className="text-muted">–</span>
          <input inputMode="numeric" value={max} onChange={(e) => setMax(e.target.value.replace(/\D/g, ''))} placeholder="Máx." className="input py-2" aria-label="Preço máximo" />
          <button type="submit" className="btn-outline px-3 py-2">
            OK
          </button>
        </form>
      </FilterGroup>

      <label className="flex cursor-pointer items-center justify-between gap-3 rounded-xl border border-line bg-surface px-4 py-3 text-sm">
        Somente disponíveis
        <input
          type="checkbox"
          checked={disponivel}
          onChange={(e) => update({ disponivel: e.target.checked ? '1' : null })}
          className="size-4 accent-[#d4af37]"
        />
      </label>

      {activeCount > 0 && (
        <button
          type="button"
          onClick={() => {
            setMin('');
            setMax('');
            update({ categoria: null, genero: null, tamanho: null, min: null, max: null, disponivel: null });
          }}
          className="btn-ghost w-full"
        >
          <X className="size-4" /> Limpar filtros
        </button>
      )}
    </div>
  );

  return (
    <>
      <button type="button" onClick={() => setMobileOpen(true)} className="btn-outline lg:hidden">
        <SlidersHorizontal className="size-4" /> Filtros {activeCount > 0 && `(${activeCount})`}
      </button>
      <aside className="hidden lg:block">{panel}</aside>

      {mobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden" role="dialog" aria-modal="true" aria-label="Filtros">
          <div className="absolute inset-0 bg-black/70" onClick={() => setMobileOpen(false)} />
          <div className="absolute inset-x-0 bottom-0 max-h-[85vh] overflow-y-auto rounded-t-3xl border-t border-line bg-ink p-5">
            <div className="mb-5 flex items-center justify-between">
              <h2 className="text-lg font-semibold">Filtros</h2>
              <button type="button" onClick={() => setMobileOpen(false)} className="rounded-full p-2 text-muted" aria-label="Fechar">
                <X className="size-5" />
              </button>
            </div>
            {panel}
            <button type="button" onClick={() => setMobileOpen(false)} className="btn-gold mt-6 w-full">
              Ver resultados
            </button>
          </div>
        </div>
      )}
    </>
  );
}

function FilterGroup({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h3 className="mb-3 text-[11px] font-bold tracking-[0.2em] text-gold uppercase">{title}</h3>
      {children}
    </div>
  );
}

function Chip({ active, small, onClick, children }: { active: boolean; small?: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        'w-full rounded-lg px-2.5 py-1.5 text-left transition',
        small ? 'text-[13px]' : 'text-sm',
        active ? 'bg-gold/10 font-semibold text-gold-light' : 'text-muted hover:bg-white/5 hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}

function Pill({ active, onClick, children }: { active: boolean; onClick: () => void; children: React.ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(
        'rounded-full border px-3 py-1.5 text-xs font-medium transition',
        active ? 'border-gold bg-gold/10 text-gold-light' : 'border-line text-muted hover:border-zinc-500 hover:text-fg',
      )}
    >
      {children}
    </button>
  );
}
