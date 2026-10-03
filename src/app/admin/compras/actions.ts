"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";

// Registra una compra de mercancía. No hay que tocar el producto: el stock sube y el
// costo promedio se recalcula solos, porque la vista product_stats suma todas las compras.
export async function createPurchase(formData: FormData): Promise<FormState> {
  await requireAdmin();

  const [setting] = await sql`select value from settings where key = 'payment_methods'`;
  const paymentMethods = (setting?.value ?? []) as string[];

  const form = readForm(formData);
  const purchasedOn = form.date("purchased_on", { required: true });
  const productId = form.integer("product_id", { required: true, min: 1, max: 2_000_000_000 });
  const quantity = form.integer("quantity", { required: true, min: 1, max: 10_000 });
  const unitCost = form.money("unit_cost", { required: true });
  const shippingCost = form.money("shipping_cost") ?? 0;
  const supplier = form.text("supplier", { max: 80 });
  const paymentMethod = form.oneOf("payment_method", paymentMethods);
  const notes = form.text("notes", { max: 200 });
  if (form.hasErrors()) return { errors: form.errors };

  try {
    await sql`
      insert into purchases
        (purchased_on, supplier, product_id, quantity, unit_cost, shipping_cost, payment_method, notes)
      values
        (${purchasedOn}, ${supplier}, ${productId}, ${quantity}, ${unitCost}, ${shippingCost}, ${paymentMethod}, ${notes})`;
  } catch (error) {
    // 23503: el producto elegido ya no existe.
    if ((error as { code?: string }).code === "23503") {
      return { errors: { product_id: "Ese producto ya no existe. Elige otro." } };
    }
    throw error;
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// Elimina una compra registrada por error. El stock y el costo promedio vuelven a calcularse sin ella.
export async function deletePurchase(id: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(id)) return { message: "Compra no válida." };

  await sql`delete from purchases where id = ${id}`;

  revalidatePath("/admin", "layout");
  return { ok: true };
}
