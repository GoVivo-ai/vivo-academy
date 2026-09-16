import Link from "next/link";
import { and, asc, count, desc, eq, gt, gte, inArray, isNull } from "drizzle-orm";
import { ArrowRight } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { courses, enrollments, liveSessions, userBadges, users, pathAssignments, pathCourses } from "@/db/schema";
import { levelProgress, streakStatus } from "@/lib/gamification";
import { getDailyMissions, getWeekActivity, MISSION_BONUS } from "@/lib/missions";
import { CourseCard } from "@/components/courses/course-card";
import { HomeHud } from "@/components/gamification/home-hud";
import { Button } from "@/components/ui/button";
import { fmtDateTime } from "@/lib/format";
import { countLessons, getProgressForCourses } from "@/lib/courses";
import { LiveIcon, MedalIcon, BookIcon } from "@/components/brand/icons";
import { BadgeArt } from "@/components/brand/badge-art";
import { cn } from "@/lib/utils";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Inicio" };

export default async function HomePage() {
  const me = await requireUser();
  const [u] = await db.select().from(users).where(eq(users.id, me.id));
  const lp = levelProgress(u.xp);
  const st = streakStatus(u);

  const [active, pathCourseIds, upcoming, recentBadges, [{ badgeCount }], [{ above }], missions, week] = await Promise.all([
    db
      .select({ course: courses, pct: enrollments.progressPct, lastLessonId: enrollments.lastLessonId })
      .from(enrollments)
      .innerJoin(courses, eq(courses.id, enrollments.courseId))
      .where(and(eq(enrollments.userId, me.id), isNull(enrollments.completedAt)))
      .orderBy(desc(enrollments.startedAt))
      .limit(3),
    db
      .select({ courseId: pathCourses.courseId })
      .from(pathAssignments)
      .innerJoin(pathCourses, eq(pathCourses.pathId, pathAssignments.pathId))
      .where(eq(pathAssignments.userId, me.id)),
    db
      .select()
      .from(liveSessions)
      .where(and(gte(liveSessions.scheduledAt, new Date(nowMs() - 2 * 3600_000)), inArray(liveSessions.status, ["programada", "en_curso"])))
      .orderBy(asc(liveSessions.scheduledAt))
      .limit(3),
    db.query.userBadges.findMany({ where: eq(userBadges.userId, me.id), with: { badge: true }, orderBy: [desc(userBadges.earnedAt)], limit: 4 }),
    db.select({ badgeCount: count() }).from(userBadges).where(eq(userBadges.userId, me.id)),
    db.select({ above: count() }).from(users).where(gt(users.xp, u.xp)),
    getDailyMissions(me.id),
    getWeekActivity(me.id),
  ]);

  const enrolledIds = new Set(active.map((a) => a.course.id));
  const pathSet = new Set(pathCourseIds.map((p) => p.courseId));
  const recommended = (await db.select().from(courses).where(eq(courses.published, true)).orderBy(desc(courses.createdAt)).limit(12))
    .filter((c) => !enrolledIds.has(c.id))
    .sort((a, b) => Number(pathSet.has(b.id)) - Number(pathSet.has(a.id)))
    .slice(0, 3);

  const allIds = [...active.map((a) => a.course.id), ...recommended.map((c) => c.id)];
  const [prog, lc] = await Promise.all([getProgressForCourses(me.id, allIds), countLessons(allIds)]);
  const firstName = (u.name ?? "").split(" ")[0] || "Hola";

  return (
    <div className="mx-auto max-w-6xl space-y-8">
      <HomeHud
        firstName={firstName}
        xp={u.xp}
        level={lp.level}
        levelName={lp.name}
        levelPct={lp.pct}
        xpInLevel={u.xp - lp.current}
        xpToNext={lp.next - lp.current}
        streak={u.streakCurrent}
        streakBest={u.streakBest}
        doneToday={st.doneToday}
        atRisk={st.atRisk}
        badges={badgeCount}
        rank={u.xp > 0 ? above + 1 : null}
        week={week}
        missions={missions.missions}
        allDone={missions.allDone}
        bonus={MISSION_BONUS}
      />

      {active.length > 0 && (
        <section>
          <SectionTitle title="Continuar aprendiendo" href="/cursos" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((a) => (
              <CourseCard key={a.course.id} course={a.course} progress={prog.get(a.course.id)} lessonCount={lc.get(a.course.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Próximas clases en vivo" href="/en-vivo" />
        {upcoming.length === 0 ? (
          <EmptyState icon={<LiveIcon size={28} />} text="No hay clases programadas por ahora." />
        ) : (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {upcoming.map((s) => (
              <Link key={s.id} href={`/en-vivo/${s.id}`} className="flex items-center gap-4 rounded-2xl border bg-card p-4 transition hover:-translate-y-0.5 hover:shadow-md">
                <div className={cn("grid size-12 shrink-0 place-items-center rounded-2xl", s.status === "en_curso" ? "bg-rose-500/10" : "bg-brand-green/10")}>
                  <LiveIcon size={30} active={s.status === "en_curso"} />
                </div>
                <div className="min-w-0">
                  <p className="truncate font-semibold">{s.title}</p>
                  <p className="text-sm text-muted-foreground">{s.status === "en_curso" ? "En curso ahora" : fmtDateTime(s.scheduledAt)} · {s.durationMin} min</p>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {recommended.length > 0 && (
        <section>
          <SectionTitle title="Recomendados para ti" href="/cursos" />
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {recommended.map((c) => (
              <CourseCard key={c.id} course={c} progress={prog.get(c.id)} lessonCount={lc.get(c.id)} />
            ))}
          </div>
        </section>
      )}

      <section>
        <SectionTitle title="Insignias recientes" href="/perfil" />
        {recentBadges.length === 0 ? (
          <EmptyState icon={<MedalIcon size={28} />} text="Completa tu primera lección para ganar tu primera insignia." />
        ) : (
          <div className="flex flex-wrap gap-3">
            {recentBadges.map((b) => (
              <div key={b.badgeId} className="flex items-center gap-3 rounded-2xl border bg-card px-4 py-3 transition hover:-translate-y-0.5 hover:shadow-md">
                <BadgeArt id={b.badgeId} size={52} />
                <div>
                  <p className="font-semibold leading-tight">{b.badge.title}</p>
                  <p className="text-xs text-muted-foreground">{b.badge.description}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {active.length === 0 && recommended.length === 0 && <EmptyState icon={<BookIcon size={28} />} text="Aún no hay cursos publicados." />}
    </div>
  );
}

function SectionTitle({ title, href }: { title: string; href: string }) {
  return (
    <div className="mb-3 flex items-center justify-between">
      <h2 className="flex items-center gap-2 text-lg font-bold"><span className="h-5 w-1.5 rounded-full bg-brand-swoosh" />{title}</h2>
      <Button variant="ghost" size="sm" render={<Link href={href} />}>Ver todo <ArrowRight className="size-4" /></Button>
    </div>
  );
}

export function EmptyState({ icon, text }: { icon: React.ReactNode; text: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
      <span className="grid size-11 place-items-center rounded-2xl bg-muted">{icon}</span>
      {text}
    </div>
  );
}
