// Da el rol de administrador a un usuario que ya inició sesión al menos una vez.
// Uso: npm run db:admin tu@correo.com
import { connect } from "./db.mjs";

const who = process.argv[2];
if (!who) {
  console.error("Uso: npm run db:admin tu@correo.com");
  process.exit(1);
}

const db = await connect();
const { rows } = await db.query(
  "select id, auth0_sub, email, role from users where lower(email) = lower($1) or auth0_sub = $1",
  [who],
);

if (rows.length === 0) {
  console.error(`No hay ningún usuario con "${who}". Inicia sesión una vez en la app y vuelve a intentarlo.`);
  process.exitCode = 1;
} else if (rows.length > 1) {
  // El mismo correo puede existir con dos formas de entrar (contraseña y Google, por ejemplo).
  console.error("Hay varias cuentas con ese correo. Repite el comando con el identificador exacto:");
  for (const u of rows) console.error(`  npm run db:admin "${u.auth0_sub}"`);
  process.exitCode = 1;
} else {
  await db.query("update users set role = 'admin' where id = $1", [rows[0].id]);
  console.log(`Listo: ${rows[0].email} ahora es administrador.`);
}

await db.end();
