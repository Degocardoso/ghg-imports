import { AlertCircle, ClipboardList, DollarSign, Layers, Package, PackageX } from 'lucide-react';
import Link from 'next/link';
import { PageHeader } from '@/components/admin/AdminShell';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { requireAdminPage } from '@/lib/auth';
import { formatDateTime, formatPrice, variantLabel } from '@/lib/format';
import type { Order } from '@/types';

interface Stats {
  products_active: number;
  products_hidden: number;
  variants_out: number;
  variants_low: number;
  orders_total: number;
  orders_open: number;
  orders_today: number;
  revenue_confirmed: number;
  categories_active: number;
}

interface LowStockRow {
  id: string;
  size: string | null;
  color: string | null;
  stock: number;
  product: { id: string; name: string; deleted_at: string | null } | null;
}

export default async function DashboardPage() {
  const { supabase } = await requireAdminPage();
  const [statsRes, ordersRes, lowRes] = await Promise.all([
    supabase.rpc('admin_dashboard_stats'),
    supabase.from('orders').select('*').order('created_at', { ascending: false }).limit(8),
    supabase
      .from('product_variants')
      .select('id, size, color, stock, product:products!inner(id, name, deleted_at)')
      .eq('is_active', true)
      .is('product.deleted_at', null)
      .lte('stock', 3)
      .order('stock')
      .limit(10),
  ]);

  const stats = (statsRes.data ?? {}) as Partial<Stats>;
  const orders = (ordersRes.data ?? []) as Order[];
  const lowStock = (lowRes.data ?? []) as unknown as LowStockRow[];

  const cards = [
    { label: 'Produtos ativos', value: stats.products_active ?? 0, hint: `${stats.products_hidden ?? 0} ocultos`, Icon: Package, href: '/admin/produtos' },
    { label: 'Variantes esgotadas', value: stats.variants_out ?? 0, hint: `${stats.variants_low ?? 0} com estoque baixo`, Icon: PackageX, href: '/admin/produtos?estoque=esgotado', alert: (stats.variants_out ?? 0) > 0 },
    { label: 'Pedidos', value: stats.orders_total ?? 0, hint: `${stats.orders_open ?? 0} em aberto · ${stats.orders_today ?? 0} hoje`, Icon: ClipboardList, href: '/admin/pedidos' },
    { label: 'Categorias ativas', value: stats.categories_active ?? 0, hint: 'Gerir categorias', Icon: Layers, href: '/admin/categorias' },
    { label: 'Vendas confirmadas', value: formatPrice(stats.revenue_confirmed ?? 0), hint: 'Confirmado → Concluído', Icon: DollarSign, href: '/admin/pedidos?estado=concluido' },
  ];

  return (
    <>
      <PageHeader title="Painel" description="Visão geral da loja em tempo real." />
      {statsRes.error && (
        <p className="mb-6 flex items-center gap-2 rounded-xl border border-danger/30 bg-danger/10 p-3 text-sm text-red-300">
          <AlertCircle className="size-4" /> Não foi possível carregar os indicadores: {statsRes.error.message}
        </p>
      )}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        {cards.map(({ label, value, hint, Icon, href, alert }) => (
          <Link key={label} href={href} className={`card p-5 transition hover:border-gold/40 ${alert ? 'border-danger/40' : ''}`}>
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide text-muted uppercase">{label}</span>
              <Icon className={`size-4 ${alert ? 'text-red-300' : 'text-gold'}`} />
            </div>
            <p className="mt-3 text-2xl font-bold tabular-nums">{value}</p>
            <p className="mt-1 text-xs text-muted">{hint}</p>
          </Link>
        ))}
      </div>

      <div className="mt-8 grid gap-6 lg:grid-cols-[1fr_360px]">
        <section className="card overflow-hidden">
          <header className="flex items-center justify-between border-b border-line px-5 py-4">
            <h2 className="font-semibold">Pedidos recentes</h2>
            <Link href="/admin/pedidos" className="text-xs font-semibold text-gold">Ver todos</Link>
          </header>
          {orders.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">Ainda não há pedidos.</p>
          ) : (
            <ul className="divide-y divide-line">
              {orders.map((o) => (
                <li key={o.id}>
                  <Link href={`/admin/pedidos/${o.id}`} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.02]">
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold">{o.code} <span className="font-normal text-muted">· {o.customer_name}</span></p>
                      <p className="text-xs text-muted">{formatDateTime(o.created_at)} · {o.items_count} item(ns)</p>
                    </div>
                    <span className="hidden text-sm font-semibold sm:block">{formatPrice(o.total)}</span>
                    <StatusBadge status={o.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section className="card overflow-hidden">
          <header className="border-b border-line px-5 py-4">
            <h2 className="font-semibold">Estoque crítico</h2>
          </header>
          {lowStock.length === 0 ? (
            <p className="p-8 text-center text-sm text-muted">Tudo abastecido. 👑</p>
          ) : (
            <ul className="divide-y divide-line">
              {lowStock.map((v) => (
                <li key={v.id}>
                  <Link href={`/admin/produtos/${v.product?.id}`} className="flex items-center gap-3 px-5 py-3 hover:bg-white/[0.02]">
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm">{v.product?.name}</span>
                      <span className="text-xs text-muted">{variantLabel(v)}</span>
                    </span>
                    <span className={`rounded-full px-2 py-0.5 text-xs font-bold ${v.stock === 0 ? 'bg-danger/15 text-red-300' : 'bg-amber-500/15 text-amber-300'}`}>
                      {v.stock === 0 ? 'Esgotado' : `${v.stock} un.`}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </>
  );
}
