"use server";

import { del, put } from "@vercel/blob";
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

  try {
    if (id === null) {
      // La dirección del producto (slug) se decide al crearlo y ya no cambia: así los enlaces
      // compartidos y lo que Google tenga guardado siguen funcionando aunque se corrija el nombre.
      let slug = slugify(`${brand ?? ""} ${name}`);
      const taken = await sql`select 1 from products where slug = ${slug}`;
      if (taken.length > 0) slug = `${slug}-${slugify(sku)}`;

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
          sku = ${sku}, name = ${name}, brand = ${brand}, audience = ${audience},
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

// ---------- Fotos del producto (Vercel Blob) ----------

const MAX_IMAGES = 6;
const MAX_IMAGE_BYTES = 1_500_000; // la foto llega ya reducida por el navegador: 1,5 MB es de sobra

// Vercel conecta el almacén al proyecto con BLOB_STORE_ID (lo normal hoy) o con un
// BLOB_READ_WRITE_TOKEN (almacenes antiguos, o para usarlo en tu computador).
const blobConnected = () => Boolean(process.env.BLOB_STORE_ID || process.env.BLOB_READ_WRITE_TOKEN);

// Sube una foto y la agrega al final de las fotos del producto. El navegador ya la
// convirtió a JPEG y la redujo (ver shrink-image.ts), pero aquí se vuelve a comprobar todo.
export async function addProductImage(productId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId)) return { message: "Producto no válido." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) return { message: "No llegó ninguna imagen." };
  if (file.size > MAX_IMAGE_BYTES) return { message: "La foto pesa demasiado. Prueba con otra." };
  // Un JPEG de verdad empieza siempre por estos tres bytes; el nombre o el tipo declarado no bastan.
  const start = new Uint8Array(await file.slice(0, 3).arrayBuffer());
  if (start[0] !== 0xff || start[1] !== 0xd8 || start[2] !== 0xff) return { message: "El archivo no es una imagen válida." };

  const [product] = await sql`select sku, cardinality(images) as count from products where id = ${productId}`;
  if (!product) return { message: "El producto ya no existe." };
  if (product.count >= MAX_IMAGES) return { message: `Un producto puede tener hasta ${MAX_IMAGES} fotos. Quita alguna primero.` };
  if (!blobConnected()) {
    return { message: "Falta conectar el almacenamiento de fotos (Vercel Blob). Los pasos están en el README." };
  }

  let url: string;
  try {
    // addRandomSuffix: cada foto recibe un nombre único, así ninguna pisa a otra.
    const blob = await put(`productos/${String(product.sku).toLowerCase()}.jpg`, file, {
      access: "public",
      addRandomSuffix: true,
      contentType: "image/jpeg",
    });
    url = blob.url;
  } catch (error) {
    // Lo más común: el almacén se creó como privado. Las fotos de la tienda necesitan uno público.
    console.error(error);
    return { message: "Vercel Blob rechazó la foto. Revisa que el almacén sea público (Public), no privado." };
  }
  await sql`update products set images = array_append(images, ${url}), updated_at = now() where id = ${productId}`;

  revalidatePath("/", "layout");
  return { ok: true };
}

// Quita una foto del producto. Si estaba en Vercel Blob, también borra el archivo.
export async function removeProductImage(productId: number, url: string): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId) || typeof url !== "string") return { message: "Foto no válida." };

  // El "where" comprueba que la foto es de este producto: así no se puede pedir que se borre un archivo ajeno.
  const removed = await sql`
    update products set images = array_remove(images, ${url}), updated_at = now()
    where id = ${productId} and ${url} = any(images)
    returning id`;
  if (removed.length === 0) return { message: "Esa foto ya no está en el producto." };

  // Las fotos de la carpeta public (npm run db:fotos) no están en Blob: solo se desvinculan.
  if (url.startsWith("https://") && blobConnected()) await del(url);

  revalidatePath("/", "layout");
  return { ok: true };
}

// Pone una foto de primera: es la que se ve en el catálogo y al abrir el producto.
export async function setMainImage(productId: number, url: string): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(productId) || typeof url !== "string") return { message: "Foto no válida." };

  const moved = await sql`
    update products set images = array_prepend(${url}, array_remove(images, ${url})), updated_at = now()
    where id = ${productId} and ${url} = any(images)
    returning id`;
  if (moved.length === 0) return { message: "Esa foto ya no está en el producto." };

  revalidatePath("/", "layout");
  return { ok: true };
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
