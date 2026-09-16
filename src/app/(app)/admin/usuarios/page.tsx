import { asc } from "drizzle-orm";
import { requireRole } from "@/auth";
import { db } from "@/db";
import { users } from "@/db/schema";
import { UsersTable } from "@/components/admin/users-table";

export const metadata = { title: "Usuarios · Admin" };

export default async function AdminUsers() {
  const me = await requireRole();
  const list = await db.select({ id: users.id, name: users.name, email: users.email, image: users.image, role: users.role, active: users.active, jobRole: users.jobRole, xp: users.xp, level: users.level, streak: users.streakCurrent, createdAt: users.createdAt }).from(users).orderBy(asc(users.name));
  const jobRoles = Array.from(new Set(list.map((u) => u.jobRole).filter((x): x is string => !!x))).sort();
  const domain = process.env.ALLOWED_EMAIL_DOMAIN?.split(",").map((d) => d.trim()).filter(Boolean).join(" o @");
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Usuarios</h1>
        <p className="text-sm text-muted-foreground">Quien entre con un correo {domain ? `@${domain}` : "corporativo"} se crea como <strong>colaborador</strong>. Aquí defines su rol y cargo, y puedes desactivar cuentas para bloquear el acceso.</p>
      </div>
      <UsersTable users={list} jobRoles={jobRoles} meId={me.id} />
    </div>
  );
}
