import 'server-only';

import type { SupabaseClient, User } from '@supabase/supabase-js';
import { redirect } from 'next/navigation';
import { createClient } from './supabase/server';

type AdminSession = { user: User; supabase: SupabaseClient };

/**
 * Verificação de administrador para layouts, páginas e Server Actions.
 * Defesa em profundidade: não depende exclusivamente do proxy.
 * getUser() valida o token junto do Supabase Auth.
 */
export async function getAdminSession(): Promise<AdminSession | null> {
  const supabase = await createClient();
  const { data, error } = await supabase.auth.getUser();
  if (error || !data.user) return null;

  const { data: row } = await supabase
    .from('admin_users')
    .select('user_id')
    .eq('user_id', data.user.id)
    .maybeSingle();

  return row ? { user: data.user, supabase } : null;
}

/** Para páginas/layouts: redireciona para o login se não for admin. */
export async function requireAdminPage(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) redirect('/admin/login');
  return session;
}

export class UnauthorizedError extends Error {
  constructor() {
    super('Sessão expirada ou sem permissão. Faça login novamente.');
  }
}

/** Para Server Actions: devolve a sessão de admin ou lança erro. */
export async function requireAdmin(): Promise<AdminSession> {
  const session = await getAdminSession();
  if (!session) throw new UnauthorizedError();
  return session;
}
