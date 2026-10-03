import { notFound } from "next/navigation";
import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { formatCOP, formatDate } from "@/lib/format";
import { getOrder, getOrderItems, nextStatuses, statusLabels, statusStyles } from "@/lib/orders";
import { ConfirmPayment, OrderForm } from "../order-actions";

export const metadata = { title: "Pedido" };

const dateTime = new Intl.DateTimeFormat("es-CO", { dateStyle: "medium", timeStyle: "short", timeZone: "America/Bogota" });

export default async function AdminOrderPage({ params }: PageProps<"/admin/pedidos/[id]">) {
  await requireAdmin();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();
  const order = await getOrder(id);
  if (!order) notFound();

  const items = await getOrderItems(id);
  const total = order.items_total + order.shipping_fee;
  const awaitingPayment = order.status === "pending" || order.status === "payment_reported";

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title={order.code} back={{ href: "/admin/pedidos", label: "Volver a pedidos" }}>
        <p className="mt-3 flex flex-wrap items-center gap-3 text-sm text-ink-soft">
          <span className={`px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] uppercase ${statusStyles[order.status]}`}>
            {statusLabels[order.status]}
          </span>
          Pedido del {formatDate(order.ordered_on)}
        </p>
      </PageHeader>

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-10">
          <section>
            <h2 className="font-display text-xl">Productos</h2>
            <ul className="mt-4 divide-y divide-line border-y border-line text-sm">
              {items.map((item) => (
                <li key={item.product_name} className="flex justify-between gap-4 py-3">
                  <span>
                    {item.quantity} × {item.product_name}
                    <span className="ml-2 text-ink-faint tabular-nums">{formatCOP(item.unit_price)} c/u</span>
                  </span>
                  <span className="shrink-0 tabular-nums">{formatCOP(item.total)}</span>
                </li>
              ))}
            </ul>
            <dl className="mt-4 flex flex-col gap-2 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-ink-soft">Envío</dt>
                <dd className="tabular-nums">{formatCOP(order.shipping_fee)}</dd>
              </div>
              <div className="flex justify-between gap-4 text-base font-medium">
                <dt>Total</dt>
                <dd className="tabular-nums">{formatCOP(total)}</dd>
              </div>
            </dl>
          </section>

          <section>
            <h2 className="font-display text-xl">Cliente y envío</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {order.shipping_name ?? order.customer ?? "Sin nombre"}
              {order.shipping_phone && `, ${order.shipping_phone}`}
              {order.shipping_address && (
                <>
                  <br />
                  {order.shipping_address}, {order.shipping_city}
                </>
              )}
              {order.shipping_notes && (
                <>
                  <br />
                  {order.shipping_notes}
                </>
              )}
            </p>
          </section>

          <section>
            <h2 className="mb-4 font-display text-xl">Estado y envío</h2>
            <OrderForm
              orderId={order.id}
              status={order.status}
              options={nextStatuses[order.status]}
              tracking={order.tracking}
              notes={order.admin_notes}
            />
          </section>
        </div>

        <aside className="border border-line bg-surface p-6 lg:sticky lg:top-8">
          <h2 className="font-display text-xl">Pago</h2>
          <dl className="mt-5 flex flex-col gap-3 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Debe llegar</dt>
              <dd className="font-medium tabular-nums">{formatCOP(total)}</dd>
            </div>
            {order.payment_reported_at && (
              <div>
                <dt className="text-ink-soft">El cliente reportó</dt>
                <dd className="mt-1">{order.payment_reference}</dd>
                <dd className="text-xs text-ink-faint">{dateTime.format(new Date(order.payment_reported_at))}</dd>
              </div>
            )}
            {order.payment_confirmed_at && (
              <div>
                <dt className="text-ink-soft">Confirmado por</dt>
                <dd className="mt-1">{order.confirmed_by}</dd>
                <dd className="text-xs text-ink-faint">{dateTime.format(new Date(order.payment_confirmed_at))}</dd>
              </div>
            )}
          </dl>

          {awaitingPayment && (
            <div className="mt-6 border-t border-line pt-6">
              <p className="mb-4 text-xs leading-relaxed text-ink-soft">
                {order.status === "pending" && "El cliente todavía no ha avisado que pagó. "}
                Confirma solo después de ver la transferencia en tu banco: una captura de pantalla no es prueba.
              </p>
              <ConfirmPayment orderId={order.id} />
            </div>
          )}
        </aside>
      </div>
    </div>
  );
}
