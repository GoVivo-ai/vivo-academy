import { desc, eq } from "drizzle-orm";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { courses } from "@/db/schema";
import { CourseCard } from "@/components/courses/course-card";
import { CatalogFilters, type Chip } from "@/components/courses/catalog-filters";
import { BookIcon } from "@/components/brand/icons";
import { countLessons, getProgressForCourses } from "@/lib/courses";

export const metadata = { title: "Cursos" };

export default async function CoursesPage({ searchParams }: PageProps<"/cursos">) {
  const me = await requireUser();
  const sp = await searchParams;
  const cat = typeof sp.categoria === "string" ? sp.categoria : "";
  const filter = typeof sp.filtro === "string" ? sp.filtro : "todos";

  const all = await db.select().from(courses).where(eq(courses.published, true)).orderBy(desc(courses.createdAt));
  const categories = Array.from(new Set(all.map((c) => c.category))).sort();
  const ids = all.map((c) => c.id);
  const [prog, lc] = await Promise.all([getProgressForCourses(me.id, ids), countLessons(ids)]);

  const byArea = cat ? all.filter((c) => c.category === cat) : all;
  const list = byArea.filter((c) => {
    const p = prog.get(c.id);
    if (filter === "en-progreso") return p?.started && !p.completed;
    if (filter === "completados") return p?.completed;
    return true;
  });

  const q = (f: string, c: string) => `/cursos?filtro=${f}${c ? `&categoria=${encodeURIComponent(c)}` : ""}`;
  const estado: Chip[] = [
    { href: q("todos", cat), label: "Todos", active: filter === "todos", count: byArea.length },
    { href: q("en-progreso", cat), label: "En progreso", active: filter === "en-progreso", count: byArea.filter((c) => prog.get(c.id)?.started && !prog.get(c.id)?.completed).length },
    { href: q("completados", cat), label: "Completados", active: filter === "completados", count: byArea.filter((c) => prog.get(c.id)?.completed).length },
  ];
  const areas: Chip[] = [
    { href: q(filter, ""), label: "Todas las áreas", active: !cat },
    ...categories.map((c) => ({ href: q(filter, c), label: c, active: cat === c })),
  ];

  const completed = all.filter((c) => prog.get(c.id)?.completed).length;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold">Catálogo de cursos</h1>
          <p className="text-muted-foreground">Elige un curso y empieza a sumar XP.</p>
        </div>
        <div className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-2.5">
          <BookIcon size={30} active />
          <div>
            <p className="font-heading text-lg font-bold leading-none">{completed}<span className="text-sm font-bold text-muted-foreground">/{all.length}</span></p>
            <p className="text-xs text-muted-foreground">cursos completados</p>
          </div>
        </div>
      </div>

      <CatalogFilters estado={estado} areas={areas} />

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[2rem] border border-dashed p-12 text-center">
          <BookIcon size={44} active />
          <p className="font-heading text-lg font-bold">No hay cursos con ese filtro</p>
          <p className="text-sm text-muted-foreground">Prueba con otra área o estado.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((c) => (
            <CourseCard key={c.id} course={c} progress={prog.get(c.id)} lessonCount={lc.get(c.id)} />
          ))}
        </div>
      )}
    </div>
  );
}
