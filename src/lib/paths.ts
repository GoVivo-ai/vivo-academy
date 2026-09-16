import { eq } from "drizzle-orm";
import { db } from "@/db";
import { learningPaths, notifications, pathAssignments, users } from "@/db/schema";

/** Asigna automáticamente las rutas cuyo jobRole coincide con el cargo del usuario. */
export async function assignPathsForUser(userId: string) {
  const [u] = await db.select({ jobRole: users.jobRole }).from(users).where(eq(users.id, userId));
  if (!u?.jobRole) return 0;
  const paths = await db.select().from(learningPaths).where(eq(learningPaths.jobRole, u.jobRole));
  if (paths.length === 0) return 0;
  const inserted = await db
    .insert(pathAssignments)
    .values(paths.map((p) => ({ pathId: p.id, userId })))
    .onConflictDoNothing()
    .returning({ pathId: pathAssignments.pathId });
  if (inserted.length > 0) {
    const byId = new Map(paths.map((p) => [p.id, p]));
    await db.insert(notifications).values(
      inserted.map((i) => ({
        userId,
        type: "path",
        title: `Nueva ruta asignada: ${byId.get(i.pathId)?.title}`,
        body: "Se agregó a tu ruta de aprendizaje según tu cargo.",
        href: "/rutas",
      })),
    );
  }
  return inserted.length;
}
