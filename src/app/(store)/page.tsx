import { ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { CategoryTiles } from '@/components/store/CategoryTiles';
import { HeroCarousel } from '@/components/store/HeroCarousel';
import { ProductShelf } from '@/components/store/ProductShelf';
import { TrustBar } from '@/components/store/TrustBar';
import { WhatsAppIcon } from '@/components/ui/SocialIcons';
import { getBanners, getCategoryTree, getShelf, getStoreSettings } from '@/lib/data/store';
import { buildWhatsAppUrl } from '@/lib/whatsapp';

// ISR: a montra é regenerada a cada 5 min e imediatamente após alterações no /admin.
export const revalidate = 300;

export default async function HomePage() {
  const [banners, categories, featured, bestSellers, newArrivals, offers, settings] = await Promise.all([
    getBanners(),
    getCategoryTree(),
    getShelf('destaques'),
    getShelf('mais-vendidos'),
    getShelf('novidades'),
    getShelf('ofertas'),
    getStoreSettings(),
  ]);

  return (
    <>
      <HeroCarousel slides={banners} />
      <CategoryTiles categories={categories} />
      <TrustBar />

      <ProductShelf eyebrow="Seleção da casa" title="Destaques" href="/catalogo" products={featured} />
      <ProductShelf eyebrow="Os favoritos dos clientes" title="Mais vendidos" href="/catalogo" products={bestSellers} />

      <section className="container-store mt-20">
        <div className="relative overflow-hidden rounded-3xl border border-gold/25 bg-brushed p-8 sm:p-12">
          <div className="absolute -top-24 -right-24 size-72 rounded-full bg-gold/15 blur-3xl" />
          <div className="relative max-w-2xl">
            <p className="text-[11px] font-bold tracking-[0.25em] text-gold uppercase">Atendimento VIP</p>
            <h2 className="mt-3 text-3xl font-extrabold tracking-tight sm:text-4xl">
              Não achou o que procura? <span className="text-gold-gradient">A gente encontra para você.</span>
            </h2>
            <p className="mt-4 text-zinc-300">
              Encomendas sob medida de camisas, tênis e perfumes. Fale com um especialista e receba uma proposta em minutos.
            </p>
            <a
              href={buildWhatsAppUrl(settings.whatsapp_number, 'Olá! Quero fazer uma encomenda personalizada.')}
              target="_blank"
              rel="noopener noreferrer"
              className="btn-whatsapp mt-7 px-7 py-3.5 text-base"
            >
              <WhatsAppIcon className="size-5" /> Falar com especialista
            </a>
          </div>
        </div>
      </section>

      <ProductShelf eyebrow="Acabou de chegar" title="Novidades" href="/catalogo?ordem=novidades" products={newArrivals} />
      <ProductShelf eyebrow="Preço de realeza" title="Ofertas" href="/catalogo?ordem=menor-preco" products={offers} />

      {featured.length + newArrivals.length === 0 && (
        <section className="container-store mt-20 text-center">
          <p className="text-muted">O catálogo está sendo preparado. Volte em breve!</p>
          <Link href="/catalogo" className="btn-outline mt-4">
            Ver catálogo <ArrowRight className="size-4" />
          </Link>
        </section>
      )}
    </>
  );
}
