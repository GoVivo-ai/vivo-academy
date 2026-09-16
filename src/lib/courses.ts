import { and, asc, count, eq, inArray, isNotNull, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  certificates,
  courses,
  enrollments,
  lessonProgress,
  lessons,
  modules,
  notifications,
  quizAttempts,
  quizzes,
} from "@/db/schema";
import { awardXp, XP, type AwardResult } from "./gamification";
import { nanoid } from "nanoid";

/** Curso completo con módulos y lecciones ordenados. */
export async function getCourseBySlug(slug: string) {
  return db.query.courses.findFirst({
    where: eq(courses.slug, slug),
    with: {
      instructor: true,
      modules: {
        orderBy: [asc(modules.order)],
        with: { lessons: { orderBy: [asc(lessons.order)] } },
      },
    },
  });
}

export function flattenLessons<L extends { id: string }>(course: { modules: Array<{ lessons: L[] }> }): L[] {
  return course.modules.flatMap((m) => m.lessons);
}

/** IDs de lecciones completadas por el usuario en un curso. */
export async function getCompletedLessonIds(userId: string, lessonIds: string[]) {
  if (lessonIds.length === 0) return new Set<string>();
  const rows = await db
    .select({ lessonId: lessonProgress.lessonId })
    .from(lessonProgress)
    .where(and(eq(lessonProgress.userId, userId), inArray(lessonProgress.lessonId, lessonIds), isNotNull(lessonProgress.completedAt)));
  return new Set(rows.map((r) => r.lessonId));
}

export async function enroll(userId: string, courseId: string) {
  await db.insert(enrollments).values({ userId, courseId }).onConflictDoNothing();
}

/** Recalcula el progreso del curso y, si llega a 100%, lo marca completado y emite certificado. */
export async function recomputeCourseProgress(userId: string, courseId: string): Promise<AwardResult & { completed: boolean; certificateCode?: string }> {
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, courseId),
    with: { modules: { with: { lessons: true } } },
  });
  const none = { awarded: 0, newBadges: [], levelUp: null, completed: false };
  if (!course) return none;
  const all = flattenLessons(course);
  if (all.length === 0) return none;
  const done = await getCompletedLessonIds(userId, all.map((l) => l.id));
  const pct = Math.round((done.size / all.length) * 100);

  await enroll(userId, courseId);
  const [existing] = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

  const justCompleted = pct === 100 && !existing?.completedAt;
  await db
    .update(enrollments)
    .set({ progressPct: pct, ...(justCompleted ? { completedAt: new Date() } : {}) })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, courseId)));

  if (!justCompleted) return { ...none, completed: pct === 100 };

  // Certificado
  const code = `VA-${nanoid(10).toUpperCase()}`;
  await db.insert(certificates).values({ code, userId, courseId }).onConflictDoNothing();
  await db.insert(notifications).values({
    userId,
    type: "certificate",
    title: `¡Certificado obtenido: ${course.title}!`,
    body: "Descárgalo y compártelo desde tu perfil.",
    href: `/certificados/${code}`,
  });
  const result = await awardXp(userId, XP.COURSE_COMPLETED, "course", courseId);
  return { ...result, completed: true, certificateCode: code };
}

/** Marca lección como completada, otorga XP y recalcula el curso. */
export async function completeLesson(userId: string, lessonId: string) {
  const lesson = await db.query.lessons.findFirst({
    where: eq(lessons.id, lessonId),
    with: { module: true },
  });
  if (!lesson) throw new Error("Lección no encontrada");
  await db
    .insert(lessonProgress)
    .values({ userId, lessonId, completedAt: new Date() })
    .onConflictDoUpdate({
      target: [lessonProgress.userId, lessonProgress.lessonId],
      set: { completedAt: sql`coalesce(${lessonProgress.completedAt}, now())` },
    });
  await db
    .update(enrollments)
    .set({ lastLessonId: lessonId })
    .where(and(eq(enrollments.userId, userId), eq(enrollments.courseId, lesson.module.courseId)));

  const xp = await awardXp(userId, lesson.xpReward, "lesson", lessonId);
  const course = await recomputeCourseProgress(userId, lesson.module.courseId);
  return {
    awarded: xp.awarded + course.awarded,
    newBadges: [...xp.newBadges, ...course.newBadges],
    levelUp: course.levelUp ?? xp.levelUp,
    courseCompleted: course.completed && course.certificateCode !== undefined,
    certificateCode: course.certificateCode,
  };
}

/** Resumen de progreso para tarjetas: lecciones totales y completadas por curso. */
export async function getProgressForCourses(userId: string, courseIds: string[]) {
  if (courseIds.length === 0) return new Map<string, { pct: number; completed: boolean; started: boolean }>();
  const rows = await db
    .select()
    .from(enrollments)
    .where(and(eq(enrollments.userId, userId), inArray(enrollments.courseId, courseIds)));
  const map = new Map<string, { pct: number; completed: boolean; started: boolean }>();
  for (const id of courseIds) map.set(id, { pct: 0, completed: false, started: false });
  for (const r of rows) map.set(r.courseId, { pct: r.progressPct, completed: !!r.completedAt, started: true });
  return map;
}

export async function countLessons(courseIds: string[]) {
  if (courseIds.length === 0) return new Map<string, number>();
  const rows = await db
    .select({ courseId: modules.courseId, n: count(lessons.id) })
    .from(modules)
    .leftJoin(lessons, eq(lessons.moduleId, modules.id))
    .where(inArray(modules.courseId, courseIds))
    .groupBy(modules.courseId);
  return new Map(rows.map((r) => [r.courseId, Number(r.n)]));
}

export async function getBestAttempt(userId: string, quizId: string) {
  const rows = await db
    .select()
    .from(quizAttempts)
    .where(and(eq(quizAttempts.userId, userId), eq(quizAttempts.quizId, quizId)))
    .orderBy(sql`${quizAttempts.score} desc`)
    .limit(1);
  return rows[0] ?? null;
}

export { quizzes };
