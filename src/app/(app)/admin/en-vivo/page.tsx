import Link from "next/link";
import { asc, desc, eq } from "drizzle-orm";
import { CalendarPlus, Radio, Trash2, XCircle, ExternalLink } from "lucide-react";
import { requireRole } from "@/auth";
import { db } from "@/db";
import { courses, liveSessions } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { cancelLiveSessionAction, createLiveSessionAction, deleteLiveSessionAction } from "../actions";
import { fmtDateTime } from "@/lib/format";
import { livekitConfigured } from "@/lib/live/server";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Clases en vivo · Admin" };

const statusLabel = { programada: "Programada", en_curso: "En curso", finalizada: "Finalizada", cancelada: "Cancelada" } as const;
const statusVariant = { programada: "secondary", en_curso: "default", finalizada: "outline", cancelada: "destructive" } as const;

export default async function AdminLive() {
  const me = await requireRole("instructor");
  const [sessions, allCourses] = await Promise.all([
    db.query.liveSessions.findMany({ with: { host: true, attendance: true, course: true }, orderBy: [desc(liveSessions.scheduledAt)], limit: 50 }),
    db.select({ id: courses.id, title: courses.title }).from(courses).where(eq(courses.published, true)).orderBy(asc(courses.title)),
  ]);
  const defaultDate = new Date(nowMs() + 3600_000);
  defaultDate.setMinutes(0, 0, 0);
  const local = new Date(defaultDate.getTime() - defaultDate.getTimezoneOffset() * 60000).toISOString().slice(0, 16);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Clases en vivo</h1>
      {!livekitConfigured() && (
        <div className="rounded-2xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900 dark:bg-amber-950/30 dark:text-amber-200">
          <strong>LiveKit no está configurado.</strong> Crea un proyecto gratuito en <a href="https://cloud.livekit.io" target="_blank" rel="noreferrer" className="underline">cloud.livekit.io</a> y agrega <code>LIVEKIT_URL</code>, <code>LIVEKIT_API_KEY</code> y <code>LIVEKIT_API_SECRET</code> a las variables de entorno. Puedes programar clases desde ya; el aula se activará cuando estén las credenciales.
        </div>
      )}

      <form action={createLiveSessionAction} className="grid gap-4 rounded-2xl border bg-card p-5 sm:grid-cols-2">
        <h2 className="font-semibold sm:col-span-2">Programar nueva clase</h2>
        <div className="sm:col-span-2"><Label>Título</Label><Input name="title" required placeholder="Ej: Taller de objeciones en ventas" /></div>
        <div className="sm:col-span-2"><Label>Descripción</Label><Textarea name="description" rows={2} placeholder="Qué aprenderán y qué deben preparar" /></div>
        <div><Label>Fecha y hora</Label><Input type="datetime-local" name="scheduledAt" required defaultValue={local} /></div>
        <div><Label>Duración (min)</Label><Input type="number" name="durationMin" min={10} defaultValue={60} /></div>
        <div className="sm:col-span-2">
          <Label>Curso relacionado (opcional)</Label>
          <select name="courseId" className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm"><option value="">Ninguno</option>{allCourses.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}</select>
        </div>
        <div className="sm:col-span-2 flex justify-end"><Button type="submit"><CalendarPlus className="size-4" />Programar y notificar a todos</Button></div>
      </form>

      <div className="overflow-hidden rounded-2xl border bg-card">
        <table className="w-full text-sm">
          <thead className="bg-muted/40 text-left text-xs uppercase tracking-wide text-muted-foreground"><tr><th className="px-4 py-3">Clase</th><th className="px-4 py-3">Cuándo</th><th className="px-4 py-3">Estado</th><th className="px-4 py-3">Asistentes</th><th className="px-4 py-3" /></tr></thead>
          <tbody className="divide-y">
            {sessions.map((s) => (
              <tr key={s.id}>
                <td className="px-4 py-3"><Link href={`/en-vivo/${s.id}`} className="font-medium hover:underline">{s.title}</Link><p className="text-xs text-muted-foreground">{s.host.name}{s.course ? ` · ${s.course.title}` : ""}</p></td>
                <td className="px-4 py-3 text-muted-foreground">{fmtDateTime(s.scheduledAt)} · {s.durationMin} min</td>
                <td className="px-4 py-3"><Badge variant={statusVariant[s.status]}>{statusLabel[s.status]}</Badge></td>
                <td className="px-4 py-3">{s.attendance.length}</td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-1">
                    {(s.status === "programada" || s.status === "en_curso") && (s.hostId === me.id || me.role === "admin") && <Button size="sm" render={<Link href={`/en-vivo/${s.id}`} />}><Radio className="size-4" />{s.status === "en_curso" ? "Volver" : "Iniciar"}</Button>}
                    {s.recordingUrl && <Button size="sm" variant="ghost" render={<a href={s.recordingUrl} target="_blank" rel="noreferrer" />}><ExternalLink className="size-4" /></Button>}
                    {s.status === "programada" && <form action={cancelLiveSessionAction.bind(null, s.id)}><Button type="submit" size="sm" variant="ghost" title="Cancelar"><XCircle className="size-4" /></Button></form>}
                    {me.role === "admin" && <form action={deleteLiveSessionAction.bind(null, s.id)}><Button type="submit" size="sm" variant="ghost" title="Eliminar"><Trash2 className="size-4 text-destructive" /></Button></form>}
                  </div>
                </td>
              </tr>
            ))}
            {sessions.length === 0 && <tr><td colSpan={5} className="px-4 py-10 text-center text-muted-foreground">Aún no hay clases programadas.</td></tr>}
          </tbody>
        </table>
      </div>
    </div>
  );
}
