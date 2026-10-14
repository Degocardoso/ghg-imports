import type { Metadata } from 'next';
import { PageHeader } from '@/components/admin/AdminShell';
import { SettingsForm } from '@/components/admin/SettingsForm';
import { requireAdminPage } from '@/lib/auth';
import type { StoreSettings } from '@/types';

export const metadata: Metadata = { title: 'Configurações' };

export default async function SettingsPage() {
  const { supabase } = await requireAdminPage();
  const { data, error } = await supabase.from('store_settings').select('*').eq('id', 1).single();
  if (error || !data) {
    return <p className="text-red-300">Não foi possível carregar as configurações. Verifique se a migração foi aplicada.</p>;
  }
  return (
    <>
      <PageHeader title="Configurações da loja" description="WhatsApp, identidade, contatos e políticas — aplicados à loja em tempo real." />
      <SettingsForm settings={data as StoreSettings} />
    </>
  );
}
