import { and, eq, gte, inArray } from "drizzle-orm";
import { db } from "@/db";
import { xpEvents } from "@/db/schema";
import { awardXp, todayLocal } from "./gamification";

export const MISSION_BONUS = 20;

export type Mission = { id: string; title: string; xp: number; done: boolean; href: string };

/** Misiones diarias calculadas a partir de los eventos de XP de hoy. Si se completan todas, otorga un bono. */
export async function getDailyMissions(userId: string) {
  const today = todayLocal();
  const start = new Date(`${today}T00:00:00-05:00`);
  const rows = await db
    .select({ reason: xpEvents.reason })
    .from(xpEvents)
    .where(and(eq(xpEvents.userId, userId), gte(xpEvents.createdAt, start), inArray(xpEvents.reason, ["lesson", "quiz", "live", "live_answer", "daily_missions"])));
  const has = (r: string) => rows.some((x) => x.reason === r);
  const missions: Mission[] = [
    { id: "lesson", title: "Completa una lección", xp: 10, done: has("lesson"), href: "/cursos" },
    { id: "quiz", title: "Aprueba un quiz", xp: 25, done: has("quiz"), href: "/cursos" },
    { id: "live", title: "Participa en una clase o encuesta en vivo", xp: 30, done: has("live") || has("live_answer"), href: "/en-vivo" },
  ];
  const allDone = missions.every((m) => m.done);
  let bonusAwarded = has("daily_missions");
  if (allDone && !bonusAwarded) {
    const r = await awardXp(userId, MISSION_BONUS, "daily_missions", today);
    bonusAwarded = r.awarded > 0 || bonusAwarded;
  }
  return { missions, allDone, bonusAwarded, doneCount: missions.filter((m) => m.done).length };
}

/** Actividad de los últimos 7 días (para el calendario de racha). */
export async function getWeekActivity(userId: string) {
  const days: string[] = [];
  for (let i = 6; i >= 0; i--) days.push(todayLocal(new Date(Date.now() - i * 86_400_000)));
  const start = new Date(`${days[0]}T00:00:00-05:00`);
  const rows = await db.select({ at: xpEvents.createdAt }).from(xpEvents).where(and(eq(xpEvents.userId, userId), gte(xpEvents.createdAt, start)));
  const active = new Set(rows.map((r) => todayLocal(r.at)));
  return days.map((d) => ({ day: d, active: active.has(d), label: ["D", "L", "M", "M", "J", "V", "S"][new Date(`${d}T12:00:00Z`).getUTCDay()] }));
}
