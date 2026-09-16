"use client";

import Link from "next/link";
import { useEffect, useRef, useState, useTransition } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Bell, CheckCheck, Loader2 } from "lucide-react";
import { MedalIcon, TrophyIcon, LiveIcon, RouteIcon, CertIcon, BookIcon } from "@/components/brand/icons";
import { fmtRelative } from "@/lib/format";
import { listNotificationsAction, markNotificationsReadAction, type NotifItem } from "@/app/(app)/actions";
import { cn } from "@/lib/utils";

const icons: Record<string, React.ReactNode> = {
  badge: <MedalIcon size={24} />,
  level: <TrophyIcon size={24} />,
  live: <LiveIcon size={24} />,
  path: <RouteIcon size={24} />,
  certificate: <CertIcon size={24} />,
  course: <BookIcon size={24} />,
};

/** Campana con panel flotante de notificaciones. */
export function NotificationsMenu({ unread }: { unread: number }) {
  const [open, setOpen] = useState(false);
  const [items, setItems] = useState<NotifItem[] | null>(null);
  const [seen, setSeen] = useState(false);
  const count = seen ? 0 : unread;
  const [, start] = useTransition();
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => { if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false); };
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    document.addEventListener("mousedown", onDown);
    document.addEventListener("keydown", onKey);
    return () => { document.removeEventListener("mousedown", onDown); document.removeEventListener("keydown", onKey); };
  }, [open]);

  const toggle = () => {
    const next = !open;
    setOpen(next);
    if (!next) return;
    listNotificationsAction().then(setItems);
    if (count > 0) {
      setSeen(true);
      start(() => { void markNotificationsReadAction(); });
    }
  };

  return (
    <div ref={ref} className="relative">
      <button onClick={toggle} aria-label="Notificaciones" aria-expanded={open} className={cn("relative grid size-9 place-items-center rounded-full transition", open ? "bg-muted text-foreground" : "text-foreground hover:bg-muted")}>
        <Bell className="size-5" />
        <AnimatePresence>
          {count > 0 && (
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} exit={{ scale: 0 }} className="absolute -right-0.5 -top-0.5 grid min-w-4.5 place-items-center rounded-full bg-brand-green px-1 font-sans text-[10px] font-bold text-brand-navy">
              {count > 9 ? "9+" : count}
            </motion.span>
          )}
        </AnimatePresence>
        {count > 0 && <span className="absolute -right-0.5 -top-0.5 size-4.5 animate-ping rounded-full bg-brand-green/50" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
            className="absolute right-0 top-12 z-50 w-[min(92vw,22rem)] origin-top-right overflow-hidden rounded-[1.5rem] border bg-popover shadow-2xl shadow-black/10"
          >
            <div className="flex items-center justify-between border-b bg-muted px-4 py-3">
              <p className="font-heading font-bold">Notificaciones</p>
              {items && items.length > 0 && <span className="flex items-center gap-1 text-xs text-muted-foreground"><CheckCheck className="size-3.5" />Al día</span>}
            </div>

            <div className="max-h-[26rem] overflow-y-auto">
              {items === null ? (
                <div className="grid place-items-center py-10 text-muted-foreground"><Loader2 className="size-5 animate-spin" /></div>
              ) : items.length === 0 ? (
                <div className="flex flex-col items-center gap-2 px-6 py-10 text-center">
                  <Bell className="size-8 text-muted-foreground/40" />
                  <p className="font-semibold">Todo tranquilo por aquí</p>
                  <p className="text-sm text-muted-foreground">Aquí verás tus insignias, niveles y clases nuevas.</p>
                </div>
              ) : (
                <ul className="divide-y">
                  {items.map((n, i) => {
                    const inner = (
                      <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.04 }} className={cn("flex items-start gap-3 px-4 py-3 transition", n.href && "hover:bg-muted/60", !n.read && "bg-brand-green/5")}>
                        <span className="mt-0.5 grid size-10 shrink-0 place-items-center rounded-2xl bg-muted">{icons[n.type] ?? <Bell className="size-5 text-muted-foreground" />}</span>
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold leading-snug">{n.title}</p>
                          {n.body && <p className="line-clamp-2 text-sm text-muted-foreground">{n.body}</p>}
                          <p className="mt-1 text-xs text-muted-foreground">{fmtRelative(n.createdAt)}</p>
                        </div>
                        {!n.read && <span className="mt-2 size-2 shrink-0 rounded-full bg-brand-green" />}
                      </motion.div>
                    );
                    return <li key={n.id}>{n.href ? <Link href={n.href} onClick={() => setOpen(false)}>{inner}</Link> : inner}</li>;
                  })}
                </ul>
              )}
            </div>

            {items && items.length > 0 && (
              <Link href="/notificaciones" onClick={() => setOpen(false)} className="block border-t px-4 py-3 text-center text-sm font-bold text-brand-green-600 transition hover:bg-muted/60">
                Ver historial completo
              </Link>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
