import { requireRole } from "@/auth";
import { AdminNav } from "@/components/admin/admin-nav";

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const me = await requireRole("instructor");
  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <AdminNav isAdmin={me.role === "admin"} />
      {children}
    </div>
  );
}
