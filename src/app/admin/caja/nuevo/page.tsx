import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { getFinanceSettings } from "@/lib/finance";
import { todayInBogota } from "@/lib/format";
import { MovementForm } from "../movement-form";

export const metadata = { title: "Registrar movimiento" };

export default async function NewMovementPage() {
  await requireAdmin();
  const { expenseCategories, paymentMethods } = await getFinanceSettings();

  return (
    <div className="motion-safe:animate-settle">
      <PageHeader title="Registrar movimiento" back={{ href: "/admin/caja", label: "Volver a caja" }} />
      <MovementForm categories={expenseCategories} paymentMethods={paymentMethods} today={todayInBogota()} />
    </div>
  );
}
