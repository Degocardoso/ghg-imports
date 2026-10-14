import type { MetadataRoute } from 'next';
import { SITE_URL } from '@/lib/constants';
import { getCategories } from '@/lib/data/store';
import { isSupabaseConfigured } from '@/lib/supabase/env';
import { createPublicClient } from '@/lib/supabase/public';

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [
    { url: SITE_URL, changeFrequency: 'daily', priority: 1 },
    { url: `${SITE_URL}/catalogo`, changeFrequency: 'daily', priority: 0.9 },
  ];
  if (!isSupabaseConfigured()) return entries;

  const categories = await getCategories();
  entries.push(...categories.map((c) => ({ url: `${SITE_URL}/catalogo?categoria=${c.slug}`, priority: 0.7 })));

  const { data } = await createPublicClient()
    .from('products')
    .select('slug, updated_at')
    .eq('is_active', true)
    .is('deleted_at', null)
    .limit(5000);
  entries.push(
    ...((data ?? []) as { slug: string; updated_at: string }[]).map((p) => ({
      url: `${SITE_URL}/produto/${p.slug}`,
      lastModified: p.updated_at,
      priority: 0.8,
    })),
  );
  return entries;
}
