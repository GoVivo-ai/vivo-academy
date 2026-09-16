"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { Lock, Check, Play, Star } from "lucide-react";
import { TrophyIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

export type MapNode = { id: string; slug: string; title: string; category: string; minutes: number; pct: number; state: "done" | "current" | "locked" };

/** Mapa de niveles estilo juego: camino en zigzag con nodos por curso. */
export function PathMap({ nodes, title }: { nodes: MapNode[]; title: string }) {
  const rowH = 150;
  const height = nodes.length * rowH + 140;
  const xFor = (i: number) => (i % 2 === 0 ? 22 : 78); // porcentaje
  const points = nodes.map((_, i) => ({ x: xFor(i), y: 60 + i * rowH }));
  const trophy = { x: nodes.length % 2 === 0 ? 22 : 78, y: 60 + nodes.length * rowH };
  const all = [...points, trophy];
  const d = all.map((p, i) => (i === 0 ? `M ${p.x} ${p.y}` : `C ${all[i - 1].x} ${all[i - 1].y + rowH / 2}, ${p.x} ${p.y - rowH / 2}, ${p.x} ${p.y}`)).join(" ");
  const doneCount = nodes.filter((n) => n.state === "done").length;
  const progressLen = nodes.length ? doneCount / nodes.length : 0;

  return (
    <div className="relative overflow-hidden rounded-[2rem] border bg-card p-4 sm:p-8" style={{ minHeight: height }}>
      <p className="mb-2 font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-green-600">{title}</p>
      <svg className="absolute inset-0 h-full w-full" viewBox={`0 0 100 ${height}`} preserveAspectRatio="none" aria-hidden>
        <path d={d} fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeDasharray="2.5 2.5" className="text-border" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 6 }} />
        <motion.path d={d} fill="none" stroke="currentColor" className="text-brand-green" strokeLinecap="round" vectorEffect="non-scaling-stroke" style={{ strokeWidth: 6 }} initial={{ pathLength: 0 }} animate={{ pathLength: progressLen }} transition={{ duration: 1.6, ease: "easeInOut", delay: 0.3 }} />
      </svg>

      {nodes.map((n, i) => {
        const p = points[i];
        const left = i % 2 === 0;
        return (
          <motion.div key={n.id} initial={{ opacity: 0, scale: 0.6 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.2 + i * 0.15, type: "spring", stiffness: 260, damping: 18 }} className="absolute flex w-full items-center" style={{ top: p.y - 36, left: 0 }}>
            <div className={cn("flex w-full items-center gap-4", left ? "flex-row" : "flex-row-reverse")} style={{ paddingLeft: left ? `calc(${p.x}% - 36px)` : undefined, paddingRight: left ? undefined : `calc(${100 - p.x}% - 36px)` }}>
              <Link href={n.state === "locked" ? "#" : `/cursos/${n.slug}`} aria-disabled={n.state === "locked"} className={cn("relative grid size-[72px] shrink-0 place-items-center rounded-full border-4 shadow-lg transition", n.state === "done" && "border-brand-green bg-brand-green text-brand-navy shadow-brand-green/40", n.state === "current" && "border-brand-yellow bg-brand-navy text-white shadow-brand-navy/40", n.state === "locked" && "cursor-not-allowed border-border bg-muted text-muted-foreground")}>
                {n.state === "current" && <motion.span className="absolute inset-0 rounded-full border-4 border-brand-yellow" animate={{ scale: [1, 1.35], opacity: [0.8, 0] }} transition={{ duration: 1.6, repeat: Infinity, ease: "easeOut" }} />}
                {n.state === "done" ? <Check className="size-8" strokeWidth={3} /> : n.state === "current" ? <Play className="size-7 fill-brand-yellow text-brand-yellow" /> : <Lock className="size-6" />}
                <span className={cn("absolute -bottom-2 rounded-full px-2 py-0.5 font-sans text-[11px] font-bold", n.state === "done" ? "bg-brand-navy text-white" : n.state === "current" ? "bg-brand-yellow text-brand-navy" : "bg-border text-muted-foreground")}>{i + 1}</span>
              </Link>
              <Link href={n.state === "locked" ? "#" : `/cursos/${n.slug}`} className={cn("max-w-[220px] rounded-2xl border bg-card px-4 py-3 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md", n.state === "current" && "border-brand-yellow", n.state === "locked" && "opacity-60")}>
                <p className="line-clamp-2 font-heading font-bold leading-tight">{n.title}</p>
                <p className="text-xs text-muted-foreground">{n.category} · {n.minutes} min{n.state === "current" && n.pct > 0 ? ` · ${n.pct}%` : ""}</p>
                {n.state === "done" && <p className="mt-1 flex items-center gap-1 text-xs font-bold text-brand-green-600"><Star className="size-3 fill-brand-green-600" />Completado</p>}
              </Link>
            </div>
          </motion.div>
        );
      })}

      <motion.div initial={{ opacity: 0, scale: 0.5 }} animate={{ opacity: 1, scale: 1 }} transition={{ delay: 0.4 + nodes.length * 0.15, type: "spring" }} className="absolute flex flex-col items-center" style={{ top: trophy.y - 40, left: `calc(${trophy.x}% - 40px)` }}>
        <div className={cn("grid size-20 place-items-center rounded-full border-4 shadow-xl", doneCount === nodes.length && nodes.length > 0 ? "border-brand-yellow bg-brand-yellow shadow-brand-yellow/40" : "border-border bg-muted")}>
          <TrophyIcon size={44} active={doneCount === nodes.length && nodes.length > 0} />
        </div>
        <p className="mt-2 font-sans text-xs font-bold uppercase tracking-wider text-muted-foreground">Meta</p>
      </motion.div>
    </div>
  );
}
