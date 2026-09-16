import { NextResponse } from "next/server";
import { and, eq } from "drizzle-orm";
import { auth } from "@/auth";
import { db } from "@/db";
import { liveAttendance, liveSessions, users } from "@/db/schema";
import { createToken, livekitConfigured } from "@/lib/live/server";
import { awardXp, XP } from "@/lib/gamification";

export async function GET(req: Request) {
  const session = await auth();
  if (!session?.user) return NextResponse.json({ error: "No autenticado" }, { status: 401 });
  if (!livekitConfigured()) return NextResponse.json({ error: "LiveKit no está configurado. Agrega LIVEKIT_URL, LIVEKIT_API_KEY y LIVEKIT_API_SECRET." }, { status: 503 });

  const id = new URL(req.url).searchParams.get("session");
  if (!id) return NextResponse.json({ error: "Falta session" }, { status: 400 });

  const [s] = await db.select().from(liveSessions).where(eq(liveSessions.id, id));
  if (!s) return NextResponse.json({ error: "Sesión no encontrada" }, { status: 404 });
  const [u] = await db.select().from(users).where(eq(users.id, session.user.id));
  const isHost = s.hostId === u.id || u.role === "admin";

  if (s.status === "cancelada" || (s.status === "finalizada" && !isHost)) {
    return NextResponse.json({ error: "La sesión ya terminó" }, { status: 410 });
  }
  if (s.status === "programada" && !isHost) {
    // Permitir entrar 10 minutos antes
    if (s.scheduledAt.getTime() - Date.now() > 10 * 60_000) {
      return NextResponse.json({ error: "La sesión aún no ha comenzado" }, { status: 425 });
    }
  }
  if (isHost && s.status === "programada") {
    await db.update(liveSessions).set({ status: "en_curso" }).where(eq(liveSessions.id, s.id));
  }

  // Asistencia (idempotente) + XP por asistir
  const inserted = await db
    .insert(liveAttendance)
    .values({ sessionId: s.id, userId: u.id })
    .onConflictDoNothing()
    .returning({ userId: liveAttendance.userId });
  let celebration = null;
  if (inserted.length > 0 && !isHost) {
    celebration = await awardXp(u.id, XP.LIVE_ATTENDED, "live", s.id);
  } else {
    await db
      .update(liveAttendance)
      .set({ leftAt: null })
      .where(and(eq(liveAttendance.sessionId, s.id), eq(liveAttendance.userId, u.id)));
  }

  const token = await createToken({
    identity: u.id,
    name: u.name ?? u.email,
    roomName: s.roomName,
    isHost,
    metadata: { role: isHost ? "host" : "participant", image: u.image, jobRole: u.jobRole },
  });

  return NextResponse.json({
    token,
    url: process.env.NEXT_PUBLIC_LIVEKIT_URL || process.env.LIVEKIT_URL,
    isHost,
    celebration,
  });
}
