import { CaretRight } from "@phosphor-icons/react/dist/ssr";
import Link from "next/link";
import { Counter, GoalGauge, MoneyDonut, MonthlyBars } from "@/components/arc-charts";
import { linkStyles } from "@/components/button";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { MoneyBars } from "@/components/money-bars";
import { PageHeader } from "@/components/page-header";
import { cell, fromMd, numberCell, row, th } from "@/components/products-table";
import { SummaryLine } from "@/components/summary-line";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import {
  getCash,
  getExpensesByCategory,
  getFinanceSettings,
  getMonthlySales,
  getResults,
  getSalesByChannel,
  getTopProducts,
  listPeriods,
  type Share,
} from "@/lib/finance";
import { queryText } from "@/lib/form";
import { formatCOP, formatPercent, todayInBogota } from "@/lib/format";
import { monthLabel, parsePeriod } from "@/lib/period";

export const metadata = { title: "Resumen" };

// Totales desde el primer día, sin importar el periodo elegido.
type Totals = {
  invested: number; // todo lo pagado en compras, con fletes
  sold: number; // total de las ventas
  cost_of_sales: number; // lo que costó la mercancía ya vendida
  receivable: number; // vendido que aún no se ha cobrado
  inventory: number; // mercancía disponible, a costo
  potential_profit: number; // ganancia si el inventario se vende a precio de lista
  // Lo que espera una acción tuya:
  to_verify: number; // pagos reportados por los clientes, sin verificar
  to_ship: number; // pedidos pagados que faltan por alistar o enviar
  quotes: number; // cotizaciones sin responder
  to_buy: number; // unidades vendidas sin tener stock: hay que comprarlas para entregar
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

// "1 pago" / "2 pagos"
const count = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`;

export default async function SummaryPage({ searchParams }: PageProps<"/admin">) {
  await requireAdmin();

  // El periodo llega en la dirección (?periodo=2026-10) y solo afecta al bloque "Resultados".
  const periodo = queryText((await searchParams).periodo);
  const period = parsePeriod(periodo);
  const thisMonth = todayInBogota().slice(0, 7);

  const [settings, periods, results, topProducts, channels, expenseCategories, months, totalRows, productRows] =
    await Promise.all([
      getFinanceSettings(),
      listPeriods(),
      getResults(period),
      getTopProducts(period),
      getSalesByChannel(period),
      getExpensesByCategory(period),
      getMonthlySales(),
      sql`
        select
          (select coalesce(sum(total_cost), 0) from purchases)::float8 as invested,
          (select coalesce(sum(inventory_value), 0) from product_stats)::float8 as inventory,
          (select coalesce(sum(stock * unit_profit) filter (where stock > 0), 0) from product_stats)::float8 as potential_profit,
          (select coalesce(sum(-stock) filter (where stock < 0), 0) from product_stats)::int as to_buy,
          (select count(*) from orders where status = 'payment_reported')::int as to_verify,
          (select count(*) from orders where status in ('payment_confirmed', 'preparing'))::int as to_ship,
          (select count(*) from quotes where answered_at is null)::int as quotes,
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
    ]);
  const totals = totalRows[0] as Totals;
  const products = productRows as ProductMovement[];
  const cash = await getCash(parsePeriod(""), settings.openingCash);

  // Lo que espera una acción. Solo se muestran las filas que tienen algo.
  const pending = [
    {
      n: totals.to_verify,
      text: count(totals.to_verify, "pago por confirmar", "pagos por confirmar"),
      href: "/admin/pedidos?estado=payment_reported",
      action: "Ir a Pedidos",
    },
    {
      n: totals.to_ship,
      text: count(totals.to_ship, "pedido pagado por enviar", "pedidos pagados por enviar"),
      href: "/admin/pedidos?estado=payment_confirmed",
      action: "Ir a Pedidos",
    },
    {
      n: totals.quotes,
      text: count(totals.quotes, "cotización por responder", "cotizaciones por responder"),
      href: "/admin/cotizaciones",
      action: "Ir a Cotizaciones",
    },
    {
      n: totals.to_buy,
      text: count(totals.to_buy, "unidad vendida que debes comprar para entregar", "unidades vendidas que debes comprar para entregar"),
      href: "/admin/compras/nueva",
      action: "Registrar compra",
    },
  ].filter((item) => item.n > 0);

  // Resultados del periodo, con las cuentas de la hoja "Resultados" del Excel.
  const gross = results.sold - results.costOfSales;
  const profit = gross + results.shipping - results.expenses;
  const variableExpenses = results.expenses - results.fixedExpenses;
  // Punto de equilibrio: lo mínimo que hay que vender para cubrir los gastos fijos.
  // De cada peso vendido, `contribution` es lo que queda tras pagar la mercancía y los gastos variables.
  const contribution = results.sold > 0 ? (gross - variableExpenses) / results.sold : 0;
  const breakEven = results.fixedExpenses > 0 && contribution > 0 ? results.fixedExpenses / contribution : null;

  // Meta del mes en curso.
  const monthSold = months.find((month) => month.month === thisMonth)?.sold ?? 0;
  const goalShare = settings.monthlyGoal > 0 ? monthSold / settings.monthlyGoal : 0;

  // Rango que cubren las gráficas por mes: "octubre de 2026" o "agosto de 2026 a octubre de 2026".
  const monthsPeriod =
    months.length === 0
      ? ""
      : months.length === 1
        ? monthLabel(months[0].month)
        : `${monthLabel(months[0].month)} a ${monthLabel(months[months.length - 1].month)}`;

  // Desde el inicio: lo invertido frente a lo vendido.
  const allTimeProfit = totals.sold - totals.cost_of_sales;
  const difference = totals.sold - totals.invested;
  const stillInStock = Math.max(0, totals.invested - totals.cost_of_sales); // de lo invertido, lo que aún no se vende
  const recovered = Math.min(totals.cost_of_sales, totals.invested);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Resumen"
        description="Qué tienes pendiente, cuánta plata hay y cuánto has ganado. Debajo de cada cifra dice de dónde sale."
      />

      <section aria-labelledby="pendientes">
        <h2 id="pendientes" className="font-display text-xl">
          Pendientes
        </h2>
        {pending.length === 0 ? (
          <p className="mt-3 text-sm text-ink-soft">No hay nada pendiente: ni pagos por verificar, ni pedidos por enviar, ni cotizaciones por responder.</p>
        ) : (
          <ul className="group/list mt-4 divide-y divide-line border border-line bg-surface">
            {pending.map((item) => (
              <li key={item.text}>
                <Link
                  href={item.href}
                  className="flex flex-wrap items-center justify-between gap-x-6 gap-y-1 px-5 py-4 text-sm transition duration-(--duration-medium) ease-smooth-out group-has-[a:hover]/list:duration-(--duration-quick) hover:bg-paper [@media(hover:hover)]:group-has-[a:hover]/list:not-hover:opacity-45"
                >
                  <span className="font-medium">{item.text}</span>
                  <span className="flex items-center gap-1 text-ink-soft">
                    {item.action}
                    <CaretRight size={14} weight="light" aria-hidden />
                  </span>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </section>

      <section aria-labelledby="hoy" className="mt-14">
        <h2 id="hoy" className="font-display text-xl">
          Cómo está el negocio hoy
        </h2>
        {/* Tres cifras y, si hay meta, su medidor. La rejilla comparte bordes para que se lea como un solo tablero. */}
        <div className={`mt-6 grid gap-px border border-line bg-line sm:grid-cols-2 ${settings.monthlyGoal > 0 ? "xl:grid-cols-4" : "lg:grid-cols-3"}`}>
          <Stat
            label="Saldo de caja"
            value={cash.closing}
            danger={cash.closing < 0}
            hint="El dinero que tienes hoy: el saldo con el que empezaste, más lo que ha entrado, menos lo que ha salido."
            link={{ href: "/admin/caja", label: "Ver la cuenta en Caja" }}
          />
          <Stat
            label="Por cobrar"
            value={totals.receivable}
            hint="Ventas que ya hiciste y que todavía no te han pagado. No están en la caja."
            link={{ href: "/admin/caja", label: "Marcar como cobrado en Caja" }}
          />
          <Stat
            label="Inventario, a costo"
            value={totals.inventory}
            hint="Lo que pagaste por los perfumes que tienes guardados: unidades en stock por su costo promedio."
            link={{ href: "/admin/productos", label: "Ver Productos" }}
          />
          {settings.monthlyGoal > 0 && (
            <div className="flex flex-col items-center bg-surface p-6 text-center">
              <GoalGauge label={`Meta de ventas de ${monthLabel(thisMonth)}`} sold={monthSold} goal={settings.monthlyGoal} />
              <p className="mt-3 text-xs leading-relaxed text-ink-faint">
                Llevas {formatPercent(goalShare)} de la meta{goalShare >= 1 ? ": cumplida" : ""}. La meta se cambia en{" "}
                <Link href="/admin/ajustes" className={linkStyles.default}>
                  Ajustes
                </Link>
                .
              </p>
            </div>
          )}
        </div>
      </section>

      <section aria-labelledby="resultados" className="mt-16 border-t border-line pt-10">
        <h2 id="resultados" className="font-display text-xl">
          Resultados
        </h2>
        <p className="mt-2 mb-5 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
          Cuánto vendiste y cuánto ganaste en el periodo que elijas. Una venta cuenta en la fecha en que se hizo, aunque
          todavía no te la hayan pagado.
        </p>
        <FilterBar values={{ periodo }} filters={[{ name: "periodo", label: "Todo el tiempo", options: periods }]} />

        {/* key: al cambiar de periodo, el bloque vuelve a entrar. */}
        <div key={periodo} className="motion-safe:animate-settle">
          {results.sales === 0 && results.expenses === 0 ? (
            <p className="border border-line bg-surface px-6 py-10 text-sm text-ink-soft">No hubo ventas ni gastos en este periodo.</p>
          ) : (
            <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_22rem]">
              {/* La cuenta, paso a paso: de lo vendido a la ganancia. */}
              <dl className="flex flex-col gap-4 border border-line bg-surface p-6 text-sm sm:p-8">
                <SummaryLine sign="" label="Lo que vendiste" hint="Suma de los perfumes vendidos. No cuenta los pedidos de la tienda que siguen esperando pago.">
                  {formatCOP(results.sold)}
                </SummaryLine>
                <SummaryLine sign="−" label="Lo que te costó esa mercancía" hint="El costo promedio de cada perfume vendido, con el flete incluido.">
                  {formatCOP(results.costOfSales)}
                </SummaryLine>
                <div className="border-t border-line" />
                <SummaryLine
                  sign="="
                  total
                  label="Ganancia bruta"
                  hint={`Lo que te deja la mercancía: ${formatPercent(results.sold > 0 ? gross / results.sold : 0)} de lo vendido.`}
                  danger={gross < 0}
                >
                  {formatCOP(gross)}
                </SummaryLine>
                {results.shipping > 0 && (
                  <SummaryLine sign="+" label="Envíos cobrados" hint="Lo que pagaron los clientes por el envío.">
                    {formatCOP(results.shipping)}
                  </SummaryLine>
                )}
                <SummaryLine
                  sign="−"
                  label="Gastos del negocio"
                  hint={
                    <>
                      Publicidad, empaques, envíos y demás. Se registran en{" "}
                      <Link href="/admin/caja" className={linkStyles.default}>
                        Caja
                      </Link>
                      .
                    </>
                  }
                >
                  {formatCOP(results.expenses)}
                </SummaryLine>
                <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-4">
                  <dt className="flex gap-2">
                    <span aria-hidden className="w-3 shrink-0 text-ink-faint">
                      =
                    </span>
                    <span className="sr-only">igual a</span>
                    <span>
                      <span className="font-medium">Ganancia</span>
                      <span className="mt-1 block text-xs leading-relaxed text-ink-faint">
                        Lo que te queda después de pagar la mercancía y los gastos:{" "}
                        {formatPercent(results.sold > 0 ? profit / results.sold : 0)} de lo vendido.
                      </span>
                    </span>
                  </dt>
                  <dd className={`shrink-0 text-3xl font-medium tracking-tight tabular-nums ${profit < 0 ? "text-danger" : ""}`}>
                    {formatCOP(profit)}
                  </dd>
                </div>
              </dl>

              <dl className="grid grid-cols-2 gap-px border border-line bg-line lg:grid-cols-1">
                <Figure label="Ventas" hint="Pedidos vendidos en el periodo." value={results.sales} />
                <Figure label="Unidades vendidas" hint="Perfumes que salieron en esas ventas." value={results.units} />
                <Figure
                  label="Promedio por venta"
                  hint="Lo vendido dividido entre el número de ventas."
                  value={results.sales > 0 ? Math.round(results.sold / results.sales) : 0}
                  money
                />
                {breakEven !== null && (
                  <Figure
                    label="Punto de equilibrio"
                    hint="Lo mínimo que debes vender en el periodo para cubrir tus gastos fijos. Por debajo de esto, pierdes."
                    value={Math.round(breakEven)}
                    money
                  />
                )}
              </dl>
            </div>
          )}

          <div className="mt-6 grid items-start gap-6 lg:grid-cols-3">
            <Panel title="Lo que más ganancia dejó" hint="Ganancia bruta por producto: lo que cobraste menos lo que te costó.">
              <ShareList items={topProducts.map((product) => ({ label: product.name, total: product.profit }))} empty="Sin ventas en este periodo." />
            </Panel>
            <Panel title="Ventas por canal" hint="Cuánto vendiste según por dónde llegó el cliente. Pulsa un canal para ocultarlo.">
              {channels.length === 0 ? <Empty>Sin ventas en este periodo.</Empty> : <MoneyDonut label="Ventas por canal" items={channels} />}
            </Panel>
            <Panel title="Gastos por categoría" hint="En qué se fue lo que gastaste. Pulsa una categoría para ocultarla.">
              {expenseCategories.length === 0 ? (
                <Empty>Sin gastos en este periodo.</Empty>
              ) : (
                <MoneyDonut label="Gastos por categoría" items={expenseCategories} />
              )}
            </Panel>
          </div>
        </div>
      </section>

      {months.length > 0 && (
        <section aria-labelledby="meses" className="mt-16">
          <h2 id="meses" className="font-display text-xl">
            Mes a mes
          </h2>
          <p className="mt-2 mb-6 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
            Lo vendido cada mes y la ganancia bruta que dejó (lo vendido menos lo que costó esa mercancía). Pasa por una
            barra para ver su valor; la línea marca el promedio.
          </p>
          <div className="grid gap-6 lg:grid-cols-2">
            <div className="border border-line bg-surface p-6 sm:p-8">
              <MonthlyBars
                label="Ventas"
                period={monthsPeriod}
                months={months.map((month) => ({ ...monthNames(month.month), value: month.sold }))}
              />
            </div>
            <div className="border border-line bg-surface p-6 sm:p-8">
              {/* Un mes con pérdida se dibuja en cero: la gráfica no tiene barras hacia abajo. */}
              <MonthlyBars
                label="Ganancia bruta"
                period={monthsPeriod}
                months={months.map((month) => ({ ...monthNames(month.month), value: Math.max(0, month.sold - month.cost) }))}
              />
            </div>
          </div>
        </section>
      )}

      {(totals.invested > 0 || totals.sold > 0) && (
        <section className="mt-16 border border-line bg-surface p-6 sm:p-8">
          <h2 className="font-display text-xl">Lo invertido frente a lo vendido</h2>
          <p className="mt-2 mb-8 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
            {difference < 0
              ? `Desde el inicio has invertido ${formatCOP(-difference)} más de lo que has vendido, pero conservas ${formatCOP(stillInStock)} en mercancía por vender. Comprar inventario no es perder dinero: es plata guardada en producto.`
              : `Desde el inicio has vendido ${formatCOP(difference)} más de lo que has invertido en compras.`}{" "}
            Si vendes el inventario a precio de lista, ganarías {formatCOP(totals.potential_profit)} más.
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
                  { label: "Ganancia", value: Math.max(0, allTimeProfit), color: colors.profit },
                ],
              },
            ]}
            legend={[
              { label: "Costo de lo vendido", value: totals.cost_of_sales, color: colors.cost },
              { label: "Aún en inventario", value: stillInStock, color: colors.inventory },
              { label: "Ganancia", value: Math.max(0, allTimeProfit), color: colors.profit },
            ]}
          />
        </section>
      )}

      {products.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl">Por producto, desde el inicio</h2>
          <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
            Lo que has comprado y vendido de cada perfume. Solo aparecen los que han tenido movimiento.
          </p>
          <Glossary
            title="¿Qué significa cada columna?"
            terms={[
              ["Compradas", "Unidades que le has comprado al proveedor."],
              ["Invertido", "Lo que pagaste por esas compras, con flete."],
              ["Vendidas", "Unidades que has vendido."],
              ["Vendido", "Lo que cobraste por esas ventas."],
              ["Ganancia", "Vendido menos lo que costaron las unidades vendidas."],
              ["En stock", "Unidades que tienes hoy. En negativo: vendiste sin tener y debes comprarlas."],
            ]}
          />
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
                        className="font-medium py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
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
      )}
    </div>
  );
}

// "2026-10" → la clave, el nombre completo y el nombre corto del mes para el eje ("oct").
function monthNames(month: string) {
  const label = monthLabel(month);
  return { key: month, label, short: label.slice(0, 3) };
}

// Caja con título y explicación para una gráfica o una lista.
function Panel({ title, hint, children }: { title: string; hint: string; children: React.ReactNode }) {
  return (
    <section className="border border-line bg-surface p-6">
      <h3 className="font-medium">{title}</h3>
      <p className="mt-1 mb-6 text-xs leading-relaxed text-ink-faint">{hint}</p>
      {children}
    </section>
  );
}

function Empty({ children }: { children: React.ReactNode }) {
  return <p className="text-sm text-ink-soft">{children}</p>;
}

// Lista con barras: cada fila muestra su valor y una barra en proporción al mayor de la lista.
function ShareList({ items, empty }: { items: Share[]; empty: string }) {
  const max = Math.max(...items.map((item) => item.total), 1);
  if (items.length === 0) return <Empty>{empty}</Empty>;

  return (
    <ul className="flex flex-col gap-4">
      {items.map((item) => (
        <li key={item.label}>
          <div className="flex items-baseline justify-between gap-4 text-sm">
            <span className="min-w-0 break-words">{item.label}</span>
            <span className={`shrink-0 font-medium tabular-nums ${item.total < 0 ? "text-danger" : ""}`}>{formatCOP(item.total)}</span>
          </div>
          <div aria-hidden className="mt-2 h-1.5 bg-mist">
            <div
              className="h-full rounded-r-[4px] bg-brand motion-safe:origin-left motion-safe:animate-grow"
              style={{ width: `${(Math.max(0, item.total) / max) * 100}%` }}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

// Un dato del estado actual: la cifra (sus dígitos ruedan al aparecer), de dónde sale y el
// enlace a la sección donde se ve el detalle.
function Stat({
  label,
  value,
  hint,
  link,
  danger = false,
}: {
  label: string;
  value: number;
  hint: string;
  link: { href: string; label: string };
  danger?: boolean;
}) {
  return (
    <div className="flex flex-col bg-surface p-6">
      <h3 className="text-sm text-ink-soft">{label}</h3>
      <p className="mt-3">
        <Counter value={value} money danger={danger} />
      </p>
      <p className="mt-3 mb-4 text-xs leading-relaxed text-ink-faint">{hint}</p>
      <Link href={link.href} className={`mt-auto flex items-center gap-1 self-start py-2 text-xs text-ink-soft ${linkStyles.default}`}>
        {link.label}
        <CaretRight size={12} weight="light" aria-hidden />
      </Link>
    </div>
  );
}

// Una cifra del periodo con su explicación debajo.
function Figure({ label, hint, value, money = false }: { label: string; hint: string; value: number; money?: boolean }) {
  return (
    <div className="bg-surface p-5">
      <dt className="text-sm text-ink-soft">{label}</dt>
      <dd>
        <p className="mt-2">
          <Counter value={value} money={money} small />
        </p>
        <p className="mt-2 text-xs leading-relaxed text-ink-faint">{hint}</p>
      </dd>
    </div>
  );
}
