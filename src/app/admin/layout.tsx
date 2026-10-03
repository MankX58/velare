import { AdminShell } from "@/components/admin-shell";
import { requireAdmin } from "@/lib/auth";

export const metadata = { title: "Panel", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const user = await requireAdmin();

  return <AdminShell userLabel={user.email ?? user.name ?? ""}>{children}</AdminShell>;
}
