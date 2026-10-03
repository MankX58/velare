import { auth0 } from "./lib/auth0";

// Auth0 atiende aquí /auth/login, /auth/logout y /auth/callback, y mantiene la sesión.
// Esto NO decide permisos: cada página del panel comprueba el rol con requireAdmin().
export async function proxy(request: Request) {
  return await auth0.middleware(request);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt).*)"],
};
