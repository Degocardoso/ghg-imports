'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { Minus, Plus, ShoppingBag, Trash, X } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useEffect } from 'react';
import { Price } from '@/components/ui/Price';
import { formatPrice } from '@/lib/format';
import { getCartTotals, useCartHydrated, useCartStore } from '@/store/cart';

export function CartDrawer() {
  const hydrated = useCartHydrated();
  const { items, isOpen, close, setQuantity, removeItem } = useCartStore();
  const totals = getCartTotals(items);

  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && close();
    document.addEventListener('keydown', onKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close]);

  return (
    <AnimatePresence>
      {isOpen && hydrated && (
        <>
          <motion.div
            className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={close}
          />
          <motion.aside
            role="dialog"
            aria-modal="true"
            aria-label="Carrinho de compras"
            className="fixed inset-y-0 right-0 z-50 flex w-full max-w-md flex-col border-l border-line bg-ink"
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 32, stiffness: 320 }}
          >
            <header className="flex items-center justify-between border-b border-line px-5 py-4">
              <h2 className="flex items-center gap-2 text-lg font-semibold">
                <ShoppingBag className="size-5 text-gold" /> Seu carrinho
                <span className="text-sm font-normal text-muted">({totals.count})</span>
              </h2>
              <button type="button" onClick={close} className="rounded-full p-2 text-muted hover:text-fg" aria-label="Fechar carrinho">
                <X className="size-5" />
              </button>
            </header>

            {items.length === 0 ? (
              <div className="flex flex-1 flex-col items-center justify-center gap-4 p-8 text-center">
                <span className="grid size-16 place-items-center rounded-full bg-gold/10 text-gold">
                  <ShoppingBag className="size-7" />
                </span>
                <p className="text-lg font-semibold">Seu carrinho está vazio</p>
                <p className="text-sm text-muted">Explore os lançamentos e garanta o seu antes que esgote.</p>
                <Link href="/catalogo" onClick={close} className="btn-gold">
                  Explorar catálogo
                </Link>
              </div>
            ) : (
              <>
                <ul className="scrollbar-thin flex-1 divide-y divide-line overflow-y-auto px-5">
                  {items.map((item) => (
                    <li key={item.variantId} className="flex gap-4 py-4">
                      <Link
                        href={`/produto/${item.slug}`}
                        onClick={close}
                        className="relative size-20 shrink-0 overflow-hidden rounded-xl bg-surface-2"
                      >
                        {item.image && <Image src={item.image} alt={item.name} fill sizes="80px" className="object-cover" />}
                      </Link>
                      <div className="flex min-w-0 flex-1 flex-col">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <Link href={`/produto/${item.slug}`} onClick={close} className="line-clamp-2 text-sm font-medium hover:text-gold-light">
                              {item.name}
                            </Link>
                            {item.variantLabel && <p className="mt-0.5 text-xs text-muted">{item.variantLabel}</p>}
                          </div>
                          <button
                            type="button"
                            onClick={() => removeItem(item.variantId)}
                            className="rounded-full p-1.5 text-muted hover:bg-white/5 hover:text-red-300"
                            aria-label={`Remover ${item.name}`}
                          >
                            <Trash className="size-4" />
                          </button>
                        </div>
                        {item.unavailable ? (
                          <p className="mt-2 text-xs font-medium text-red-300">Indisponível — remova para continuar.</p>
                        ) : (
                          <div className="mt-auto flex items-end justify-between pt-2">
                            <QuantityControl
                              value={item.quantity}
                              max={item.maxStock}
                              onChange={(q) => setQuantity(item.variantId, q)}
                            />
                            <Price price={item.price * item.quantity} compareAt={item.compareAtPrice ? item.compareAtPrice * item.quantity : null} size="sm" showPercent={false} className="justify-end" />
                          </div>
                        )}
                      </div>
                    </li>
                  ))}
                </ul>

                <footer className="space-y-3 border-t border-line bg-surface px-5 py-5">
                  {totals.discount > 0 && (
                    <>
                      <Row label="Subtotal" value={formatPrice(totals.subtotal)} />
                      <Row label="Descontos" value={`-${formatPrice(totals.discount)}`} className="text-success" />
                    </>
                  )}
                  <Row label="Total" value={formatPrice(totals.total)} strong />
                  <p className="text-xs text-muted">Frete e prazo combinados no WhatsApp após o pedido.</p>
                  <Link href="/checkout" onClick={close} className="btn-gold w-full py-3.5 text-base">
                    Finalizar pedido
                  </Link>
                  <button type="button" onClick={close} className="btn-ghost w-full">
                    Continuar comprando
                  </button>
                </footer>
              </>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
}

function Row({ label, value, strong, className }: { label: string; value: string; strong?: boolean; className?: string }) {
  return (
    <div className={`flex items-center justify-between ${strong ? 'text-lg font-bold' : 'text-sm text-muted'} ${className ?? ''}`}>
      <span>{label}</span>
      <span className={strong ? 'text-gold-light' : undefined}>{value}</span>
    </div>
  );
}

export function QuantityControl({
  value,
  max,
  onChange,
}: {
  value: number;
  max: number;
  onChange: (value: number) => void;
}) {
  return (
    <div className="inline-flex items-center rounded-full border border-line bg-surface-2">
      <button
        type="button"
        onClick={() => onChange(value - 1)}
        disabled={value <= 1}
        className="grid size-8 place-items-center rounded-full text-muted hover:text-fg disabled:opacity-30"
        aria-label="Diminuir quantidade"
      >
        <Minus className="size-3.5" />
      </button>
      <span className="w-7 text-center text-sm font-semibold tabular-nums" aria-live="polite">
        {value}
      </span>
      <button
        type="button"
        onClick={() => onChange(value + 1)}
        disabled={value >= Math.min(max, 20)}
        className="grid size-8 place-items-center rounded-full text-muted hover:text-fg disabled:opacity-30"
        aria-label="Aumentar quantidade"
      >
        <Plus className="size-3.5" />
      </button>
    </div>
  );
}
