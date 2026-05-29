import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const authToken = request.cookies.get('auth_token');
  const isLoginPage = request.nextUrl.pathname.startsWith('/login');

  // Se não estiver autenticado e não estiver na página de login, redirecionar
  if (!authToken && !isLoginPage) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  // Se estiver autenticado e tentar acessar a página de login, redirecionar para home
  if (authToken && isLoginPage) {
    return NextResponse.redirect(new URL('/', request.url));
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
