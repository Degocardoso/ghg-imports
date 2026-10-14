import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ProductGrid } from '@/components/store/ProductCard';
import { ProductGallery } from '@/components/store/ProductGallery';
import { ProductPurchase } from '@/components/store/ProductPurchase';
import { ProductBadge } from '@/components/ui/ProductBadge';
import { CURRENCY, GENDER_LABEL, SITE_URL } from '@/lib/constants';
import { getProductBySlug, getRelatedProducts, getStoreSettings } from '@/lib/data/store';
import { discountPercent } from '@/lib/format';

export const revalidate = 120;

type Params = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: Params }): Promise<Metadata> {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) return { title: 'Produto não encontrado' };
  const description = product.description?.slice(0, 160) ?? `${product.name} — GHD Imports`;
  return {
    title: product.name,
    description,
    alternates: { canonical: `/produto/${product.slug}` },
    openGraph: { title: product.name, description, images: product.images.slice(0, 1) },
  };
}

export default async function ProductPage({ params }: { params: Params }) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);
  if (!product) notFound();

  const [settings, related] = await Promise.all([getStoreSettings(), getRelatedProducts(product)]);
  const pct = discountPercent(product.price, product.compare_at_price);
  const inStock = product.product_variants.some((v) => v.stock > 0);

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.name,
    image: product.images,
    description: product.description ?? undefined,
    brand: product.brand ? { '@type': 'Brand', name: product.brand } : undefined,
    offers: {
      '@type': 'Offer',
      url: `${SITE_URL}/produto/${product.slug}`,
      priceCurrency: CURRENCY,
      price: product.price,
      availability: inStock ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="container-store py-8 lg:py-12">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c') }} />

      <nav className="mb-6 text-xs text-muted" aria-label="Navegação estrutural">
        <Link href="/" className="hover:text-fg">Início</Link>
        <span className="mx-1.5">/</span>
        {product.category && (
          <>
            <Link href={`/catalogo?categoria=${product.category.slug}`} className="hover:text-fg">
              {product.category.name}
            </Link>
            <span className="mx-1.5">/</span>
          </>
        )}
        <span className="text-zinc-300">{product.name}</span>
      </nav>

      <div className="grid gap-10 lg:grid-cols-2 lg:gap-14">
        <ProductGallery images={product.images} name={product.name} />

        <div>
          <div className="mb-4 flex flex-wrap gap-2">
            {product.badge && <ProductBadge kind={product.badge} />}
            {pct > 0 && <ProductBadge kind="desconto" label={`-${pct}% OFF`} />}
            {!inStock && <ProductBadge kind="esgotado" />}
          </div>
          {product.brand && <p className="text-xs font-semibold tracking-[0.2em] text-gold uppercase">{product.brand}</p>}
          <h1 className="mt-2 text-3xl leading-tight font-extrabold tracking-tight sm:text-4xl">{product.name}</h1>
          {product.gender && <p className="mt-2 text-sm text-muted">{GENDER_LABEL[product.gender]}</p>}

          <div className="mt-6">
            <ProductPurchase product={product} whatsappNumber={settings.whatsapp_number} />
          </div>

          {product.description && (
            <div className="mt-10 border-t border-line pt-8">
              <h2 className="mb-3 text-sm font-bold tracking-[0.2em] text-gold uppercase">Descrição</h2>
              <div className="space-y-3 text-sm leading-relaxed whitespace-pre-line text-zinc-300">{product.description}</div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-20">
          <h2 className="mb-6 text-2xl font-bold tracking-tight">Você também pode gostar</h2>
          <ProductGrid products={related} />
        </section>
      )}
    </div>
  );
}
