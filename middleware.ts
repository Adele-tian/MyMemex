import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// 保护需要认证的路径
export function middleware(req: NextRequest) {
  // 定义需要保护的路径
  const protectedPaths = [
    /^\/$/,
    /^\/dashboard/,
    /^\/notes/,
    /^\/settings/,
    /^\/analytics/,
  ];

  const pathname = req.nextUrl.pathname;

  // 检查当前路径是否需要认证保护
  const isProtectedPath = protectedPaths.some(pattern => pattern.test(pathname));

  if (isProtectedPath) {
    // 使用NextAuth中间件保护这些路径
    return withAuth({
      pages: {
        signIn: '/login',
      },
    })(req);
  }

  // 对于不需要认证的路径（如登录、注册页面），直接放行
  return NextResponse.next();
}

// 定义中间件应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - 只有扩展名的公共文件 (_next/static, _next/image, favicon.ico, etc.)
     * - API routes (static assets and public dirs are handled by the server)
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public|login|register|auth).*)',
  ],
};