import Link from "next/link";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { Fact, NoMatches, PageHeader } from "@/components/page-header";
import { cell, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate } from "@/lib/format";
import { OrderStatusBadge } from "@/components/order-progress";
import { statusLabels, type OrderStatus } from "@/lib/orders";

export const metadata = { title: "Pedidos" };

type OrderRow = {
  id: number;
  code: string;
  ordered_on: string;
  status: OrderStatus;
  customer: string | null;
  channel: string | null;
  total: number;
};

export default async function OrdersPage({ searchParams }: PageProps<"/admin/pedidos">) {
  await requireAdmin();

  const params = await searchParams;
  const q = queryText(params.q);
  const estado = queryText(params.estado);
  const like = `%${q}%`;

  const orders = (await sql`
    select o.id, o.code, o.ordered_on::text as ordered_on, o.status, o.channel,
           coalesce(o.shipping_name, c.name) as customer,
           ((select coalesce(sum(total), 0) from order_items where order_id = o.id) + o.shipping_fee)::int as total
    from orders o
    left join customers c on c.id = o.customer_id
    where (${q} = '' or o.code ilike ${like} or c.name ilike ${like} or o.shipping_name ilike ${like})
      and (${estado} = '' or o.status = ${estado})
    order by o.id desc`) as OrderRow[];

  // Lo que pide atención: pagos reportados que hay que revisar en el banco.
  const [{ to_verify }] = await sql`select count(*)::int as to_verify from orders where status = 'payment_reported'`;

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Pedidos"
        description="Los pedidos que hacen los clientes en la tienda. Abre uno para verificar su pago, cambiar su estado o registrar la guía de envío."
      >
        <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
          <Fact label="Pedidos">{orders.length}</Fact>
          <Fact label="Pagos por verificar">{to_verify}</Fact>
        </dl>
      </PageHeader>

      <FilterBar
        placeholder="Buscar por código o cliente"
        values={{ q, estado }}
        filters={[
          {
            name: "estado",
            label: "Todos los estados",
            options: Object.entries(statusLabels).map(([value, label]) => ({ value, label })),
          },
        ]}
      />

      <Glossary
        title="¿Qué significa cada estado?"
        terms={[
          ["Pendiente de pago", "El cliente hizo el pedido y aún no avisa que pagó. No cuenta como venta ni descuenta stock."],
          ["Pago reportado", "El cliente dice que ya transfirió. Te toca revisar el banco y confirmar."],
          ["Pago confirmado", "Viste el dinero. Desde aquí cuenta como venta, descuenta stock y entra a caja."],
          ["Preparando", "Estás alistando o consiguiendo el producto."],
          ["Enviado", "Ya lo despachaste. Si registraste la guía, el cliente la ve."],
          ["Entregado", "El cliente lo recibió. Pedido cerrado."],
          ["Cancelado", "No se hizo. No cuenta en ventas, stock ni caja."],
        ]}
      />

      {orders.length === 0 && (q || estado) ? (
        <NoMatches what="pedido" />
      ) : orders.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay pedidos</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cuando alguien haga un pedido en la tienda, aparecerá aquí para que verifiques su pago.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Pedido</th>
                <th className={`${th} ${fromMd}`}>Fecha</th>
                <th className={th}>Cliente</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={th}>Estado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {orders.map((order) => (
                <tr key={order.id} className={row}>
                  <td className={`${cell} py-4`}>
                    <Link
                      href={`/admin/pedidos/${order.id}`}
                      className="font-medium tabular-nums py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
                    >
                      {order.code}
                    </Link>
                    <p className="mt-1 text-xs text-ink-faint">{order.channel ?? "Sin canal"}</p>
                  </td>
                  <td className={`${cell} ${fromMd} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                    {formatDate(order.ordered_on)}
                  </td>
                  <td className={`${cell} py-4`}>{order.customer ?? "Sin cliente"}</td>
                  <td className={numberCell}>{formatCOP(order.total)}</td>
                  <td className={`${cell} py-4`}>
                    <OrderStatusBadge status={order.status} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
