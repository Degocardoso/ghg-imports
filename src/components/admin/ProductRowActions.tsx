'use client';

import { Eye, EyeOff, LoaderCircle, Trash } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useTransition } from 'react';
import { setProductActive, softDeleteProduct } from '@/app/admin/_actions/products';

export function ProductRowActions({ id, name, isActive }: { id: string; name: string; isActive: boolean }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const run = (fn: () => Promise<{ ok: boolean; error?: string }>) =>
    startTransition(async () => {
      const res = await fn();
      if (!res.ok) alert(res.error);
      router.refresh();
    });

  if (pending) return <LoaderCircle className="size-4 animate-spin text-gold" />;

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={() => run(() => setProductActive(id, !isActive))}
        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-fg"
        title={isActive ? 'Ocultar da loja' : 'Publicar na loja'}
        aria-label={isActive ? 'Ocultar da loja' : 'Publicar na loja'}
      >
        {isActive ? <Eye className="size-4" /> : <EyeOff className="size-4" />}
      </button>
      <button
        type="button"
        onClick={() => {
          if (confirm(`Eliminar "${name}"? O produto deixa de aparecer na loja e no painel (o histórico de pedidos é preservado).`)) {
            run(() => softDeleteProduct(id));
          }
        }}
        className="rounded-lg p-2 text-muted hover:bg-white/5 hover:text-red-300"
        title="Eliminar"
        aria-label="Eliminar"
      >
        <Trash className="size-4" />
      </button>
    </div>
  );
}
