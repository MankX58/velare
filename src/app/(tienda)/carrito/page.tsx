import type { Metadata } from "next";
import { CartView } from "./cart-view";

export const metadata: Metadata = { title: "Carrito", robots: { index: false } };

export default function CartPage() {
  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <h1 className="mb-10 font-display text-5xl font-light tracking-tight motion-safe:animate-unveil sm:text-6xl">Carrito</h1>
      <CartView />
    </main>
  );
}
