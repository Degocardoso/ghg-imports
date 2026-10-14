import type { Metadata } from 'next';
import { LoginForm } from '@/components/admin/LoginForm';
import { Logo } from '@/components/ui/Logo';

export const metadata: Metadata = { title: 'Entrar' };

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ next?: string; erro?: string }> }) {
  const { next, erro } = await searchParams;
  return (
    <div className="grid min-h-screen place-items-center bg-brushed p-4">
      <div className="w-full max-w-sm">
        <div className="mb-8 flex justify-center">
          <Logo href="/" size={64} />
        </div>
        <div className="card p-6 shadow-gold">
          <h1 className="text-xl font-bold">Painel administrativo</h1>
          <p className="mb-6 text-sm text-muted">Acesso restrito à equipe GHD Imports.</p>
          <LoginForm next={next} notice={erro} />
        </div>
      </div>
    </div>
  );
}
