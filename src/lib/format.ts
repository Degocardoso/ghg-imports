import { CURRENCY, LOCALE, SIZE_PRESETS } from './constants';

const currency = new Intl.NumberFormat(LOCALE, { style: 'currency', currency: CURRENCY });

export function formatPrice(value: number | string | null | undefined): string {
  return currency.format(Number(value ?? 0));
}

export function formatDateTime(value: string | Date): string {
  return new Intl.DateTimeFormat(LOCALE, {
    dateStyle: 'short',
    timeStyle: 'short',
    timeZone: 'America/Sao_Paulo',
  }).format(new Date(value));
}

/** Percentagem de desconto face ao preço original (0 se não houver desconto). */
export function discountPercent(price: number, compareAt: number | null | undefined): number {
  if (!compareAt || compareAt <= price || compareAt <= 0) return 0;
  return Math.round((1 - price / compareAt) * 100);
}

export function slugify(input: string): string {
  return input
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80);
}

export const onlyDigits = (value: string) => value.replace(/\D/g, '');

/** (11) 98888-7777 */
export function formatPhone(value: string): string {
  const d = onlyDigits(value).replace(/^55(?=\d{10,11}$)/, '');
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return value;
}

export function formatCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d;
}

const SIZE_ORDER = SIZE_PRESETS.vestuario;

/** Ordena tamanhos: PP→XGG, depois numéricos (calçado / ml), depois o resto. */
export function sortSizes(sizes: string[]): string[] {
  const rank = (s: string) => {
    const i = SIZE_ORDER.indexOf(s.toUpperCase());
    if (i >= 0) return [0, i] as const;
    const n = parseFloat(s.replace(',', '.'));
    if (!Number.isNaN(n)) return [1, n] as const;
    return [2, 0] as const;
  };
  return [...new Set(sizes)].sort((a, b) => {
    const [ga, va] = rank(a);
    const [gb, vb] = rank(b);
    return ga - gb || va - vb || a.localeCompare(b, LOCALE);
  });
}

export function variantLabel(v: { size: string | null; color: string | null }): string {
  return [v.size, v.color].filter(Boolean).join(' / ') || 'Único';
}
