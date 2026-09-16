import Link from "next/link";
import { asc, desc, eq, inArray } from "drizzle-orm";
import { Radio, CalendarClock, Video, PlayCircle, Users } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { liveSessions } from "@/db/schema";
import { fmtDateTime, initials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const metadata = { title: "En vivo" };

export default async function LivePage() {
  const me = await requireUser();
  const isStaff = me.role !== "colaborador";

  const [activeAndUpcoming, past] = await Promise.all([
    db.query.liveSessions.findMany({
      where: inArray(liveSessions.status, ["programada", "en_curso"]),
      with: { host: true, attendance: true },
      orderBy: [asc(liveSessions.scheduledAt)],
    }),
    db.query.liveSessions.findMany({
      where: eq(liveSessions.status, "finalizada"),
      with: { host: true, attendance: true },
      orderBy: [desc(liveSessions.scheduledAt)],
      limit: 12,
    }),
  ]);
  const live = activeAndUpcoming.filter((s) => s.status === "en_curso");
  const upcoming = activeAndUpcoming.filter((s) => s.status === "programada");

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Clases en vivo</h1>
          <p className="text-muted-foreground">Aprende en tiempo real con quizzes, encuestas y pizarra.</p>
        </div>
        {isStaff && <Button render={<Link href="/admin/en-vivo" />}><CalendarClock className="size-4" />Programar clase</Button>}
      </div>

      {live.length > 0 && (
        <section>
          <h2 className="mb-3 flex items-center gap-2 text-lg font-semibold"><span className="size-2.5 animate-pulse rounded-full bg-red-500" />En curso ahora</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {live.map((s) => <SessionCard key={s.id} s={s} live />)}
          </div>
        </section>
      )}

      <section>
        <h2 className="mb-3 text-lg font-semibold">Próximas</h2>
        {upcoming.length === 0 ? (
          <div className="flex items-center gap-3 rounded-2xl border border-dashed p-6 text-sm text-muted-foreground"><Radio className="size-5" />No hay clases programadas. {isStaff && <Link href="/admin/en-vivo" className="text-primary hover:underline">Programa una</Link>}</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">{upcoming.map((s) => <SessionCard key={s.id} s={s} />)}</div>
        )}
      </section>

      {past.length > 0 && (
        <section>
          <h2 className="mb-3 text-lg font-semibold">Anteriores</h2>
          <ul className="divide-y overflow-hidden rounded-2xl border bg-card">
            {past.map((s) => (
              <li key={s.id} className="flex items-center gap-4 px-4 py-3">
                <div className="grid size-10 shrink-0 place-items-center rounded-xl bg-muted"><Video className="size-5 text-muted-foreground" /></div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{s.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDateTime(s.scheduledAt)} · {s.host.name} · {s.attendance.length} asistentes</p>
                </div>
                {s.recordingUrl ? (
                  <Button size="sm" variant="outline" render={<a href={s.recordingUrl} target="_blank" rel="noreferrer" />}><PlayCircle className="size-4" />Grabación</Button>
                ) : (
                  <Badge variant="secondary">Sin grabación</Badge>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function SessionCard({ s, live }: { s: { id: string; title: string; description: string; scheduledAt: Date; durationMin: number; host: { name: string | null; image: string | null }; attendance: unknown[] }; live?: boolean }) {
  return (
    <div className={cn("flex flex-col gap-3 rounded-2xl border bg-card p-5", live && "border-red-300 ring-2 ring-red-200 dark:ring-red-900")}>
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <h3 className="truncate text-lg font-semibold">{s.title}</h3>
          <p className="line-clamp-2 text-sm text-muted-foreground">{s.description}</p>
        </div>
        {live && <Badge className="bg-red-500 text-white hover:bg-red-500">EN VIVO</Badge>}
      </div>
      <div className="flex flex-wrap items-center gap-3 text-sm text-muted-foreground">
        <span className="flex items-center gap-2"><Avatar className="size-6"><AvatarImage src={s.host.image ?? undefined} /><AvatarFallback className="text-[10px]">{initials(s.host.name)}</AvatarFallback></Avatar>{s.host.name}</span>
        <span className="flex items-center gap-1"><CalendarClock className="size-4" />{fmtDateTime(s.scheduledAt)}</span>
        <span>{s.durationMin} min</span>
        {live && <span className="flex items-center gap-1"><Users className="size-4" />{s.attendance.length}</span>}
      </div>
      <Button render={<Link href={`/en-vivo/${s.id}`} />} className={cn("mt-auto", live && "bg-rose-500 hover:bg-rose-600 text-white")}>
        <Radio className="size-4" />{live ? "Unirme ahora" : "Ver detalles"}
      </Button>
    </div>
  );
}
