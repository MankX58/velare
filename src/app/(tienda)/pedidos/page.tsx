import type { Metadata } from "next";
import Link from "next/link";
import { buttonStyles, linkStyles } from "@/components/button";
import { requireUser } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCOP, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-progress";
import type { OrderStatus } from "@/lib/orders";

export const metadata: Metadata = { title: "Mis pedidos", robots: { index: false } };

type OrderRow = { id: number; code: string; ordered_on: string; status: OrderStatus; total: number; units: number };

export default async function MyOrdersPage() {
  const user = await requireUser("/pedidos");

  const orders = (await sql`
    select o.id, o.code, o.ordered_on::text as ordered_on, o.status,
           (coalesce(sum(oi.total), 0) + o.shipping_fee)::int as total,
           coalesce(sum(oi.quantity), 0)::int as units
    from orders o
    left join order_items oi on oi.order_id = o.id
    where o.user_id = ${user.id}
    group by o.id
    order by o.id desc`) as OrderRow[];

  return (
    <main className="mx-auto w-full max-w-7xl flex-1 px-4 pt-12 pb-24 sm:px-8">
      <div className="mb-10 flex flex-wrap items-baseline justify-between gap-4 motion-safe:animate-unveil">
        <h1 className="font-display text-5xl font-light tracking-tight sm:text-6xl">Mis pedidos</h1>
        <p className="text-sm text-ink-soft">
          {user.email}
          {/* /auth/logout lo atiende Auth0: por eso es <a> y no <Link>. */}
          <a href="/auth/logout" className={`ml-4 ${linkStyles.default}`}>
            Cerrar sesión
          </a>
        </p>
      </div>

      {orders.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-16">
          <h2 className="font-display text-2xl">Aún no tienes pedidos</h2>
          <p className="mt-2 text-sm text-ink-soft">Cuando hagas el primero, aquí podrás seguir su estado.</p>
          <Link href="/catalogo" className={`mt-8 ${buttonStyles.primary}`}>
            Ver catálogo
          </Link>
        </div>
      ) : (
        <ul className="group/list border-b border-line motion-safe:animate-settle">
          {orders.map((order) => (
            <li key={order.id} className="border-t border-line">
              <Link
                href={`/pedidos/${order.id}`}
                className="flex flex-wrap items-center justify-between gap-x-6 gap-y-2 py-5 transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/list:duration-(--duration-quick) [@media(hover:hover)]:group-has-[a:hover]/list:not-hover:opacity-45"
              >
                <span className="font-display text-2xl tabular-nums">{order.code}</span>
                <span className="text-sm text-ink-soft">
                  {formatDate(order.ordered_on)}, {order.units} {order.units === 1 ? "unidad" : "unidades"}
                </span>
                <OrderStatusBadge status={order.status} />
                <span className="font-medium tabular-nums">{formatCOP(order.total)}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
