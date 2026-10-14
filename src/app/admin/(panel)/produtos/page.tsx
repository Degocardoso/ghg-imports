import { Plus, Search } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/AdminShell';
import { ProductRowActions } from '@/components/admin/ProductRowActions';
import { Pagination } from '@/components/store/Pagination';
import { requireAdminPage } from '@/lib/auth';
import { formatPrice } from '@/lib/format';
import type { CatalogProduct } from '@/types';

export const metadata: Metadata = { title: 'Produtos' };

const PAGE_SIZE = 30;

type SP = Promise<{ q?: string; estado?: string; estoque?: string; categoria?: string; pagina?: string }>;

export default async function ProductsPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdminPage();
  const page = Math.max(1, Number(sp.pagina) || 1);

  // product_catalog com RLS de admin: inclui ocultos, exclui eliminados.
  let query = supabase.from('product_catalog').select('*', { count: 'exact' });
  const q = sp.q?.trim().slice(0, 80);
  if (q) query = query.ilike('name', `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);
  if (sp.estado === 'ativos') query = query.eq('is_active', true);
  if (sp.estado === 'ocultos') query = query.eq('is_active', false);
  if (sp.estoque === 'esgotado') query = query.lte('total_stock', 0);
  if (sp.categoria) query = query.eq('category_slug', sp.categoria);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const products = (data ?? []) as CatalogProduct[];

  const filters: Array<{ label: string; params: Record<string, string> }> = [
    { label: 'Todos', params: {} },
    { label: 'Ativos', params: { estado: 'ativos' } },
    { label: 'Ocultos', params: { estado: 'ocultos' } },
    { label: 'Esgotados', params: { estoque: 'esgotado' } },
  ];
  const isCurrent = (p: Record<string, string>) =>
    (p.estado ?? '') === (sp.estado ?? '') && (p.estoque ?? '') === (sp.estoque ?? '');

  return (
    <>
      <PageHeader
        title="Produtos"
        description={`${count ?? 0} produto(s)`}
        actions={<Link href="/admin/produtos/novo" className="btn-gold"><Plus className="size-4" /> Novo produto</Link>}
      />

      <div className="mb-5 flex flex-wrap items-center gap-3">
        <form className="relative min-w-60 flex-1">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Pesquisar por nome…" className="input pl-9" />
          {sp.estado && <input type="hidden" name="estado" value={sp.estado} />}
        </form>
        <div className="flex flex-wrap gap-1.5">
          {filters.map((f) => (
            <Link
              key={f.label}
              href={{ pathname: '/admin/produtos', query: { ...f.params, ...(q ? { q } : {}) } }}
              className={`rounded-full border px-3 py-1.5 text-xs font-medium ${isCurrent(f.params) ? 'border-gold bg-gold/10 text-gold-light' : 'border-line text-muted'}`}
            >
              {f.label}
            </Link>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">Erro ao carregar produtos: {error.message}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-[11px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Produto</th>
              <th className="px-4 py-3 font-medium">Categoria</th>
              <th className="px-4 py-3 font-medium">Preço</th>
              <th className="px-4 py-3 font-medium">Estoque</th>
              <th className="px-4 py-3 font-medium">Estado</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {products.map((p) => (
              <tr key={p.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/produtos/${p.id}`} className="flex items-center gap-3">
                    <span className="relative size-11 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                      {p.images[0] && <Image src={p.images[0]} alt="" fill sizes="44px" className="object-cover" />}
                    </span>
                    <span className="min-w-0">
                      <span className="block truncate font-medium hover:text-gold-light">{p.name}</span>
                      <span className="text-xs text-muted">{p.brand ?? '—'} · {p.variant_count} variante(s)</span>
                    </span>
                  </Link>
                </td>
                <td className="px-4 py-3 text-muted">{p.category_name ?? '—'}</td>
                <td className="px-4 py-3">{formatPrice(p.min_price)}</td>
                <td className="px-4 py-3">
                  <span className={p.total_stock <= 0 ? 'font-semibold text-red-300' : p.total_stock <= 3 ? 'text-amber-300' : ''}>
                    {p.total_stock} un.
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2 py-0.5 text-xs ${p.is_active ? 'bg-success/15 text-green-300' : 'bg-zinc-800 text-zinc-400'}`}>
                    {p.is_active ? 'Visível' : 'Oculto'}
                  </span>
                  {p.is_featured && <span className="ml-1.5 text-xs text-gold">★</span>}
                </td>
                <td className="px-4 py-3">
                  <ProductRowActions id={p.id} name={p.name} isActive={p.is_active} />
                </td>
              </tr>
            ))}
            {products.length === 0 && (
              <tr><td colSpan={6} className="px-4 py-12 text-center text-muted">Nenhum produto encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} searchParams={sp} basePath="/admin/produtos" />
    </>
  );
}
