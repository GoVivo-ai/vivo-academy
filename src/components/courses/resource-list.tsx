"use client";

import { motion } from "motion/react";
import { FileText, FileSpreadsheet, Presentation, ImageIcon, Video, FileArchive, ExternalLink, Download, Paperclip } from "lucide-react";
import { cn } from "@/lib/utils";

export type ResourceItem = {
  id: string;
  kind: "pdf" | "doc" | "sheet" | "slide" | "image" | "video" | "zip" | "link";
  title: string;
  description: string;
  url: string;
  sizeBytes: number | null;
};

const META = {
  pdf: { icon: FileText, label: "PDF", cls: "bg-rose-500/12 text-rose-600 dark:text-rose-400" },
  doc: { icon: FileText, label: "Documento", cls: "bg-sky-500/12 text-sky-600 dark:text-sky-400" },
  sheet: { icon: FileSpreadsheet, label: "Hoja de cálculo", cls: "bg-brand-green/15 text-brand-green-600 dark:text-brand-green" },
  slide: { icon: Presentation, label: "Presentación", cls: "bg-amber-500/15 text-amber-600 dark:text-amber-400" },
  image: { icon: ImageIcon, label: "Imagen", cls: "bg-violet-500/12 text-violet-600 dark:text-violet-400" },
  video: { icon: Video, label: "Video", cls: "bg-brand-navy/10 text-brand-navy dark:bg-white/10 dark:text-white" },
  zip: { icon: FileArchive, label: "Archivo", cls: "bg-muted text-muted-foreground" },
  link: { icon: ExternalLink, label: "Enlace", cls: "bg-brand-navy/10 text-brand-navy dark:bg-white/10 dark:text-white" },
} as const;

export function fmtSize(bytes: number | null) {
  if (!bytes) return null;
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Material de apoyo descargable de un curso o una lección. */
export function ResourceList({ items, compact = false, title = "Material de apoyo" }: { items: ResourceItem[]; compact?: boolean; title?: string }) {
  if (items.length === 0) return null;
  return (
    <section className={compact ? "" : "space-y-4"}>
      <div className={cn("flex items-center justify-between", compact && "mb-2")}>
        <h2 className={cn("flex items-center gap-2 font-bold", compact ? "text-base" : "text-xl")}>
          {compact ? <Paperclip className="size-4 text-brand-green-600" /> : <span className="h-5 w-1.5 rounded-full bg-brand-swoosh" />}
          {title}
        </h2>
        <span className="text-sm font-semibold text-muted-foreground">{items.length} {items.length === 1 ? "recurso" : "recursos"}</span>
      </div>
      <ul className={cn("grid gap-3", !compact && "sm:grid-cols-2")}>
        {items.map((r, i) => {
          const m = META[r.kind];
          const Icon = m.icon;
          const isLink = r.kind === "link";
          const size = fmtSize(r.sizeBytes);
          return (
            <motion.li key={r.id} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}>
              <a
                href={r.url}
                target="_blank"
                rel="noreferrer"
                {...(isLink ? {} : { download: "" })}
                className="group flex items-center gap-3 rounded-2xl border bg-card p-3.5 transition hover:-translate-y-0.5 hover:border-brand-green/60 hover:shadow-md"
              >
                <span className={cn("grid size-11 shrink-0 place-items-center rounded-2xl", m.cls)}><Icon className="size-5" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold leading-tight">{r.title}</p>
                  <p className="truncate text-xs text-muted-foreground">
                    {m.label}
                    {size ? ` · ${size}` : ""}
                    {r.description ? ` · ${r.description}` : ""}
                  </p>
                </div>
                <span className="grid size-9 shrink-0 place-items-center rounded-full bg-muted text-muted-foreground transition group-hover:bg-brand-green group-hover:text-brand-navy">
                  {isLink ? <ExternalLink className="size-4" /> : <Download className="size-4" />}
                </span>
              </a>
            </motion.li>
          );
        })}
      </ul>
    </section>
  );
}
