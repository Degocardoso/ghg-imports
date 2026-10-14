import Image from 'next/image';
import Link from 'next/link';
import { Price } from '@/components/ui/Price';
import { ProductBadge } from '@/components/ui/ProductBadge';
import { discountPercent } from '@/lib/format';
import type { CatalogProduct } from '@/types';

export function ProductCard({ product, priority }: { product: CatalogProduct; priority?: boolean }) {
  const [cover, hover] = product.images;
  const soldOut = product.total_stock <= 0;
  const pct = discountPercent(product.min_price, product.max_compare_at_price);
  const hasRange = product.variant_count > 1 && product.min_price < product.price;

  return (
    <Link
      href={`/produto/${product.slug}`}
      className="group relative flex flex-col overflow-hidden rounded-card border border-line bg-surface transition duration-300 hover:-translate-y-1 hover:border-gold/40 hover:shadow-gold"
    >
      <div className="relative aspect-[4/5] overflow-hidden bg-surface-2">
        {cover ? (
          <>
            <Image
              src={cover}
              alt={product.name}
              fill
              priority={priority}
              sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
              className={`object-cover transition duration-500 group-hover:scale-105 ${hover ? 'group-hover:opacity-0' : ''} ${soldOut ? 'opacity-50 grayscale' : ''}`}
            />
            {hover && (
              <Image
                src={hover}
                alt=""
                fill
                sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
                className="object-cover opacity-0 transition duration-500 group-hover:scale-105 group-hover:opacity-100"
              />
            )}
          </>
        ) : (
          <div className="grid h-full place-items-center text-xs text-muted">Sem imagem</div>
        )}

        <div className="absolute top-3 left-3 flex flex-col items-start gap-1.5">
          {soldOut ? (
            <ProductBadge kind="esgotado" />
          ) : (
            <>
              {product.badge && <ProductBadge kind={product.badge} />}
              {pct > 0 && <ProductBadge kind="desconto" label={`-${pct}%`} />}
            </>
          )}
        </div>
      </div>

      <div className="flex flex-1 flex-col gap-2 p-3.5 sm:p-4">
        {product.brand && <p className="text-[10px] font-semibold tracking-[0.18em] text-gold uppercase">{product.brand}</p>}
        <h3 className="line-clamp-2 text-sm leading-snug font-medium text-zinc-100 group-hover:text-white">{product.name}</h3>
        <Price price={product.min_price} compareAt={product.max_compare_at_price} size="md" showPercent={false} fromLabel={hasRange} className="mt-auto" />
        {!soldOut && product.sizes.length > 0 && (
          <p className="truncate text-[11px] text-muted">{product.sizes.slice(0, 6).join(' · ')}</p>
        )}
      </div>
    </Link>
  );
}

export function ProductGrid({ products }: { products: CatalogProduct[] }) {
  return (
    <div className="grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:grid-cols-4">
      {products.map((p, i) => (
        <ProductCard key={p.id} product={p} priority={i < 4} />
      ))}
    </div>
  );
}
