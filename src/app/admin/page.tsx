import Link from "next/link";
import { MoneyBars } from "@/components/money-bars";
import { PageHeader } from "@/components/page-header";
import { cell, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCOP, formatPercent } from "@/lib/format";

export const metadata = { title: "Resumen" };

type Totals = {
  invested: number; // todo lo pagado en compras, con fletes
  sold: number; // total de las ventas
  cost_of_sales: number; // lo que costó la mercancía ya vendida
  receivable: number; // vendido que aún no se ha cobrado
  inventory: number; // mercancía disponible, a costo
  potential_profit: number; // ganancia si el inventario se vende a precio de lista
};

type ProductMovement = {
  id: number;
  name: string;
  sku: string;
  units_purchased: number;
  invested: number;
  units_sold: number;
  total_sales: number;
  gross_profit: number;
  stock: number;
};

const colors = {
  cost: "var(--color-chart-cost)",
  inventory: "var(--color-chart-inventory)",
  profit: "var(--color-chart-profit)",
};

export default async function SummaryPage() {
  await requireAdmin();

  // Las sumas se piden como float8 para recibirlas como número (exacto en pesos enteros).
  const [[totals], products] = (await Promise.all([
    sql`
      select
        (select coalesce(sum(total_cost), 0) from purchases)::float8 as invested,
        (select coalesce(sum(inventory_value), 0) from product_stats)::float8 as inventory,
        (select coalesce(sum(stock * unit_profit) filter (where stock > 0), 0) from product_stats)::float8 as potential_profit,
        s.sold, s.cost_of_sales, s.receivable
      from (
        select coalesce(sum(oi.total), 0)::float8 as sold,
               coalesce(sum(oi.quantity * oi.unit_cost), 0)::float8 as cost_of_sales,
               coalesce(sum(oi.total) filter (where o.paid_on is null), 0)::float8 as receivable
        from order_items oi
        join orders o on o.id = oi.order_id
        where o.status not in ('pending', 'payment_reported', 'cancelled')
      ) s`,
    sql`
      select p.id, p.name, p.sku, s.units_purchased, s.units_sold, s.total_sales, s.gross_profit, s.stock,
             coalesce((select sum(total_cost) from purchases where product_id = p.id), 0)::int as invested
      from products p
      join product_stats s on s.product_id = p.id
      where s.units_purchased > 0 or s.units_sold > 0
      order by s.gross_profit desc, p.sku`,
  ])) as [Totals[], ProductMovement[]];

  const profit = totals.sold - totals.cost_of_sales;
  const margin = totals.sold > 0 ? profit / totals.sold : 0;
  const difference = totals.sold - totals.invested;
  // De lo invertido, la parte que todavía no se ha vendido.
  const stillInStock = Math.max(0, totals.invested - totals.cost_of_sales);
  const recovered = Math.min(totals.cost_of_sales, totals.invested);

  if (totals.invested === 0 && totals.sold === 0) {
    return (
      <div className="motion-safe:animate-settle">
        <PageHeader title="Resumen" />
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay compras ni ventas</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cuando registres la primera compra, aquí verás cuánto has invertido, cuánto has vendido y cuánto has ganado.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title="Resumen" />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        <section>
          <p className="text-sm text-ink-soft">Ganancia bruta</p>
          <p className={`mt-2 text-5xl font-medium tracking-tight sm:text-6xl ${profit < 0 ? "text-danger" : ""}`}>
            {formatCOP(profit)}
          </p>
          <p className="mt-4 max-w-[52ch] leading-relaxed text-ink-soft">
            Has vendido <strong className="font-medium text-ink">{formatCOP(totals.sold)}</strong> de mercancía que te
            costó <strong className="font-medium text-ink">{formatCOP(totals.cost_of_sales)}</strong>. De cada peso
            vendido te quedan {formatPercent(margin)}.
          </p>
        </section>

        <dl className="flex flex-col gap-3 border-t border-line pt-6 text-sm lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <Row label="Invertido en compras">{formatCOP(totals.invested)}</Row>
          <Row label="Vendido">{formatCOP(totals.sold)}</Row>
          <Row label="Diferencia (vendido menos invertido)" danger={difference < 0}>
            {formatCOP(difference)}
          </Row>
          <div className="my-1 border-t border-line" />
          <Row label="Inventario disponible, a costo">{formatCOP(totals.inventory)}</Row>
          <Row label="Ganancia si lo vendes a precio de lista">{formatCOP(totals.potential_profit)}</Row>
          <Row label="Por cobrar">{formatCOP(totals.receivable)}</Row>
        </dl>
      </div>

      <section className="mt-16 border border-line bg-surface p-6 sm:p-8">
        <h2 className="font-display text-xl">Lo invertido frente a lo vendido</h2>
        <p className="mt-2 mb-8 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
          {difference < 0
            ? `Has invertido ${formatCOP(-difference)} más de lo que has vendido, pero conservas ${formatCOP(stillInStock)} en mercancía por vender. Comprar inventario no es perder dinero: es plata guardada en producto.`
            : `Has vendido ${formatCOP(difference)} más de lo que has invertido en compras.`}
        </p>
        <MoneyBars
          bars={[
            {
              label: "Invertido en compras",
              segments: [
                { label: "Costo de lo vendido", value: recovered, color: colors.cost },
                { label: "Aún en inventario", value: stillInStock, color: colors.inventory },
              ],
            },
            {
              label: "Vendido",
              segments: [
                { label: "Costo de lo vendido", value: Math.min(totals.cost_of_sales, totals.sold), color: colors.cost },
                { label: "Ganancia", value: Math.max(0, profit), color: colors.profit },
              ],
            },
          ]}
          legend={[
            { label: "Costo de lo vendido", value: totals.cost_of_sales, color: colors.cost },
            { label: "Aún en inventario", value: stillInStock, color: colors.inventory },
            { label: "Ganancia", value: Math.max(0, profit), color: colors.profit },
          ]}
        />
      </section>

      <section className="mt-16">
        <h2 className="mb-6 font-display text-xl">Por producto</h2>
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Producto</th>
                <th className={`${th} ${fromMd} text-right`}>Compradas</th>
                <th className={`${th} text-right`}>Invertido</th>
                <th className={`${th} ${fromMd} text-right`}>Vendidas</th>
                <th className={`${th} text-right`}>Vendido</th>
                <th className={`${th} text-right`}>Ganancia</th>
                <th className={`${th} ${fromMd} text-right`}>En stock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {products.map((p) => (
                <tr key={p.id} className={row}>
                  <td className={`${cell} py-4`}>
                    <Link
                      href={`/admin/productos/${p.id}`}
                      className="font-medium underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
                    >
                      {p.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-faint tabular-nums">{p.sku}</p>
                  </td>
                  <td className={`${numberCell} ${fromMd} text-ink-soft`}>{p.units_purchased}</td>
                  <td className={numberCell}>{formatCOP(p.invested)}</td>
                  <td className={`${numberCell} ${fromMd} text-ink-soft`}>{p.units_sold}</td>
                  <td className={numberCell}>{formatCOP(p.total_sales)}</td>
                  <td className={`${numberCell} font-medium ${p.gross_profit < 0 ? "text-danger" : ""}`}>
                    {formatCOP(p.gross_profit)}
                  </td>
                  <td className={`${numberCell} ${fromMd} text-ink-soft`}>{p.stock}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Row({ label, danger = false, children }: { label: string; danger?: boolean; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className={`text-right font-medium tabular-nums ${danger ? "text-danger" : ""}`}>{children}</dd>
    </div>
  );
}
