import { Check } from "@phosphor-icons/react/dist/ssr";
import { statusLabels, type OrderStatus } from "@/lib/orders";

// Cómo se ve el avance de un pedido en toda la app:
// - OrderProgress: el recorrido completo (página del pedido, en tienda y en panel).
// - OrderStatus: versión corta para listas y encabezados.

const steps: OrderStatus[] = ["pending", "payment_reported", "payment_confirmed", "preparing", "shipped", "delivered"];

// Qué está pasando en cada paso, dicho para el cliente y para quien administra.
const hints: Record<"customer" | "admin", Record<OrderStatus, string>> = {
  customer: {
    pending: "Transfiere el valor exacto y avísanos.",
    payment_reported: "Estamos revisando tu transferencia en el banco.",
    payment_confirmed: "Recibimos tu pago. Vamos a alistar tu pedido.",
    preparing: "Estamos alistando tu pedido.",
    shipped: "Tu pedido va en camino.",
    delivered: "Entregado. Gracias por tu compra.",
    cancelled: "Este pedido se canceló.",
  },
  admin: {
    pending: "Esperando la transferencia del cliente.",
    payment_reported: "Revisa tu banco y confirma el pago.",
    payment_confirmed: "Compra o alista el producto.",
    preparing: "Despáchalo y registra la guía.",
    shipped: "En camino al cliente.",
    delivered: "Pedido cerrado.",
    cancelled: "Este pedido se canceló.",
  },
};

// Recorrido del pedido. En el teléfono es una línea vertical; desde pantallas medianas, horizontal.
export function OrderProgress({ status, audience }: { status: OrderStatus; audience: "customer" | "admin" }) {
  if (status === "cancelled") {
    return (
      <p role="status" className="border border-danger/30 bg-danger-soft px-4 py-3 text-sm text-danger">
        {hints[audience].cancelled}
      </p>
    );
  }

  const current = steps.indexOf(status);
  const finished = status === "delivered";

  return (
    <ol aria-label="Avance del pedido" className="flex flex-col md:flex-row">
      {steps.map((step, index) => {
        const done = index < current || finished;
        const isCurrent = index === current && !finished;
        return (
          <li
            key={step}
            aria-current={index === current ? "step" : undefined}
            className="relative flex flex-1 gap-4 pb-7 last:pb-0 md:flex-col md:gap-3 md:pr-4 md:pb-0"
          >
            {/* Línea hacia el paso siguiente: vertical en el teléfono, horizontal en pantallas medianas. */}
            {index < steps.length - 1 && (
              <span aria-hidden className="absolute top-8 bottom-1 left-3.5 w-px bg-line md:top-3.5 md:right-1 md:bottom-auto md:left-8 md:h-px md:w-auto">
                {index < current && (
                  <span
                    style={{ animationDelay: `${index * 120}ms` }}
                    className="absolute inset-0 origin-left bg-brand md:motion-safe:animate-grow"
                  />
                )}
              </span>
            )}

            {/* Marcador: visto bueno sobre verde si ya pasó; número sobre el tono más oscuro
                (y un pulso) si es el actual; número en gris si falta. */}
            <span className="relative grid size-7 shrink-0 place-items-center">
              {isCurrent && <span aria-hidden className="absolute inset-0 bg-brand motion-safe:animate-ping" />}
              <span
                className={`relative grid size-7 place-items-center text-xs font-medium tabular-nums ${
                  done ? "bg-brand text-on-brand" : isCurrent ? "bg-ink text-paper" : "border border-line bg-surface text-ink-faint"
                }`}
              >
                {done ? <Check size={14} weight="bold" aria-hidden /> : index + 1}
              </span>
            </span>

            <div className="min-w-0 pt-1 md:pt-0">
              <p className={`text-sm ${isCurrent ? "font-medium" : done ? "text-ink-soft" : "text-ink-faint"}`}>
                {statusLabels[step]}
                {done && <span className="sr-only"> (completado)</span>}
              </p>
              {index === current && <p className="mt-1 text-xs leading-relaxed text-ink-soft">{hints[audience][step]}</p>}
            </div>
          </li>
        );
      })}
    </ol>
  );
}

// Estado en corto: el nombre y una barrita de seis tramos que se llena hasta el paso actual.
export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  if (status === "cancelled") {
    return <span className="text-sm font-medium text-danger">{statusLabels.cancelled}</span>;
  }

  const current = steps.indexOf(status);
  return (
    <span className="inline-flex flex-col gap-1.5">
      <span className="text-sm font-medium whitespace-nowrap">{statusLabels[status]}</span>
      <span aria-hidden className="flex gap-0.5">
        {steps.map((step, index) => (
          <span key={step} className={`h-1 w-4 ${index <= current ? "bg-brand" : "bg-line"}`} />
        ))}
      </span>
      <span className="sr-only">
        Paso {current + 1} de {steps.length}
      </span>
    </span>
  );
}
