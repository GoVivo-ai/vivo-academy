"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Check, FileText, HelpCircle, Link2, Play, Video } from "lucide-react";
import { LevelRing } from "@/components/gamification/level-ring";
import { cn } from "@/lib/utils";

type L = { id: string; title: string; type: "video" | "text" | "pdf" | "embed" | "quiz"; done: boolean; durationSec: number };
type M = { id: string; title: string; lessons: L[] };

const typeIcon = { video: Video, text: FileText, pdf: FileText, embed: Link2, quiz: HelpCircle } as const;

/** Riel de navegación de la lección: progreso circular + timeline de lecciones. */
export function LessonRail({ modules, slug, currentId, doneCount, total }: { modules: M[]; slug: string; currentId: string; doneCount: number; total: number }) {
  const pct = total ? Math.round((doneCount / total) * 100) : 0;
  return (
    <div className="sticky top-20 max-h-[calc(100vh-6rem)] overflow-auto rounded-[1.75rem] border bg-card">
      <div className="flex items-center gap-4 border-b bg-muted p-4">
        <LevelRing pct={pct} size={64} stroke={6} track="var(--gray-300)">
          <span className="font-heading text-sm font-bold">{pct}%</span>
        </LevelRing>
        <div>
          <p className="font-heading text-sm font-bold">Tu progreso</p>
          <p className="text-xs text-muted-foreground">{doneCount} de {total} lecciones</p>
        </div>
      </div>

      <div className="p-2">
        {modules.map((m) => (
          <div key={m.id} className="mb-2 last:mb-0">
            <p className="px-3 py-2 font-sans text-[11px] font-bold uppercase tracking-widest text-muted-foreground">{m.title}</p>
            <ul className="relative ml-[26px] border-l-2 border-dashed border-border">
              {m.lessons.map((l) => {
                const Icon = typeIcon[l.type];
                const current = l.id === currentId;
                return (
                  <li key={l.id} className="relative">
                    <span className={cn("absolute -left-[13px] top-3 grid size-6 place-items-center rounded-full border-2 border-card", l.done ? "bg-brand-green text-brand-navy" : current ? "bg-brand-yellow text-brand-navy" : "bg-muted text-muted-foreground")}>
                      {l.done ? <Check className="size-3.5" strokeWidth={3} /> : current ? <Play className="size-3 fill-current" /> : <Icon className="size-3" />}
                    </span>
                    <Link href={`/cursos/${slug}/${l.id}`} className={cn("relative ml-4 block rounded-xl px-3 py-2 text-sm transition", current ? "font-bold text-brand-navy dark:text-white" : "text-muted-foreground hover:bg-muted/60 hover:text-foreground")}>
                      {current && <motion.span layoutId="rail-active" className="absolute inset-0 rounded-xl bg-brand-yellow/25" transition={{ type: "spring", stiffness: 400, damping: 32 }} />}
                      <span className="relative line-clamp-2 leading-snug">{l.title}</span>
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </div>
    </div>
  );
}
