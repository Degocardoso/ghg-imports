import 'server-only';

import { createServerClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { cookies } from 'next/headers';
import { getSupabaseEnv } from './env';

/**
 * Cliente com a sessão do utilizador (cookies) para Server Components,
 * Server Actions e Route Handlers. Todas as queries passam pelo RLS
 * com a identidade de quem está autenticado.
 */
export async function createClient(): Promise<SupabaseClient> {
  const { url, anonKey } = getSupabaseEnv();
  const cookieStore = await cookies();

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        } catch {
          // Chamado a partir de um Server Component: os cookies só podem ser
          // escritos em Server Actions/Route Handlers. O proxy (src/proxy.ts)
          // trata da renovação da sessão, por isso é seguro ignorar.
        }
      },
    },
  });
}
