"use client";

import Link from "next/link";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check, ChevronDown, Lock, Play, FileText, Link2, Video, HelpCircle } from "lucide-react";
import { BoltIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

export type OutlineLesson = { id: string; title: string; type: "video" | "text" | "pdf" | "embed" | "quiz"; durationSec: number; xpReward: number; done: boolean };
export type OutlineModule = { id: string; title: string; lessons: OutlineLesson[] };

const typeIcon = { video: Video, text: FileText, pdf: FileText, embed: Link2, quiz: HelpCircle } as const;
const typeLabel = { video: "Video", text: "Lectura", pdf: "Documento", embed: "Video", quiz: "Reto" } as const;

/** Contenido del curso como lista de misiones: módulos plegables y lecciones con estado. */
export function CourseOutline({ modules, slug, enrolled, nextLessonId }: { modules: OutlineModule[]; slug: string; enrolled: boolean; nextLessonId?: string }) {
  const firstOpen = modules.findIndex((m) => m.lessons.some((l) => !l.done));
  const [open, setOpen] = useState<Record<string, boolean>>(() => Object.fromEntries(modules.map((m, i) => [m.id, i === (firstOpen === -1 ? 0 : firstOpen)])));

  return (
    <div className="space-y-3">
      {modules.map((m, mi) => {
        const done = m.lessons.filter((l) => l.done).length;
        const pct = m.lessons.length ? (done / m.lessons.length) * 100 : 0;
        const complete = done === m.lessons.length && m.lessons.length > 0;
        const isOpen = open[m.id];
        return (
          <div key={m.id} className={cn("overflow-hidden rounded-[1.75rem] border bg-card transition", complete && "border-brand-green/50")}>
            <button onClick={() => setOpen((o) => ({ ...o, [m.id]: !o[m.id] }))} className="flex w-full items-center gap-4 p-4 text-left transition hover:bg-muted/40">
              <span className={cn("relative grid size-12 shrink-0 place-items-center rounded-2xl font-heading text-lg font-bold", complete ? "bg-brand-green text-brand-navy" : "bg-brand-navy text-white")}>
                {complete ? <Check className="size-6" strokeWidth={3} /> : mi + 1}
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-heading text-lg font-bold leading-tight">{m.title}</p>
                <div className="mt-1.5 flex items-center gap-2">
                  <span className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                    <motion.span className="block h-full rounded-full bg-brand-swoosh" initial={{ width: 0 }} animate={{ width: `${pct}%` }} transition={{ duration: 0.8, delay: 0.1 * mi }} />
                  </span>
                  <span className="text-xs font-semibold text-muted-foreground">{done}/{m.lessons.length} lecciones</span>
                </div>
              </div>
              <motion.span animate={{ rotate: isOpen ? 180 : 0 }} className="grid size-8 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground"><ChevronDown className="size-4" /></motion.span>
            </button>

            <AnimatePresence initial={false}>
              {isOpen && (
                <motion.ul initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25, ease: "easeInOut" }} className="overflow-hidden border-t">
                  {m.lessons.map((l, li) => {
                    const Icon = typeIcon[l.type];
                    const isNext = l.id === nextLessonId;
                    return (
                      <li key={l.id} className={cn("relative", li > 0 && "border-t border-border/60")}>
                        <Link href={enrolled ? `/cursos/${slug}/${l.id}` : `/cursos/${slug}`} className={cn("group flex items-center gap-3 px-4 py-3 transition", enrolled ? "hover:bg-brand-green/5" : "cursor-default opacity-70", isNext && "bg-brand-yellow/10")}>
                          <span className={cn("relative grid size-9 shrink-0 place-items-center rounded-xl transition", l.done ? "bg-brand-green text-brand-navy" : isNext ? "bg-brand-yellow text-brand-navy" : "bg-muted text-muted-foreground")}>
                            {isNext && !l.done && <motion.span className="absolute inset-0 rounded-xl bg-brand-yellow" animate={{ scale: [1, 1.35], opacity: [0.6, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />}
                            <span className="relative">{l.done ? <Check className="size-4" strokeWidth={3} /> : !enrolled ? <Lock className="size-3.5" /> : isNext ? <Play className="size-4 fill-current" /> : <Icon className="size-4" />}</span>
                          </span>
                          <div className="min-w-0 flex-1">
                            <p className={cn("truncate font-semibold leading-tight", l.done && "text-muted-foreground")}>{l.title}</p>
                            <p className="text-xs text-muted-foreground">{typeLabel[l.type]} · {Math.max(1, Math.round(l.durationSec / 60))} min</p>
                          </div>
                          <span className={cn("flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-bold tabular-nums", l.done ? "bg-brand-green/15 text-brand-green-600" : "bg-muted text-muted-foreground")}>
                            <BoltIcon size={13} active={!l.done} />+{l.xpReward}
                          </span>
                        </Link>
                      </li>
                    );
                  })}
                </motion.ul>
              )}
            </AnimatePresence>
          </div>
        );
      })}
    </div>
  );
}
