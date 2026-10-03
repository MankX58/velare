"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { slugify } from "@/lib/slug";

const AUDIENCES = ["Hombre", "Mujer", "Unisex"];

// Códigos de PostgreSQL: 23505 = valor repetido, 23503 = otro registro depende de este.
const dbError = (error: unknown) => error as { code?: string; constraint?: string };

// Crea un producto (id = null) o actualiza uno existente.
export async function saveProduct(id: number | null, formData: FormData): Promise<FormState> {
  await requireAdmin();

  const form = readForm(formData);
  const sku = (form.text("sku", { required: true, max: 20 }) ?? "").toUpperCase();
  const name = form.text("name", { required: true, max: 120 }) ?? "";
  const brand = form.text("brand", { max: 60 });
  const audience = form.oneOf("audience", AUDIENCES);
  const sizeMl = form.integer("size_ml", { min: 1, max: 5000 });
  const category = form.text("category", { max: 60 });
  const description = form.text("description", { max: 2000 });
  const listPrice = form.money("list_price", { required: true }) ?? 0;
  const initialStock = form.integer("initial_stock") ?? 0;
  const initialUnitCost = form.money("initial_unit_cost") ?? 0;
  const reorderPoint = form.integer("reorder_point") ?? 0;
  const isActive = form.checkbox("is_active");
  if (form.hasErrors()) return { errors: form.errors };

  // ponytail: la dirección del producto (slug) se recalcula cada vez que se guarda.
  // Cuando la tienda sea pública, cambiar el nombre cambiará su enlace: en ese
  // momento conviene congelar el slug o crear redirecciones.
  let slug = slugify(`${brand ?? ""} ${name}`);
  const taken = await sql`select 1 from products where slug = ${slug} and id is distinct from ${id}`;
  if (taken.length > 0) slug = `${slug}-${slugify(sku)}`;

  try {
    if (id === null) {
      const rows = await sql`
        insert into products
          (sku, slug, name, brand, audience, size_ml, category, description,
           list_price, initial_stock, initial_unit_cost, reorder_point, is_active)
        values
          (${sku}, ${slug}, ${name}, ${brand}, ${audience}, ${sizeMl}, ${category}, ${description},
           ${listPrice}, ${initialStock}, ${initialUnitCost}, ${reorderPoint}, ${isActive})
        returning id`;
      id = rows[0].id as number;
    } else {
      await sql`
        update products set
          sku = ${sku}, slug = ${slug}, name = ${name}, brand = ${brand}, audience = ${audience},
          size_ml = ${sizeMl}, category = ${category}, description = ${description},
          list_price = ${listPrice}, initial_stock = ${initialStock}, initial_unit_cost = ${initialUnitCost},
          reorder_point = ${reorderPoint}, is_active = ${isActive}, updated_at = now()
        where id = ${id}`;
    }
  } catch (error) {
    if (dbError(error).code === "23505") {
      return dbError(error).constraint === "products_sku_key"
        ? { errors: { sku: "Ya existe un producto con ese SKU." } }
        : { message: "Ya existe un producto con la misma marca y nombre." };
    }
    throw error;
  }

  revalidatePath("/admin", "layout");
  return { ok: true, id };
}

export async function deleteProduct(id: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { message: "Producto no válido." };

  try {
    await sql`delete from products where id = ${id}`;
  } catch (error) {
    if (dbError(error).code === "23503") {
      return { message: "Este producto tiene compras o ventas registradas. Desactívalo en lugar de eliminarlo." };
    }
    throw error;
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}
