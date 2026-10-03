import Link from "next/link";
import { buttonStyles, linkStyles } from "@/components/button";
import { Wordmark } from "@/components/wordmark";
import { getCurrentUser } from "@/lib/auth";

// Portada provisional. La tienda pública se construye en la fase 3.
export default async function HomePage() {
  const user = await getCurrentUser();

  return (
    <main className="flex min-h-dvh flex-col justify-between bg-brand px-6 py-8 text-on-brand sm:px-12 sm:py-10">
      <header className="flex items-center justify-between gap-6">
        <Wordmark className="text-sm" />
        {/* Las rutas /auth/* usan <a> y no <Link>: las atiende Auth0, no son páginas de la app. */}
        {user && (
          <div className="flex items-center gap-5 text-sm">
            <span className="hidden text-on-brand-soft sm:inline">{user.email ?? user.name}</span>
            <a href="/auth/logout" className={linkStyles.onBrand}>
              Cerrar sesión
            </a>
          </div>
        )}
      </header>

      <section className="max-w-3xl pb-[6vh]">
        <h1 className="font-display text-4xl leading-[1.05] font-light tracking-tight text-balance motion-safe:animate-unveil sm:text-6xl lg:text-7xl">
          Perfumería internacional.
        </h1>
        <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-on-brand-soft motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-micro)]">
          Estamos preparando la tienda. Muy pronto podrás explorar el catálogo y hacer tu pedido aquí.
        </p>
        <div className="mt-10 motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*2)]">
          {!user && (
            <a href="/auth/login" className={buttonStyles.onBrand}>
              Iniciar sesión
            </a>
          )}
          {user?.role === "admin" && (
            <Link href="/admin" className={buttonStyles.onBrand}>
              Ir al panel
            </Link>
          )}
        </div>
      </section>
    </main>
  );
}
