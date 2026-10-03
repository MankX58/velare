import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles, linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { requireUser } from "@/lib/auth";
import { formatCOP, formatDate } from "@/lib/format";
import { getOrder, getOrderItems, getStoreSettings, statusLabels, statusStyles, type OrderStatus } from "@/lib/orders";
import { cancelOrder } from "../actions";
import { ReportPaymentForm } from "../report-payment-form";

export const metadata: Metadata = { title: "Tu pedido", robots: { index: false } };

// Los pasos que ve el cliente, en orden.
const steps: OrderStatus[] = ["pending", "payment_reported", "payment_confirmed", "preparing", "shipped", "delivered"];

export default async function OrderPage({ params }: PageProps<"/pedidos/[id]">) {
  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const user = await requireUser(`/pedidos/${id}`);
  const order = await getOrder(id);
  // Solo el dueño del pedido (o un administrador) puede verlo.
  if (!order || (order.user_id !== user.id && user.role !== "admin")) notFound();

  const [items, store] = await Promise.all([getOrderItems(id), getStoreSettings()]);
  const total = order.items_total + order.shipping_fee;
  const currentStep = steps.indexOf(order.status);
  const whatsappText = encodeURIComponent(`Hola, hice el pedido ${order.code} por ${formatCOP(total)}.`);

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-8 pb-24 sm:px-8">
      <Link href="/pedidos" className={`text-sm text-ink-soft ${linkStyles.default}`}>
        Mis pedidos
      </Link>
      <div className="mt-6 flex flex-wrap items-center gap-4 motion-safe:animate-unveil">
        <h1 className="font-display text-5xl font-light tracking-tight tabular-nums sm:text-6xl">{order.code}</h1>
        <span className={`px-2 py-1 text-[11px] leading-none font-medium tracking-[0.08em] uppercase ${statusStyles[order.status]}`}>
          {statusLabels[order.status]}
        </span>
      </div>
      <p className="mt-2 text-sm text-ink-soft">Pedido del {formatDate(order.ordered_on)}</p>

      {order.status !== "cancelled" && (
        <ol className="mt-10 grid grid-cols-2 gap-x-4 gap-y-5 sm:grid-cols-3 lg:grid-cols-6">
          {steps.map((step, index) => (
            <li
              key={step}
              aria-current={index === currentStep ? "step" : undefined}
              className={`border-t-2 pt-3 text-sm ${
                index < currentStep ? "border-on-brand text-ink-soft" : index === currentStep ? "border-on-brand font-medium" : "border-line text-ink-faint"
              }`}
            >
              {statusLabels[step]}
            </li>
          ))}
        </ol>
      )}

      <div className="mt-12 grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div className="flex flex-col gap-10">
          {order.status === "pending" && (
            <section className="bg-brand p-6 text-on-brand sm:p-8">
              <h2 className="font-display text-2xl">Paga por transferencia</h2>
              {store.brebKey || store.qrImage ? (
                <div className="mt-6 flex flex-col gap-8 sm:flex-row sm:items-start">
                  {store.qrImage && (
                    <Image
                      src={store.qrImage}
                      alt="Código QR para pagar"
                      width={208}
                      height={208}
                      className="size-52 shrink-0 bg-surface object-contain p-2"
                    />
                  )}
                  <dl className="grid flex-1 gap-x-8 gap-y-5 sm:grid-cols-2">
                    <Datum label="Valor exacto">{formatCOP(total)}</Datum>
                    {store.brebKey && <Datum label="Llave Bre-B o Nequi">{store.brebKey}</Datum>}
                    {store.holder && <Datum label="A nombre de">{store.holder}</Datum>}
                    {store.bank && <Datum label="Banco o billetera">{store.bank}</Datum>}
                  </dl>
                </div>
              ) : (
                <p className="mt-4 leading-relaxed text-on-brand-soft">
                  Te enviaremos los datos para pagar {formatCOP(total)}. Escríbenos con el código {order.code}.
                </p>
              )}
              {/* Recordatorio: sin estos dos datos no se puede saber de quién es una transferencia. */}
              <ol className="mt-8 flex list-decimal flex-col gap-3 border-t border-on-brand/20 pt-6 pl-5 leading-relaxed">
                <li>
                  <strong className="font-medium">En el mensaje de la transferencia</strong> escribe tu nombre y el
                  código <strong className="font-medium tabular-nums">{order.code}</strong>.
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
                Recibimos tu aviso ({order.payment_reference}). En cuanto veamos la transferencia en el banco, el pedido
                pasa a Pago confirmado.
              </p>
            </section>
          )}

          {order.tracking && (
            <section className="border border-line bg-surface p-6">
              <h2 className="font-display text-xl">Guía de envío</h2>
              <p className="mt-2 tabular-nums">{order.tracking}</p>
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
                href={`https://wa.me/${store.whatsapp}?text=${whatsappText}`}
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
