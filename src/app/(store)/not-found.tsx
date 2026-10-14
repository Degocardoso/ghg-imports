import { Crown } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
  return (
    <div className="container-store flex flex-col items-center py-28 text-center">
      <Crown className="size-12 text-gold" />
      <h1 className="mt-6 text-4xl font-extrabold">Página não encontrada</h1>
      <p className="mt-3 text-muted">O produto pode ter esgotado ou o link mudou.</p>
      <Link href="/catalogo" className="btn-gold mt-8">Ver catálogo</Link>
    </div>
  );
}
