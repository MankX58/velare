"use client";

import { ShoppingCartSimple } from "@phosphor-icons/react";
import Link from "next/link";
import { useCart } from "@/lib/cart";
import { navLink } from "./nav-styles";

// Una cajita sobre el borde del carrito: invisible en reposo, salta al señalar el carrito.
const cartBox = "absolute top-0.5 size-1 bg-current opacity-0 motion-safe:group-hover/cart:animate-hop";

// El carrito de la cabecera. Es de cliente porque el carrito vive en el navegador.
export function CartLink() {
  const { count } = useCart();

  return (
    <Link
      href="/carrito"
      aria-label={count > 0 ? `Carrito, ${count} ${count === 1 ? "producto" : "productos"}` : "Carrito"}
      className={`group/cart relative grid size-11 place-items-center ${navLink}`}
    >
      {/* Al señalarlo, el carrito se inclina hacia atrás sobre la rueda trasera y dos cajitas rebotan encima. */}
      <span
        aria-hidden
        className="relative origin-[30%_85%] duration-(--duration-fast) ease-bounce group-hover/cart:-rotate-12 motion-safe:transition-transform"
      >
        <ShoppingCartSimple size={24} weight="light" />
        <span className={`${cartBox} left-2`} />
        <span className={`${cartBox} left-3.5 [animation-delay:var(--duration-micro)]`} />
      </span>
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
