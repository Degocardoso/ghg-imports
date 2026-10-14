import { NextResponse, type NextRequest } from 'next/server';
import { z } from 'zod';
import { MAX_CART_LINES } from '@/lib/constants';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createPublicClient } from '@/lib/supabase/public';
import type { CartValidation } from '@/store/cart';

const bodySchema = z.object({ variantIds: z.array(z.guid()).min(1).max(MAX_CART_LINES) });

interface VariantRow {
  id: string;
  stock: number;
  price: number | null;
  compare_at_price: number | null;
  is_active: boolean;
  product: { price: number; compare_at_price: number | null; is_active: boolean; deleted_at: string | null } | null;
}

/**
 * POST /api/cart/validate — devolve preço, stock e disponibilidade atuais
 * das variantes do carrinho (o RLS só expõe produtos ativos).
 */
export async function POST(request: NextRequest) {
  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: 'Carrinho inválido.' }, { status: 400 });
  if (!isSupabaseConfigured()) return NextResponse.json({ results: [] });

  const { data, error } = await createPublicClient()
    .from('product_variants')
    .select('id, stock, price, compare_at_price, is_active, product:products(price, compare_at_price, is_active, deleted_at)')
    .in('id', parsed.data.variantIds);

  if (error) {
    console.error('[cart/validate]', error.message);
    return NextResponse.json({ error: 'Não foi possível validar o carrinho.' }, { status: 500 });
  }

  const rows = (data ?? []) as unknown as VariantRow[];
  const results: CartValidation[] = parsed.data.variantIds.map((id) => {
    const row = rows.find((r) => r.id === id);
    if (!row || !row.product || !row.is_active || !row.product.is_active || row.product.deleted_at) {
      return { variantId: id, available: false, price: 0, compareAtPrice: null, stock: 0 };
    }
    const price = Number(row.price ?? row.product.price);
    const compare = row.compare_at_price ?? row.product.compare_at_price;
    return {
      variantId: id,
      available: row.stock > 0,
      price,
      compareAtPrice: compare !== null && Number(compare) > price ? Number(compare) : null,
      stock: row.stock,
    };
  });

  return NextResponse.json({ results }, { headers: { 'Cache-Control': 'no-store' } });
}
