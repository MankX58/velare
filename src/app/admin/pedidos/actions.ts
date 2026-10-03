"use server";

import { revalidatePath } from "next/cache";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { readForm, type FormState } from "@/lib/form";
import { todayInBogota } from "@/lib/format";
import { nextStatuses, type OrderStatus } from "@/lib/orders";

// Confirma que el dinero llegó. Queda registrado quién lo confirmó y cuándo, la venta
// empieza a contar (stock, resumen, ventas) y entra a caja con la fecha de hoy.
export async function confirmPayment(orderId: number): Promise<FormState> {
  const admin = await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  // Las dos sentencias van en una transacción: o se aplican ambas o ninguna.
  const [, confirmed] = await sql.transaction([
    // El costo de cada línea se actualiza al costo promedio de este momento.
    sql`
      update order_items oi set unit_cost = s.avg_cost
      from product_stats s, orders o
      where s.product_id = oi.product_id and o.id = oi.order_id
        and o.id = ${orderId} and o.status in ('pending', 'payment_reported')`,
    sql`
      update orders
      set status = 'payment_confirmed', payment_confirmed_at = now(),
          payment_confirmed_by = ${admin.id}, paid_on = ${todayInBogota()}
      where id = ${orderId} and status in ('pending', 'payment_reported')
      returning id`,
  ]);
  if (confirmed.length === 0) return { message: "Este pedido ya no está esperando confirmación de pago." };

  revalidatePath("/", "layout");
  return { ok: true };
}

// Cambia el estado del pedido (solo a los estados permitidos) y guarda guía y notas internas.
export async function updateOrder(orderId: number, formData: FormData): Promise<FormState> {
  await requireAdmin();
  if (!Number.isInteger(orderId)) return { message: "Pedido no válido." };

  const [order] = await sql`select status from orders where id = ${orderId}`;
  if (!order) return { message: "El pedido no existe." };
  const current = order.status as OrderStatus;

  const form = readForm(formData);
  const status = (form.oneOf("status", [current, ...nextStatuses[current]]) ?? current) as OrderStatus;
  const tracking = form.text("tracking", { max: 80 });
  const notes = form.text("admin_notes", { max: 500 });
  if (form.hasErrors()) return { errors: form.errors };

  await sql`
    update orders set status = ${status}, tracking = ${tracking}, admin_notes = ${notes}
    where id = ${orderId}`;

  revalidatePath("/", "layout");
  return { ok: true };
}
