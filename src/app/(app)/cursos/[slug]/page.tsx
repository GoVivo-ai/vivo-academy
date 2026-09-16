import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { Clock, Play, PlayCircle, Award, Signal } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { certificates, enrollments, resources } from "@/db/schema";
import { getCourseBySlug, flattenLessons, getCompletedLessonIds } from "@/lib/courses";
import { ResourceList } from "@/components/courses/resource-list";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { fmtMinutes, initials } from "@/lib/format";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { CourseOutline } from "@/components/courses/course-outline";
import { LevelRing } from "@/components/gamification/level-ring";
import { BoltIcon } from "@/components/brand/icons";
import { enrollAction } from "./actions";

const levelLabel = { basico: "Básico", intermedio: "Intermedio", avanzado: "Avanzado" } as const;

export default async function CoursePage({ params }: PageProps<"/cursos/[slug]">) {
  const { slug } = await params;
  const me = await requireUser();
  const course = await getCourseBySlug(slug);
  if (!course || (!course.published && me.role === "colaborador")) notFound();

  const all = flattenLessons(course);
  const done = await getCompletedLessonIds(me.id, all.map((l) => l.id));
  const [enr] = await db.select().from(enrollments).where(and(eq(enrollments.userId, me.id), eq(enrollments.courseId, course.id)));
  const [cert] = await db.select().from(certificates).where(and(eq(certificates.userId, me.id), eq(certificates.courseId, course.id)));
  const material = await db.select().from(resources).where(eq(resources.courseId, course.id)).orderBy(asc(resources.order));
  const pct = all.length ? Math.round((done.size / all.length) * 100) : 0;
  const nextLesson = all.find((l) => !done.has(l.id)) ?? all[0];
  const totalMin = Math.round(all.reduce((s, l) => s + l.durationSec, 0) / 60) || course.estimatedMinutes;
  const totalXp = all.reduce((s, l) => s + l.xpReward, 0) + 100;

  return (
    <div className="mx-auto max-w-5xl space-y-8">
      <div className="relative overflow-hidden rounded-[2rem] bg-brand-navy text-white">
        {course.cover && <Image src={course.cover} alt="" fill sizes="100vw" className="object-cover opacity-30" priority />}
        <div className="absolute inset-0 bg-gradient-to-r from-brand-navy via-brand-navy/85 to-brand-navy/40" />
        <div className="relative grid gap-6 p-6 md:grid-cols-[1fr_auto] md:items-center md:p-10">
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <Badge className="rounded-full bg-brand-green font-heading font-bold text-brand-navy hover:bg-brand-green">{course.category}</Badge>
              <Badge className="rounded-full bg-white/15 font-semibold text-white hover:bg-white/15"><Signal className="mr-1 size-3" />{levelLabel[course.level]}</Badge>
              {!course.published && <Badge variant="destructive" className="rounded-full">Borrador</Badge>}
            </div>
            <h1 className="font-heading text-3xl font-bold md:text-4xl">{course.title}</h1>
            <p className="max-w-2xl text-white/80">{course.description}</p>
            <div className="flex flex-wrap items-center gap-4 text-sm text-white/80">
              <span className="flex items-center gap-1.5"><Clock className="size-4" />{fmtMinutes(totalMin)}</span>
              <span className="flex items-center gap-1.5"><PlayCircle className="size-4" />{all.length} lecciones</span>
              <span className="flex items-center gap-1.5"><BoltIcon size={16} />hasta {totalXp} XP</span>
              {course.instructor && (
                <span className="flex items-center gap-2">
                  <Avatar className="size-6"><AvatarImage src={course.instructor.image ?? undefined} /><AvatarFallback className="text-[10px] text-black">{initials(course.instructor.name)}</AvatarFallback></Avatar>
                  {course.instructor.name}
                </span>
              )}
            </div>
            <div className="flex flex-wrap items-center gap-3 pt-1">
              {enr ? (
                <Button size="lg" className="h-12 rounded-full bg-brand-green px-6 font-bold text-brand-navy hover:bg-brand-green/90" render={<Link href={`/cursos/${slug}/${nextLesson?.id}`} />}>
                  <Play className="size-4 fill-current" />{pct === 100 ? "Repasar curso" : pct > 0 ? "Continuar" : "Empezar ahora"}
                </Button>
              ) : (
                <form action={enrollAction.bind(null, course.id, slug, nextLesson?.id ?? "")}>
                  <Button type="submit" size="lg" className="h-12 rounded-full bg-brand-green px-6 font-bold text-brand-navy hover:bg-brand-green/90"><Play className="size-4 fill-current" />Inscribirme y empezar</Button>
                </form>
              )}
              {cert && (
                <Button size="lg" variant="outline" className="h-12 gap-2 rounded-full border-white/30 bg-white/10 px-5 text-white hover:bg-white/20 hover:text-white" render={<Link href={`/certificados/${cert.code}`} />}><Award className="size-4" />Ver certificado</Button>
              )}
            </div>
          </div>

          {enr && (
            <LevelRing pct={pct} size={124} stroke={10} className="justify-self-center md:justify-self-end">
              <div className="text-center">
                <p className="font-heading text-3xl font-bold leading-none">{pct}%</p>
                <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">completado</p>
              </div>
            </LevelRing>
          )}
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="flex items-center gap-2 text-xl font-bold"><span className="h-5 w-1.5 rounded-full bg-brand-swoosh" />Contenido del curso</h2>
          <p className="text-sm font-semibold text-muted-foreground">{done.size} de {all.length} lecciones</p>
        </div>
        <CourseOutline
          slug={slug}
          enrolled={!!enr}
          nextLessonId={enr && pct < 100 ? nextLesson?.id : undefined}
          modules={course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, durationSec: l.durationSec, xpReward: l.xpReward, done: done.has(l.id) })),
          }))}
        />
      </div>

      <ResourceList items={material.map((r) => ({ id: r.id, kind: r.kind, title: r.title, description: r.description, url: r.url, sizeBytes: r.sizeBytes }))} />
    </div>
  );
}
