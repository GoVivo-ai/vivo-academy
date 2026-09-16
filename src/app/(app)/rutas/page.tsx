import Link from "next/link";
import { asc, eq } from "drizzle-orm";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { pathAssignments, pathCourses } from "@/db/schema";
import { getProgressForCourses } from "@/lib/courses";
import { Badge } from "@/components/ui/badge";
import { PathMap, type MapNode } from "@/components/gamification/path-map";
import { RouteIcon } from "@/components/brand/icons";

export const metadata = { title: "Mi ruta" };

export default async function PathsPage() {
  const me = await requireUser();
  const assigned = await db.query.pathAssignments.findMany({
    where: eq(pathAssignments.userId, me.id),
    with: { path: { with: { courses: { orderBy: [asc(pathCourses.order)], with: { course: true } } } } },
  });
  const allCourseIds = assigned.flatMap((a) => a.path.courses.map((c) => c.courseId));
  const prog = await getProgressForCourses(me.id, allCourseIds);

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <div>
        <h1 className="text-2xl font-bold">Mi ruta de aprendizaje</h1>
        <p className="text-muted-foreground">Tu mapa de niveles{me.jobRole ? ` para ${me.jobRole}` : ""}. Completa cada parada para desbloquear la siguiente.</p>
      </div>

      {assigned.length === 0 ? (
        <div className="flex flex-col items-center gap-3 rounded-[2rem] border border-dashed p-12 text-center">
          <span className="grid size-20 place-items-center rounded-3xl bg-muted"><RouteIcon size={48} active /></span>
          <p className="font-heading text-lg font-bold">Aún no tienes una ruta asignada</p>
          <p className="max-w-sm text-sm text-muted-foreground">Pide a un administrador que configure tu cargo o explora el catálogo mientras tanto.</p>
          <Link href="/cursos" className="text-sm font-bold text-brand-green-600 hover:underline">Ir al catálogo →</Link>
        </div>
      ) : (
        assigned.map(({ path }) => {
          let prevDone = true;
          const nodes: MapNode[] = path.courses.map((pc) => {
            const p = prog.get(pc.courseId)!;
            const state: MapNode["state"] = p.completed ? "done" : prevDone ? "current" : "locked";
            prevDone = p.completed;
            return { id: pc.courseId, slug: pc.course.slug, title: pc.course.title, category: pc.course.category, minutes: pc.course.estimatedMinutes, pct: p.pct, state };
          });
          const done = nodes.filter((n) => n.state === "done").length;
          return (
            <section key={path.id} className="space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div>
                  <h2 className="text-xl font-bold">{path.title}</h2>
                  <p className="text-sm text-muted-foreground">{path.description}</p>
                </div>
                <Badge variant={done === nodes.length ? "default" : "secondary"} className="rounded-full px-3 py-1 font-heading font-bold">{done}/{nodes.length} niveles</Badge>
              </div>
              <PathMap nodes={nodes} title={`${nodes.length} paradas`} />
            </section>
          );
        })
      )}
    </div>
  );
}
