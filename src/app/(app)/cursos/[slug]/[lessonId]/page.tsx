import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { and, asc, eq } from "drizzle-orm";
import { ArrowLeft, ArrowRight, CheckCircle2, ChevronLeft } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { enrollments, resources } from "@/db/schema";
import { getCourseBySlug, flattenLessons, getCompletedLessonIds, getBestAttempt } from "@/lib/courses";
import { getQuizForLesson, publicQuiz } from "@/lib/quiz";
import { Button } from "@/components/ui/button";
import { LessonPlayer } from "@/components/courses/lesson-player";
import { QuizPlayer } from "@/components/quiz/quiz-player";
import { LessonRail } from "@/components/courses/lesson-rail";
import { ResourceList } from "@/components/courses/resource-list";

export default async function LessonPage({ params }: PageProps<"/cursos/[slug]/[lessonId]">) {
  const { slug, lessonId } = await params;
  const me = await requireUser();
  const course = await getCourseBySlug(slug);
  if (!course) notFound();
  const all = flattenLessons(course);
  const idx = all.findIndex((l) => l.id === lessonId);
  if (idx === -1) notFound();
  const lesson = all[idx];

  const [enr] = await db.select().from(enrollments).where(and(eq(enrollments.userId, me.id), eq(enrollments.courseId, course.id)));
  if (!enr) redirect(`/cursos/${slug}`);

  const done = await getCompletedLessonIds(me.id, all.map((l) => l.id));
  const material = await db.select().from(resources).where(eq(resources.lessonId, lesson.id)).orderBy(asc(resources.order));
  const prev = all[idx - 1];
  const next = all[idx + 1];
  const isDone = done.has(lesson.id);

  let quiz: ReturnType<typeof publicQuiz> | null = null;
  let best: Awaited<ReturnType<typeof getBestAttempt>> | null = null;
  if (lesson.type === "quiz") {
    const q = await getQuizForLesson(lesson.id);
    if (q) {
      quiz = publicQuiz(q, q.shuffle);
      best = await getBestAttempt(me.id, q.id);
    }
  }

  return (
    <div className="mx-auto grid max-w-7xl gap-6 lg:grid-cols-[1fr_300px]">
      <div className="min-w-0 space-y-4">
        <div className="flex flex-wrap items-center gap-2 text-sm">
          <Link href={`/cursos/${slug}`} className="flex items-center gap-1 font-semibold text-muted-foreground transition hover:text-foreground"><ChevronLeft className="size-4" />{course.title}</Link>
          <span className="rounded-full bg-brand-navy px-2.5 py-0.5 font-sans text-xs font-bold text-white">Lección {idx + 1} de {all.length}</span>
          {isDone && <span className="flex items-center gap-1 rounded-full bg-brand-green/15 px-2.5 py-0.5 text-xs font-bold text-brand-green-600"><CheckCircle2 className="size-3.5" />Completada</span>}
        </div>
        <h1 className="text-3xl font-bold">{lesson.title}</h1>

        {lesson.type === "quiz" ? (
          quiz ? (
            <QuizPlayer quiz={quiz} lessonId={lesson.id} slug={slug} best={best ? { score: best.score, passed: best.passed } : null} nextHref={next ? `/cursos/${slug}/${next.id}` : `/cursos/${slug}`} />
          ) : (
            <p className="text-muted-foreground">Este quiz aún no tiene preguntas.</p>
          )
        ) : (
          <LessonPlayer lesson={{ id: lesson.id, type: lesson.type, content: lesson.content, blobUrl: lesson.blobUrl, xpReward: lesson.xpReward }} slug={slug} isDone={isDone} nextHref={next ? `/cursos/${slug}/${next.id}` : `/cursos/${slug}`} />
        )}

        {material.length > 0 && (
          <div className="rounded-[1.5rem] border bg-card p-4">
            <ResourceList compact title="Material de esta lección" items={material.map((r) => ({ id: r.id, kind: r.kind, title: r.title, description: r.description, url: r.url, sizeBytes: r.sizeBytes }))} />
          </div>
        )}

        <div className="flex items-center justify-between border-t pt-4">
          {prev ? (
            <Button variant="ghost" render={<Link href={`/cursos/${slug}/${prev.id}`} />}><ArrowLeft className="size-4" />Anterior</Button>
          ) : <span />}
          {next ? (
            <Button variant="ghost" render={<Link href={`/cursos/${slug}/${next.id}`} />}>Siguiente<ArrowRight className="size-4" /></Button>
          ) : (
            <Button variant="ghost" render={<Link href={`/cursos/${slug}`} />}>Volver al curso</Button>
          )}
        </div>
      </div>

      <aside className="hidden lg:block">
        <LessonRail
          slug={slug}
          currentId={lesson.id}
          doneCount={done.size}
          total={all.length}
          modules={course.modules.map((m) => ({
            id: m.id,
            title: m.title,
            lessons: m.lessons.map((l) => ({ id: l.id, title: l.title, type: l.type, durationSec: l.durationSec, done: done.has(l.id) })),
          }))}
        />
      </aside>
    </div>
  );
}
