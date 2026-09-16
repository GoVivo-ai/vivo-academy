import Link from "next/link";
import { and, desc, eq, isNull } from "drizzle-orm";
import { Bell } from "lucide-react";
import { MedalIcon, TrophyIcon, LiveIcon, RouteIcon, CertIcon, BookIcon } from "@/components/brand/icons";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";
import { fmtRelative } from "@/lib/format";
import { cn } from "@/lib/utils";

export const metadata = { title: "Notificaciones" };

const icons: Record<string, React.ReactNode> = {
  badge: <MedalIcon size={26} />,
  level: <TrophyIcon size={26} />,
  live: <LiveIcon size={26} />,
  path: <RouteIcon size={26} />,
  certificate: <CertIcon size={26} />,
  course: <BookIcon size={26} />,
};

export default async function NotificationsPage() {
  const me = await requireUser();
  const list = await db.select().from(notifications).where(eq(notifications.userId, me.id)).orderBy(desc(notifications.createdAt)).limit(50);
  // Marcar como leídas al abrir
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));

  return (
    <div className="mx-auto max-w-2xl space-y-4">
      <h1 className="text-2xl font-bold">Historial de notificaciones</h1>
      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed p-12 text-center text-muted-foreground"><Bell className="size-8" />Nada por aquí todavía.</div>
      ) : (
        <ul className="divide-y overflow-hidden rounded-[1.75rem] border bg-card">
          {list.map((n) => {
            const inner = (
              <div className={cn("flex items-start gap-3 px-4 py-3", !n.readAt && "bg-primary/5")}>
                <span className="mt-0.5 grid size-11 shrink-0 place-items-center rounded-2xl bg-muted">{icons[n.type] ?? <Bell className="size-5" />}</span>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{n.title}</p>
                  {n.body && <p className="text-sm text-muted-foreground">{n.body}</p>}
                  <p className="mt-1 text-xs text-muted-foreground">{fmtRelative(n.createdAt)}</p>
                </div>
                {!n.readAt && <span className="mt-2 size-2 rounded-full bg-primary" />}
              </div>
            );
            return <li key={n.id}>{n.href ? <Link href={n.href} className="block hover:bg-muted/40">{inner}</Link> : inner}</li>;
          })}
        </ul>
      )}
    </div>
  );
}
