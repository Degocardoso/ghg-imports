'use server';

import { revalidatePath } from 'next/cache';
import { z } from 'zod';
import { safeAction, type ActionResult } from '@/lib/admin/action';
import { requireAdmin } from '@/lib/auth';
import {
  bannerInputSchema,
  categoryInputSchema,
  settingsInputSchema,
  type BannerInput,
  type CategoryInput,
  type SettingsInput,
} from '@/lib/validation';

const refreshStore = () => revalidatePath('/', 'layout');

// ----------------------------------------------------------------- Categorias
export async function saveCategory(input: CategoryInput): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const { id, ...category } = categoryInputSchema.parse(input);
    if (id && category.parent_id === id) {
      return { ok: false, error: 'Uma categoria não pode ser subcategoria dela mesma.' };
    }
    const { error } = id
      ? await supabase.from('categories').update(category).eq('id', id)
      : await supabase.from('categories').insert(category);
    if (error) throw error;
    refreshStore();
    revalidatePath('/admin/categorias');
    return { ok: true, message: id ? 'Categoria atualizada.' : 'Categoria criada.' };
  });
}

export async function deleteCategory(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const categoryId = z.guid().parse(id);
    const { count } = await supabase
      .from('products')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', categoryId)
      .is('deleted_at', null);
    if (count && count > 0) {
      return { ok: false, error: `Existem ${count} produto(s) nesta categoria. Mova-os ou desative a categoria.` };
    }
    const { error } = await supabase.from('categories').delete().eq('id', categoryId);
    if (error) throw error;
    refreshStore();
    revalidatePath('/admin/categorias');
    return { ok: true, message: 'Categoria excluída.' };
  });
}

// -------------------------------------------------------------------- Banners
export async function saveBanner(input: BannerInput): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const { id, ...banner } = bannerInputSchema.parse(input);
    if (banner.starts_at && banner.ends_at && banner.ends_at <= banner.starts_at) {
      return { ok: false, error: 'A data de fim deve ser posterior à de início.', fields: { ends_at: 'Data inválida.' } };
    }
    const { error } = id
      ? await supabase.from('banners').update(banner).eq('id', id)
      : await supabase.from('banners').insert(banner);
    if (error) throw error;
    refreshStore();
    revalidatePath('/admin/banners');
    return { ok: true, message: id ? 'Banner atualizado.' : 'Banner criado.' };
  });
}

export async function deleteBanner(id: string): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const { error } = await supabase.from('banners').delete().eq('id', z.guid().parse(id));
    if (error) throw error;
    refreshStore();
    revalidatePath('/admin/banners');
    return { ok: true, message: 'Banner excluído.' };
  });
}

// ---------------------------------------------------------------- Definições
export async function saveSettings(input: SettingsInput): Promise<ActionResult> {
  return safeAction(async () => {
    const { supabase } = await requireAdmin();
    const settings = settingsInputSchema.parse(input);
    const { error } = await supabase.from('store_settings').update(settings).eq('id', 1);
    if (error) throw error;
    refreshStore();
    revalidatePath('/admin/configuracoes');
    return { ok: true, message: 'Configurações salvas. A loja já reflete as alterações.' };
  });
}
