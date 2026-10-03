import { Client } from "@neondatabase/serverless";

// Conexión directa (sin pool) para los scripts: migraciones, importación, roles.
export async function connect() {
  const url = process.env.DATABASE_URL_UNPOOLED;
  if (!url) {
    throw new Error("Falta DATABASE_URL_UNPOOLED. Ejecuta el script con npm run (lee .env.local).");
  }
  const client = new Client(url);
  await client.connect();
  return client;
}
