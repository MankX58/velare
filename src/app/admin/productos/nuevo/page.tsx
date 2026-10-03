import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { sql } from "@/lib/db";
import { ProductForm } from "../product-form";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();

  // Sugiere el siguiente código con el formato del Excel: P025 → P026.
  const [last] = await sql`
    select max(substring(sku from 2)::int) as number from products where sku ~ '^P[0-9]+$'`;
  const suggestedSku = `P${String((last.number ?? 0) + 1).padStart(3, "0")}`;

  return (
    <div className="max-w-3xl motion-safe:animate-settle">
      <PageHeader title="Nuevo producto" back={{ href: "/admin/productos", label: "Volver a productos" }} />
      <ProductForm suggestedSku={suggestedSku} />
    </div>
  );
}
