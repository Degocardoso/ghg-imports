import { AdminShell } from '@/components/admin/AdminShell';
import { requireAdminPage } from '@/lib/auth';

export const dynamic = 'force-dynamic';

export default async function PanelLayout({ children }: { children: React.ReactNode }) {
  // Segunda barreira (além do proxy): valida o token junto do Supabase Auth.
  const { user, supabase } = await requireAdminPage();
  const { count } = await supabase
    .from('orders')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'aguardando_contato');

  return (
    <AdminShell email={user.email ?? ''} openOrders={count ?? 0}>
      {children}
    </AdminShell>
  );
}
