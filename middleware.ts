import { withAuth } from "next-auth/middleware";

export default withAuth({
  pages: {
    signIn: "/login",
  },
});

// 定义中间件应用的路径
export const config = {
  matcher: [
    /*
     * 匹配所有请求路径，除了:
     * - 只有扩展名的公共文件 (_next/static, _next/image, favicon.ico, etc.)
     * - API routes (static assets and public dirs are handled by the server)
     */
    "/",
    "/dashboard/:path*",
    "/notes/:path*",
    "/settings/:path*",
    "/analytics/:path*",
  ],
};
