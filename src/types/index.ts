// Tipos de domínio — espelham supabase/migrations/20261014000000_init.sql.
// Para tipos gerados automaticamente: `npx supabase gen types typescript`.

export const ORDER_STATUSES = [
  'aguardando_contato',
  'em_negociacao',
  'confirmado',
  'pago',
  'enviado',
  'concluido',
  'cancelado',
] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const GENDERS = ['masculino', 'feminino', 'unissex', 'infantil'] as const;
export type Gender = (typeof GENDERS)[number];

export const BADGES = ['lancamento', 'oferta', 'destaque'] as const;
export type Badge = (typeof BADGES)[number];

export const VARIANT_KINDS = ['vestuario', 'calcado', 'volume', 'unico'] as const;
export type VariantKind = (typeof VARIANT_KINDS)[number];

export interface Category {
  id: string;
  parent_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  image_url: string | null;
  sort_order: number;
  is_active: boolean;
  created_at: string;
}

export interface CategoryNode extends Category {
  children: Category[];
}

export interface Product {
  id: string;
  category_id: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  gender: Gender | null;
  variant_kind: VariantKind;
  price: number;
  compare_at_price: number | null;
  images: string[];
  badge: Badge | null;
  is_featured: boolean;
  is_active: boolean;
  sales_count: number;
  tags: string[];
  deleted_at?: string | null;
  created_at: string;
  updated_at: string;
}

export interface ProductVariant {
  id: string;
  product_id: string;
  size: string | null;
  color: string | null;
  sku: string | null;
  price: number | null;
  compare_at_price: number | null;
  stock: number;
  sort_order: number;
  is_active: boolean;
}

/** Linha da vista `product_catalog` (produto + agregados das variantes). */
export interface CatalogProduct extends Product {
  category_slug: string | null;
  category_name: string | null;
  parent_category_slug: string | null;
  min_price: number;
  max_compare_at_price: number | null;
  total_stock: number;
  sizes: string[];
  variant_count: number;
}

export interface ProductWithVariants extends Product {
  product_variants: ProductVariant[];
  category: Pick<Category, 'id' | 'name' | 'slug' | 'parent_id'> | null;
}

export interface Banner {
  id: string;
  title: string;
  subtitle: string | null;
  eyebrow: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string;
  mobile_image_url: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at: string | null;
  ends_at: string | null;
}

export interface StoreSettings {
  id: number;
  store_name: string;
  tagline: string | null;
  announcement: string | null;
  whatsapp_number: string;
  logo_url: string | null;
  contact_email: string | null;
  contact_phone: string | null;
  address: string | null;
  business_hours: string | null;
  instagram_url: string | null;
  facebook_url: string | null;
  tiktok_url: string | null;
  about_text: string | null;
  shipping_policy: string | null;
  returns_policy: string | null;
  privacy_policy: string | null;
  terms_of_service: string | null;
  updated_at?: string;
}

export interface Order {
  id: string;
  order_number: number;
  code: string;
  status: OrderStatus;
  customer_name: string;
  customer_phone: string;
  customer_email: string | null;
  customer_document: string | null;
  delivery_method: 'entrega' | 'retirada';
  postal_code: string | null;
  street: string | null;
  street_number: string | null;
  complement: string | null;
  district: string | null;
  city: string | null;
  state: string | null;
  payment_preference: PaymentPreference | null;
  lead_source: string | null;
  notes: string | null;
  marketing_opt_in: boolean;
  subtotal: number;
  discount_total: number;
  total: number;
  items_count: number;
  stock_committed: boolean;
  admin_notes: string | null;
  status_updated_at: string;
  created_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string | null;
  variant_id: string | null;
  product_name: string;
  variant_label: string | null;
  sku: string | null;
  image_url: string | null;
  unit_price: number;
  compare_at_price: number | null;
  quantity: number;
  line_total: number;
}

export interface OrderStatusHistory {
  id: number;
  order_id: string;
  from_status: OrderStatus | null;
  to_status: OrderStatus;
  changed_by: string | null;
  created_at: string;
}

export const PAYMENT_PREFERENCES = ['pix', 'cartao', 'boleto', 'dinheiro'] as const;
export type PaymentPreference = (typeof PAYMENT_PREFERENCES)[number];

export const LEAD_SOURCES = ['instagram', 'tiktok', 'google', 'indicacao', 'whatsapp', 'cliente', 'outro'] as const;
export type LeadSource = (typeof LEAD_SOURCES)[number];

/** Resposta de `create_order` (montantes recalculados e congelados no servidor). */
export interface CreatedOrder {
  id: string;
  code: string;
  status: OrderStatus;
  subtotal: number;
  discount_total: number;
  total: number;
  items_count: number;
  created_at: string;
  items: Array<{
    product_name: string;
    variant_label: string | null;
    sku: string | null;
    unit_price: number;
    compare_at_price: number | null;
    quantity: number;
    line_total: number;
  }>;
}
