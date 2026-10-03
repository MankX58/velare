"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { buttonStyles, linkStyles } from "@/components/button";
import { QuantityStepper } from "@/components/store/add-to-cart";
import { ProductLabel, availability } from "@/components/store/product-tile";
import { useCart } from "@/lib/cart";
import type { StoreProduct } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";
import { getCartProducts } from "./actions";

export function CartView() {
  const { cart, setQuantity } = useCart();
  // null = todavía cargando los datos de los productos.
  const [products, setProducts] = useState<StoreProduct[] | null>(null);

  // Solo se vuelve a consultar cuando cambia QUÉ productos hay, no sus cantidades.
  const ids = Object.keys(cart).sort().join(",");
  useEffect(() => {
    let cancelled = false;
    getCartProducts(ids ? ids.split(",").map(Number) : []).then((result) => {
      if (!cancelled) setProducts(result);
    });
    return () => {
      cancelled = true;
    };
  }, [ids]);

  if (products === null) {
    return (
      <div aria-busy="true" aria-label="Cargando el carrito" className="motion-safe:animate-skeleton">
        {[0, 1].map((i) => (
          <div key={i} className="flex gap-5 border-t border-line py-6">
            <div className="aspect-[4/5] w-24 bg-mist" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-1/2 bg-mist" />
              <div className="h-4 w-1/4 bg-mist" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Un producto que ya no está activo desaparece de la lista aunque siga guardado.
  const lines = products.filter((product) => cart[product.id]);

  if (lines.length === 0) {
    return (
      <div className="border border-line bg-surface px-6 py-16 motion-safe:animate-settle">
        <h2 className="font-display text-2xl">Tu carrito está vacío</h2>
        <p className="mt-2 text-sm leading-relaxed text-ink-soft">Cuando agregues un perfume, aparecerá aquí.</p>
        <Link href="/catalogo" className={`mt-8 ${buttonStyles.primary}`}>
          Ver catálogo
        </Link>
      </div>
    );
  }

  const subtotal = lines.reduce((total, product) => total + product.list_price * cart[product.id], 0);
  const units = lines.reduce((total, product) => total + cart[product.id], 0);

  return (
    <div className="grid items-start gap-12 motion-safe:animate-settle lg:grid-cols-[minmax(0,1fr)_22rem]">
      <ul className="border-b border-line">
        {lines.map((product) => (
          <li key={product.id} className="flex gap-4 border-t border-line py-6 sm:gap-6">
            <Link href={`/producto/${product.slug}`} className="group w-20 shrink-0 sm:w-28">
              <ProductLabel product={product} className="text-[6px] sm:text-[9px]" />
            </Link>
            <div className="flex min-w-0 flex-1 flex-col gap-3">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <Link href={`/producto/${product.slug}`} className="font-medium underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink">
                    {product.name}
                  </Link>
                  <p className="mt-1 text-xs text-ink-faint">
                    {[product.brand, availability(product)].filter(Boolean).join(", ")}
                  </p>
                </div>
                {/* key: el total de la línea vuelve a entrar cuando cambia la cantidad. */}
                <p key={cart[product.id]} className="shrink-0 font-medium tabular-nums motion-safe:animate-swap">
                  {formatCOP(product.list_price * cart[product.id])}
                </p>
              </div>
              <div className="mt-auto flex flex-wrap items-center justify-between gap-3">
                <QuantityStepper
                  value={cart[product.id]}
                  onChange={(quantity) => setQuantity(product.id, quantity)}
                  label={`Cantidad de ${product.name}`}
                />
                <button type="button" onClick={() => setQuantity(product.id, 0)} className={`text-sm text-ink-soft ${linkStyles.default}`}>
                  Quitar
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      <aside className="border border-line bg-surface p-6 lg:sticky lg:top-24">
        <h2 className="font-display text-xl">Resumen</h2>
        <dl className="mt-6 flex flex-col gap-3 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">
              {units} {units === 1 ? "unidad" : "unidades"}
            </dt>
            <dd key={subtotal} className="font-medium tabular-nums motion-safe:animate-swap">
              {formatCOP(subtotal)}
            </dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-ink-soft">Envío</dt>
            <dd className="text-ink-soft">Se define en el siguiente paso</dd>
          </div>
        </dl>
        <Link href="/checkout" className={`mt-8 w-full ${buttonStyles.primary}`}>
          Continuar con el pedido
        </Link>
        <p className="mt-4 text-xs leading-relaxed text-ink-faint">
          El total se confirma en el servidor con los precios vigentes antes de crear el pedido.
        </p>
      </aside>
    </div>
  );
}
