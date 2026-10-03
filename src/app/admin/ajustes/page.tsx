import { PageHeader } from "@/components/page-header";
import { requireAdmin } from "@/lib/auth";
import { getStoreSettings } from "@/lib/orders";
import { SettingsForm } from "./settings-form";

export const metadata = { title: "Ajustes" };

export default async function SettingsPage() {
  await requireAdmin();
  const settings = await getStoreSettings();

  return (
    <div className="max-w-3xl motion-safe:animate-settle">
      <PageHeader title="Ajustes" />
      <SettingsForm settings={settings} />
    </div>
  );
}
