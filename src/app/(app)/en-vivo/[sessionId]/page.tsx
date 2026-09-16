import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { CalendarClock, ChevronLeft, Radio, Users, Video } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { liveSessions } from "@/db/schema";
import { fmtDateTime, initials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { LiveRoom } from "@/components/live/live-room";
import { livekitConfigured } from "@/lib/live/server";
import { nowMs } from "@/lib/time";

export default async function LiveSessionPage({ params }: PageProps<"/en-vivo/[sessionId]">) {
  const { sessionId } = await params;
  const me = await requireUser();
  const s = await db.query.liveSessions.findFirst({ where: eq(liveSessions.id, sessionId), with: { host: true, attendance: true, course: true } });
  if (!s) notFound();
  const isHost = s.hostId === me.id || me.role === "admin";
  const canJoin = s.status === "en_curso" || (isHost && s.status === "programada") || (s.status === "programada" && s.scheduledAt.getTime() - nowMs() <= 10 * 60_000);

  if (canJoin && livekitConfigured()) {
    return (
      <LiveRoom
        sessionId={s.id}
        title={s.title}
        isHost={isHost}
        me={{ id: me.id, name: me.name ?? "", image: me.image ?? null }}
      />
    );
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <Link href="/en-vivo" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" />Clases en vivo</Link>
      <div className="rounded-3xl border bg-card p-8 text-center">
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-primary/10 text-primary"><Radio className="size-8" /></span>
        <h1 className="mt-4 text-2xl font-bold">{s.title}</h1>
        <p className="mt-1 text-muted-foreground">{s.description}</p>
        <div className="mt-4 flex flex-wrap items-center justify-center gap-4 text-sm text-muted-foreground">
          <span className="flex items-center gap-2"><Avatar className="size-6"><AvatarImage src={s.host.image ?? undefined} /><AvatarFallback className="text-[10px]">{initials(s.host.name)}</AvatarFallback></Avatar>{s.host.name}</span>
          <span className="flex items-center gap-1"><CalendarClock className="size-4" />{fmtDateTime(s.scheduledAt)}</span>
          <span>{s.durationMin} min</span>
          <span className="flex items-center gap-1"><Users className="size-4" />{s.attendance.length} asistentes</span>
        </div>
        <div className="mt-6">
          {!livekitConfigured() ? (
            <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800 dark:bg-amber-950/30 dark:text-amber-300">El aula en vivo aún no está configurada. Un administrador debe agregar las credenciales de LiveKit.</p>
          ) : s.status === "finalizada" ? (
            s.recordingUrl ? (
              <Button render={<a href={s.recordingUrl} target="_blank" rel="noreferrer" />}><Video className="size-4" />Ver grabación</Button>
            ) : (
              <p className="text-sm text-muted-foreground">Esta clase ya finalizó.</p>
            )
          ) : s.status === "cancelada" ? (
            <p className="text-sm text-muted-foreground">Esta clase fue cancelada.</p>
          ) : (
            <p className="text-sm text-muted-foreground">Podrás entrar 10 minutos antes de la hora programada. Te avisaremos.</p>
          )}
        </div>
      </div>
    </div>
  );
}
