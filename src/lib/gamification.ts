import { and, count, eq, gte, sql } from "drizzle-orm";
import { db } from "@/db";
import {
  badges,
  enrollments,
  liveAttendance,
  notifications,
  quizAttempts,
  userBadges,
  users,
  xpEvents,
} from "@/db/schema";

export const XP = {
  LESSON_COMPLETED: 10,
  QUIZ_PASSED: 25,
  QUIZ_PERFECT_BONUS: 15,
  COURSE_COMPLETED: 100,
  LIVE_ATTENDED: 30,
  LIVE_ANSWER: 5,
  LIVE_QUIZ_WINNER: 20,
} as const;

import { LEVEL_NAMES, levelFromXp, levelName, levelProgress, xpForLevel } from "./levels";
export { LEVEL_NAMES, levelFromXp, levelName, levelProgress, xpForLevel };

/** Fecha local (YYYY-MM-DD) en zona horaria de Colombia. */
export function todayLocal(d = new Date()) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: process.env.APP_TIMEZONE || "America/Bogota",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(d);
}

function daysBetween(a: string, b: string) {
  const da = new Date(`${a}T00:00:00Z`).getTime();
  const dbb = new Date(`${b}T00:00:00Z`).getTime();
  return Math.round((dbb - da) / 86_400_000);
}

export type AwardResult = {
  awarded: number;
  newBadges: Array<{ id: string; title: string; icon: string; description: string }>;
  levelUp: number | null;
};

/**
 * Otorga XP a un usuario de forma idempotente (por reason+refId), actualiza racha,
 * nivel e insignias. Devuelve lo nuevo para poder celebrar en la UI.
 */
export async function awardXp(
  userId: string,
  amount: number,
  reason: string,
  refId: string | null = null,
): Promise<AwardResult> {
  const empty: AwardResult = { awarded: 0, newBadges: [], levelUp: null };
  const inserted = await db
    .insert(xpEvents)
    .values({ userId, amount, reason, refId })
    .onConflictDoNothing()
    .returning({ id: xpEvents.id });
  if (inserted.length === 0) return empty;

  const [u] = await db.select().from(users).where(eq(users.id, userId));
  if (!u) return empty;

  // Racha
  const today = todayLocal();
  let streak = u.streakCurrent;
  if (!u.lastActivityDate) streak = 1;
  else {
    const diff = daysBetween(u.lastActivityDate, today);
    if (diff === 0) streak = Math.max(1, streak);
    else if (diff === 1) streak += 1;
    else streak = 1;
  }
  const newXp = u.xp + amount;
  const oldLevel = u.level;
  const newLevel = levelFromXp(newXp);

  await db
    .update(users)
    .set({
      xp: newXp,
      level: newLevel,
      streakCurrent: streak,
      streakBest: Math.max(u.streakBest, streak),
      lastActivityDate: today,
    })
    .where(eq(users.id, userId));

  const newBadges = await checkBadges(userId);
  if (newLevel > oldLevel) {
    await db.insert(notifications).values({
      userId,
      type: "level",
      title: `¡Subiste al nivel ${newLevel}!`,
      body: `Ahora eres ${levelName(newLevel)}. Sigue así.`,
      href: "/perfil",
    });
  }
  return { awarded: amount, newBadges, levelUp: newLevel > oldLevel ? newLevel : null };
}

/** Evalúa todas las insignias del catálogo y otorga las que se cumplan. */
export async function checkBadges(userId: string) {
  const [all, owned, u] = await Promise.all([
    db.select().from(badges),
    db.select({ badgeId: userBadges.badgeId }).from(userBadges).where(eq(userBadges.userId, userId)),
    db.select().from(users).where(eq(users.id, userId)).then((r) => r[0]),
  ]);
  if (!u) return [];
  const ownedSet = new Set(owned.map((o) => o.badgeId));
  const pending = all.filter((b) => !ownedSet.has(b.id));
  if (pending.length === 0) return [];

  const [[{ coursesDone }], [{ perfectQuizzes }], [{ liveCount }], [{ lessonsDone }]] = await Promise.all([
    db
      .select({ coursesDone: count() })
      .from(enrollments)
      .where(and(eq(enrollments.userId, userId), sql`${enrollments.completedAt} is not null`)),
    db
      .select({ perfectQuizzes: count() })
      .from(quizAttempts)
      .where(and(eq(quizAttempts.userId, userId), gte(quizAttempts.score, 100))),
    db.select({ liveCount: count() }).from(liveAttendance).where(eq(liveAttendance.userId, userId)),
    db
      .select({ lessonsDone: count() })
      .from(xpEvents)
      .where(and(eq(xpEvents.userId, userId), eq(xpEvents.reason, "lesson"))),
  ]);

  const metrics: Record<string, number> = {
    courses_completed: coursesDone,
    perfect_quizzes: perfectQuizzes,
    live_attended: liveCount,
    lessons_completed: lessonsDone,
    streak: u.streakCurrent,
    xp: u.xp,
    level: u.level,
  };

  const earned = pending.filter((b) => (metrics[b.rule.kind] ?? 0) >= b.rule.value);
  if (earned.length === 0) return [];

  await db.insert(userBadges).values(earned.map((b) => ({ userId, badgeId: b.id }))).onConflictDoNothing();
  const bonus = earned.reduce((s, b) => s + b.xpBonus, 0);
  if (bonus > 0) {
    await db.update(users).set({ xp: sql`${users.xp} + ${bonus}` }).where(eq(users.id, userId));
    await db
      .insert(xpEvents)
      .values(earned.filter((b) => b.xpBonus > 0).map((b) => ({ userId, amount: b.xpBonus, reason: "badge", refId: b.id })))
      .onConflictDoNothing();
  }
  await db.insert(notifications).values(
    earned.map((b) => ({
      userId,
      type: "badge",
      title: `Insignia desbloqueada: ${b.icon} ${b.title}`,
      body: b.description,
      href: "/perfil",
    })),
  );
  return earned.map((b) => ({ id: b.id, title: b.title, icon: b.icon, description: b.description }));
}

/** Indica si la racha del usuario está en riesgo (no ha hecho nada hoy). */
export function streakStatus(u: { streakCurrent: number; lastActivityDate: string | null }) {
  const today = todayLocal();
  if (!u.lastActivityDate) return { active: false, doneToday: false, atRisk: false };
  const diff = daysBetween(u.lastActivityDate, today);
  if (diff === 0) return { active: u.streakCurrent > 0, doneToday: true, atRisk: false };
  if (diff === 1) return { active: u.streakCurrent > 0, doneToday: false, atRisk: true };
  return { active: false, doneToday: false, atRisk: false };
}
