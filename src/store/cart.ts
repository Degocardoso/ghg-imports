'use client';

import { useSyncExternalStore } from 'react';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { MAX_CART_LINES, MAX_QTY_PER_ITEM } from '@/lib/constants';

export interface CartItem {
  variantId: string;
  productId: string;
  slug: string;
  name: string;
  image: string | null;
  variantLabel: string | null;
  price: number;
  compareAtPrice: number | null;
  quantity: number;
  /** Stock conhecido no momento em que foi adicionado/validado. */
  maxStock: number;
  /** Marcado pela validação no servidor quando já não está disponível. */
  unavailable?: boolean;
}

export interface CartValidation {
  variantId: string;
  available: boolean;
  price: number;
  compareAtPrice: number | null;
  stock: number;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
  open: () => void;
  close: () => void;
  addItem: (item: Omit<CartItem, 'quantity'>, quantity?: number) => { ok: boolean; message?: string };
  setQuantity: (variantId: string, quantity: number) => void;
  removeItem: (variantId: string) => void;
  clear: () => void;
  /** Aplica preços/stock atuais devolvidos pelo servidor. Devolve true se algo mudou. */
  applyValidation: (results: CartValidation[]) => boolean;
}

const clampQty = (qty: number, max: number) =>
  Math.max(1, Math.min(Math.floor(qty) || 1, MAX_QTY_PER_ITEM, Math.max(max, 1)));

export const useCartStore = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),

      addItem: (item, quantity = 1) => {
        if (item.maxStock <= 0) return { ok: false, message: 'Esta opção está esgotada.' };
        const items = get().items;
        const existing = items.find((i) => i.variantId === item.variantId);

        if (existing) {
          const next = existing.quantity + quantity;
          const limit = Math.min(item.maxStock, MAX_QTY_PER_ITEM);
          if (existing.quantity >= limit) {
            return { ok: false, message: `Quantidade máxima disponível: ${limit}.` };
          }
          set({
            items: items.map((i) =>
              i.variantId === item.variantId
                ? { ...i, ...item, unavailable: false, quantity: clampQty(next, item.maxStock) }
                : i,
            ),
          });
          return { ok: true };
        }

        if (items.length >= MAX_CART_LINES) {
          return { ok: false, message: `O carrinho aceita até ${MAX_CART_LINES} artigos diferentes.` };
        }
        set({ items: [...items, { ...item, quantity: clampQty(quantity, item.maxStock) }] });
        return { ok: true };
      },

      setQuantity: (variantId, quantity) =>
        set({
          items: get().items.map((i) =>
            i.variantId === variantId ? { ...i, quantity: clampQty(quantity, i.maxStock) } : i,
          ),
        }),

      removeItem: (variantId) => set({ items: get().items.filter((i) => i.variantId !== variantId) }),

      clear: () => set({ items: [] }),

      applyValidation: (results) => {
        const byId = new Map(results.map((r) => [r.variantId, r]));
        let changed = false;
        const items = get().items.map((item) => {
          const r = byId.get(item.variantId);
          if (!r || !r.available || r.stock <= 0) {
            if (!item.unavailable) changed = true;
            return { ...item, unavailable: true };
          }
          const quantity = Math.min(item.quantity, r.stock, MAX_QTY_PER_ITEM);
          if (
            item.price !== r.price ||
            item.compareAtPrice !== r.compareAtPrice ||
            item.maxStock !== r.stock ||
            item.quantity !== quantity ||
            item.unavailable
          ) {
            changed = true;
          }
          return { ...item, price: r.price, compareAtPrice: r.compareAtPrice, maxStock: r.stock, quantity, unavailable: false };
        });
        if (changed) set({ items });
        return changed;
      },
    }),
    {
      name: 'ghd-cart',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ items: state.items }),
    },
  ),
);

/** Totais derivados (preço "de" → descontos → total). */
export function getCartTotals(items: CartItem[]) {
  const valid = items.filter((i) => !i.unavailable);
  const total = valid.reduce((sum, i) => sum + i.price * i.quantity, 0);
  const subtotal = valid.reduce((sum, i) => sum + Math.max(i.compareAtPrice ?? 0, i.price) * i.quantity, 0);
  const count = valid.reduce((sum, i) => sum + i.quantity, 0);
  return { subtotal, discount: subtotal - total, total, count };
}

/** Evita diferenças de hidratação SSR ↔ localStorage. */
export function useCartHydrated(): boolean {
  return useSyncExternalStore(
    (onChange) => useCartStore.persist.onFinishHydration(onChange),
    () => useCartStore.persist.hasHydrated(),
    () => false,
  );
}
