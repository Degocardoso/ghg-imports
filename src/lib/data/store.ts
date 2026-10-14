import 'server-only';

import { cache } from 'react';
import type {
  Banner,
  CatalogProduct,
  Category,
  CategoryNode,
  Gender,
  ProductWithVariants,
  StoreSettings,
} from '@/types';
import { CATALOG_PAGE_SIZE } from '../constants';
import { sortSizes } from '../format';
import { isSupabaseConfigured } from '../supabase/env';
import { createPublicClient } from '../supabase/public';

/**
 * Camada de leitura da vitrine. Cada função trata os erros e devolve um
 * valor por omissão — a loja continua a renderizar mesmo que o Supabase
 * falhe pontualmente (e o build não depende da base de dados).
 */

function logError(scope: string, error: unknown) {
  console.error(`[data:${scope}]`, error instanceof Error ? error.message : error);
}

const DEFAULT_SETTINGS: StoreSettings = {
  id: 1,
  store_name: 'GHD Imports',
  tagline: 'Importados premium. Atendimento VIP.',
  announcement: 'Atendimento personalizado via WhatsApp • Enviamos para todo o Brasil',
  whatsapp_number: '5511999999999',
  logo_url: null,
  contact_email: null,
  contact_phone: null,
  address: null,
  business_hours: 'Seg a Sáb, 9h às 19h',
  instagram_url: null,
  facebook_url: null,
  tiktok_url: null,
  about_text: null,
  shipping_policy: null,
  returns_policy: null,
  privacy_policy: null,
  terms_of_service: null,
};

export const getStoreSettings = cache(async (): Promise<StoreSettings> => {
  if (!isSupabaseConfigured()) return DEFAULT_SETTINGS;
  try {
    const { data, error } = await createPublicClient().from('store_settings').select('*').eq('id', 1).maybeSingle();
    if (error) throw error;
    return (data as StoreSettings | null) ?? DEFAULT_SETTINGS;
  } catch (error) {
    logError('settings', error);
    return DEFAULT_SETTINGS;
  }
});

export const getCategories = cache(async (): Promise<Category[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    const { data, error } = await createPublicClient()
      .from('categories')
      .select('*')
      .eq('is_active', true)
      .order('sort_order')
      .order('name');
    if (error) throw error;
    return (data ?? []) as Category[];
  } catch (error) {
    logError('categories', error);
    return [];
  }
});

/** Árvore de categorias (raiz → subcategorias). */
export const getCategoryTree = cache(async (): Promise<CategoryNode[]> => {
  const categories = await getCategories();
  const roots = categories.filter((c) => !c.parent_id || !categories.some((p) => p.id === c.parent_id));
  return roots.map((root) => ({ ...root, children: categories.filter((c) => c.parent_id === root.id) }));
});

export const getBanners = cache(async (): Promise<Banner[]> => {
  if (!isSupabaseConfigured()) return [];
  try {
    // A janela de datas (starts_at/ends_at) é aplicada pelo RLS.
    const { data, error } = await createPublicClient()
      .from('banners')
      .select('*')
      .eq('is_active', true)
      .order('sort_order');
    if (error) throw error;
    return (data ?? []) as Banner[];
  } catch (error) {
    logError('banners', error);
    return [];
  }
});

export type ShelfKind = 'destaques' | 'mais-vendidos' | 'novidades' | 'ofertas';

/** Prateleiras da página inicial. */
export async function getShelf(kind: ShelfKind, limit = 8): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured()) return [];
  try {
    let query = createPublicClient().from('product_catalog').select('*').eq('is_active', true).limit(limit);
    switch (kind) {
      case 'destaques':
        query = query.or('is_featured.eq.true,badge.eq.destaque').order('updated_at', { ascending: false });
        break;
      case 'mais-vendidos':
        query = query.gt('sales_count', 0).order('sales_count', { ascending: false });
        break;
      case 'novidades':
        query = query.order('created_at', { ascending: false });
        break;
      case 'ofertas':
        query = query
          .or('badge.eq.oferta,max_compare_at_price.not.is.null')
          .order('updated_at', { ascending: false });
        break;
    }
    const { data, error } = await query;
    if (error) throw error;
    return (data ?? []) as CatalogProduct[];
  } catch (error) {
    logError(`shelf:${kind}`, error);
    return [];
  }
}

export type CatalogSort = 'relevancia' | 'novidades' | 'menor-preco' | 'maior-preco';

export interface CatalogFilters {
  categoria?: string;
  genero?: Gender;
  tamanho?: string;
  min?: number;
  max?: number;
  disponivel?: boolean;
  ordem?: CatalogSort;
  q?: string;
  pagina?: number;
}

export interface CatalogResult {
  products: CatalogProduct[];
  total: number;
  page: number;
  pageCount: number;
  sizes: string[];
  category: Category | null;
}

export async function getCatalog(filters: CatalogFilters): Promise<CatalogResult> {
  const page = Math.max(1, filters.pagina ?? 1);
  const empty: CatalogResult = { products: [], total: 0, page, pageCount: 0, sizes: [], category: null };
  if (!isSupabaseConfigured()) return empty;

  try {
    const supabase = createPublicClient();
    const categories = await getCategories();
    const category = filters.categoria ? categories.find((c) => c.slug === filters.categoria) ?? null : null;
    const categoryIds = category
      ? [category.id, ...categories.filter((c) => c.parent_id === category.id).map((c) => c.id)]
      : null;

    const term = filters.q?.trim().slice(0, 80);
    let query = term
      ? supabase.rpc('search_products', { term, max_results: 100 }, { count: 'exact' }).select('*')
      : supabase.from('product_catalog').select('*', { count: 'exact' });

    query = query.eq('is_active', true);
    if (categoryIds) query = query.in('category_id', categoryIds);
    if (filters.genero) query = query.eq('gender', filters.genero);
    if (filters.tamanho) query = query.contains('sizes', [filters.tamanho]);
    if (filters.min !== undefined) query = query.gte('min_price', filters.min);
    if (filters.max !== undefined) query = query.lte('min_price', filters.max);
    if (filters.disponivel) query = query.gt('total_stock', 0);

    switch (filters.ordem ?? 'relevancia') {
      case 'novidades':
        query = query.order('created_at', { ascending: false });
        break;
      case 'menor-preco':
        query = query.order('min_price', { ascending: true });
        break;
      case 'maior-preco':
        query = query.order('min_price', { ascending: false });
        break;
      default:
        query = query
          .order('is_featured', { ascending: false })
          .order('sales_count', { ascending: false })
          .order('created_at', { ascending: false });
    }

    const from = (page - 1) * CATALOG_PAGE_SIZE;
    const { data, error, count } = await query.range(from, from + CATALOG_PAGE_SIZE - 1);
    if (error) throw error;

    // Tamanhos disponíveis no contexto atual (para o filtro)
    let sizesQuery = supabase.from('product_catalog').select('sizes').eq('is_active', true).limit(500);
    if (categoryIds) sizesQuery = sizesQuery.in('category_id', categoryIds);
    const { data: sizeRows } = await sizesQuery;
    const sizes = sortSizes((sizeRows ?? []).flatMap((r: { sizes: string[] | null }) => r.sizes ?? []));

    const total = count ?? 0;
    return {
      products: (data ?? []) as CatalogProduct[],
      total,
      page,
      pageCount: Math.ceil(total / CATALOG_PAGE_SIZE),
      sizes,
      category,
    };
  } catch (error) {
    logError('catalog', error);
    return empty;
  }
}

export const getProductBySlug = cache(async (slug: string): Promise<ProductWithVariants | null> => {
  if (!isSupabaseConfigured()) return null;
  try {
    const { data, error } = await createPublicClient()
      .from('products')
      .select('*, product_variants(*), category:categories(id, name, slug, parent_id)')
      .eq('slug', slug)
      .eq('is_active', true)
      .is('deleted_at', null)
      .maybeSingle();
    if (error) throw error;
    if (!data) return null;
    const product = data as ProductWithVariants;
    product.product_variants = (product.product_variants ?? [])
      .filter((v) => v.is_active)
      .sort((a, b) => a.sort_order - b.sort_order);
    return product;
  } catch (error) {
    logError('product', error);
    return null;
  }
});

export async function getRelatedProducts(product: ProductWithVariants, limit = 4): Promise<CatalogProduct[]> {
  if (!isSupabaseConfigured() || !product.category_id) return [];
  try {
    const { data, error } = await createPublicClient()
      .from('product_catalog')
      .select('*')
      .eq('is_active', true)
      .eq('category_id', product.category_id)
      .neq('id', product.id)
      .gt('total_stock', 0)
      .order('sales_count', { ascending: false })
      .limit(limit);
    if (error) throw error;
    return (data ?? []) as CatalogProduct[];
  } catch (error) {
    logError('related', error);
    return [];
  }
}
