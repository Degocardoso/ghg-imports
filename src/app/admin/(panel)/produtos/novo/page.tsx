import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';
import { requireAdminPage } from '@/lib/auth';
import type { Category } from '@/types';

export const metadata: Metadata = { title: 'Novo produto' };

export default async function NewProductPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from('categories').select('*').order('sort_order').order('name');
  return (
    <>
      <PageHeader title="Novo produto" />
      <ProductForm categories={(data ?? []) as Category[]} />
    </>
  );
}
