import Link from "next/link";
import { AdminNav } from "./admin-nav";
import { linkStyles } from "./button";
import { Wordmark } from "./wordmark";

// Marco del panel: cabecera verde con la marca, las secciones y la sesión, y el área de trabajo debajo.
// En el teléfono las secciones bajan a una segunda fila.
export function AdminShell({ userLabel, children }: { userLabel: string; children: React.ReactNode }) {
  return (
    <div className="flex flex-1 flex-col">
      <header className="flex flex-wrap items-center gap-x-10 bg-brand px-4 text-on-brand sm:px-8">
        <Link href="/admin" className="flex h-16 items-center">
          <Wordmark className="text-sm" />
        </Link>
        <div className="order-last w-full sm:order-none sm:w-auto">
          <AdminNav />
        </div>
        <div className="ml-auto flex items-center gap-5 text-sm">
          <span className="hidden text-on-brand-soft md:inline">{userLabel}</span>
          <a href="/auth/logout" className={linkStyles.onBrand}>
            Cerrar sesión
          </a>
        </div>
      </header>
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-12 pb-20 sm:px-8">{children}</main>
    </div>
  );
}
