'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { cn } from '@/lib/cn';

export interface HeroSlide {
  id: string;
  eyebrow: string | null;
  title: string;
  subtitle: string | null;
  cta_label: string | null;
  cta_href: string | null;
  image_url: string | null;
  mobile_image_url: string | null;
}

/** Copies de conversão usadas enquanto não existem banners no painel. */
export const DEFAULT_SLIDES: HeroSlide[] = [
  {
    id: 'default-1',
    eyebrow: 'Coleção 2026',
    title: 'Vista o manto. Viva a glória.',
    subtitle: 'Camisas de clubes e seleções com acabamento premium — do Brasil para o mundo.',
    cta_label: 'Ver camisas',
    cta_href: '/catalogo?categoria=camisas-de-futebol',
    image_url: null,
    mobile_image_url: null,
  },
  {
    id: 'default-2',
    eyebrow: 'Perfumaria importada',
    title: 'Presença que fica no ar.',
    subtitle: 'Fragrâncias masculinas, femininas e unissex. Escolha o volume ideal e receba em casa.',
    cta_label: 'Descobrir perfumes',
    cta_href: '/catalogo?categoria=perfumes',
    image_url: null,
    mobile_image_url: null,
  },
  {
    id: 'default-3',
    eyebrow: 'Atendimento VIP',
    title: 'Seu estilo, nível realeza.',
    subtitle: 'Tênis, streetwear e acessórios selecionados a dedo. Finalize em 1 minuto pelo WhatsApp.',
    cta_label: 'Explorar novidades',
    cta_href: '/catalogo?ordem=novidades',
    image_url: null,
    mobile_image_url: null,
  },
];

const AUTOPLAY_MS = 6500;

export function HeroCarousel({ slides }: { slides: HeroSlide[] }) {
  const list = slides.length > 0 ? slides : DEFAULT_SLIDES;
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  const go = useCallback((dir: number) => setIndex((i) => (i + dir + list.length) % list.length), [list.length]);

  useEffect(() => {
    if (paused || list.length < 2) return;
    const timer = setInterval(() => go(1), AUTOPLAY_MS);
    return () => clearInterval(timer);
  }, [paused, go, list.length]);

  const slide = list[index] ?? list[0]!;

  return (
    <section
      className="relative isolate overflow-hidden border-b border-line bg-brushed"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carrossel"
      aria-label="Destaques"
    >
      <div className="relative h-[540px] sm:h-[560px] lg:h-[620px]">
        <AnimatePresence mode="wait">
          <motion.div
            key={slide.id}
            className="absolute inset-0"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
          >
            {slide.image_url ? (
              <>
                <picture>
                  {slide.mobile_image_url && <source media="(max-width: 640px)" srcSet={slide.mobile_image_url} />}
                  <Image
                    src={slide.image_url}
                    alt=""
                    fill
                    priority={index === 0}
                    sizes="100vw"
                    className="object-cover"
                  />
                </picture>
                <div className="absolute inset-0 bg-gradient-to-r from-ink via-ink/75 to-ink/10" />
                <div className="absolute inset-0 bg-gradient-to-t from-ink via-transparent to-transparent" />
              </>
            ) : (
              <div className="absolute inset-0 overflow-hidden">
                <div className="absolute top-1/2 right-[-10%] hidden size-[560px] -translate-y-1/2 opacity-90 md:block lg:right-[2%]">
                  <div className="absolute inset-10 rounded-full bg-gold/20 blur-3xl" />
                  <Image src="/brand/logo.jpg" alt="" fill sizes="560px" className="rounded-[3rem] object-cover [mask-image:radial-gradient(circle,black_45%,transparent_72%)]" priority />
                </div>
              </div>
            )}

            <div className="container-store relative flex h-full flex-col justify-center">
              <motion.div
                className="max-w-xl"
                initial={{ y: 24, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ delay: 0.15, duration: 0.6 }}
              >
                {slide.eyebrow && (
                  <span className="mb-5 inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/10 px-3.5 py-1.5 text-[11px] font-bold tracking-[0.2em] text-gold-light uppercase">
                    {slide.eyebrow}
                  </span>
                )}
                <h1 className="text-4xl leading-[1.05] font-extrabold tracking-tight text-balance sm:text-5xl lg:text-6xl">
                  <span className="text-gold-gradient animate-shimmer">{slide.title}</span>
                </h1>
                {slide.subtitle && <p className="mt-5 max-w-lg text-base text-zinc-300 sm:text-lg">{slide.subtitle}</p>}
                {slide.cta_label && slide.cta_href && (
                  <div className="mt-8 flex flex-wrap gap-3">
                    <Link href={slide.cta_href} className="btn-gold px-7 py-3.5 text-base">
                      {slide.cta_label} <ArrowRight className="size-4" />
                    </Link>
                    <Link href="/catalogo" className="btn-outline px-7 py-3.5 text-base">
                      Ver catálogo
                    </Link>
                  </div>
                )}
              </motion.div>
            </div>
          </motion.div>
        </AnimatePresence>

        {list.length > 1 && (
          <div className="absolute inset-x-0 bottom-6 z-10">
            <div className="container-store flex items-center justify-between">
              <div className="flex gap-2">
                {list.map((s, i) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Ir para destaque ${i + 1}`}
                    aria-current={i === index}
                    className={cn('h-1.5 rounded-full transition-all', i === index ? 'w-10 bg-gold' : 'w-4 bg-white/25 hover:bg-white/50')}
                  />
                ))}
              </div>
              <div className="hidden gap-2 sm:flex">
                <button type="button" onClick={() => go(-1)} className="grid size-10 place-items-center rounded-full border border-white/15 bg-ink/50 text-fg backdrop-blur hover:border-gold/60" aria-label="Anterior">
                  <ChevronLeft className="size-5" />
                </button>
                <button type="button" onClick={() => go(1)} className="grid size-10 place-items-center rounded-full border border-white/15 bg-ink/50 text-fg backdrop-blur hover:border-gold/60" aria-label="Seguinte">
                  <ChevronRight className="size-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
