'use client';

import { createBrowserClient } from '@supabase/ssr';
import type { SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

let browserClient: SupabaseClient | undefined;

/**
 * Cliente para o browser (Client Components).
 * Usa a sessão em cookies — no /admin permite uploads diretos para o Storage,
 * com o RLS a validar que o utilizador é administrador.
 */
export function createClient(): SupabaseClient {
  if (!browserClient) {
    const { url, anonKey } = getSupabaseEnv();
    browserClient = createBrowserClient(url, anonKey);
  }
  return browserClient;
}
