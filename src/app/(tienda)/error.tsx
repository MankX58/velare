"use client"; // Las pantallas de error de Next.js deben ser componentes de cliente.

import Link from "next/link";
import { useEffect } from "react";
import { buttonStyles } from "@/components/button";

// Se muestra si una página de la tienda falla al cargar (por ejemplo, sin conexión a la base de datos).
export default function StoreError({ error, retry }: { error: Error & { digest?: string }; retry: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main role="alert" className="mx-auto w-full max-w-7xl flex-1 px-4 pt-16 pb-24 sm:px-8">
      <h1 className="font-display text-5xl font-light tracking-tight text-balance sm:text-6xl">No pudimos cargar esta página</h1>
      <p className="mt-6 max-w-[48ch] text-lg leading-relaxed text-ink-soft">
        Suele ser un problema pasajero. Vuelve a intentarlo; tu carrito sigue guardado.
      </p>
      <div className="mt-10 flex flex-wrap gap-4">
        <button onClick={() => retry()} className={buttonStyles.primary}>
          Reintentar
        </button>
        <Link href="/" className={buttonStyles.secondary}>
          Ir al inicio
        </Link>
      </div>
    </main>
  );
}
