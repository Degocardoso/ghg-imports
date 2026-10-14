import { ArrowLeft } from 'lucide-react';
import type { Metadata } from 'next';
import Image from 'next/image';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { OrderStatusForm } from '@/components/admin/OrderStatusForm';
import { StatusBadge } from '@/components/admin/StatusBadge';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { requireAdminPage } from '@/lib/auth';
import { LEAD_SOURCE_LABEL, ORDER_STATUS_LABEL, PAYMENT_LABEL } from '@/lib/constants';
import { formatCep, formatDateTime, formatPhone, formatPrice } from '@/lib/format';
import { buildWhatsAppUrl, toInternationalBR } from '@/lib/whatsapp';
import type { LeadSource, Order, OrderItem, OrderStatusHistory } from '@/types';

export const metadata: Metadata = { title: 'Pedido' };

export default async function OrderDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const { supabase } = await requireAdminPage();

  const [{ data: orderData }, { data: itemsData }, { data: historyData }] = await Promise.all([
    supabase.from('orders').select('*').eq('id', id).maybeSingle(),
    supabase.from('order_items').select('*').eq('order_id', id).order('created_at'),
    supabase.from('order_status_history').select('*').eq('order_id', id).order('created_at', { ascending: false }),
  ]);
  if (!orderData) notFound();
  const order = orderData as Order;
  const items = (itemsData ?? []) as OrderItem[];
  const history = (historyData ?? []) as OrderStatusHistory[];

  const firstName = order.customer_name.split(' ')[0];
  const contactUrl = buildWhatsAppUrl(
    toInternationalBR(order.customer_phone),
    `Olá, ${firstName}! 👑 Aqui é da GHD Imports, sobre o seu pedido ${order.code} (${formatPrice(order.total)}). Vamos finalizar?`,
  );

  return (
    <>
      <Link href="/admin/pedidos" className="mb-4 inline-flex items-center gap-1.5 text-sm text-muted hover:text-fg">
        <ArrowLeft className="size-4" /> Pedidos
      </Link>
      <div className="mb-8 flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="flex flex-wrap items-center gap-3 text-2xl font-bold sm:text-3xl">
            {order.code} <StatusBadge status={order.status} />
          </h1>
          <p className="mt-1 text-sm text-muted">Recebido em {formatDateTime(order.created_at)}</p>
        </div>
        <a href={contactUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp">
          <WhatsAppIcon className="size-4" /> Falar com o cliente
        </a>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <section className="card overflow-hidden">
            <h2 className="border-b border-line px-5 py-4 text-sm font-semibold tracking-wide text-gold-light uppercase">
              Itens (preços congelados)
            </h2>
            <ul className="divide-y divide-line">
              {items.map((item) => (
                <li key={item.id} className="flex gap-4 px-5 py-4">
                  <span className="relative size-14 shrink-0 overflow-hidden rounded-lg bg-surface-2">
                    {item.image_url && <Image src={item.image_url} alt="" fill sizes="56px" className="object-cover" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-medium">
                      {item.product_id ? (
                        <Link href={`/admin/produtos/${item.product_id}`} className="hover:text-gold-light">{item.product_name}</Link>
                      ) : (
                        item.product_name
                      )}
                    </p>
                    <p className="text-xs text-muted">
                      {[item.variant_label, item.sku && `SKU ${item.sku}`].filter(Boolean).join(' · ') || '—'}
                    </p>
                    <p className="mt-1 text-xs text-muted">
                      {item.quantity} × {formatPrice(item.unit_price)}
                      {item.compare_at_price && <span className="ml-1 line-through">{formatPrice(item.compare_at_price)}</span>}
                    </p>
                  </div>
                  <span className="font-semibold">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="space-y-1.5 border-t border-line bg-surface-2/40 px-5 py-4 text-sm">
              <Row label="Subtotal" value={formatPrice(order.subtotal)} />
              {order.discount_total > 0 && <Row label="Descontos" value={`-${formatPrice(order.discount_total)}`} className="text-success" />}
              <Row label="Frete" value="A combinar" />
              <Row label="Total" value={formatPrice(order.total)} strong />
            </div>
          </section>

          <div className="grid gap-6 md:grid-cols-2">
            <section className="card space-y-2 p-5 text-sm">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gold-light uppercase">Cliente</h2>
              <p className="font-medium">{order.customer_name}</p>
              <p className="text-muted">{formatPhone(order.customer_phone)}</p>
              {order.customer_email && <p className="text-muted">{order.customer_email}</p>}
              {order.customer_document && <p className="text-muted">CPF: {order.customer_document.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</p>}
              <p className="pt-2 text-xs text-muted">
                Pagamento preferido: <span className="text-fg">{order.payment_preference ? PAYMENT_LABEL[order.payment_preference] : '—'}</span>
              </p>
              <p className="text-xs text-muted">
                Origem: <span className="text-fg">{order.lead_source ? LEAD_SOURCE_LABEL[order.lead_source as LeadSource] ?? order.lead_source : '—'}</span>
              </p>
              <p className="text-xs text-muted">
                Aceita marketing: <span className="text-fg">{order.marketing_opt_in ? 'Sim' : 'Não'}</span>
              </p>
            </section>
            <section className="card space-y-1 p-5 text-sm">
              <h2 className="mb-2 text-sm font-semibold tracking-wide text-gold-light uppercase">
                {order.delivery_method === 'entrega' ? 'Entrega' : 'Retirada'}
              </h2>
              {order.delivery_method === 'entrega' ? (
                <>
                  <p>{order.street}, {order.street_number}{order.complement ? ` — ${order.complement}` : ''}</p>
                  <p className="text-muted">{order.district}</p>
                  <p className="text-muted">{order.city}/{order.state}</p>
                  {order.postal_code && <p className="text-muted">CEP {formatCep(order.postal_code)}</p>}
                </>
              ) : (
                <p className="text-muted">Cliente vai retirar pessoalmente.</p>
              )}
              {order.notes && (
                <p className="mt-3 rounded-xl bg-surface-2 p-3 text-xs text-zinc-300">
                  <strong className="block text-muted">Observações do cliente</strong>
                  {order.notes}
                </p>
              )}
            </section>
          </div>
        </div>

        <div className="space-y-6">
          <OrderStatusForm key={`${order.status}-${order.admin_notes ?? ''}`} id={order.id} status={order.status} adminNotes={order.admin_notes} stockCommitted={order.stock_committed} />
          <section className="card p-5">
            <h2 className="mb-4 text-sm font-semibold tracking-wide text-gold-light uppercase">Histórico</h2>
            <ol className="space-y-3 border-l border-line pl-4">
              {history.map((h) => (
                <li key={h.id} className="relative text-sm">
                  <span className="absolute top-1.5 -left-[21px] size-2.5 rounded-full bg-gold" />
                  <p>{h.from_status ? `${ORDER_STATUS_LABEL[h.from_status]} → ` : 'Criado: '}<strong>{ORDER_STATUS_LABEL[h.to_status]}</strong></p>
                  <p className="text-xs text-muted">{formatDateTime(h.created_at)}{h.changed_by ? ' · pela equipe' : ' · pelo site'}</p>
                </li>
              ))}
            </ol>
          </section>
        </div>
      </div>
    </>
  );
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={`flex justify-between ${strong ? 'pt-1 text-base font-bold' : 'text-muted'} ${className ?? ''}`}>
      <span>{label}</span>
      <span className={strong ? 'text-gold-light' : undefined}>{value}</span>
    </div>
  );
}
