import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/AdminShell';
import { CategoryManager } from '@/components/admin/CategoryManager';
import { requireAdminPage } from '@/lib/auth';
import type { Category } from '@/types';

export const metadata: Metadata = { title: 'Categorias' };

export default async function CategoriesPage() {
  const { supabase } = await requireAdminPage();
  const [{ data: categories }, { data: products }] = await Promise.all([
    supabase.from('categories').select('*').order('sort_order').order('name'),
    supabase.from('products').select('category_id').is('deleted_at', null),
  ]);
  const counts: Record<string, number> = {};
  for (const p of (products ?? []) as { category_id: string | null }[]) {
    if (p.category_id) counts[p.category_id] = (counts[p.category_id] ?? 0) + 1;
  }
  return (
    <>
      <PageHeader title="Categorias" description="Crie categorias e subcategorias. Novas categorias aparecem no menu da loja." />
      <CategoryManager categories={(categories ?? []) as Category[]} counts={counts} />
    </>
  );
}
