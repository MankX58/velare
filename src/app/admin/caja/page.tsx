import Link from "next/link";
import { buttonStyles, linkStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { FilterBar } from "@/components/filter-bar";
import { Glossary } from "@/components/glossary";
import { PageHeader } from "@/components/page-header";
import { cell, fromMd, numberCell, row, th } from "@/components/products-table";
import { SummaryLine } from "@/components/summary-line";
import { requireAdmin } from "@/lib/auth";
import { getCash, getCashMovements, getFinanceSettings, getReceivables, listPeriods } from "@/lib/finance";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate } from "@/lib/format";
import { parsePeriod } from "@/lib/period";
import { deleteMovement, markPaid } from "./actions";

export const metadata = { title: "Caja" };

const underline =
  "font-medium py-2 underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink";

export default async function CashPage({ searchParams }: PageProps<"/admin/caja">) {
  await requireAdmin();

  const periodo = queryText((await searchParams).periodo);
  const period = parsePeriod(periodo);
  const { from } = period;

  const [settings, periods, movements, receivable] = await Promise.all([
    getFinanceSettings(),
    listPeriods(),
    getCashMovements(period),
    getReceivables(), // no dependen del periodo
  ]);
  const cash = await getCash(period, settings.openingCash);
  const owed = receivable.reduce((sum, sale) => sum + sale.total, 0);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Caja"
        description="El dinero que de verdad tienes: lo que ha entrado menos lo que ha salido. Aquí registras los gastos y el dinero que metes o sacas del negocio."
        action={
          <Link href="/admin/caja/nuevo" className={buttonStyles.primary}>
            Registrar movimiento
          </Link>
        }
      />

      <FilterBar values={{ periodo }} filters={[{ name: "periodo", label: "Todo el tiempo", options: periods }]} />

      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_22rem]">
        {/* La cuenta, paso a paso: del saldo con el que se empezó al saldo final. */}
        <dl className="flex flex-col gap-4 text-sm">
          <SummaryLine
            sign=""
            label={from ? "Saldo al empezar el periodo" : "Saldo inicial"}
            hint={
              from ? (
                "Lo que había en caja justo antes de este periodo."
              ) : (
                <>
                  El dinero con el que empezaste. Se cambia en{" "}
                  <Link href="/admin/ajustes" className={linkStyles.default}>
                    Ajustes
                  </Link>
                  .
                </>
              )
            }
            danger={cash.opening < 0}
          >
            {formatCOP(cash.opening)}
          </SummaryLine>
          <SummaryLine sign="+" label="Ventas cobradas" hint="Pedidos cuyo pago ya recibiste.">
            {formatCOP(cash.collected)}
          </SummaryLine>
          <SummaryLine sign="+" label="Aportes tuyos" hint="Dinero tuyo que metiste al negocio.">
            {formatCOP(cash.contributions)}
          </SummaryLine>
          <SummaryLine sign="−" label="Compras de mercancía" hint="Lo que pagaste al proveedor, con fletes.">
            {formatCOP(cash.purchases)}
          </SummaryLine>
          <SummaryLine sign="−" label="Gastos" hint="Publicidad, empaques, envíos y demás.">
            {formatCOP(cash.expenses)}
          </SummaryLine>
          <SummaryLine sign="−" label="Retiros tuyos" hint="Dinero que sacaste del negocio para ti.">
            {formatCOP(cash.withdrawals)}
          </SummaryLine>
          <div className="flex items-baseline justify-between gap-4 border-t border-ink pt-4">
            <dt className="flex gap-2">
              <span aria-hidden className="w-3 shrink-0 text-ink-faint">
                =
              </span>
              <span className="sr-only">igual a</span>
              <span className="font-medium">{from ? "Saldo al terminar el periodo" : "Saldo de caja hoy"}</span>
            </dt>
            <dd className={`shrink-0 text-3xl font-medium tracking-tight tabular-nums ${cash.closing < 0 ? "text-danger" : ""}`}>
              {formatCOP(cash.closing)}
            </dd>
          </div>
        </dl>

        <div className="flex flex-col gap-4 border-t border-line pt-6 text-sm leading-relaxed text-ink-soft lg:border-t-0 lg:border-l lg:pt-0 lg:pl-8">
          <p>
            La caja solo cuenta dinero que de verdad entró o salió. No es lo mismo que la ganancia: comprar mercancía
            baja la caja, aunque esa plata siga guardada en producto.
          </p>
          {cash.closing < 0 && (
            <p>
              Un saldo negativo significa que ha salido más de lo que hay registrado como entrada. Revisa el saldo
              inicial o registra el dinero que pusiste como un aporte.
            </p>
          )}
          {owed > 0 && (
            <p>
              Tienes <strong className="font-medium text-ink">{formatCOP(owed)}</strong> por cobrar: ventas fiadas que
              no entran a caja hasta que las marcas como cobradas, más abajo.
            </p>
          )}
        </div>
      </div>

      {receivable.length > 0 && (
        <section className="mt-16">
          <h2 className="font-display text-xl">Por cobrar</h2>
          <p className="mt-2 mb-6 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
            Ventas que ya entregaste o acordaste, pero cuyo dinero no ha entrado.
          </p>
          {/* relative: el título oculto de la columna de acciones queda dentro de la zona que se desliza. */}
          <div className="relative overflow-x-auto border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Venta</th>
                  <th className={`${th} ${fromMd}`}>Fecha</th>
                  <th className={th}>Cliente</th>
                  <th className={`${th} text-right`}>Total</th>
                  <th className={th}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {receivable.map((sale) => (
                  <tr key={sale.id} className={row}>
                    <td className={`${cell} py-4`}>
                      <Link href={`/admin/pedidos/${sale.id}`} className={`tabular-nums ${underline}`}>
                        {sale.code}
                      </Link>
                    </td>
                    <td className={`${cell} ${fromMd} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                      {formatDate(sale.ordered_on)}
                    </td>
                    <td className={`${cell} py-4`}>{sale.customer ?? "Sin cliente"}</td>
                    <td className={numberCell}>{formatCOP(sale.total)}</td>
                    <td className={`${cell} py-4 text-right`}>
                      <ConfirmButton
                        action={markPaid.bind(null, sale.id)}
                        label="Marcar como cobrada"
                        question="¿Ya recibiste el dinero?"
                        confirmLabel="Sí, cobrada"
                        successMessage="Venta cobrada"
                        failureTitle="No se pudo marcar"
                        danger={false}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="mt-16">
        <h2 className="font-display text-xl">Movimientos</h2>
        <p className="mt-2 max-w-[70ch] text-sm leading-relaxed text-ink-soft">
          Cada entrada (+) y salida (−) de dinero, de la más reciente a la más antigua. Sumadas al saldo inicial dan el
          saldo final.
        </p>
        <Glossary
          title="¿Qué es cada tipo de movimiento?"
          terms={[
            ["Venta cobrada", "Un pedido cuyo pago recibiste. Aparece sola al confirmar el pago o al marcar una venta como cobrada."],
            ["Compra", "Mercancía que le pagaste al proveedor. Aparece sola al registrarla en Compras."],
            ["Gasto", "Lo que gasta el negocio para funcionar: publicidad, empaques, envíos. Se registra con el botón de arriba."],
            ["Aporte", "Dinero tuyo que metes al negocio. Se registra con el botón de arriba."],
            ["Retiro", "Dinero que sacas del negocio para ti. Se registra con el botón de arriba."],
          ]}
        />
        {movements.length === 0 ? (
          <div className="border border-line bg-surface px-6 py-14">
            <h3 className="font-medium">{from ? "No hubo movimientos en este periodo" : "Todavía no hay movimientos"}</h3>
            <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
              Aquí aparecen solas las ventas cobradas y las compras de mercancía. Los gastos, y el dinero que metes o
              sacas del negocio, se registran con el botón de arriba.
            </p>
          </div>
        ) : (
          <div className="relative overflow-x-auto border border-line bg-surface">
            <table className="w-full text-left text-sm">
              <thead className="border-b border-line">
                <tr>
                  <th className={th}>Fecha</th>
                  <th className={th}>Movimiento</th>
                  <th className={`${th} ${fromMd}`}>Método</th>
                  <th className={`${th} text-right`}>Valor</th>
                  <th className={th}>
                    <span className="sr-only">Acciones</span>
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {movements.map((movement) => (
                  <tr key={`${movement.kind}-${movement.source_id}`} className={row}>
                    <td className={`${cell} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                      {formatDate(movement.moved_on)}
                    </td>
                    <td className={`${cell} py-4`}>
                      {movement.kind === "Venta cobrada" ? (
                        <Link href={`/admin/pedidos/${movement.source_id}`} className={underline}>
                          {movement.kind}
                        </Link>
                      ) : (
                        <p className="font-medium">{movement.kind}</p>
                      )}
                      <p className="mt-1 text-xs break-words text-ink-faint">{movement.description || "Sin descripción"}</p>
                    </td>
                    <td className={`${cell} ${fromMd} py-4 text-ink-soft`}>{movement.method ?? "Sin definir"}</td>
                    <td className={`${numberCell} font-medium`}>
                      {movement.amount > 0 && "+"}
                      {formatCOP(movement.amount)}
                    </td>
                    <td className={`${cell} py-4 text-right`}>
                      {/* Las ventas y las compras se corrigen en su propia sección. */}
                      {movement.kind !== "Venta cobrada" && movement.kind !== "Compra" && (
                        <ConfirmButton
                          action={deleteMovement.bind(null, movement.kind, movement.source_id)}
                          label="Eliminar"
                          question="¿Eliminar?"
                          successMessage={`${movement.kind} eliminado`}
                        />
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
