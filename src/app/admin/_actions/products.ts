'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { safeAction, type ActionResult } from '@/lib/admin/action';
import { requireAdmin } from '@/lib/auth';
import { productInputSchema, type ProductInput } from '@/lib/validation';

function revalidateStore(slug?: string) {
  revalidatePath('/', 'layout');
  if (slug) revalidatePath(`/produto/${slug}`);
}

/**
 * Cria ou atualiza produto + variantes numa única transação
 * (função `admin_save_product`, sujeita ao RLS do administrador).
 */
export async function saveProduct(id: string | null, input: ProductInput): Promise<ActionResult<{ id: string }>> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const parsed = productInputSchema.parse(input);
    const productId = id ? z.guid().parse(id) : null;
    const { variants, ...product } = parsed;

    const { data, error } = await supabase.rpc('admin_save_product', {
      p_id: productId,
      p_product: product,
      p_variants: variants.map((v) => ({ ...v, id: productId ? v.id ?? null : null })),
    });
    if (error) throw error;

    revalidateStore(parsed.slug);
    revalidatePath('/admin/produtos');
    return { ok: true, message: 'Produto guardado.', data: { id: data as string } };
  });
}

export async function setProductActive(id: string, isActive: boolean): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('products').update({ is_active: isActive }).eq('id', z.guid().parse(id));
    if (error) throw error;
    revalidateStore();
    revalidatePath('/admin/produtos');
    return { ok: true, message: isActive ? 'Produto publicado.' : 'Produto ocultado da loja.' };
  });
}

/** Eliminação lógica: preserva histórico de encomendas e liberta o slug. */
export async function softDeleteProduct(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const productId = z.guid().parse(id);
    const { data, error: readError } = await supabase.from('products').select('slug').eq('id', productId).single();
    if (readError) throw readError;
    const slug = `${(data as { slug: string }).slug}-removido-${Date.now().toString(36)}`.slice(0, 80);
    const { error } = await supabase
      .from('products')
      .update({ deleted_at: new Date().toISOString(), is_active: false, is_featured: false, slug })
      .eq('id', productId);
    if (error) throw error;
    revalidateStore();
    revalidatePath('/admin/produtos');
    return { ok: true, message: 'Produto eliminado.' };
  });
}
