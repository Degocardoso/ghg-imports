'use server';

import { redirect } from 'next/navigation';
import { z } from 'zod';
import { createClient } from '@/lib/supabase/server';

const loginSchema = z.object({
  email: z.email(),
  password: z.string().min(6).max(200),
  next: z.string().optional(),
});

export type LoginState = { error?: string } | undefined;

export async function login(_prev: LoginState, formData: FormData): Promise<LoginState> {
  const parsed = loginSchema.safeParse({
    email: formData.get('email'),
    password: formData.get('password'),
    next: formData.get('next') ?? undefined,
  });
  if (!parsed.success) return { error: 'Informe um e-mail e senha válidos.' };

  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithPassword({
    email: parsed.data.email,
    password: parsed.data.password,
  });
  // Mensagem genérica: não revela se o e-mail existe.
  if (error || !data.user) return { error: 'Credenciais inválidas.' };

  const { data: admin } = await supabase.from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!admin) {
    await supabase.auth.signOut();
    return { error: 'Esta conta não tem acesso ao painel.' };
  }

  // Só aceita destinos internos do /admin (evita open redirect).
  const next = parsed.data.next;
  redirect(next && /^\/admin(\/[\w\-/?=&%.]*)?$/.test(next) && !next.startsWith('/admin/login') ? next : '/admin');
}

export async function logout() {
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/admin/login');
}
