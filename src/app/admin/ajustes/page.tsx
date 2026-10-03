import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { getFinanceSettings } from "@/lib/finance";
import { getStoreSettings } from "@/lib/orders";
import { FinanceForm } from "./finance-form";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  await requireAdmin();
  const [settings, finance] = await Promise.all([getStoreSettings(), getFinanceSettings()]);

  return (
    <div className="flex max-w-3xl flex-col gap-12 motion-safe:animate-settle">
      <div>
        <PageHeader
          title="Ajustes"
          description="Los datos de pago que ve el cliente al hacer un pedido y los valores que usan las cuentas del panel."
        />
        <SettingsForm settings={settings} />
      </div>
      <FinanceForm settings={finance} />
    </div>
  );
}
