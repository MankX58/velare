"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { getFinanceSettings } from "@/lib/finance";
import { readForm, type FormState } from "@/lib/form";
import { todayInBogota } from "@/lib/format";

const movementTypes = ["Gasto", "Aporte", "Retiro"];

// Registra dinero que entró o salió y que no es una venta ni una compra de mercancía:
// un gasto del negocio, o un aporte o retiro del dueño.
export async function createMovement(formData: FormData): Promise<FormState> {
  await requireAdmin();
  const { expenseCategories, paymentMethods } = await getFinanceSettings();

  const form = readForm(formData);
  const type = form.oneOf("type", movementTypes, { required: true });
  const date = form.date("date", { required: true });
  const amount = form.money("amount", { required: true });
  const concept = form.text("concept", { max: 200 });
  const method = form.oneOf("method", paymentMethods);
  // Solo los gastos tienen categoría y tipo (fijo o variable).
  const category = form.oneOf("category", expenseCategories);
  const kind = form.oneOf("kind", ["Fijo", "Variable"]);
  if (amount === 0) form.errors.amount = "El valor debe ser mayor que cero.";
  if (form.hasErrors()) return { errors: form.errors };

  if (type === "Gasto") {
    await sql`
      insert into expenses (spent_on, category, description, amount, kind, payment_method)
      values (${date}, ${category}, ${concept}, ${amount}, ${kind}, ${method})`;
  } else {
    await sql`
      insert into owner_movements (moved_on, kind, concept, amount, method)
      values (${date}, ${type}, ${concept}, ${amount}, ${method})`;
  }

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// Elimina un gasto, aporte o retiro registrado por error. Las ventas y las compras
// no se borran aquí: se corrigen en Pedidos y en Compras.
export async function deleteMovement(type: string, id: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(id) || !movementTypes.includes(type)) return { message: "Movimiento no válido." };

  if (type === "Gasto") await sql`delete from expenses where id = ${id}`;
  else await sql`delete from owner_movements where id = ${id} and kind = ${type}`;

  revalidatePath("/admin", "layout");
  return { ok: true };
}

// Marca como cobrada una venta fiada: el dinero entra a caja con la fecha de hoy.
export async function markPaid(orderId: number): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Venta no válida." };

  const updated = await sql`
    update orders set paid_on = ${todayInBogota()}
    where id = ${orderId} and paid_on is null and status not in ('pending', 'payment_reported', 'cancelled')
    returning id`;
  if (updated.length === 0) return { message: "Esta venta ya estaba cobrada." };

  revalidatePath("/admin", "layout");
  return { ok: true };
}
