'use client';

import { AnimatePresence, motion } from 'framer-motion';
import { ChevronDown, Menu, Search, ShoppingBag, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';
import { getCartTotals, useCartHydrated, useCartStore } from '@/store/cart';
import type { CategoryNode } from '@/types';
import { SearchBox } from './SearchBox';

export function Header({ categories, logoUrl }: { categories: CategoryNode[]; logoUrl: string | null }) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const hydrated = useCartHydrated();
  const items = useCartStore((s) => s.items);
  const openCart = useCartStore((s) => s.open);
  const count = hydrated ? getCartTotals(items).count : 0;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Fecha menus ao mudar de página
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setMenuOpen(false);
    setSearchOpen(false);
  }

  return (
    <header
      className={cn(
        'sticky top-0 z-40 border-b transition-colors duration-300',
        scrolled ? 'border-line bg-ink/85 backdrop-blur-xl' : 'border-transparent bg-ink',
      )}
    >
      <div className="container-store flex h-16 items-center gap-3 lg:h-20 lg:gap-8">
        <button
          type="button"
          onClick={() => setMenuOpen(true)}
          className="-ml-2 rounded-full p-2 text-muted hover:text-fg lg:hidden"
          aria-label="Abrir menu"
        >
          <Menu className="size-5" />
        </button>

        <Logo src={logoUrl} size={40} />

        <nav className="hidden flex-1 items-center gap-1 lg:flex" aria-label="Categorias">
          <Link href="/catalogo" className="rounded-full px-3 py-2 text-sm font-medium text-muted hover:text-fg">
            Novidades
          </Link>
          {categories.slice(0, 5).map((cat) => (
            <div key={cat.id} className="group relative">
              <Link
                href={`/catalogo?categoria=${cat.slug}`}
                className="flex items-center gap-1 rounded-full px-3 py-2 text-sm font-medium text-muted transition hover:text-fg"
              >
                {cat.name}
                {cat.children.length > 0 && <ChevronDown className="size-3.5 transition group-hover:rotate-180" />}
              </Link>
              {cat.children.length > 0 && (
                <div className="invisible absolute top-full left-0 z-50 pt-2 opacity-0 transition group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100">
                  <ul className="min-w-56 rounded-2xl border border-line bg-surface p-2 shadow-2xl shadow-black/60">
                    {cat.children.map((sub) => (
                      <li key={sub.id}>
                        <Link
                          href={`/catalogo?categoria=${sub.slug}`}
                          className="block rounded-xl px-3 py-2 text-sm text-muted hover:bg-white/5 hover:text-gold-light"
                        >
                          {sub.name}
                        </Link>
                      </li>
                    ))}
                    <li className="mt-1 border-t border-line pt-1">
                      <Link
                        href={`/catalogo?categoria=${cat.slug}`}
                        className="block rounded-xl px-3 py-2 text-xs font-semibold text-gold hover:bg-white/5"
                      >
                        Ver tudo em {cat.name}
                      </Link>
                    </li>
                  </ul>
                </div>
              )}
            </div>
          ))}
        </nav>

        <div className="ml-auto flex items-center gap-1 lg:ml-0">
          <SearchBox className="hidden w-72 md:block xl:w-80" />
          <button
            type="button"
            onClick={() => setSearchOpen((v) => !v)}
            className="rounded-full p-2.5 text-muted hover:text-fg md:hidden"
            aria-label="Pesquisar"
            aria-expanded={searchOpen}
          >
            <Search className="size-5" />
          </button>
          <button
            type="button"
            onClick={openCart}
            className="relative rounded-full p-2.5 text-muted transition hover:text-gold-light"
            aria-label={`Abrir carrinho (${count} ${count === 1 ? 'item' : 'itens'})`}
          >
            <ShoppingBag className="size-5" />
            <AnimatePresence>
              {count > 0 && (
                <motion.span
                  key={count}
                  initial={{ scale: 0.4, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  exit={{ scale: 0.4, opacity: 0 }}
                  className="absolute -top-0.5 -right-0.5 grid min-w-5 place-items-center rounded-full bg-gold-gradient px-1 text-[10px] font-bold text-ink"
                >
                  {count}
                </motion.span>
              )}
            </AnimatePresence>
          </button>
        </div>
      </div>

      {searchOpen && (
        <div className="container-store pb-3 md:hidden">
          <SearchBox onNavigate={() => setSearchOpen(false)} />
        </div>
      )}

      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm lg:hidden"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setMenuOpen(false)}
            />
            <motion.aside
              className="fixed inset-y-0 left-0 z-50 flex w-[85%] max-w-sm flex-col border-r border-line bg-brushed lg:hidden"
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              aria-label="Menu"
            >
              <div className="flex items-center justify-between border-b border-line p-4">
                <Logo src={logoUrl} size={36} />
                <button type="button" onClick={() => setMenuOpen(false)} className="rounded-full p-2 text-muted" aria-label="Fechar menu">
                  <X className="size-5" />
                </button>
              </div>
              <nav className="scrollbar-thin flex-1 overflow-y-auto p-4" aria-label="Categorias">
                <Link href="/catalogo" className="block rounded-xl px-3 py-3 font-semibold text-gold-light">
                  Ver todo o catálogo
                </Link>
                {categories.map((cat) => (
                  <details key={cat.id} className="group border-b border-line/60">
                    <summary className="flex cursor-pointer list-none items-center justify-between px-3 py-3 font-medium">
                      {cat.name}
                      {cat.children.length > 0 && <ChevronDown className="size-4 text-muted transition group-open:rotate-180" />}
                    </summary>
                    <ul className="pb-2 pl-3">
                      <li>
                        <Link href={`/catalogo?categoria=${cat.slug}`} className="block px-3 py-2 text-sm text-gold">
                          Ver tudo
                        </Link>
                      </li>
                      {cat.children.map((sub) => (
                        <li key={sub.id}>
                          <Link href={`/catalogo?categoria=${sub.slug}`} className="block px-3 py-2 text-sm text-muted">
                            {sub.name}
                          </Link>
                        </li>
                      ))}
                    </ul>
                  </details>
                ))}
              </nav>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </header>
  );
}
