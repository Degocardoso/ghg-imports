import 'server-only';

import { createClient as createSupabaseClient, type SupabaseClient } from '@supabase/supabase-js';
import { getSupabaseEnv } from './env';

/**
 * Cliente com a chave service_role — IGNORA o RLS.
 * Uso exclusivo no servidor e restrito à criação de encomendas via
 * `create_order` (função que valida preços e stock dentro da base de dados).
 */
export function createAdminClient(): SupabaseClient {
  const { url } = getSupabaseEnv();
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceKey) {
    throw new Error('SUPABASE_SERVICE_ROLE_KEY não definida (ver .env.example).');
  }
  return createSupabaseClient(url, serviceKey, {
    auth: { persistSession: false, autoRefreshToken: false, detectSessionInUrl: false },
  });
}
