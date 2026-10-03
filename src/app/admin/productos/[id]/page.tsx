import Link from "next/link";
import { notFound } from "next/navigation";
import { buttonStyles } from "@/components/button";
import { ConfirmButton } from "@/components/confirm-button";
import { PageHeader } from "@/components/page-header";
import { StockBadge, type StockAlert } from "@/components/products-table";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { formatCOP, formatPercent } from "@/lib/format";
import { deleteProduct } from "../actions";
import { ProductForm, type Product } from "../product-form";

export const metadata = { title: "Editar producto" };

type Stats = {
  units_purchased: number;
  units_sold: number;
  stock: number;
  avg_cost: number;
  unit_profit: number;
  margin: number;
  markup: number;
  inventory_value: number;
  alert: StockAlert;
  total_sales: number;
  gross_profit: number;
};

export default async function EditProductPage({ params }: PageProps<"/admin/productos/[id]">) {
  await requireAdmin();

  const id = Number((await params).id);
  if (!Number.isInteger(id)) notFound();

  const [product] = (await sql`
    select p.id, p.sku, p.name, p.brand, p.audience, p.size_ml, p.category, p.description,
           p.list_price, p.initial_stock, p.initial_unit_cost, p.reorder_point, p.is_active,
           s.units_purchased, s.units_sold, s.stock, s.avg_cost, s.unit_profit, s.margin, s.markup,
           s.inventory_value, s.alert, s.total_sales, s.gross_profit
    from products p
    join product_stats s on s.product_id = p.id
    where p.id = ${id}`) as (Product & Stats)[];
  if (!product) notFound();

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title={product.name} back={{ href: "/admin/productos", label: "Volver a productos" }} />

      <div className="grid items-start gap-12 lg:grid-cols-[minmax(0,1fr)_20rem]">
        <ProductForm product={product} avgCost={product.avg_cost} />

        {/* Lo que el Excel tenía en las columnas grises: nadie lo escribe, sale de compras y ventas. */}
        <aside className="border border-line bg-surface p-6 lg:sticky lg:top-8">
          <h2 className="font-display text-xl">Calculado por el sistema</h2>
          <p className="mt-2 text-xs leading-relaxed text-ink-faint">
            Sale de las compras y ventas registradas. Se actualiza solo.
          </p>

          <dl className="mt-6 flex flex-col gap-3 text-sm">
            <Stat label="Stock actual">
              <span className="mr-3">{product.stock}</span>
              <StockBadge alert={product.alert} />
            </Stat>
            <Stat label="Unidades compradas">{product.units_purchased}</Stat>
            <Stat label="Unidades vendidas">{product.units_sold}</Stat>
            <Stat label="Costo promedio">{formatCOP(product.avg_cost)}</Stat>
            <Stat label="Ganancia por unidad">{formatCOP(product.unit_profit)}</Stat>
            <Stat label="Margen sobre precio">{formatPercent(product.margin)}</Stat>
            <Stat label="Markup sobre costo">{formatPercent(product.markup)}</Stat>
            <Stat label="Valor del inventario">{formatCOP(product.inventory_value)}</Stat>
            <Stat label="Ventas acumuladas">{formatCOP(product.total_sales)}</Stat>
            <Stat label="Utilidad bruta">{formatCOP(product.gross_profit)}</Stat>
          </dl>

          <Link href={`/admin/compras/nueva?producto=${product.id}`} className={`mt-8 w-full ${buttonStyles.secondary}`}>
            Registrar una compra
          </Link>
        </aside>
      </div>

      <div className="mt-16 border-t border-line pt-6">
        <ConfirmButton
          action={deleteProduct.bind(null, product.id)}
          label="Eliminar este producto"
          question="¿Eliminar el producto? No se puede deshacer."
          successMessage="Producto eliminado"
          redirectTo="/admin/productos"
        />
      </div>
    </div>
  );
}

function Stat({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-ink-soft">{label}</dt>
      <dd className="text-right tabular-nums">{children}</dd>
    </div>
  );
}
