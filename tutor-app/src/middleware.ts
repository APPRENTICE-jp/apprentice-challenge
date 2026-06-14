import { NextResponse, type NextRequest } from "next/server";

/**
 * /admin を Basic 認証で保護する。
 * ユーザー名は任意、パスワードは環境変数 ADMIN_PASSWORD と一致する必要がある。
 */
export function middleware(req: NextRequest) {
  const expected = process.env.ADMIN_PASSWORD;

  // 未設定なら管理ページは無効化（誤って全公開しないため 503）
  if (!expected) {
    return new NextResponse(
      "ADMIN_PASSWORD が未設定のため管理ページは無効です。",
      { status: 503 },
    );
  }

  const header = req.headers.get("authorization") ?? "";
  if (header.startsWith("Basic ")) {
    const decoded = atob(header.slice(6));
    const password = decoded.slice(decoded.indexOf(":") + 1);
    if (password === expected) {
      return NextResponse.next();
    }
  }

  return new NextResponse("認証が必要です", {
    status: 401,
    headers: { "WWW-Authenticate": 'Basic realm="admin", charset="UTF-8"' },
  });
}

export const config = {
  matcher: ["/admin/:path*", "/admin"],
};
