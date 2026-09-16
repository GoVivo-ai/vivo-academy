import { NextResponse, type NextRequest } from "next/server";

/**
 * Protección ligera de rutas: si no hay cookie de sesión, redirige a /login.
 * La verificación real de la sesión ocurre en los layouts de servidor.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession =
    request.cookies.has("authjs.session-token") ||
    request.cookies.has("__Secure-authjs.session-token");

  const isPublic =
    pathname === "/login" ||
    pathname.startsWith("/api/auth") ||
    pathname.startsWith("/api/livekit/webhook") ||
    pathname.startsWith("/certificados/") ||
    pathname.startsWith("/api/certificates/");

  if (!hasSession && !isPublic) {
    const url = new URL("/login", request.url);
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }
  if (hasSession && pathname === "/login") {
    return NextResponse.redirect(new URL("/inicio", request.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico|mp4|pdf)$).*)"],
};
