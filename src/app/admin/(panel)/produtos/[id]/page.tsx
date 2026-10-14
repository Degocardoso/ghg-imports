import { ExternalLink } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { PageHeader } from '@/components/admin/AdminShell';
import { ProductForm } from '@/components/admin/ProductForm';
import { requireAdminPage } from '@/lib/auth';
import type { Category, Product, ProductVariant } from '@/types';

export const metadata: Metadata = { title: 'Editar produto' };

export default async function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();

  const [{ data: product }, { data: categories }] = await Promise.all([
    supabase.from('products').select('*, product_variants(*)').eq('id', id).is('deleted_at', null).maybeSingle(),
    supabase.from('categories').select('*').order('sort_order').order('name'),
  ]);
  if (!product) notFound();
  const p = product as Product & { product_variants: ProductVariant[] };

  return (
    <>
      <PageHeader
        title={p.name}
        description="Editar produto"
        actions={
          p.is_active && (
            <Link href={`/produto/${p.slug}`} target="_blank" className="btn-outline">
              <ExternalLink className="size-4" /> Ver na loja
            </Link>
          )
        }
      />
      <ProductForm key={p.updated_at} product={p} categories={(categories ?? []) as Category[]} />
    </>
  );
}
