import type { Badge, Gender, LeadSource, OrderStatus, PaymentPreference, VariantKind } from '@/types';

export const LOCALE = 'pt-BR';
export const CURRENCY = 'BRL';
export const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000').replace(/\/$/, '');

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  aguardando_contato: 'Aguardando contato',
  em_negociacao: 'Em negociação',
  confirmado: 'Confirmado',
  pago: 'Pago',
  enviado: 'Enviado',
  concluido: 'Concluído',
  cancelado: 'Cancelado',
};

/** Classes Tailwind por estado (painel admin). */
export const ORDER_STATUS_STYLE: Record<OrderStatus, string> = {
  aguardando_contato: 'bg-amber-500/15 text-amber-300 ring-amber-500/30',
  em_negociacao: 'bg-sky-500/15 text-sky-300 ring-sky-500/30',
  confirmado: 'bg-gold/15 text-gold-light ring-gold/30',
  pago: 'bg-emerald-500/15 text-emerald-300 ring-emerald-500/30',
  enviado: 'bg-indigo-500/15 text-indigo-300 ring-indigo-500/30',
  concluido: 'bg-success/15 text-success ring-success/30',
  cancelado: 'bg-red-500/15 text-red-300 ring-red-500/30',
};

export const BADGE_LABEL: Record<Badge, string> = {
  lancamento: 'Lançamento',
  oferta: 'Oferta',
  destaque: 'Destaque',
};

export const GENDER_LABEL: Record<Gender, string> = {
  masculino: 'Masculino',
  feminino: 'Feminino',
  unissex: 'Unissex',
  infantil: 'Infantil',
};

export const VARIANT_KIND_LABEL: Record<VariantKind, { option: string; admin: string }> = {
  vestuario: { option: 'Tamanho', admin: 'Vestuário (PP–XGG)' },
  calcado: { option: 'Numeração', admin: 'Calçado (numeração)' },
  volume: { option: 'Volume', admin: 'Perfume (ml)' },
  unico: { option: 'Opção', admin: 'Tamanho único' },
};

export const SIZE_PRESETS: Record<VariantKind, string[]> = {
  vestuario: ['PP', 'P', 'M', 'G', 'GG', 'XG', 'XGG'],
  calcado: ['34', '35', '36', '37', '38', '39', '40', '41', '42', '43', '44', '45'],
  volume: ['30 ml', '50 ml', '75 ml', '100 ml', '150 ml', '200 ml'],
  unico: [],
};

export const PAYMENT_LABEL: Record<PaymentPreference, string> = {
  pix: 'Pix',
  cartao: 'Cartão de crédito',
  boleto: 'Boleto',
  dinheiro: 'Dinheiro (retirada)',
};

export const LEAD_SOURCE_LABEL: Record<LeadSource, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  google: 'Google',
  indicacao: 'Indicação de amigo',
  whatsapp: 'Grupo / status do WhatsApp',
  cliente: 'Já sou cliente',
  outro: 'Outro',
};

export const BRAZIL_STATES = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA',
  'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
] as const;

export const CATALOG_PAGE_SIZE = 24;
export const MAX_QTY_PER_ITEM = 20;
export const MAX_CART_LINES = 30;
