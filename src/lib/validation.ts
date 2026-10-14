import { z } from 'zod';
import {
  BADGES,
  GENDERS,
  LEAD_SOURCES,
  ORDER_STATUSES,
  PAYMENT_PREFERENCES,
  VARIANT_KINDS,
} from '@/types';
import { BRAZIL_STATES, MAX_CART_LINES, MAX_QTY_PER_ITEM } from './constants';
import { onlyDigits } from './format';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
const trimmed = (max: number) => z.string().trim().max(max, { error: `Máximo de ${max} caracteres.` });
/** Texto opcional: string vazia → null. */
const optionalText = (max: number) =>
  z.preprocess((v) => (typeof v === 'string' && v.trim() === '' ? null : v), trimmed(max).nullable().optional())
    .transform((v) => v ?? null);
const digits = z.string().transform(onlyDigits);
const money = z.coerce.number({ error: 'Valor inválido.' }).min(0, { error: 'Não pode ser negativo.' }).max(1_000_000);
const optionalMoney = z.preprocess((v) => (v === '' || v === null || v === undefined ? null : v), money.nullable());
const slug = z
  .string()
  .trim()
  .toLowerCase()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, { error: 'Use apenas letras minúsculas, números e hífens.' })
  .max(80);
const safeUrl = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.url({ protocol: /^https?$/, error: 'URL inválida (use http/https).' }).max(500).nullable().optional(),
).transform((v) => v ?? null);
/** Link interno (/catalogo) ou externo https. */
const href = z.preprocess(
  (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
  z.string().trim().max(300)
    .refine((v) => /^\/(?!\/)/.test(v) || /^https:\/\//.test(v), { error: 'Use um caminho interno (/catalogo) ou URL https.' })
    .nullable().optional(),
).transform((v) => v ?? null);

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (len: number) => {
    let sum = 0;
    for (let i = 0; i < len; i++) sum += Number(cpf[i]) * (len + 1 - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(9) === Number(cpf[9]) && calc(10) === Number(cpf[10]);
}

/** Converte issues do Zod num mapa campo → primeira mensagem. */
export function fieldErrors(error: z.ZodError): Record<string, string> {
  const out: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.join('.') || '_';
    out[key] ??= issue.message;
  }
  return out;
}

// ---------------------------------------------------------------------------
// Checkout (formulário de qualificação do cliente + carrinho)
// ---------------------------------------------------------------------------
export const checkoutCustomerSchema = z
  .object({
    name: trimmed(120).min(3, { error: 'Informe o seu nome completo.' })
      .refine((v) => v.split(/\s+/).length >= 2, { error: 'Informe nome e sobrenome.' }),
    phone: digits.pipe(z.string().regex(/^\d{10,11}$/, { error: 'WhatsApp inválido. Ex.: (11) 98888-7777' })),
    email: z.preprocess(
      (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
      z.email({ error: 'E-mail inválido.' }).max(160).nullable().optional(),
    ).transform((v) => v ?? null),
    document: z.preprocess(
      (v) => (typeof v === 'string' ? onlyDigits(v) || null : v ?? null),
      z.string().refine(isValidCpf, { error: 'CPF inválido.' }).nullable(),
    ),
    delivery_method: z.enum(['entrega', 'retirada'], { error: 'Escolha a forma de entrega.' }),
    postal_code: z.preprocess((v) => (typeof v === 'string' ? onlyDigits(v) || null : null), z.string().length(8, { error: 'CEP inválido.' }).nullable()),
    street: optionalText(160),
    street_number: optionalText(20),
    complement: optionalText(80),
    district: optionalText(80),
    city: optionalText(80),
    state: z.preprocess((v) => (typeof v === 'string' && v ? v.toUpperCase() : null), z.enum(BRAZIL_STATES, { error: 'UF inválida.' }).nullable()),
    payment_preference: z.enum(PAYMENT_PREFERENCES, { error: 'Escolha a forma de pagamento preferida.' }),
    lead_source: z.enum(LEAD_SOURCES).nullable().optional().transform((v) => v ?? null),
    notes: optionalText(500),
    marketing_opt_in: z.boolean().default(false),
    privacy_accepted: z.literal(true, { error: 'É necessário aceitar a política de privacidade.' }),
  })
  .superRefine((data, ctx) => {
    if (data.delivery_method !== 'entrega') return;
    const required: Array<[keyof typeof data, string]> = [
      ['postal_code', 'Informe o CEP.'],
      ['street', 'Informe a rua.'],
      ['street_number', 'Informe o número.'],
      ['district', 'Informe o bairro.'],
      ['city', 'Informe a cidade.'],
      ['state', 'Informe a UF.'],
    ];
    for (const [key, message] of required) {
      if (!data[key]) ctx.addIssue({ code: 'custom', path: [key], message });
    }
  });

export const cartItemSchema = z.object({
  variant_id: z.guid({ error: 'Artigo inválido.' }),
  quantity: z.number().int().min(1).max(MAX_QTY_PER_ITEM),
});

export const checkoutSchema = z.object({
  customer: checkoutCustomerSchema,
  items: z.array(cartItemSchema).min(1, { error: 'O carrinho está vazio.' }).max(MAX_CART_LINES),
});

export type CheckoutInput = z.input<typeof checkoutSchema>;
export type CheckoutCustomer = z.output<typeof checkoutCustomerSchema>;

// ---------------------------------------------------------------------------
// Admin
// ---------------------------------------------------------------------------
export const variantInputSchema = z.object({
  id: z.guid().optional(),
  size: optionalText(30),
  color: optionalText(40),
  sku: optionalText(60),
  price: optionalMoney,
  compare_at_price: optionalMoney,
  stock: z.coerce.number().int({ error: 'Estoque deve ser inteiro.' }).min(0, { error: 'Estoque não pode ser negativo.' }).max(100_000),
  is_active: z.boolean().default(true),
});

export const productInputSchema = z
  .object({
    name: trimmed(140).min(2, { error: 'Nome obrigatório.' }),
    slug,
    description: optionalText(5000),
    brand: optionalText(80),
    category_id: z.preprocess((v) => (v === '' ? null : v), z.guid().nullable()),
    gender: z.preprocess((v) => (v === '' ? null : v), z.enum(GENDERS).nullable()),
    variant_kind: z.enum(VARIANT_KINDS),
    price: money,
    compare_at_price: optionalMoney,
    images: z.array(z.url({ protocol: /^https$/ })).max(12, { error: 'Máximo de 12 imagens.' }),
    badge: z.preprocess((v) => (v === '' ? null : v), z.enum(BADGES).nullable()),
    is_featured: z.boolean(),
    is_active: z.boolean(),
    tags: z.array(trimmed(30).min(1)).max(20),
    variants: z.array(variantInputSchema).min(1, { error: 'Adicione pelo menos uma variante (estoque).' }).max(100),
  })
  .superRefine((p, ctx) => {
    if (p.compare_at_price !== null && p.compare_at_price <= p.price) {
      ctx.addIssue({ code: 'custom', path: ['compare_at_price'], message: 'O preço original deve ser maior que o preço de venda.' });
    }
    const keys = new Set<string>();
    p.variants.forEach((v, i) => {
      const key = `${(v.size ?? '').toLowerCase()}|${(v.color ?? '').toLowerCase()}`;
      if (keys.has(key)) ctx.addIssue({ code: 'custom', path: ['variants', i, 'size'], message: 'Variante duplicada.' });
      keys.add(key);
      if (p.variant_kind !== 'unico' && !v.size) {
        ctx.addIssue({ code: 'custom', path: ['variants', i, 'size'], message: 'Indique o tamanho/numeração/volume.' });
      }
    });
  });
export type ProductInput = z.input<typeof productInputSchema>;

export const categoryInputSchema = z.object({
  id: z.guid().optional(),
  name: trimmed(80).min(1, { error: 'Nome obrigatório.' }),
  slug,
  parent_id: z.preprocess((v) => (v === '' ? null : v), z.guid().nullable()),
  description: optionalText(500),
  image_url: safeUrl,
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
});
export type CategoryInput = z.input<typeof categoryInputSchema>;

const optionalDate = z.preprocess(
  (v) => (v === '' || v === null || v === undefined ? null : v),
  z.coerce.date({ error: 'Data inválida.' }).nullable(),
).transform((d) => (d ? d.toISOString() : null));

export const bannerInputSchema = z.object({
  id: z.guid().optional(),
  title: trimmed(120).min(1, { error: 'Título obrigatório.' }),
  subtitle: optionalText(240),
  eyebrow: optionalText(40),
  cta_label: optionalText(40),
  cta_href: href,
  image_url: z.url({ protocol: /^https$/, error: 'Carregue a imagem do banner.' }),
  mobile_image_url: safeUrl,
  sort_order: z.coerce.number().int().min(0).max(9999),
  is_active: z.boolean(),
  starts_at: optionalDate,
  ends_at: optionalDate,
});
export type BannerInput = z.input<typeof bannerInputSchema>;

export const settingsInputSchema = z.object({
  store_name: trimmed(80).min(2),
  tagline: optionalText(160),
  announcement: optionalText(200),
  whatsapp_number: digits.pipe(
    z.string().regex(/^\d{12,13}$/, { error: 'Use o formato internacional: 55 + DDD + número (ex.: 5511988887777).' }),
  ),
  logo_url: safeUrl,
  contact_email: z.preprocess(
    (v) => (typeof v === 'string' && v.trim() === '' ? null : v),
    z.email({ error: 'E-mail inválido.' }).nullable().optional(),
  ).transform((v) => v ?? null),
  contact_phone: optionalText(30),
  address: optionalText(300),
  business_hours: optionalText(120),
  instagram_url: safeUrl,
  facebook_url: safeUrl,
  tiktok_url: safeUrl,
  about_text: optionalText(5000),
  shipping_policy: optionalText(10000),
  returns_policy: optionalText(10000),
  privacy_policy: optionalText(10000),
  terms_of_service: optionalText(10000),
});
export type SettingsInput = z.input<typeof settingsInputSchema>;

export const orderUpdateSchema = z.object({
  id: z.guid(),
  status: z.enum(ORDER_STATUSES),
  admin_notes: optionalText(2000),
});
