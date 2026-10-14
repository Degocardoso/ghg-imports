import { NextResponse, type NextRequest } from 'next/server';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createPublicClient } from '@/lib/supabase/public';
import type { CatalogProduct } from '@/types';

/** GET /api/search?q=termo — pesquisa instantânea do cabeçalho. */
export async function GET(request: NextRequest) {
  const q = request.nextUrl.searchParams.get('q')?.trim().slice(0, 80) ?? '';
  if (q.length < 2 || !isSupabaseConfigured()) return NextResponse.json({ results: [] });

  const { data, error } = await createPublicClient().rpc('search_products', { term: q, max_results: 6 });
  if (error) {
    console.error('[search]', error.message);
    return NextResponse.json({ results: [], error: 'Pesquisa indisponível.' }, { status: 500 });
  }

  const results = ((data ?? []) as CatalogProduct[]).map((p) => ({
    id: p.id,
    name: p.name,
    slug: p.slug,
    image: p.images[0] ?? null,
    price: p.min_price,
    compareAtPrice: p.max_compare_at_price,
    category: p.category_name,
    inStock: p.total_stock > 0,
  }));

  return NextResponse.json(
    { results },
    { headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' } },
  );
}
