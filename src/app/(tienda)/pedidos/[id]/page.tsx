import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles, linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatDate, whatsappLink } from "@/lib/format";
import { OrderProgress, OrderStatusBadge } from "@/components/order-progress";
import { QrImage } from "@/components/store/qr-image";
import { getOrder, getOrderItems, getStoreSettings, isToShip, showsCode } from "@/lib/orders";
import { ActionButton } from "@/components/action-button";
import { cancelOrder, confirmDelivery } from "../actions";
import { ReportPaymentForm } from "../report-payment-form";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

export default async function OrderPage({ params }: PageProps<"/pedidos/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const user = await requireUser(`/pedidos/${id}`);
  const order = await getOrder(id);
  // Solo el dueño del pedido (o un administrador) puede verlo.
  if (!order || (order.user_id !== user.id && user.role !== "admin")) notFound();

  const [items, store] = await Promise.all([getOrderItems(id), getStoreSettings()]);
  const total = order.items_total + order.shipping_fee;
  // Sin pago confirmado no se muestra el código: el pedido se identifica por nombre y fecha.
  const code = showsCode(order.status) ? order.code : null;
  const whatsappText = code
    ? `Hola, hice el pedido ${code} por ${formatCOP(total)}.`
    : `Hola, soy ${order.shipping_name}. Hice un pedido el ${formatDate(order.ordered_on)} por ${formatCOP(total)}.`;

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-24 sm:px-8">
      <Link href="/pedidos" className={`text-sm text-ink-soft ${linkStyles.default}`}>
        Mis pedidos
      </Link>
      <div className="mt-6 flex flex-wrap items-end justify-between gap-x-8 gap-y-3 motion-safe:animate-unveil">
        <div>
          <h1 className="font-display text-5xl font-light tracking-tight tabular-nums sm:text-6xl">{code ?? "Tu pedido"}</h1>
          <p className="mt-2 text-sm text-ink-soft">Pedido del {formatDate(order.ordered_on)}</p>
        </div>
        <OrderStatusBadge status={order.status} />
      </div>

      <div className="mt-10 border-y border-line py-8">
        <OrderProgress status={order.status} audience="customer" />
      </div>

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-10">
          {order.status === "pending" && (
            <section className="bg-brand p-6 text-on-brand sm:p-8">
              <h2 className="font-display text-2xl">Paga por transferencia</h2>
              {store.brebKey || store.qrImage ? (
                <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-start">
                  {store.qrImage && <QrImage src={store.qrImage} />}
                  <dl className="grid flex-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <Datum label="Valor exacto">{formatCOP(total)}</Datum>
                    {store.brebKey && <Datum label="Llave Bre-B o Nequi">{store.brebKey}</Datum>}
                    {store.holder && <Datum label="A nombre de">{store.holder}</Datum>}
                    {store.bank && <Datum label="Banco o billetera">{store.bank}</Datum>}
                  </dl>
                </div>
              ) : (
                <p className="mt-4 leading-relaxed text-on-brand-soft">
                  Te enviaremos los datos para pagar {formatCOP(total)}. Escríbenos por WhatsApp.
                </p>
              )}
              {/* Recordatorio: sin el nombre y el aviso no se puede saber de quién es una transferencia. */}
              <ol className="mt-8 flex list-decimal flex-col gap-3 border-t border-on-brand/20 pt-6 pl-5 leading-relaxed">
                <li>
                  <strong className="font-medium">En el mensaje de la transferencia</strong> escribe tu nombre
                  completo.
                </li>
                <li>
                  <strong className="font-medium">Después de pagar</strong>, llena el campo de abajo y pulsa Ya pagué.
                  Sin ese aviso no podemos identificar tu pago.
                </li>
              </ol>
            </section>
          )}

          {order.status === "pending" && (
            <section>
              <ReportPaymentForm orderId={order.id} />
            </section>
          )}

          {order.status === "payment_reported" && (
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-2xl">Estamos verificando tu pago</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Recibimos tu aviso ({order.payment_reference}). No tienes que hacer nada más: en cuanto veamos la
                transferencia en el banco, confirmamos el pago y alistamos tu pedido.
              </p>
            </section>
          )}

          {isToShip(order.status) && (
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-2xl">Pago confirmado</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Recibimos tu pago. Estamos alistando tu pedido; cuando salga, aquí verás la guía de envío.
              </p>
            </section>
          )}

          {order.status === "shipped" && (
            <section className="bg-brand p-6 text-on-brand sm:p-8">
              <h2 className="font-display text-2xl">Tu pedido va en camino</h2>
              {order.tracking && (
                <p className="mt-4">
                  <span className="block text-sm text-on-brand-soft">Guía de envío</span>
                  <span className="mt-1 block text-xl font-medium tabular-nums select-all">{order.tracking}</span>
                </p>
              )}
              <p className="mt-4 mb-6 leading-relaxed text-on-brand-soft">Cuando lo tengas en tus manos, avísanos.</p>
              {order.user_id === user.id && (
                <ActionButton
                  action={confirmDelivery.bind(null, order.id)}
                  label="Ya lo recibí"
                  successMessage="Gracias por avisar"
                  className={buttonStyles.onBrand}
                />
              )}
            </section>
          )}

          {order.status === "delivered" && (
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-2xl">Pedido entregado</h2>
              <p className="mt-2 text-sm leading-relaxed text-ink-soft">
                Gracias por tu compra.{order.tracking && ` Guía de envío: ${order.tracking}.`}
              </p>
            </section>
          )}

          <section>
            <h2 className="font-display text-xl">Envío</h2>
            <p className="mt-3 text-sm leading-relaxed text-ink-soft">
              {order.shipping_name}, {order.shipping_phone}
              <br />
              {order.shipping_address}, {order.shipping_city}
              {order.shipping_notes && (
                <>
                  <br />
                  {order.shipping_notes}
                </>
              )}
            </p>
          </section>

          <div className="flex flex-wrap items-center gap-6">
            {store.whatsapp && (
              <a
                href={whatsappLink(store.whatsapp, whatsappText)}
                target="_blank"
                rel="noreferrer"
                className={buttonStyles.secondary}
              >
                Escribir por WhatsApp
              </a>
            )}
            {order.status === "pending" && order.user_id === user.id && (
              <ConfirmButton
                action={cancelOrder.bind(null, order.id)}
                label="Cancelar el pedido"
                question="¿Cancelar este pedido?"
                confirmLabel="Sí, cancelar"
                failureTitle="No se pudo cancelar"
                successMessage="Pedido cancelado"
              />
            )}
          </div>
        </div>

        <aside className="border border-line bg-surface p-6 lg:sticky lg:top-24">
          <h2 className="font-display text-xl">Resumen</h2>
          <ul className="mt-6 flex flex-col gap-3 text-sm">
            {items.map((item) => (
              <li key={item.product_name} className="flex justify-between gap-4">
                <span className="text-ink-soft">
                  {item.quantity} × {item.product_name}
                </span>
                <span className="shrink-0 tabular-nums">{formatCOP(item.total)}</span>
              </li>
            ))}
          </ul>
          <dl className="mt-6 flex flex-col gap-3 border-t border-line pt-6 text-sm">
            <div className="flex justify-between gap-4">
              <dt className="text-ink-soft">Envío</dt>
              <dd className="tabular-nums">{order.shipping_fee > 0 ? formatCOP(order.shipping_fee) : "Se coordina contigo"}</dd>
            </div>
            <div className="flex justify-between gap-4 text-base font-medium">
              <dt>Total</dt>
              <dd className="tabular-nums">{formatCOP(total)}</dd>
            </div>
          </dl>
        </aside>
      </div>
    </main>
  );
}

function Datum({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <dt className="text-sm text-on-brand-soft">{label}</dt>
      <dd className="mt-1 text-xl font-medium tabular-nums select-all">{children}</dd>
    </div>
  );
}
