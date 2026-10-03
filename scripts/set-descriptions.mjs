// Pone las descripciones de db/descriptions.json en los productos que aún no tienen una.
// No pisa lo que ya se haya escrito en el panel. Uso: npm run db:descriptions
import { readFileSync } from "node:fs";
import { connect } from "./db.mjs";

const descriptions = JSON.parse(readFileSync("db/descriptions.json", "utf8"));
const db = await connect();

let updated = 0;
for (const [sku, description] of Object.entries(descriptions)) {
  const result = await db.query(
    "update products set description = $1, updated_at = now() where sku = $2 and coalesce(description, '') = ''",
    [description, sku],
  );
  updated += result.rowCount;
}

console.log(`Listo: ${updated} producto(s) recibieron descripción. Los que ya tenían una no se tocaron.`);
await db.end();
