import { asc, count, desc, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { courses, enrollments, liveAttendance, liveSessions, users, xpEvents } from "@/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials, fmtDateTime } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Reportes · Admin" };

export default async function AdminReports() {
  const [perUser, perCourse, sessions] = await Promise.all([
    db
      .select({
        id: users.id, name: users.name, image: users.image, jobRole: users.jobRole, xp: users.xp, level: users.level, streak: users.streakCurrent, lastActivity: users.lastActivityDate,
        started: count(enrollments.courseId),
        completed: sql<number>`count(${enrollments.completedAt})`.mapWith(Number),
        avgPct: sql<number>`coalesce(round(avg(${enrollments.progressPct})), 0)`.mapWith(Number),
      })
      .from(users)
      .leftJoin(enrollments, eq(enrollments.userId, users.id))
      .groupBy(users.id)
      .orderBy(desc(users.xp)),
    db
      .select({ id: courses.id, title: courses.title, published: courses.published, enrolled: count(enrollments.userId), completed: sql<number>`count(${enrollments.completedAt})`.mapWith(Number), avgPct: sql<number>`coalesce(round(avg(${enrollments.progressPct})), 0)`.mapWith(Number) })
      .from(courses)
      .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
      .groupBy(courses.id)
      .orderBy(desc(sql`count(${enrollments.userId})`)),
    db
      .select({ id: liveSessions.id, title: liveSessions.title, scheduledAt: liveSessions.scheduledAt, status: liveSessions.status, attendees: count(liveAttendance.userId) })
      .from(liveSessions)
      .leftJoin(liveAttendance, eq(liveAttendance.sessionId, liveSessions.id))
      .groupBy(liveSessions.id)
      .orderBy(desc(liveSessions.scheduledAt))
      .limit(10),
  ]);

  const [[{ totalUsers }], activity] = await Promise.all([
    db.select({ totalUsers: count() }).from(users),
    db.select({ day: sql<string>`to_char(${xpEvents.createdAt}, 'YYYY-MM-DD')`, n: sql<number>`count(distinct ${xpEvents.userId})`.mapWith(Number) }).from(xpEvents).where(sql`${xpEvents.createdAt} > now() - interval '14 days'`).groupBy(sql`1`).orderBy(asc(sql`1`)),
  ]);
  const maxAct = Math.max(1, ...activity.map((a) => a.n));

  return (
    <div className="space-y-8">
      <h1 className="text-2xl font-bold">Reportes</h1>

      <section className="rounded-2xl border bg-card p-5">
        <h2 className="mb-3 font-semibold">Personas activas por día (últimos 14 días)</h2>
        <div className="flex h-32 items-end gap-1">
          {activity.length === 0 && <p className="text-sm text-muted-foreground">Sin actividad aún.</p>}
          {activity.map((a) => (
            <div key={a.day} className="group relative flex flex-1 flex-col items-center justify-end">
              <div className="w-full rounded-t-md bg-gradient-to-t from-brand-green to-brand-yellow" style={{ height: `${(a.n / maxAct) * 100}%` }} />
              <span className="mt-1 text-[10px] text-muted-foreground">{a.day.slice(5)}</span>
              <span className="absolute -top-6 hidden rounded bg-foreground px-1.5 py-0.5 text-xs text-background group-hover:block">{a.n}/{totalUsers}</span>
            </div>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 font-semibold">Avance por persona</h2>
        <div className="overflow-x-auto rounded-2xl border bg-card">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Persona</th><th className="px-3 py-3">Cursos</th><th className="px-3 py-3">Avance prom.</th><th className="px-3 py-3">XP</th><th className="px-3 py-3">Racha</th><th className="px-3 py-3">Última actividad</th></tr></thead>
            <tbody className="divide-y">
              {perUser.map((u) => (
                <tr key={u.id}>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><Avatar className="size-7"><AvatarImage src={u.image ?? undefined} /><AvatarFallback className="text-xs">{initials(u.name)}</AvatarFallback></Avatar><div><p className="font-medium">{u.name}</p><p className="text-xs text-muted-foreground">{u.jobRole ?? "—"}</p></div></div></td>
                  <td className="px-3 py-2">{u.completed}/{u.started} completados</td>
                  <td className="px-3 py-2"><div className="flex items-center gap-2"><div className="h-2 w-24 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary" style={{ width: `${u.avgPct}%` }} /></div><span className="tabular-nums">{u.avgPct}%</span></div></td>
                  <td className="px-3 py-2 tabular-nums">{u.xp} · Nv {u.level}</td>
                  <td className="px-3 py-2">{u.streak} días</td>
                  <td className={cn("px-3 py-2", !u.lastActivity && "text-muted-foreground")}>{u.lastActivity ?? "Nunca"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="grid gap-6 lg:grid-cols-2">
        <div>
          <h2 className="mb-3 font-semibold">Cursos</h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Curso</th><th className="px-3 py-3">Inscritos</th><th className="px-3 py-3">Completados</th><th className="px-3 py-3">Avance</th></tr></thead>
              <tbody className="divide-y">{perCourse.map((c) => <tr key={c.id}><td className="px-3 py-2 font-medium">{c.title}{!c.published && <span className="ml-1 text-xs text-muted-foreground">(borrador)</span>}</td><td className="px-3 py-2">{c.enrolled}</td><td className="px-3 py-2">{c.completed}</td><td className="px-3 py-2">{c.avgPct}%</td></tr>)}</tbody>
            </table>
          </div>
        </div>
        <div>
          <h2 className="mb-3 font-semibold">Asistencia a clases</h2>
          <div className="overflow-hidden rounded-2xl border bg-card">
            <table className="w-full text-sm">
              <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-3 py-3">Clase</th><th className="px-3 py-3">Fecha</th><th className="px-3 py-3">Asistentes</th></tr></thead>
              <tbody className="divide-y">
                {sessions.map((s) => <tr key={s.id}><td className="px-3 py-2 font-medium">{s.title}</td><td className="px-3 py-2 text-muted-foreground">{fmtDateTime(s.scheduledAt)}</td><td className="px-3 py-2">{s.attendees}/{totalUsers}</td></tr>)}
                {sessions.length === 0 && <tr><td colSpan={3} className="px-3 py-6 text-center text-muted-foreground">Sin clases aún.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </section>
    </div>
  );
}
