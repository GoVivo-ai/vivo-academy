import { NextResponse } from "next/server";
import { WebhookReceiver } from "livekit-server-sdk";
import { and, eq, sql } from "drizzle-orm";
import { db } from "@/db";
import { liveAttendance, liveSessions } from "@/db/schema";

/**
 * Webhook de LiveKit: configúralo en LiveKit Cloud → Settings → Webhooks
 * apuntando a https://<tu-dominio>/api/livekit/webhook
 */
export async function POST(req: Request) {
  const key = process.env.LIVEKIT_API_KEY;
  const secret = process.env.LIVEKIT_API_SECRET;
  if (!key || !secret) return NextResponse.json({ ok: false }, { status: 503 });

  const receiver = new WebhookReceiver(key, secret);
  const body = await req.text();
  let event;
  try {
    event = await receiver.receive(body, req.headers.get("authorization") ?? undefined);
  } catch {
    return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  }

  const roomName = event.room?.name;
  if (!roomName) return NextResponse.json({ ok: true });
  const [s] = await db.select().from(liveSessions).where(eq(liveSessions.roomName, roomName));
  if (!s) return NextResponse.json({ ok: true });

  switch (event.event) {
    case "participant_left": {
      const identity = event.participant?.identity;
      if (identity) {
        await db
          .update(liveAttendance)
          .set({
            leftAt: new Date(),
            secondsPresent: sql`${liveAttendance.secondsPresent} + greatest(0, extract(epoch from (now() - ${liveAttendance.joinedAt})))::int`,
          })
          .where(and(eq(liveAttendance.sessionId, s.id), eq(liveAttendance.userId, identity)));
      }
      break;
    }
    case "room_finished": {
      if (s.status === "en_curso") {
        await db.update(liveSessions).set({ status: "finalizada" }).where(eq(liveSessions.id, s.id));
      }
      break;
    }
    case "egress_ended": {
      const file = event.egressInfo?.fileResults?.[0];
      const url = file?.location;
      if (url) await db.update(liveSessions).set({ recordingUrl: url }).where(eq(liveSessions.id, s.id));
      break;
    }
  }
  return NextResponse.json({ ok: true });
}
