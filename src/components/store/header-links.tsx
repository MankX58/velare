"use client";

import { useUser } from "@auth0/nextjs-auth0";
import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useCart } from "@/lib/cart";

// Enlaces de la cabecera que dependen del navegador: la sesión y el carrito.
// Igual que en el panel, los demás enlaces se atenúan al señalar uno (group/nav).
export const navLink =
  "transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/nav:duration-(--duration-quick) " +
  "[@media(hover:hover)]:group-has-[a:hover]/nav:not-hover:opacity-40";

export function AccountLink() {
  const { user, isLoading } = useUser();
  if (isLoading) return null;

  // Las rutas /auth/* usan <a> y no <Link>: las atiende Auth0, no son páginas de la app.
  return user ? (
    <Link href="/pedidos" className={navLink}>
      Pedidos
    </Link>
  ) : (
    <a href="/auth/login" className={navLink}>
      Entrar
    </a>
  );
}

export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/carrito"
      aria-label={count > 0 ? `Carrito, ${count} ${count === 1 ? "producto" : "productos"}` : "Carrito"}
      className={`relative grid size-11 place-items-center ${navLink}`}
    >
      <ShoppingCartSimple size={24} weight="light" aria-hidden />
      {count > 0 && (
        // key: cada vez que cambia la cantidad, el contador vuelve a entrar con un rebote corto.
        <span
          key={count}
          className="absolute top-1 right-0 grid h-4.5 min-w-4.5 place-items-center bg-brand px-1 text-[10px] font-medium text-on-brand tabular-nums motion-safe:animate-pop"
        >
          {count}
        </span>
      )}
    </Link>
  );
}
