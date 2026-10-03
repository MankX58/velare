import { sql } from "./db";
import { monthLabel, type Period } from "./period";

// Consultas de dinero del panel: lo que en el Excel eran las hojas Config, Resultados y Caja.
// Una "venta" es un pedido con el pago confirmado (ni pendiente ni cancelado).
// Las sumas se piden como float8 para recibirlas como número (exacto en pesos enteros).
// Un periodo sin fechas (from y to en null) significa "todo el tiempo".

// ---------- Parámetros (hoja Config). Se editan en Panel → Ajustes ----------

export type FinanceSettings = {
  openingCash: number; // dinero en caja y bancos el día en que se empezó a registrar
  monthlyGoal: number; // meta de ventas del mes
  targetMargin: number; // margen deseado, como fracción: 0.3 = 30 %
  paymentFee: number; // comisión de pago, como fracción
  vat: number; // IVA a cobrar, como fracción
  reactivationDays: number; // días sin comprar para marcar a un cliente como "Reactivar"
  expenseCategories: string[];
  paymentMethods: string[];
};

export async function getFinanceSettings(): Promise<FinanceSettings> {
  const rows = await sql`select key, value from settings`;
  const saved = Object.fromEntries(rows.map((row) => [row.key as string, row.value as unknown]));
  const number = (key: string) => (typeof saved[key] === "number" ? saved[key] : 0);
  const list = (key: string) => (Array.isArray(saved[key]) ? (saved[key] as string[]) : []);

  return {
    openingCash: number("opening_cash"),
    monthlyGoal: number("monthly_sales_goal"),
    targetMargin: number("target_margin"),
    paymentFee: number("payment_fee"),
    vat: number("vat"),
    reactivationDays: number("reactivation_days") || 60,
    expenseCategories: list("expense_categories"),
    paymentMethods: list("payment_methods"),
  };
}

// ---------- Periodos ----------

// Opciones del filtro de periodo: los años y meses en los que hubo ventas o movimientos de caja.
export async function listPeriods() {
  const rows = (await sql`
    select distinct to_char(day, 'YYYY-MM') as month
    from (
      select ordered_on as day from orders where status not in ('pending', 'payment_reported', 'cancelled')
      union all
      select moved_on from cash_movements
    ) days
    order by month desc`) as { month: string }[];

  const options: { value: string; label: string }[] = [];
  for (const { month } of rows) {
    const year = month.slice(0, 4);
    // Antes del primer mes de cada año va la opción del año completo.
    if (!options.some((option) => option.value === year)) options.push({ value: year, label: `Año ${year}` });
    options.push({ value: month, label: monthLabel(month) });
  }
  return options;
}

// ---------- Resultados (hoja Resultados): por fecha de venta, aunque aún no se haya cobrado ----------

export type Results = {
  sold: number; // total de las ventas, sin envíos
  costOfSales: number; // lo que costó la mercancía vendida
  shipping: number; // envíos cobrados a los clientes
  units: number;
  sales: number; // número de pedidos vendidos
  expenses: number; // gastos operativos
  fixedExpenses: number; // la parte de esos gastos marcada como "Fijo"
};

export async function getResults({ from, to }: Period) {
  const [row] = await sql`
    with sold as (
      select id, shipping_fee from orders
      where status not in ('pending', 'payment_reported', 'cancelled')
        and (${from}::date is null or ordered_on >= ${from}::date)
        and (${to}::date is null or ordered_on < ${to}::date)
    ),
    lines as (
      select oi.quantity, oi.unit_cost, oi.total from order_items oi join sold on sold.id = oi.order_id
    ),
    spent as (
      select amount, kind from expenses
      where (${from}::date is null or spent_on >= ${from}::date)
        and (${to}::date is null or spent_on < ${to}::date)
    )
    select
      (select coalesce(sum(total), 0) from lines)::float8 as sold,
      (select coalesce(sum(quantity * unit_cost), 0) from lines)::float8 as "costOfSales",
      (select coalesce(sum(quantity), 0) from lines)::int as units,
      (select coalesce(sum(shipping_fee), 0) from sold)::float8 as shipping,
      (select count(*) from sold)::int as sales,
      (select coalesce(sum(amount), 0) from spent)::float8 as expenses,
      (select coalesce(sum(amount), 0) from spent where kind = 'Fijo')::float8 as "fixedExpenses"`;
  return row as Results;
}

export type ProductResult = { id: number; name: string; units: number; sold: number; profit: number };

// Los productos que más ganancia bruta dejaron en el periodo.
export async function getTopProducts({ from, to }: Period, limit = 5) {
  return (await sql`
    select oi.product_id as id, max(oi.product_name) as name, sum(oi.quantity)::int as units,
           sum(oi.total)::float8 as sold,
           sum(oi.total - oi.quantity * oi.unit_cost)::float8 as profit
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.status not in ('pending', 'payment_reported', 'cancelled')
      and (${from}::date is null or o.ordered_on >= ${from}::date)
      and (${to}::date is null or o.ordered_on < ${to}::date)
    group by oi.product_id
    order by profit desc, sold desc
    limit ${limit}`) as ProductResult[];
}

export type Share = { label: string; total: number };

// Ventas del periodo según el canal por el que llegó el cliente.
export async function getSalesByChannel({ from, to }: Period) {
  return (await sql`
    select coalesce(o.channel, 'Sin canal') as label, sum(oi.total)::float8 as total
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.status not in ('pending', 'payment_reported', 'cancelled')
      and (${from}::date is null or o.ordered_on >= ${from}::date)
      and (${to}::date is null or o.ordered_on < ${to}::date)
    group by 1
    order by total desc`) as Share[];
}

export async function getExpensesByCategory({ from, to }: Period) {
  return (await sql`
    select coalesce(category, 'Sin categoría') as label, sum(amount)::float8 as total
    from expenses
    where (${from}::date is null or spent_on >= ${from}::date)
      and (${to}::date is null or spent_on < ${to}::date)
    group by 1
    order by total desc`) as Share[];
}

export type MonthSales = { month: string; sold: number; cost: number };

// Ventas y su costo, mes a mes: los últimos 12 meses en que hubo ventas, del más reciente al más antiguo.
export async function getMonthlySales() {
  return (await sql`
    select to_char(o.ordered_on, 'YYYY-MM') as month,
           sum(oi.total)::float8 as sold,
           sum(oi.quantity * oi.unit_cost)::float8 as cost
    from order_items oi
    join orders o on o.id = oi.order_id
    where o.status not in ('pending', 'payment_reported', 'cancelled')
    group by 1
    order by 1 desc
    limit 12`) as MonthSales[];
}

// ---------- Caja (hoja Caja): solo dinero que de verdad entró o salió ----------

export type Cash = {
  opening: number; // saldo al empezar el periodo
  collected: number; // ventas cobradas
  contributions: number; // aportes del dueño
  purchases: number; // compras de mercancía
  expenses: number; // gastos operativos
  withdrawals: number; // retiros del dueño
  closing: number; // saldo al terminar el periodo
};

export type Movement = {
  moved_on: string;
  kind: "Venta cobrada" | "Aporte" | "Compra" | "Gasto" | "Retiro";
  amount: number; // positivo si entró, negativo si salió
  description: string | null;
  method: string | null;
  source_id: number; // id del pedido, compra, gasto o movimiento del que sale la fila
};

// Libro de caja del periodo, del movimiento más reciente al más antiguo.
// ponytail: devuelve como máximo 500 filas, sin páginas. Elegir un mes las acota.
export async function getCashMovements({ from, to }: Period) {
  return (await sql`
    select moved_on::text as moved_on, kind, amount, description, method, source_id
    from cash_movements
    where (${from}::date is null or moved_on >= ${from}::date)
      and (${to}::date is null or moved_on < ${to}::date)
    order by moved_on desc, kind, source_id desc
    limit 500`) as Movement[];
}

export type Receivable = { id: number; code: string; ordered_on: string; customer: string | null; total: number };

// Ventas hechas que todavía no se han cobrado (fiado), de la más antigua a la más reciente.
export async function getReceivables() {
  return (await sql`
    select o.id, o.code, o.ordered_on::text as ordered_on, coalesce(o.shipping_name, c.name) as customer,
           ((select coalesce(sum(total), 0) from order_items where order_id = o.id) + o.shipping_fee)::int as total
    from orders o
    left join customers c on c.id = o.customer_id
    where o.paid_on is null and o.status not in ('pending', 'payment_reported', 'cancelled')
    order by o.ordered_on, o.id`) as Receivable[];
}

// Estado de la caja en un periodo. El saldo inicial es el que se configuró en Ajustes
// más todo lo que entró y salió antes del periodo.
export async function getCash({ from, to }: Period, openingCash: number): Promise<Cash> {
  const rows = (await sql`
    select kind,
           coalesce(sum(amount) filter (where ${from}::date is not null and moved_on < ${from}::date), 0)::float8 as before,
           coalesce(sum(amount) filter (where ${from}::date is null or moved_on >= ${from}::date), 0)::float8 as within
    from cash_movements
    where ${to}::date is null or moved_on < ${to}::date
    group by kind`) as { kind: string; before: number; within: number }[];

  // Las salidas vienen en negativo desde la vista; aquí se muestran en positivo.
  const total = (kind: string) => Math.abs(rows.find((row) => row.kind === kind)?.within ?? 0);
  const opening = openingCash + rows.reduce((sum, row) => sum + row.before, 0);
  const closing = opening + rows.reduce((sum, row) => sum + row.within, 0);

  return {
    opening,
    collected: total("Venta cobrada"),
    contributions: total("Aporte"),
    purchases: total("Compra"),
    expenses: total("Gasto"),
    withdrawals: total("Retiro"),
    closing,
  };
}
