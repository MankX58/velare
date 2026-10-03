"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { navLink } from "./nav-styles";

// El carrito de la cabecera. Es de cliente porque el carrito vive en el navegador.
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
