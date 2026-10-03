// Aplica, en orden, los archivos de db/migrations que todavía no se han aplicado.
// Uso: npm run db:migrate
import { readdirSync, readFileSync } from "node:fs";
import { connect } from "./db.mjs";

const db = await connect();

await db.query(`
  create table if not exists schema_migrations (
    name        text primary key,
    applied_at  timestamptz not null default now()
  )`);

const { rows } = await db.query("select name from schema_migrations");
const applied = new Set(rows.map((r) => r.name));
const files = readdirSync("db/migrations").filter((f) => f.endsWith(".sql")).sort();

let count = 0;
for (const file of files) {
  if (applied.has(file)) continue;
  console.log("Aplicando", file);
  await db.query("begin");
  try {
    await db.query(readFileSync(`db/migrations/${file}`, "utf8"));
    await db.query("insert into schema_migrations (name) values ($1)", [file]);
    await db.query("commit");
    count++;
  } catch (error) {
    await db.query("rollback");
    await db.end();
    throw error;
  }
}

console.log(count ? `Listo: ${count} migración(es) aplicada(s).` : "La base de datos ya está al día.");
await db.end();
