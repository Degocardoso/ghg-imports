import { Search } from 'lucide-react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/AdminShell';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { Pagination } from '@/components/store/Pagination';
import { requireAdminPage } from '@/lib/auth';
import { ORDER_STATUS_LABEL } from '@/lib/constants';
import { formatDateTime, formatPhone, formatPrice, onlyDigits } from '@/lib/format';
import { ORDER_STATUSES, type Order, type OrderStatus } from '@/types';

export const metadata: Metadata = { title: 'Pedidos' };

const PAGE_SIZE = 30;

type SP = Promise<{ estado?: string; q?: string; pagina?: string }>;

export default async function OrdersPage({ searchParams }: { searchParams: SP }) {
  const sp = await searchParams;
  const { supabase } = await requireAdminPage();
  const page = Math.max(1, Number(sp.pagina) || 1);
  const status = ORDER_STATUSES.includes(sp.estado as OrderStatus) ? (sp.estado as OrderStatus) : null;
  const q = sp.q?.trim().slice(0, 80) ?? '';

  let query = supabase.from('orders').select('*', { count: 'exact' });
  if (status) query = query.eq('status', status);
  // Pesquisa sem construir filtros "or" com texto do utilizador.
  const codeMatch = q.match(/^(?:GHD-?)?(\d{4,})$/i);
  if (codeMatch && q.toUpperCase().startsWith('GHD')) query = query.eq('order_number', Number(codeMatch[1]));
  else if (q && /^[\d\s()+-]+$/.test(q)) query = query.ilike('customer_phone', `%${onlyDigits(q)}%`);
  else if (q) query = query.ilike('customer_name', `%${q.replace(/[\\%_]/g, (c) => `\\${c}`)}%`);

  const from = (page - 1) * PAGE_SIZE;
  const { data, count, error } = await query.order('created_at', { ascending: false }).range(from, from + PAGE_SIZE - 1);
  const orders = (data ?? []) as Order[];

  return (
    <>
      <PageHeader title="Pedidos" description="Pedidos enviados pelo checkout do WhatsApp. Preços congelados no momento do pedido." />

      <div className="mb-5 space-y-3">
        <form className="relative max-w-md">
          <Search className="absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted" />
          <input name="q" defaultValue={q} placeholder="Código (GHD-1001), nome ou telefone…" className="input pl-9" />
          {status && <input type="hidden" name="estado" value={status} />}
        </form>
        <div className="no-scrollbar flex gap-1.5 overflow-x-auto">
          <FilterLink href={{ q }} active={!status}>Todos</FilterLink>
          {ORDER_STATUSES.map((s) => (
            <FilterLink key={s} href={{ estado: s, q }} active={status === s}>{ORDER_STATUS_LABEL[s]}</FilterLink>
          ))}
        </div>
      </div>

      {error && <p className="mb-4 text-sm text-red-300">Erro ao carregar pedidos: {error.message}</p>}

      <div className="card overflow-x-auto">
        <table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-line text-left text-[11px] tracking-wide text-muted uppercase">
            <tr>
              <th className="px-4 py-3 font-medium">Pedido</th>
              <th className="px-4 py-3 font-medium">Cliente</th>
              <th className="px-4 py-3 font-medium">Data</th>
              <th className="px-4 py-3 font-medium">Total</th>
              <th className="px-4 py-3 font-medium">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-line">
            {orders.map((o) => (
              <tr key={o.id} className="hover:bg-white/[0.02]">
                <td className="px-4 py-3">
                  <Link href={`/admin/pedidos/${o.id}`} className="font-semibold text-gold-light hover:underline">{o.code}</Link>
                  <p className="text-xs text-muted">{o.items_count} item(ns) · {o.delivery_method === 'entrega' ? `${o.city ?? ''}/${o.state ?? ''}` : 'Retirada'}</p>
                </td>
                <td className="px-4 py-3">
                  <p>{o.customer_name}</p>
                  <p className="text-xs text-muted">{formatPhone(o.customer_phone)}</p>
                </td>
                <td className="px-4 py-3 text-muted">{formatDateTime(o.created_at)}</td>
                <td className="px-4 py-3 font-semibold">{formatPrice(o.total)}</td>
                <td className="px-4 py-3"><StatusBadge status={o.status} /></td>
              </tr>
            ))}
            {orders.length === 0 && (
              <tr><td colSpan={5} className="px-4 py-12 text-center text-muted">Nenhum pedido encontrado.</td></tr>
            )}
          </tbody>
        </table>
      </div>
      <Pagination page={page} pageCount={Math.ceil((count ?? 0) / PAGE_SIZE)} searchParams={sp} basePath="/admin/pedidos" />
    </>
  );
}

function FilterLink({ href, active, children }: { href: Record<string, string>; active: boolean; children: React.ReactNode }) {
  const query = Object.fromEntries(Object.entries(href).filter(([, v]) => v));
  return (
    <Link
      href={{ pathname: '/admin/pedidos', query }}
      className={`shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium ${active ? 'border-gold bg-gold/10 text-gold-light' : 'border-line text-muted hover:text-fg'}`}
    >
      {children}
    </Link>
  );
}
