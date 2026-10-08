import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { suggestSku } from "../actions";
import { ProductForm } from "../product-form";

export const metadata = { title: "Nuevo producto" };

export default async function NewProductPage() {
  await requireAdmin();
  const suggestedSku = await suggestSku();

  return (
    <div className="max-w-3xl motion-safe:animate-settle">
      <PageHeader title="Nuevo producto" back={{ href: "/admin/productos", label: "Volver a productos" }} />
      <ProductForm suggestedSku={suggestedSku} />
    </div>
  );
}
