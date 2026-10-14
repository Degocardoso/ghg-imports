'use client';

import { ClipboardList, ExternalLink, Image as ImageIcon, LayoutDashboard, LogOut, Menu, Package, Settings, Tags, X } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { logout } from '@/app/admin/_actions/auth';
import { Logo } from '@/components/ui/Logo';
import { cn } from '@/lib/cn';

const NAV = [
  { href: '/admin', label: 'Painel', Icon: LayoutDashboard, exact: true },
  { href: '/admin/pedidos', label: 'Pedidos', Icon: ClipboardList },
  { href: '/admin/produtos', label: 'Produtos', Icon: Package },
  { href: '/admin/categorias', label: 'Categorias', Icon: Tags },
  { href: '/admin/banners', label: 'Banners', Icon: ImageIcon },
  { href: '/admin/configuracoes', label: 'Configurações', Icon: Settings },
];

export function AdminShell({ email, openOrders, children }: { email: string; openOrders: number; children: React.ReactNode }) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [lastPath, setLastPath] = useState(pathname);
  if (pathname !== lastPath) {
    setLastPath(pathname);
    setOpen(false);
  }

  const sidebar = (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-line p-5">
        <Logo href="/admin" size={36} />
        <button type="button" onClick={() => setOpen(false)} className="rounded-full p-2 text-muted lg:hidden" aria-label="Fechar menu">
          <X className="size-5" />
        </button>
      </div>
      <nav className="flex-1 space-y-1 p-3" aria-label="Painel">
        {NAV.map(({ href, label, Icon, exact }) => {
          const active = exact ? pathname === href : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-medium transition',
                active ? 'bg-gold/10 text-gold-light' : 'text-muted hover:bg-white/5 hover:text-fg',
              )}
            >
              <Icon className="size-4.5" />
              {label}
              {href === '/admin/pedidos' && openOrders > 0 && (
                <span className="ml-auto rounded-full bg-gold px-2 py-0.5 text-[10px] font-bold text-ink">{openOrders}</span>
              )}
            </Link>
          );
        })}
      </nav>
      <div className="space-y-1 border-t border-line p-3">
        <Link href="/" target="_blank" className="flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-fg">
          <ExternalLink className="size-4.5" /> Ver loja
        </Link>
        <form action={logout}>
          <button type="submit" className="flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-sm text-muted hover:bg-white/5 hover:text-red-300">
            <LogOut className="size-4.5" /> Sair
          </button>
        </form>
        <p className="truncate px-3 pt-2 text-[11px] text-zinc-500" title={email}>{email}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-[250px_1fr]">
      <aside className="sticky top-0 hidden h-screen border-r border-line bg-surface lg:block">{sidebar}</aside>
      {open && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <div className="absolute inset-0 bg-black/70" onClick={() => setOpen(false)} />
          <aside className="absolute inset-y-0 left-0 w-72 border-r border-line bg-surface">{sidebar}</aside>
        </div>
      )}
      <div className="min-w-0">
        <header className="sticky top-0 z-30 flex h-14 items-center gap-3 border-b border-line bg-ink/90 px-4 backdrop-blur lg:hidden">
          <button type="button" onClick={() => setOpen(true)} className="rounded-full p-2 text-muted" aria-label="Abrir menu">
            <Menu className="size-5" />
          </button>
          <span className="text-sm font-semibold text-gold-light">Painel GHD Imports</span>
        </header>
        <main className="mx-auto max-w-6xl p-4 sm:p-6 lg:p-10">{children}</main>
      </div>
    </div>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: React.ReactNode }) {
  return (
    <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">{title}</h1>
        {description && <p className="mt-1 text-sm text-muted">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}
