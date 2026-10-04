"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { navLink } from "./nav-styles";

const itemStyles = "flex min-h-11 items-center px-4 transition-colors duration-(--duration-quick) hover:bg-surface";

// Menú de la cuenta en la cabecera: un botón con la foto (o la inicial) de la persona que despliega
// sus enlaces. Es de cliente porque se abre y se cierra en el navegador.
export function AccountMenu({
  name,
  email,
  picture,
  isAdmin,
}: {
  name: string | null;
  email: string | null;
  picture: string | null; // foto de Google; si no hay (o no carga) se muestra la inicial
  isAdmin: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pictureFailed, setPictureFailed] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  // Abierto, se cierra al tocar fuera o con Escape.
  useEffect(() => {
    if (!open) return;
    const onPointerDown = (event: PointerEvent) => {
      if (!ref.current?.contains(event.target as Node)) setOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(false);
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [open]);

  const initial = (name ?? email ?? "?").charAt(0).toUpperCase();

  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-label="Tu cuenta"
        aria-expanded={open}
        aria-controls="menu-cuenta"
        onClick={() => setOpen(!open)}
        className={`group/account grid size-11 cursor-pointer place-items-center ${navLink}`}
      >
        {/* Al señalarlo aparece un aro alrededor de la foto. */}
        <span
          aria-hidden
          className="grid size-8 place-items-center overflow-hidden rounded-full bg-brand text-sm font-medium text-on-brand ring-1 ring-transparent ring-offset-2 ring-offset-paper transition-shadow duration-(--duration-fast) ease-smooth-out group-hover/account:ring-brand group-aria-expanded/account:ring-brand"
        >
          {picture && !pictureFailed ? (
            // <img> y no <Image>: la foto viene de los servidores de Google, no de la tienda.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={picture}
              alt=""
              referrerPolicy="no-referrer"
              onError={() => setPictureFailed(true)}
              className="size-full object-cover"
            />
          ) : (
            initial
          )}
        </span>
      </button>
      {open && (
        // onClick: al elegir un enlace el menú se cierra (la cabecera no se recarga al navegar).
        <div
          id="menu-cuenta"
          onClick={() => setOpen(false)}
          className="absolute top-full right-0 z-30 mt-2 w-60 overflow-hidden rounded-xl border border-line bg-paper text-sm shadow-lg motion-safe:animate-disclose"
        >
          <p className="border-b border-line px-4 py-3">
            {name && <span className="block truncate font-medium">{name}</span>}
            <span className="block truncate text-ink-soft">{email}</span>
          </p>
          <Link href="/pedidos" className={itemStyles}>
            Mis pedidos
          </Link>
          <Link href="/cotizar#mis-cotizaciones" className={itemStyles}>
            Mis cotizaciones
          </Link>
          {isAdmin && (
            <Link href="/admin" className={itemStyles}>
              Panel
            </Link>
          )}
          {/* /auth/logout lo atiende Auth0: por eso es <a> y no <Link>. */}
          <a href="/auth/logout" className={`border-t border-line ${itemStyles}`}>
            Cerrar sesión
          </a>
        </div>
      )}
    </div>
  );
}
