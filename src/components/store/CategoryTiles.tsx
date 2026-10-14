import { Crown } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import type { CategoryNode } from '@/types';

export function CategoryTiles({ categories }: { categories: CategoryNode[] }) {
  if (categories.length === 0) return null;
  return (
    <section className="container-store mt-14">
      <div className="no-scrollbar -mx-4 flex snap-x gap-3 overflow-x-auto px-4 sm:mx-0 sm:grid sm:grid-cols-3 sm:px-0 lg:grid-cols-5">
        {categories.map((cat) => (
          <Link
            key={cat.id}
            href={`/catalogo?categoria=${cat.slug}`}
            className="group relative flex h-36 w-40 shrink-0 snap-start flex-col justify-end overflow-hidden rounded-card border border-line bg-surface p-4 transition hover:border-gold/50 sm:h-44 sm:w-auto"
          >
            {cat.image_url ? (
              <>
                <Image src={cat.image_url} alt="" fill sizes="(max-width: 640px) 160px, 20vw" className="object-cover transition duration-500 group-hover:scale-105" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/40 to-transparent" />
              </>
            ) : (
              <Crown className="absolute top-4 right-4 size-8 text-gold/25 transition group-hover:text-gold/60" />
            )}
            <span className="relative text-base font-semibold">{cat.name}</span>
            <span className="relative text-xs text-gold-light/80">
              {cat.children.length > 0 ? `${cat.children.length} subcategorias` : 'Ver produtos'}
            </span>
          </Link>
        ))}
      </div>
    </section>
  );
}
