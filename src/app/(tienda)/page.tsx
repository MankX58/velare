import Link from "next/link";
import { buttonStyles } from "@/components/button";
import { ProductCard, ProductLabel } from "@/components/store/product-tile";
import { countByAudience, listBrands, listProducts } from "@/lib/catalog";

const audienceNames: Record<string, string> = { Hombre: "Para él", Mujer: "Para ella", Unisex: "Unisex" };

const steps = [
  { title: "Elige", text: "Explora el catálogo y agrega al carrito lo que te guste." },
  { title: "Paga por transferencia", text: "Con tu llave Bre-B o Nequi. Te mostramos los datos al hacer el pedido." },
  { title: "Confirmamos tu pago", text: "Revisamos que la transferencia llegó antes de procesar el pedido." },
  { title: "Recíbelo", text: "Si está en stock lo despachamos; si no, lo pedimos al proveedor y te lo enviamos." },
];

// Giro final y tono de cada caja de la portada (tonos que contrastan con el fondo verde).
const tilts = ["-7deg", "3deg", "-2deg"];
const heroTones = [3, 2, 1];

export default async function HomePage() {
  const [featured, brands, audiences] = await Promise.all([
    listProducts({ limit: 8 }), // sin orden: primero los más vendidos y los que tienen stock
    listBrands(),
    countByAudience(),
  ]);
  const heroProducts = featured.slice(0, 3);
  const gridProducts = featured.slice(3, 8);

  return (
    <main>
      {/* Portada: mensaje a la izquierda y tres cajas reales del catálogo a la derecha. */}
      <section className="mx-auto grid max-w-7xl items-center gap-12 px-4 pt-14 pb-20 sm:px-8 lg:grid-cols-[1.1fr_1fr] lg:pt-20 lg:pb-28">
        <div>
          <h1 className="font-display text-5xl leading-[1.02] font-light tracking-tight text-balance motion-safe:animate-unveil sm:text-6xl xl:text-7xl">
            Aromas del mundo, traídos para ti.
          </h1>
          <p className="mt-6 max-w-[44ch] text-lg leading-relaxed text-ink-soft motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-micro)]">
            Elige tu fragancia y paga por transferencia. Si no está en stock, la pedimos por ti.
          </p>
          <div className="mt-10 motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*2)]">
            <Link href="/catalogo" className={buttonStyles.primary}>
              Ver catálogo
            </Link>
          </div>
        </div>

        {heroProducts.length > 0 && (
          <div className="relative mx-auto flex w-full max-w-md justify-center bg-brand px-6 py-14 sm:py-20 lg:max-w-none">
            {heroProducts.map((product, index) => (
              <Link
                key={product.id}
                href={`/producto/${product.slug}`}
                style={{ "--tilt": tilts[index], animationDelay: `${index * 120}ms` } as React.CSSProperties}
                className="group -mx-5 w-2/5 max-w-56 rotate-(--tilt) shadow-[0_18px_40px_-18px_oklch(0.23_0.05_160/0.55)] transition duration-(--duration-fast) ease-smooth-out hover:z-10 hover:-translate-y-3 hover:rotate-0 motion-safe:animate-deal sm:-mx-4"
              >
                <ProductLabel product={product} tone={heroTones[index]} className="text-[10px] sm:text-sm" />
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* Cinta de marcas. La lista va dos veces para que el deslizamiento no tenga corte. */}
      {brands.length > 0 && (
        <section aria-label="Marcas" className="overflow-hidden border-y border-line py-5">
          <div className="flex w-max motion-safe:animate-marquee motion-safe:hover:[animation-play-state:paused] motion-reduce:w-auto motion-reduce:flex-wrap">
            {[0, 1].map((copy) => (
              <ul key={copy} aria-hidden={copy === 1} className={`flex shrink-0 ${copy === 1 ? "motion-reduce:hidden" : "motion-reduce:flex-wrap"}`}>
                {brands.map((brand) => (
                  <li key={brand} className="px-8 font-display text-xl tracking-[0.18em] whitespace-nowrap text-ink-soft uppercase">
                    <Link
                      href={`/catalogo?marca=${encodeURIComponent(brand)}`}
                      tabIndex={copy === 1 ? -1 : undefined}
                      className="transition-colors duration-(--duration-quick) ease-smooth-out hover:text-ink"
                    >
                      {brand}
                    </Link>
                  </li>
                ))}
              </ul>
            ))}
          </div>
        </section>
      )}

      {/* Destacados: una caja grande y cuatro pequeñas. */}
      {gridProducts.length > 0 && (
        <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
          <div className="reveal mb-10 flex flex-wrap items-end justify-between gap-4">
            <h2 className="font-display text-4xl font-light tracking-tight sm:text-5xl">Destacados</h2>
            <Link href="/catalogo" className="text-sm underline decoration-line transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink">
              Ver todo el catálogo
            </Link>
          </div>
          <div className="group/grid grid grid-cols-2 gap-x-5 gap-y-10 lg:grid-cols-4">
            {gridProducts.map((product, index) => (
              <div key={product.id} className={`reveal ${index === 0 ? "col-span-2 lg:row-span-2" : ""}`}>
                <ProductCard product={product} labelClassName={index === 0 ? "text-lg sm:text-2xl" : "text-xs sm:text-sm"} />
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Para quién: banda verde con enlaces grandes. Al señalar uno, los otros se atenúan. */}
      {audiences.length > 0 && (
        <section className="bg-brand text-on-brand">
          <div className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
            <h2 className="reveal text-sm text-on-brand-soft">¿Para quién es el perfume?</h2>
            <ul className="group/list mt-8 flex flex-col">
              {audiences.map(({ audience, count }) => (
                <li key={audience} className="reveal border-t border-on-brand/20 last:border-b">
                  <Link
                    href={`/catalogo?publico=${encodeURIComponent(audience)}`}
                    className="group flex items-baseline justify-between gap-6 py-6 transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/list:duration-(--duration-quick) [@media(hover:hover)]:group-has-[a:hover]/list:not-hover:opacity-35"
                  >
                    <span className="font-display text-5xl font-light tracking-tight transition-transform duration-(--duration-fast) ease-smooth-out group-hover:translate-x-4 sm:text-7xl">
                      {audienceNames[audience] ?? audience}
                    </span>
                    <span className="shrink-0 text-sm text-on-brand-soft tabular-nums">
                      {count} {count === 1 ? "perfume" : "perfumes"}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* Cómo se compra: cuatro pasos en orden. */}
      <section className="mx-auto max-w-7xl px-4 py-24 sm:px-8">
        <h2 className="reveal max-w-[18ch] font-display text-4xl font-light tracking-tight text-balance sm:text-5xl">
          Comprar es sencillo
        </h2>
        <ol className="mt-12 grid gap-x-8 gap-y-10 sm:grid-cols-2 lg:grid-cols-4">
          {steps.map((step, index) => (
            <li key={step.title} className="reveal border-t border-ink pt-5">
              <span className="font-display text-3xl font-light text-ink-faint tabular-nums">{index + 1}</span>
              <h3 className="mt-3 text-lg font-medium">{step.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">{step.text}</p>
            </li>
          ))}
        </ol>
      </section>
    </main>
  );
}
