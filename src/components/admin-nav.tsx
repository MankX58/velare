"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const sections = [
  { href: "/admin", label: "Resumen" },
  { href: "/admin/productos", label: "Productos" },
  { href: "/admin/compras", label: "Compras" },
  { href: "/admin/pedidos", label: "Pedidos" },
  { href: "/admin/ventas", label: "Ventas" },
  { href: "/admin/ajustes", label: "Ajustes" },
];

// Cada enlace:
// - se atenúa cuando el cursor está sobre OTRO enlace de la barra (así resalta el que se señala);
// - tiene una línea debajo que crece desde la izquierda al señalarlo y queda fija en la sección actual.
// Entrar es rápido (duration-quick) y volver es más suave (duration-medium).
// El atenuado solo aplica en equipos con cursor: en pantallas táctiles se quedaría pegado tras tocar.
const link =
  "relative flex h-12 shrink-0 items-center sm:h-16 " +
  "transition duration-(--duration-medium) ease-smooth-out " +
  "group-has-[a:hover]/nav:duration-(--duration-quick) [@media(hover:hover)]:group-has-[a:hover]/nav:not-hover:opacity-40 " +
  "after:absolute after:inset-x-0 after:bottom-0 after:h-0.5 after:origin-left after:bg-on-brand " +
  "after:transition-transform after:duration-(--duration-fast) after:ease-smooth-out";

export function AdminNav() {
  const pathname = usePathname();

  return (
    <nav aria-label="Secciones del panel" className="group/nav flex gap-5 overflow-x-auto text-sm sm:gap-6">
      {sections.map(({ href, label }) => {
        // "Resumen" es la raíz del panel: solo está activa en /admin exacto.
        const current = href === "/admin" ? pathname === href : pathname.startsWith(href);
        return (
          <Link
            key={href}
            href={href}
            aria-current={current ? "page" : undefined}
            className={`${link} ${
              current
                ? "text-on-brand after:scale-x-100"
                : "text-on-brand-soft after:scale-x-0 hover:text-on-brand hover:after:scale-x-100"
            }`}
          >
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
