// Pone las descripciones de db/descriptions.json en los productos.
//   npm run db:descriptions             solo en los que aún no tienen descripción
//   npm run db:descriptions -- --todas  en todos, reemplazando lo que haya (también lo escrito en el panel)
import { readFileSync } from "node:fs";
import { connect } from "./db.mjs";

const all = process.argv.includes("--todas");
const descriptions = JSON.parse(readFileSync("db/descriptions.json", "utf8"));
const db = await connect();

let updated = 0;
for (const [sku, description] of Object.entries(descriptions)) {
  const result = await db.query(
    "update products set description = $1, updated_at = now() where sku = $2 and ($3 or coalesce(description, '') = '')",
    [description, sku, all],
  );
  updated += result.rowCount;
}

console.log(
  all
    ? `Listo: ${updated} producto(s) con la descripción reemplazada.`
    : `Listo: ${updated} producto(s) recibieron descripción. Los que ya tenían una no se tocaron.`,
);
await db.end();
