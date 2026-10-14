import { PackageSearch } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { CatalogFilters, SortSelect } from '@/components/store/CatalogFilters';
import { Pagination } from '@/components/store/Pagination';
import { ProductGrid } from '@/components/store/ProductCard';
import { EmptyState } from '@/components/ui/EmptyState';
import { getCatalog, getCategoryTree, type CatalogFilters as Filters, type CatalogSort } from '@/lib/data/store';
import { GENDERS, type Gender } from '@/types';

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

const SORTS: CatalogSort[] = ['relevancia', 'novidades', 'menor-preco', 'maior-preco'];

function parseFilters(raw: Record<string, string | string[] | undefined>) {
  const get = (k: string) => {
    const v = raw[k];
    return (Array.isArray(v) ? v[0] : v)?.slice(0, 100) || undefined;
  };
  const num = (k: string) => {
    const n = Number(get(k));
    return Number.isFinite(n) && n >= 0 ? n : undefined;
  };
  const genero = get('genero');
  const ordem = get('ordem');
  const flat = {
    categoria: get('categoria'),
    genero: get('genero'),
    tamanho: get('tamanho'),
    min: get('min'),
    max: get('max'),
    disponivel: get('disponivel'),
    ordem: get('ordem'),
    q: get('q'),
    pagina: get('pagina'),
  };
  const filters: Filters = {
    categoria: flat.categoria,
    genero: GENDERS.includes(genero as Gender) ? (genero as Gender) : undefined,
    tamanho: flat.tamanho,
    min: get('min') ? num('min') : undefined,
    max: get('max') ? num('max') : undefined,
    disponivel: flat.disponivel === '1',
    ordem: SORTS.includes(ordem as CatalogSort) ? (ordem as CatalogSort) : undefined,
    q: flat.q,
    pagina: num('pagina') ? Math.floor(num('pagina')!) : 1,
  };
  return { filters, flat };
}

export async function generateMetadata({ searchParams }: { searchParams: SearchParams }): Promise<Metadata> {
  const { filters } = parseFilters(await searchParams);
  if (filters.q) return { title: `Busca: ${filters.q}`, robots: { index: false } };
  const tree = await getCategoryTree();
  const all = tree.flatMap((c) => [c, ...c.children]);
  const cat = all.find((c) => c.slug === filters.categoria);
  return {
    title: cat?.name ?? 'Catálogo',
    description: cat?.description ?? 'Camisas de futebol, tênis, perfumes importados, vestuário e acessórios premium.',
  };
}

export default async function CatalogPage({ searchParams }: { searchParams: SearchParams }) {
  const { filters, flat } = parseFilters(await searchParams);
  const [result, categories] = await Promise.all([getCatalog(filters), getCategoryTree()]);

  const title = filters.q ? `Resultados para “${filters.q}”` : result.category?.name ?? 'Todos os produtos';

  return (
    <div className="container-store py-10">
      <nav className="mb-4 text-xs text-muted" aria-label="Navegação estrutural">
        <Link href="/" className="hover:text-fg">Início</Link> <span className="mx-1.5">/</span>
        <span className="text-zinc-300">{title}</span>
      </nav>

      <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl">{title}</h1>
          <p className="mt-1 text-sm text-muted">
            {result.total} {result.total === 1 ? 'produto encontrado' : 'produtos encontrados'}
          </p>
        </div>
        <div className="flex items-center gap-3">
          <Suspense>
            <SortSelect />
          </Suspense>
        </div>
      </div>

      <div className="grid gap-8 lg:grid-cols-[250px_1fr]">
        <Suspense>
          <div className="lg:sticky lg:top-28 lg:self-start">
            <CatalogFilters categories={categories} sizes={result.sizes} />
          </div>
        </Suspense>

        <div>
          {result.products.length > 0 ? (
            <>
              <ProductGrid products={result.products} />
              <Pagination page={result.page} pageCount={result.pageCount} searchParams={flat} />
            </>
          ) : (
            <EmptyState
              icon={PackageSearch}
              title="Nenhum produto encontrado"
              description="Tente remover alguns filtros ou pesquisar por outro termo. Também pode pedir ajuda no WhatsApp — encontramos para você."
              action={
                <Link href="/catalogo" className="btn-outline">
                  Ver todo o catálogo
                </Link>
              }
            />
          )}
        </div>
      </div>
    </div>
  );
}
