import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { linkStyles } from "@/components/button";
import { AddToCart } from "@/components/store/add-to-cart";
import { ProductCard, ProductLabel } from "@/components/store/product-tile";
import { getProduct, listProducts } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";

// Título y descripción para buscadores y para la vista previa al compartir el enlace.
export async function generateMetadata({ params }: PageProps<"/producto/[slug]">): Promise<Metadata> {
  const product = await getProduct((await params).slug);
  if (!product) return {};

  const title = [product.brand, product.name].filter(Boolean).join(" ");
  const description =
    product.description ??
    `${title}${product.size_ml ? `, ${product.size_ml} ml` : ""}. ${formatCOP(product.list_price)} en Velare.`;
  return { title, description, openGraph: { title, description } };
}

export default async function ProductPage({ params }: PageProps<"/producto/[slug]">) {
  const product = await getProduct((await params).slug);
  if (!product) notFound();

  const sameBrand = product.brand
    ? (await listProducts({ marca: product.brand, limit: 5 })).filter((other) => other.id !== product.id).slice(0, 4)
    : [];

  const details = [
    { label: "Marca", value: product.brand },
    { label: "Para", value: product.audience },
    { label: "Tamaño", value: product.size_ml ? `${product.size_ml} ml` : null },
    { label: "Categoría", value: product.category },
  ].filter((detail) => detail.value);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-24 sm:px-8">
      <Link href="/catalogo" className={`text-sm text-ink-soft ${linkStyles.default}`}>
        Volver al catálogo
      </Link>

      <div className="mt-8 grid items-start gap-10 lg:grid-cols-2 lg:gap-16">
        <div className="group mx-auto w-full max-w-lg motion-safe:animate-settle lg:sticky lg:top-24">
          <ProductLabel product={product} className="text-base sm:text-2xl" />
        </div>

        <div className="lg:py-6">
          {product.brand && (
            <p className="font-display text-sm tracking-[0.22em] text-ink-soft uppercase motion-safe:animate-unveil">
              {product.brand}
            </p>
          )}
          <h1 className="mt-3 font-display text-4xl leading-[1.05] font-light tracking-tight text-balance motion-safe:animate-unveil motion-safe:[animation-delay:var(--duration-micro)] sm:text-6xl">
            {product.name}
          </h1>
          <p className="mt-6 text-3xl font-medium motion-safe:animate-unveil motion-safe:[animation-delay:calc(var(--duration-micro)*2)]">
            {formatCOP(product.list_price)}
          </p>

          <p className="mt-6 flex items-start gap-3 text-sm leading-relaxed text-ink-soft">
            <span
              className={`mt-0.5 shrink-0 px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] uppercase ${
                product.in_stock ? "bg-ok-soft text-ok" : "bg-mist text-ink-soft"
              }`}
            >
              {product.in_stock ? "En stock" : "Bajo pedido"}
            </span>
            {product.in_stock
              ? "Lo despachamos en cuanto confirmemos tu pago."
              : "Lo pedimos al proveedor en cuanto confirmemos tu pago y luego te lo enviamos."}
          </p>

          <div className="mt-8">
            <AddToCart productId={product.id} productName={product.name} />
          </div>

          {product.description && <p className="mt-10 max-w-[60ch] leading-relaxed whitespace-pre-line">{product.description}</p>}

          <dl className="mt-10 grid grid-cols-2 gap-x-8 gap-y-5 border-t border-line pt-8 text-sm">
            {details.map((detail) => (
              <div key={detail.label}>
                <dt className="text-ink-faint">{detail.label}</dt>
                <dd className="mt-1">{detail.value}</dd>
              </div>
            ))}
          </dl>

          <p className="mt-8 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft">
            Pago por transferencia con llave Bre-B o Nequi. Verificamos cada pago antes de procesar el pedido.
          </p>
        </div>
      </div>

      {sameBrand.length > 0 && (
        <section className="mt-28">
          <h2 className="reveal mb-8 font-display text-3xl font-light tracking-tight">Más de {product.brand}</h2>
          <div className="group/grid grid grid-cols-2 gap-x-5 gap-y-10 md:grid-cols-4">
            {sameBrand.map((other) => (
              <div key={other.id} className="reveal">
                <ProductCard product={other} labelClassName="text-[11px] sm:text-sm" />
              </div>
            ))}
          </div>
        </section>
      )}
    </main>
  );
}
