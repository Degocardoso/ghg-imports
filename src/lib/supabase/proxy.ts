import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import { getSupabaseEnv } from './env';

/**
 * Renova a sessão do Supabase (cookies) e devolve o utilizador autenticado.
 * Segue o padrão oficial do @supabase/ssr: os cookies renovados são copiados
 * para o pedido e para a resposta, juntamente com os cabeçalhos anti-cache.
 */
export async function updateSession(request: NextRequest) {
  const { url, anonKey } = getSupabaseEnv();
  let response = NextResponse.next({ request });

  const supabase = createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet, headers) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) => response.cookies.set(name, value, options));
        Object.entries(headers ?? {}).forEach(([key, value]) => response.headers.set(key, value));
      },
    },
  });

  // IMPORTANTE: nada entre createServerClient e getClaims (evita logouts aleatórios).
  // getClaims valida a assinatura do JWT (não confia cegamente no cookie).
  const { data } = await supabase.auth.getClaims();
  const userId = typeof data?.claims?.sub === 'string' ? data.claims.sub : null;

  let isAdmin = false;
  if (userId) {
    const { data: row } = await supabase.from('admin_users').select('user_id').eq('user_id', userId).maybeSingle();
    isAdmin = Boolean(row);
  }

  return { response, userId, isAdmin };
}
