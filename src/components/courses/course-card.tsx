import Link from "next/link";
import Image from "next/image";
import { Clock, CheckCircle2, PlayCircle, Signal } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { fmtMinutes } from "@/lib/format";
import { cn } from "@/lib/utils";

const levelLabel = { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" } as const;

export function CourseCard({
  course,
  progress,
  lessonCount,
  className,
}: {
  course: { slug: string; title: string; description: string; cover: string | null; category: string; level: "basico" | "intermedio" | "avanzado"; estimatedMinutes: number };
  progress?: { pct: number; completed: boolean; started: boolean };
  lessonCount?: number;
  className?: string;
}) {
  return (
    <Link
      href={`/cursos/${course.slug}`}
      className={cn(
        "group relative flex flex-col overflow-hidden rounded-3xl border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:border-brand-green/60 hover:shadow-[0_20px_40px_-20px_rgba(1,22,64,0.45)]",
        className,
      )}
    >
      <div className="relative aspect-[16/9] w-full overflow-hidden bg-gradient-to-br from-brand-green to-brand-yellow">
        <span className="pointer-events-none absolute inset-0 z-10 -translate-x-full bg-gradient-to-r from-transparent via-white/30 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        {course.cover && (
          <Image src={course.cover} alt="" fill sizes="(max-width: 768px) 100vw, 33vw" className="object-cover transition-transform duration-500 group-hover:scale-105" />
        )}
        <div className="absolute left-3 top-3 flex gap-2">
          <Badge className="bg-brand-navy/80 font-heading font-bold text-white backdrop-blur hover:bg-brand-navy/80">{course.category}</Badge>
        </div>
        {progress?.completed && (
          <div className="absolute right-3 top-3 z-20 grid size-8 place-items-center rounded-full bg-brand-green text-brand-navy shadow">
            <CheckCircle2 className="size-5" />
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-2 p-4">
        <h3 className="line-clamp-2 font-semibold leading-snug">{course.title}</h3>
        <p className="line-clamp-2 text-sm text-muted-foreground">{course.description}</p>
        <div className="mt-auto flex items-center gap-3 pt-2 text-xs text-muted-foreground">
          <span className="flex items-center gap-1"><Clock className="size-3.5" />{fmtMinutes(course.estimatedMinutes)}</span>
          <span className="flex items-center gap-1"><Signal className="size-3.5" />{levelLabel[course.level]}</span>
          {lessonCount !== undefined && <span className="flex items-center gap-1"><PlayCircle className="size-3.5" />{lessonCount} lecciones</span>}
        </div>
        {progress?.started && !progress.completed && (
          <div className="mt-1">
            <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
              <div className="h-full rounded-full bg-gradient-to-r from-brand-green to-brand-yellow transition-all" style={{ width: `${progress.pct}%` }} />
            </div>
            <p className="mt-1 text-xs text-muted-foreground">{progress.pct}% completado</p>
          </div>
        )}
      </div>
    </Link>
  );
}
