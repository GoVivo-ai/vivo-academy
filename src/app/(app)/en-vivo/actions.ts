"use server";

import { and, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { livePolls, livePollVotes, liveSessions, users } from "@/db/schema";
import { awardXp, XP } from "@/lib/gamification";
import { livekitConfigured, roomService } from "@/lib/live/server";
import type { LivePoll, PollAnswer } from "@/lib/live/protocol";
import { quizPoints } from "@/lib/live/protocol";

async function requireHost(sessionId: string) {
  const me = await requireUser();
  const [s] = await db.select().from(liveSessions).where(eq(liveSessions.id, sessionId));
  if (!s) throw new Error("Sesión no encontrada");
  if (s.hostId !== me.id && me.role !== "admin") throw new Error("Sin permisos");
  return { me, s };
}

export async function endSessionAction(sessionId: string) {
  const { s } = await requireHost(sessionId);
  await db.update(liveSessions).set({ status: "finalizada" }).where(eq(liveSessions.id, s.id));
  if (livekitConfigured()) {
    try {
      await roomService().deleteRoom(s.roomName);
    } catch {
      /* la sala puede no existir */
    }
  }
  revalidatePath("/en-vivo");
  revalidatePath(`/en-vivo/${s.id}`);
}

export async function muteAllAction(sessionId: string) {
  const { me, s } = await requireHost(sessionId);
  if (!livekitConfigured()) return;
  const svc = roomService();
  const parts = await svc.listParticipants(s.roomName);
  await Promise.all(
    parts
      .filter((p) => p.identity !== me.id)
      .flatMap((p) => p.tracks.filter((t) => t.type === 1 /* AUDIO */ && !t.muted).map((t) => svc.mutePublishedTrack(s.roomName, p.identity, t.sid, true))),
  );
}

export async function removeParticipantAction(sessionId: string, identity: string) {
  const { s } = await requireHost(sessionId);
  if (!livekitConfigured()) return;
  await roomService().removeParticipant(s.roomName, identity);
}

/** Persiste una encuesta/quiz cerrado y reparte XP. */
export async function savePollResultAction(sessionId: string, poll: LivePoll, answers: PollAnswer[]) {
  const { s } = await requireHost(sessionId);
  const [existing] = await db.select({ id: livePolls.id }).from(livePolls).where(eq(livePolls.id, poll.id));
  if (existing) return;

  await db.insert(livePolls).values({
    id: poll.id,
    sessionId: s.id,
    kind: poll.kind,
    question: poll.question,
    options: poll.options,
    correctIndex: poll.correctIndex,
    seconds: poll.seconds,
    createdAt: new Date(poll.startedAt),
    closedAt: new Date(),
  });

  const byUser = new Map<string, PollAnswer>();
  for (const a of answers) if (!byUser.has(a.identity)) byUser.set(a.identity, a);
  const rows = [...byUser.values()].map((a) => ({
    pollId: poll.id,
    userId: a.identity,
    optionIndex: a.optionIndex,
    responseMs: a.responseMs,
    points: poll.kind === "quiz" ? quizPoints(a.optionIndex === poll.correctIndex, a.responseMs, poll.seconds) : 0,
  }));
  if (rows.length === 0) return;

  // Solo usuarios existentes (por si alguien entró con identidad rara)
  const validIds = new Set((await db.select({ id: users.id }).from(users)).map((u) => u.id));
  const valid = rows.filter((r) => validIds.has(r.userId));
  if (valid.length === 0) return;
  await db.insert(livePollVotes).values(valid).onConflictDoNothing();

  await Promise.all(valid.map((r) => awardXp(r.userId, XP.LIVE_ANSWER, "live_answer", poll.id)));
  if (poll.kind === "quiz") {
    const winner = [...valid].sort((a, b) => b.points - a.points)[0];
    if (winner && winner.points > 0) await awardXp(winner.userId, XP.LIVE_QUIZ_WINNER, "live_quiz_winner", poll.id);
  }
}

export async function markLeftAction(sessionId: string) {
  const me = await requireUser();
  const { liveAttendance } = await import("@/db/schema");
  await db
    .update(liveAttendance)
    .set({ leftAt: new Date() })
    .where(and(eq(liveAttendance.sessionId, sessionId), eq(liveAttendance.userId, me.id)));
}
