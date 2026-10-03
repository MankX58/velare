// Conecta las fotos de public/productos con sus productos, según el nombre del archivo.
//   P001.jpg        → primera foto del producto P001
//   P001-2.jpg      → segunda foto, y así sucesivamente
// Uso: npm run db:fotos   (se puede repetir cada vez que agregues o cambies fotos)
//
// Solo toca las fotos de esa carpeta. Las que se subieron desde el panel (guardadas en
// Vercel Blob) se conservan y quedan después de las de la carpeta.
import { existsSync, readdirSync } from "node:fs";
import { connect } from "./db.mjs";

const folder = "public/productos";
const files = existsSync(folder) ? readdirSync(folder).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).sort() : [];

// Agrupa los archivos por SKU: lo que va antes del primer guion o del punto.
const bySku = new Map();
for (const file of files) {
  const sku = file.split(/[-.]/)[0].toUpperCase();
  bySku.set(sku, [...(bySku.get(sku) ?? []), `/productos/${file}`]);
}

const db = await connect();
const { rows: products } = await db.query("select sku, images from products order by sku");

let linked = 0;
for (const { sku, images } of products) {
  const local = bySku.get(sku) ?? [];
  const uploaded = images.filter((url) => !url.startsWith("/productos/"));
  await db.query("update products set images = $1 where sku = $2", [[...local, ...uploaded], sku]);
  if (local.length) linked++;
}

const unknown = [...bySku.keys()].filter((sku) => !products.some((p) => p.sku === sku));
console.log(`Listo: ${linked} de ${products.length} productos tienen foto en la carpeta.`);
if (unknown.length) console.log(`Archivos cuyo nombre no coincide con ningún SKU: ${unknown.join(", ")}`);
await db.end();
