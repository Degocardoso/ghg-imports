import { NextResponse, type NextRequest } from 'next/server';
import { updateSession } from '@/lib/supabase/proxy';

/**
 * Proxy (antigo "Middleware" — renomeado no Next.js 16).
 * Primeira barreira do /admin: renova a sessão e redireciona quem não é
 * administrador. As páginas e Server Actions voltam a verificar
 * (requireAdmin) e o RLS garante a última palavra na base de dados.
 */
export async function proxy(request: NextRequest) {
  const { pathname, search } = request.nextUrl;
  const isLoginPage = pathname === '/admin/login';

  let session: Awaited<ReturnType<typeof updateSession>>;
  try {
    session = await updateSession(request);
  } catch (error) {
    console.error('[proxy] falha ao validar sessão', error);
    if (isLoginPage) return NextResponse.next();
    const url = request.nextUrl.clone();
    url.pathname = '/admin/login';
    url.search = '?erro=config';
    return NextResponse.redirect(url);
  }

  const { response, userId, isAdmin } = session;

  const redirectTo = (path: string, params?: Record<string, string>) => {
    const url = request.nextUrl.clone();
    url.pathname = path;
    url.search = params ? `?${new URLSearchParams(params)}` : '';
    const redirect = NextResponse.redirect(url);
    // Preserva cookies de sessão renovados durante o redirecionamento
    response.cookies.getAll().forEach((cookie) => redirect.cookies.set(cookie));
    return redirect;
  };

  if (isLoginPage) {
    return userId && isAdmin ? redirectTo('/admin') : response;
  }

  if (!userId) {
    return redirectTo('/admin/login', { next: `${pathname}${search}` });
  }
  if (!isAdmin) {
    return redirectTo('/admin/login', { erro: 'sem-permissao' });
  }

  return response;
}

export const config = {
  // Só o painel precisa de sessão — a vitrine fica estática/rápida.
  matcher: ['/admin', '/admin/:path*'],
};
