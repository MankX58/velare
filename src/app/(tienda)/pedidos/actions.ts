"use server";

import { revalidatePath } from "next/cache";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";

// El cliente avisa que ya transfirió. Esto NO marca el pedido como pagado:
// solo lo pasa a "pago reportado" para que un administrador lo verifique en el banco.
export async function reportPayment(orderId: number, formData: FormData): Promise<FormState> {
  const user = await requireUser("/pedidos");

  const form = readForm(formData);
  const reference = form.text("reference", { required: true, max: 200 });
  if (form.hasErrors()) return { errors: form.errors };

  // El "where" garantiza que el pedido es de esta persona y sigue pendiente.
  const updated = await sql`
    update orders
    set status = 'payment_reported', payment_reference = ${reference}, payment_reported_at = now()
    where id = ${orderId} and user_id = ${user.id} and status = 'pending'
    returning id`;
  if (updated.length === 0) return { message: "Este pedido ya no está pendiente de pago." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// El cliente puede cancelar su pedido mientras no haya reportado el pago.
export async function cancelOrder(orderId: number): Promise<FormState> {
  const user = await requireUser("/pedidos");

  const updated = await sql`
    update orders set status = 'cancelled'
    where id = ${orderId} and user_id = ${user.id} and status = 'pending'
    returning id`;
  if (updated.length === 0) return { message: "Este pedido ya no se puede cancelar desde aquí. Escríbenos." };

  revalidatePath("/", "layout");
  return { ok: true };
}
