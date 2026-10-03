import Link from "next/link";
import type { StoreProduct } from "@/lib/catalog";
import { formatCOP } from "@/lib/format";

// Mientras un producto no tenga foto, su imagen es una "etiqueta" como el frente de
// la caja del perfume: marca arriba, nombre al centro, tamaño y público abajo.
// Cada marca recibe siempre el mismo tono, para que el catálogo tenga ritmo.
const tones = [
  "bg-brand text-on-brand",
  "bg-mist text-ink",
  "bg-on-brand text-brand",
  "border border-line bg-surface text-ink",
];

// Convierte el texto en un número fijo para elegir tono. Los valores (7, 17, 1009)
// se eligieron probando: reparten bien las marcas actuales entre los cuatro tonos.
function toneFor(text: string) {
  let hash = 7;
  for (const char of text) hash = (hash * 17 + char.charCodeAt(0)) % 1009;
  return tones[hash % tones.length];
}

// `className` fija el tamaño del texto (text-sm, text-base, text-2xl...): todo lo de
// dentro se mide en em, así la misma etiqueta sirve en pequeño y en grande.
// `tone` fuerza uno de los cuatro tonos (0 a 3) en lugar del que le toca a la marca.
export function ProductLabel({
  product,
  className = "text-sm",
  tone,
}: {
  product: StoreProduct;
  className?: string;
  tone?: number;
}) {
  const colors = tone === undefined ? toneFor(product.brand ?? product.name) : tones[tone % tones.length];
  return (
    <div className={`relative aspect-[4/5] overflow-hidden ${colors} ${className}`}>
      {/* El marco interior crece un poco cuando el cursor pasa sobre la tarjeta (group-hover). */}
      <div className="absolute inset-[0.8em] flex flex-col justify-between border border-current/25 p-[1em] transition-transform duration-(--duration-fast) ease-smooth-out group-hover:scale-[1.04]">
        <span className="font-display text-[0.75em] tracking-[0.22em] uppercase">{product.brand}</span>
        <span className="font-display text-[1.7em] leading-[1.05] font-light text-balance">{product.name}</span>
        <span className="flex justify-between gap-2 text-[0.72em] tracking-[0.14em] uppercase opacity-80">
          <span>{product.size_ml ? `${product.size_ml} ml` : ""}</span>
          <span>{product.audience}</span>
        </span>
      </div>
    </div>
  );
}

export const availability = (product: StoreProduct) => (product.in_stock ? "En stock" : "Bajo pedido");

// Tarjeta de producto para rejillas. Dentro de un contenedor "group/grid", las demás
// tarjetas se atenúan mientras el cursor está sobre una.
export function ProductCard({ product, labelClassName }: { product: StoreProduct; labelClassName?: string }) {
  return (
    <Link
      href={`/producto/${product.slug}`}
      className="group block transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/grid:duration-(--duration-quick) hover:-translate-y-1 [@media(hover:hover)]:group-has-[a:hover]/grid:not-hover:opacity-45"
    >
      <ProductLabel product={product} className={labelClassName} />
      <div className="mt-3 flex items-baseline justify-between gap-3 text-sm">
        <span className="text-ink-soft">{availability(product)}</span>
        <span className="font-medium tabular-nums">{formatCOP(product.list_price)}</span>
      </div>
    </Link>
  );
}
