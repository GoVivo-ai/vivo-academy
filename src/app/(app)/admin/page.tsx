import Link from "next/link";
import { count, desc, eq, gte, isNotNull, sql } from "drizzle-orm";
import { BookOpen, Users, Award, Radio, Plus, CalendarPlus, ArrowRight, Flame } from "lucide-react";
import { db } from "@/db";
import { certificates, courses, enrollments, liveSessions, users, xpEvents } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Administración" };

export default async function AdminHome() {
  const week = new Date(nowMs() - 7 * 86_400_000);
  const [[{ nUsers }], [{ nCourses }], [{ nCerts }], [{ nSessions }], [{ activeWeek }], [{ completions }], top] = await Promise.all([
    db.select({ nUsers: count() }).from(users),
    db.select({ nCourses: count() }).from(courses).where(eq(courses.published, true)),
    db.select({ nCerts: count() }).from(certificates),
    db.select({ nSessions: count() }).from(liveSessions),
    db.select({ activeWeek: sql<number>`count(distinct ${xpEvents.userId})`.mapWith(Number) }).from(xpEvents).where(gte(xpEvents.createdAt, week)),
    db.select({ completions: count() }).from(enrollments).where(isNotNull(enrollments.completedAt)),
    db.select({ name: users.name, xp: users.xp, streak: users.streakCurrent }).from(users).orderBy(desc(users.xp)).limit(5),
  ]);

  const stats = [
    { label: "Colaboradores", value: nUsers, sub: `${activeWeek} activos esta semana`, icon: Users },
    { label: "Cursos publicados", value: nCourses, sub: `${completions} finalizaciones`, icon: BookOpen },
    { label: "Certificados", value: nCerts, sub: "emitidos", icon: Award },
    { label: "Clases en vivo", value: nSessions, sub: "programadas o realizadas", icon: Radio },
  ];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Panel de administración</h1>
        <div className="flex gap-2">
          <Button render={<Link href="/admin/cursos?nuevo=1" />}><Plus className="size-4" />Nuevo curso</Button>
          <Button variant="outline" render={<Link href="/admin/en-vivo" />}><CalendarPlus className="size-4" />Programar clase</Button>
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl border bg-card p-5">
            <div className="flex items-center justify-between text-muted-foreground"><span className="text-sm">{s.label}</span><s.icon className="size-5" /></div>
            <p className="mt-2 text-3xl font-bold tabular-nums">{s.value}</p>
            <p className="text-xs text-muted-foreground">{s.sub}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-2xl border bg-card p-5">
          <div className="mb-3 flex items-center justify-between"><h2 className="font-semibold">Top colaboradores</h2><Link href="/ranking" className="flex items-center gap-1 text-sm text-primary hover:underline">Ranking<ArrowRight className="size-4" /></Link></div>
          <ol className="space-y-2">
            {top.map((u, i) => (
              <li key={u.name} className="flex items-center gap-3 text-sm"><span className="w-5 font-bold text-muted-foreground">{i + 1}</span><span className="flex-1 truncate">{u.name}</span>{u.streak > 0 && <span className="flex items-center gap-0.5 text-brand-gold"><Flame className="size-3.5" />{u.streak}</span>}<span className="font-semibold tabular-nums">{u.xp} XP</span></li>
            ))}
            {top.length === 0 && <p className="text-sm text-muted-foreground">Aún no hay actividad.</p>}
          </ol>
        </div>
        <div className="rounded-2xl border bg-card p-5">
          <h2 className="mb-3 font-semibold">Primeros pasos</h2>
          <ul className="space-y-2 text-sm">
            <li className="flex items-start gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">1</span>Crea cursos con lecciones de texto, video, PDF y quizzes en <Link href="/admin/cursos" className="text-primary hover:underline">Cursos</Link>.</li>
            <li className="flex items-start gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">2</span>Asigna cargos a las personas en <Link href="/admin/usuarios" className="text-primary hover:underline">Usuarios</Link> y arma <Link href="/admin/rutas" className="text-primary hover:underline">Rutas</Link> por cargo.</li>
            <li className="flex items-start gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">3</span>Programa <Link href="/admin/en-vivo" className="text-primary hover:underline">clases en vivo</Link> con quizzes, encuestas y pizarra.</li>
            <li className="flex items-start gap-2"><span className="grid size-5 shrink-0 place-items-center rounded-full bg-primary/10 text-xs font-bold text-primary">4</span>Sigue el avance del equipo en <Link href="/admin/reportes" className="text-primary hover:underline">Reportes</Link>.</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
