'use client';

import { CircleCheck, Copy } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useMemo, useState, useSyncExternalStore } from 'react';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { formatPrice } from '@/lib/format';
import type { CreatedOrder } from '@/types';
import { LAST_ORDER_KEY } from './CheckoutForm';

interface LastOrder {
  order: CreatedOrder;
  whatsappUrl: string;
}

const subscribe = () => () => {};
function readLastOrder(): string | null {
  try {
    return sessionStorage.getItem(LAST_ORDER_KEY);
  } catch {
    return null;
  }
}

/**
 * Confirmação após o registo. Em dispositivos móveis abre o WhatsApp
 * automaticamente; em desktop o cliente clica no botão (evita bloqueio de pop-ups).
 */
export function OrderSuccess({ code }: { code: string | null }) {
  const raw = useSyncExternalStore(subscribe, readLastOrder, () => null);
  const order = useMemo(() => {
    if (!raw) return null;
    try {
      const data = JSON.parse(raw) as LastOrder;
      return !code || data.order.code === code ? data : null;
    } catch {
      return null;
    }
  }, [raw, code]);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    if (!order) return;
    const isTouch = window.matchMedia('(pointer: coarse)').matches;
    if (!isTouch) return;
    const timer = setTimeout(() => window.location.assign(order.whatsappUrl), 1200);
    return () => clearTimeout(timer);
  }, [order]);

  return (
    <div className="mx-auto max-w-xl py-16 text-center">
      <span className="mx-auto mb-6 grid size-20 place-items-center rounded-full bg-success/15 text-success">
        <CircleCheck className="size-10" />
      </span>
      <p className="text-xs font-bold tracking-[0.25em] text-gold uppercase">Pedido registrado</p>
      <h1 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
        {order ? (
          <>
            Seu pedido <span className="text-gold-gradient">{order.order.code}</span> foi recebido!
          </>
        ) : (
          'Pedido recebido!'
        )}
      </h1>
      <p className="mt-4 text-muted">
        Último passo: envie a mensagem no WhatsApp para a nossa equipe confirmar estoque, frete e pagamento.
      </p>

      {order ? (
        <>
          <div className="card mt-8 p-5 text-left">
            <ul className="space-y-2 text-sm">
              {order.order.items.map((item, i) => (
                <li key={i} className="flex justify-between gap-4">
                  <span className="text-zinc-300">
                    {item.quantity}× {item.product_name}
                    {item.variant_label && <span className="text-muted"> ({item.variant_label})</span>}
                  </span>
                  <span className="shrink-0">{formatPrice(item.line_total)}</span>
                </li>
              ))}
            </ul>
            <div className="mt-4 flex justify-between border-t border-line pt-4 font-bold">
              <span>Total</span>
              <span className="text-gold-light">{formatPrice(order.order.total)}</span>
            </div>
          </div>
          <a href={order.whatsappUrl} target="_blank" rel="noopener noreferrer" className="btn-whatsapp mt-8 w-full py-4 text-base">
            <WhatsAppIcon className="size-5" /> Enviar pedido no WhatsApp
          </a>
          <button
            type="button"
            onClick={async () => {
              try {
                await navigator.clipboard.writeText(order.order.code);
                setCopied(true);
              } catch {
                setCopied(false);
              }
            }}
            className="btn-ghost mt-3"
          >
            <Copy className="size-4" /> {copied ? 'Código copiado!' : `Copiar código ${order.order.code}`}
          </button>
        </>
      ) : (
        <p className="mt-8 text-sm text-muted">
          Se o WhatsApp não abriu, fale conosco informando o código do pedido{code ? ` ${code}` : ''}.
        </p>
      )}

      <Link href="/catalogo" className="mt-8 inline-block text-sm font-semibold text-gold hover:underline">
        Continuar comprando
      </Link>
    </div>
  );
}
