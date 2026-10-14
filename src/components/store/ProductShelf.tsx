import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import type { CatalogProduct } from '@/types';
import { ProductGrid } from './ProductCard';

export function ProductShelf({
  eyebrow,
  title,
  href,
  products,
}: {
  eyebrow: string;
  title: string;
  href: string;
  products: CatalogProduct[];
}) {
  if (products.length === 0) return null;
  return (
    <section className="container-store mt-20">
      <div className="mb-7 flex items-end justify-between gap-4">
        <div>
          <p className="mb-2 text-[11px] font-bold tracking-[0.25em] text-gold uppercase">{eyebrow}</p>
          <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h2>
        </div>
        <Link href={href} className="group flex shrink-0 items-center gap-1.5 text-sm font-semibold text-gold-light hover:text-gold">
          Ver todos <ArrowRight className="size-4 transition group-hover:translate-x-1" />
        </Link>
      </div>
      <ProductGrid products={products} />
    </section>
  );
}
