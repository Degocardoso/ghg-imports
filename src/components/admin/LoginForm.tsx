'use client';

import { LoaderCircle, Lock } from 'lucide-react';
import { useActionState } from 'react';
import { login, type LoginState } from '@/app/admin/_actions/auth';

const NOTICES: Record<string, string> = {
  'sem-permissao': 'Sua conta não tem permissão de administrador.',
  config: 'Supabase não configurado. Verifique as variáveis de ambiente.',
};

export function LoginForm({ next, notice }: { next?: string; notice?: string }) {
  const [state, action, pending] = useActionState<LoginState, FormData>(login, undefined);
  const message = state?.error ?? (notice ? NOTICES[notice] : undefined);

  return (
    <form action={action} className="space-y-4">
      <input type="hidden" name="next" value={next ?? ''} />
      <div>
        <label htmlFor="email" className="label">E-mail</label>
        <input id="email" name="email" type="email" required autoComplete="email" className="input" />
      </div>
      <div>
        <label htmlFor="password" className="label">Senha</label>
        <input id="password" name="password" type="password" required minLength={6} autoComplete="current-password" className="input" />
      </div>
      {message && <p role="alert" className="rounded-xl border border-danger/30 bg-danger/10 px-3.5 py-2.5 text-sm text-red-300">{message}</p>}
      <button type="submit" disabled={pending} className="btn-gold w-full py-3">
        {pending ? <LoaderCircle className="size-4 animate-spin" /> : <Lock className="size-4" />}
        Entrar no painel
      </button>
    </form>
  );
}
