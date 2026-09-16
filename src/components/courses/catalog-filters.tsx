"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { cn } from "@/lib/utils";

export type Chip = { href: string; label: string; active: boolean; count?: number };

/** Filtros del catálogo con indicador deslizante compartido (layoutId). */
export function CatalogFilters({ estado, areas }: { estado: Chip[]; areas: Chip[] }) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <div className="flex gap-1 rounded-full border bg-card p-1 shadow-sm">
        {estado.map((c) => (
          <Link key={c.href} href={c.href} className="relative">
            {c.active && <motion.span layoutId="cat-estado" className="absolute inset-0 rounded-full bg-brand-green" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className={cn("relative flex items-center gap-1.5 rounded-full px-4 py-1.5 text-sm font-bold transition-colors", c.active ? "text-brand-navy" : "text-muted-foreground hover:text-foreground")}>
              {c.label}
              {c.count !== undefined && <span className={cn("rounded-full px-1.5 text-xs tabular-nums", c.active ? "bg-brand-navy/15" : "bg-muted")}>{c.count}</span>}
            </span>
          </Link>
        ))}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {areas.map((c) => (
          <Link key={c.href} href={c.href} className="relative">
            {c.active && <motion.span layoutId="cat-area" className="absolute inset-0 rounded-full bg-brand-green" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className={cn("relative block rounded-full border px-3.5 py-1.5 text-sm font-semibold transition-colors", c.active ? "border-transparent text-brand-navy" : "border-border text-muted-foreground hover:border-brand-green/50 hover:text-foreground")}>
              {c.label}
            </span>
          </Link>
        ))}
      </div>
    </div>
  );
}
