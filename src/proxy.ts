import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function proxy(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Se o usuário acessar a tela de login solicitando reset ou logout, limpa o cookie
  if (isLoginPage && (request.nextUrl.searchParams.has('reset') || request.nextUrl.searchParams.has('logout'))) {
    const response = NextResponse.next();
    response.cookies.delete('auth_token');
    return response;
  }

  // Se não estiver autenticado e não estiver na página de login, redirecionar
  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Aplica nas rotas exceto:
     * - api (rotas de API)
     * - _next/static (arquivos estáticos e CSS)
     * - _next/image (arquivos de imagem otimizados)
     * - favicon.ico (ícone)
     * - logo-devlog.png (logotipo público)
     * - icon.png (favicon dinâmico do Next.js)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|logo-devlog.png|icon.png).*)',
  ],
};
