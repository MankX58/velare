import { neon } from "@neondatabase/serverless";

// Cliente SQL del servidor. Se usa como sql`select ... where id = ${id}`:
// los valores viajan como parámetros, nunca pegados al texto de la consulta.
export const sql = neon(process.env.DATABASE_URL!);
