import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/AdminShell';
import { BannerManager } from '@/components/admin/BannerManager';
import { requireAdminPage } from '@/lib/auth';
import type { Banner } from '@/types';

export const metadata: Metadata = { title: 'Banners' };

export default async function BannersPage() {
  const { supabase } = await requireAdminPage();
  const { data } = await supabase.from('banners').select('*').order('sort_order').order('created_at');
  return (
    <>
      <PageHeader title="Banners da vitrine" description="Hero rotativo da página inicial. Agende campanhas com datas de início e fim." />
      <BannerManager banners={(data ?? []) as Banner[]} />
    </>
  );
}
