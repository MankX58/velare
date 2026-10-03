import Link from "next/link";
import { linkStyles } from "@/components/button";
import { AccountLink, CartLink, navLink } from "@/components/store/header-links";
import { Wordmark } from "@/components/wordmark";

// ponytail: las páginas de la tienda consultan la base de datos en cada visita, así
// un cambio de precio en el panel se ve al instante. Si el tráfico crece, pasar a
// páginas en caché que se refrescan al guardar (revalidatePath).
export const dynamic = "force-dynamic";

// Marco de la tienda pública: cabecera fija, contenido y pie.
export default function StoreLayout({ children }: LayoutProps<"/">) {
  return (
    <>
      <header className="sticky top-0 z-20 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between gap-6 px-4 sm:px-8">
          <Link href="/" aria-label="Velare, inicio">
            <Wordmark className="text-sm" />
          </Link>
          <nav aria-label="Principal" className="group/nav flex items-center gap-5 text-sm sm:gap-8">
            <Link href="/catalogo" className={navLink}>
              Catálogo
            </Link>
            <AccountLink />
            <CartLink />
          </nav>
        </div>
      </header>

      <div className="flex flex-1 flex-col">{children}</div>

      <footer className="border-t border-line">
        <div className="mx-auto max-w-7xl px-4 pt-16 pb-10 sm:px-8">
          <p className="font-display text-[clamp(3.5rem,14vw,11rem)] leading-none font-light tracking-tight text-on-brand">
            Velare
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-between gap-x-8 gap-y-4 text-sm text-ink-soft">
            <p>Perfumes y lociones internacionales. Envíos en Colombia.</p>
            <nav aria-label="Pie de página" className="flex flex-wrap gap-x-6 gap-y-2">
              <Link href="/catalogo" className={linkStyles.default}>
                Catálogo
              </Link>
              <Link href="/carrito" className={linkStyles.default}>
                Carrito
              </Link>
              <Link href="/admin" className={linkStyles.default}>
                Panel
              </Link>
            </nav>
          </div>
        </div>
      </footer>
    </>
  );
}
