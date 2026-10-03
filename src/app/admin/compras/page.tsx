import Link from "next/link";
import { buttonStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { FilterBar } from "@/components/filter-bar";
import { Fact, NoMatches, PageHeader } from "@/components/page-header";
import { cell, fromLg, fromMd, numberCell, row, th } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { queryText } from "@/lib/form";
import { formatCOP, formatDate } from "@/lib/format";
import { deletePurchase } from "./actions";

export const metadata = { title: "Compras" };

type PurchaseRow = {
  id: number;
  purchased_on: string;
  supplier: string | null;
  quantity: number;
  unit_cost: number;
  shipping_cost: number;
  total_cost: number;
  payment_method: string | null;
  notes: string | null;
  product_id: number;
  sku: string;
  name: string;
};

export default async function PurchasesPage({ searchParams }: PageProps<"/admin/compras">) {
  await requireAdmin();

  const q = queryText((await searchParams).q);
  const like = `%${q}%`;

  const purchases = (await sql`
    select pu.id, pu.purchased_on::text as purchased_on, pu.supplier, pu.quantity, pu.unit_cost,
           pu.shipping_cost, pu.total_cost, pu.payment_method, pu.notes,
           p.id as product_id, p.sku, p.name
    from purchases pu
    join products p on p.id = pu.product_id
    where ${q} = '' or p.name ilike ${like} or p.sku ilike ${like}
       or pu.supplier ilike ${like} or pu.notes ilike ${like}
    order by pu.purchased_on desc, pu.id desc`) as PurchaseRow[];

  const total = purchases.reduce((sum, purchase) => sum + purchase.total_cost, 0);
  const units = purchases.reduce((sum, purchase) => sum + purchase.quantity, 0);

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader
        title="Compras"
        action={
          <Link href="/admin/compras/nueva" className={buttonStyles.primary}>
            Registrar compra
          </Link>
        }
      >
        {purchases.length > 0 && (
          <dl className="mt-4 flex flex-wrap gap-x-8 gap-y-2">
            <Fact label="Compras">{purchases.length}</Fact>
            <Fact label="Unidades">{units}</Fact>
            <Fact label="Total invertido">{formatCOP(total)}</Fact>
          </dl>
        )}
      </PageHeader>

      <FilterBar placeholder="Buscar por producto, proveedor o factura" values={{ q }} />

      {purchases.length === 0 && q ? (
        <NoMatches what="compra" />
      ) : purchases.length === 0 ? (
        <div className="border border-line bg-surface px-6 py-14">
          <h2 className="font-medium">Todavía no hay compras</h2>
          <p className="mt-2 max-w-[60ch] text-sm leading-relaxed text-ink-soft">
            Cada vez que compres mercancía, regístrala aquí. El stock del producto sube y su costo promedio se recalcula
            con el flete incluido.
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto border border-line bg-surface">
          <table className="w-full text-left text-sm">
            <thead className="border-b border-line">
              <tr>
                <th className={th}>Fecha</th>
                <th className={th}>Producto</th>
                <th className={`${th} ${fromLg}`}>Proveedor</th>
                <th className={`${th} ${fromMd} text-right`}>Cant.</th>
                <th className={`${th} ${fromMd} text-right`}>Costo unitario</th>
                <th className={`${th} ${fromLg} text-right`}>Flete</th>
                <th className={`${th} text-right`}>Total</th>
                <th className={`${th} ${fromMd} text-right`}>Costo real / und</th>
                <th className={th}>
                  <span className="sr-only">Acciones</span>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {purchases.map((purchase) => (
                <tr key={purchase.id} className={row}>
                  <td className={`${cell} py-4 whitespace-nowrap text-ink-soft tabular-nums`}>
                    {formatDate(purchase.purchased_on)}
                  </td>
                  <td className={`${cell} py-4`}>
                    <Link
                      href={`/admin/productos/${purchase.product_id}`}
                      className="font-medium underline decoration-transparent transition-colors duration-(--duration-quick) ease-smooth-out hover:decoration-ink"
                    >
                      {purchase.name}
                    </Link>
                    <p className="mt-1 text-xs text-ink-faint tabular-nums">{purchase.sku}</p>
                  </td>
                  <td className={`${cell} ${fromLg} py-4`}>
                    <p>{purchase.supplier ?? "Sin proveedor"}</p>
                    <p className="mt-1 text-xs text-ink-faint">
                      {[purchase.payment_method, purchase.notes].filter(Boolean).join(", ")}
                    </p>
                  </td>
                  <td className={`${numberCell} ${fromMd}`}>{purchase.quantity}</td>
                  <td className={`${numberCell} ${fromMd} text-ink-soft`}>{formatCOP(purchase.unit_cost)}</td>
                  <td className={`${numberCell} ${fromLg} text-ink-soft`}>{formatCOP(purchase.shipping_cost)}</td>
                  <td className={numberCell}>{formatCOP(purchase.total_cost)}</td>
                  <td className={`${numberCell} ${fromMd} text-ink-soft`}>
                    {formatCOP(Math.round(purchase.total_cost / purchase.quantity))}
                  </td>
                  <td className={`${cell} py-4 text-right`}>
                    <ConfirmButton
                      action={deletePurchase.bind(null, purchase.id)}
                      label="Eliminar"
                      question="¿Eliminar?"
                      successMessage="Compra eliminada"
                    />
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
