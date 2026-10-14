'use client';

import { CircleCheck, ShoppingBag, Zap } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Price } from '@/components/ui/Price';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { cn } from '@/lib/cn';
import { VARIANT_KIND_LABEL } from '@/lib/constants';
import { sortSizes, variantLabel } from '@/lib/format';
import { createClient } from '@/lib/supabase/client';
import { buildWhatsAppUrl } from '@/lib/whatsapp';
import { useCartStore } from '@/store/cart';
import type { ProductVariant, ProductWithVariants } from '@/types';
import { QuantityControl } from './CartDrawer';

interface Props {
  product: ProductWithVariants;
  whatsappNumber: string;
}

export function ProductPurchase({ product, whatsappNumber }: Props) {
  const router = useRouter();
  const addItem = useCartStore((s) => s.addItem);
  const openCart = useCartStore((s) => s.open);

  const [variants, setVariants] = useState<ProductVariant[]>(product.product_variants);
  const [selectedId, setSelectedId] = useState<string | null>(() => {
    const only = product.product_variants.length === 1 ? product.product_variants[0] : undefined;
    return only && only.stock > 0 ? only.id : null;
  });
  const [quantity, setQuantity] = useState(1);
  const [feedback, setFeedback] = useState<{ type: 'ok' | 'error'; text: string } | null>(null);

  // Stock em tempo real (Supabase Realtime, sujeito ao RLS)
  useEffect(() => {
    let supabase: ReturnType<typeof createClient>;
    try {
      supabase = createClient();
    } catch {
      return;
    }
    const channel = supabase
      .channel(`variants:${product.id}`)
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'product_variants', filter: `product_id=eq.${product.id}` },
        (payload) => {
          const updated = payload.new as ProductVariant;
          setVariants((list) => list.map((v) => (v.id === updated.id ? { ...v, ...updated } : v)));
        },
      )
      .subscribe();
    return () => {
      supabase.removeChannel(channel);
    };
  }, [product.id]);

  const colors = useMemo(() => [...new Set(variants.map((v) => v.color).filter(Boolean))] as string[], [variants]);
  const [color, setColor] = useState<string | null>(colors.length === 1 ? colors[0]! : null);
  const visible = colors.length > 1 && color ? variants.filter((v) => v.color === color) : variants;
  const ordered = useMemo(() => {
    const order = sortSizes(visible.map((v) => v.size ?? ''));
    return [...visible].sort((a, b) => order.indexOf(a.size ?? '') - order.indexOf(b.size ?? ''));
  }, [visible]);

  const selected = variants.find((v) => v.id === selectedId) ?? null;
  const price = Number(selected?.price ?? product.price);
  const compareAt = selected?.compare_at_price ?? product.compare_at_price;
  const stock = selected?.stock ?? 0;
  const totalStock = variants.reduce((s, v) => s + v.stock, 0);
  const needsSelection = product.variant_kind !== 'unico' || variants.length > 1;
  const optionLabel = VARIANT_KIND_LABEL[product.variant_kind].option;
  const effectiveQty = Math.min(quantity, Math.max(stock, 1));

  const add = (goToCheckout: boolean) => {
    setFeedback(null);
    if (!selected) {
      setFeedback({ type: 'error', text: `Selecione ${optionLabel.toLowerCase()} para continuar.` });
      return;
    }
    const result = addItem(
      {
        variantId: selected.id,
        productId: product.id,
        slug: product.slug,
        name: product.name,
        image: product.images[0] ?? null,
        variantLabel: needsSelection ? variantLabel(selected) : null,
        price,
        compareAtPrice: compareAt && Number(compareAt) > price ? Number(compareAt) : null,
        maxStock: selected.stock,
      },
      effectiveQty,
    );
    if (!result.ok) {
      setFeedback({ type: 'error', text: result.message ?? 'Não foi possível adicionar.' });
      return;
    }
    if (goToCheckout) router.push('/checkout');
    else {
      setFeedback({ type: 'ok', text: 'Adicionado ao carrinho!' });
      openCart();
    }
  };

  const question = buildWhatsAppUrl(
    whatsappNumber,
    `Olá! Tenho interesse no produto "${product.name}"${selected ? ` (${variantLabel(selected)})` : ''}. Pode me ajudar?`,
  );

  return (
    <div className="space-y-6">
      <Price price={price} compareAt={compareAt} size="lg" />

      {colors.length > 1 && (
        <fieldset>
          <legend className="label">Cor {color && <span className="text-fg normal-case">— {color}</span>}</legend>
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => {
                  setColor(c);
                  setSelectedId(null);
                }}
                className={cn(
                  'rounded-full border px-4 py-2 text-sm transition',
                  c === color ? 'border-gold bg-gold/10 text-gold-light' : 'border-line text-muted hover:border-zinc-500',
                )}
              >
                {c}
              </button>
            ))}
          </div>
        </fieldset>
      )}

      {needsSelection && (
        <fieldset>
          <legend className="label">
            {optionLabel} <span className="text-gold">*</span>
          </legend>
          <div className="flex flex-wrap gap-2">
            {ordered.map((v) => {
              const out = v.stock <= 0;
              const isSelected = v.id === selectedId;
              return (
                <button
                  key={v.id}
                  type="button"
                  disabled={out}
                  onClick={() => {
                    setSelectedId(v.id);
                    setQuantity(1);
                    setFeedback(null);
                  }}
                  aria-pressed={isSelected}
                  className={cn(
                    'relative min-w-14 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
                    isSelected && 'border-gold bg-gold/10 text-gold-light shadow-gold',
                    !isSelected && !out && 'border-line text-zinc-200 hover:border-zinc-500',
                    out && 'cursor-not-allowed border-line/50 text-zinc-600 line-through',
                  )}
                  title={out ? 'Esgotado' : undefined}
                >
                  {colors.length > 1 ? v.size ?? 'Único' : variantLabel(v)}
                </button>
              );
            })}
          </div>
        </fieldset>
      )}

      <div aria-live="polite" className="min-h-5 text-sm">
        {totalStock <= 0 ? (
          <span className="font-semibold text-red-300">Produto esgotado no momento.</span>
        ) : selected ? (
          stock <= 0 ? (
            <span className="text-red-300">Esta opção acabou de esgotar.</span>
          ) : stock <= 3 ? (
            <span className="font-semibold text-amber-300">🔥 Últimas {stock} unidade(s)!</span>
          ) : (
            <span className="text-success">✓ Em estoque — {stock} disponíveis</span>
          )
        ) : (
          <span className="text-muted">Selecione uma opção para ver a disponibilidade.</span>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <QuantityControl value={effectiveQty} max={Math.max(stock, 1)} onChange={setQuantity} />
        <button
          type="button"
          onClick={() => add(false)}
          disabled={totalStock <= 0 || (selected !== null && stock <= 0)}
          className="btn-outline flex-1 py-3.5"
        >
          <ShoppingBag className="size-4" /> Adicionar ao carrinho
        </button>
      </div>
      <button
        type="button"
        onClick={() => add(true)}
        disabled={totalStock <= 0 || (selected !== null && stock <= 0)}
        className="btn-gold w-full py-4 text-base"
      >
        <Zap className="size-4" /> Comprar agora
      </button>

      {feedback && (
        <p className={cn('flex items-center gap-2 text-sm', feedback.type === 'ok' ? 'text-success' : 'text-red-300')} role="status">
          {feedback.type === 'ok' && <CircleCheck className="size-4" />} {feedback.text}
        </p>
      )}

      <a href={question} target="_blank" rel="noopener noreferrer" className="btn-ghost w-full border border-line">
        <WhatsAppIcon className="size-4 text-success" /> Tirar dúvidas no WhatsApp
      </a>
    </div>
  );
}
