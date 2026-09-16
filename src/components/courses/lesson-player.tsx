"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CheckCircle2, Loader2, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { celebrate } from "@/components/gamification/celebrate";
import { completeLessonAction } from "@/app/(app)/cursos/[slug]/actions";

type Lesson = { id: string; type: "video" | "text" | "pdf" | "embed" | "quiz"; content: string; blobUrl: string | null; xpReward: number };

function embedUrl(url: string) {
  try {
    const u = new URL(url);
    if (u.hostname.includes("youtube.com") && u.searchParams.get("v")) return `https://www.youtube.com/embed/${u.searchParams.get("v")}`;
    if (u.hostname === "youtu.be") return `https://www.youtube.com/embed/${u.pathname.slice(1)}`;
    if (u.hostname.includes("loom.com") && u.pathname.startsWith("/share/")) return `https://www.loom.com/embed/${u.pathname.split("/")[2]}`;
    if (u.hostname.includes("vimeo.com")) return `https://player.vimeo.com/video/${u.pathname.split("/").filter(Boolean).pop()}`;
    return url;
  } catch {
    return url;
  }
}

export function LessonPlayer({ lesson, slug, isDone, nextHref }: { lesson: Lesson; slug: string; isDone: boolean; nextHref: string }) {
  const [done, setDone] = useState(isDone);
  const [pending, start] = useTransition();
  const router = useRouter();

  const markDone = () =>
    start(async () => {
      const r = await completeLessonAction(lesson.id, slug);
      setDone(true);
      celebrate(r);
      router.refresh();
    });

  return (
    <div className="space-y-4">
      {lesson.type === "video" && lesson.blobUrl && (
        <video
          src={lesson.blobUrl}
          controls
          playsInline
          className="aspect-video w-full rounded-2xl bg-black"
          onEnded={() => !done && markDone()}
        />
      )}
      {lesson.type === "embed" && (
        <div className="aspect-video w-full overflow-hidden rounded-2xl bg-black">
          <iframe src={embedUrl(lesson.content)} className="size-full" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen title="Video" />
        </div>
      )}
      {lesson.type === "pdf" && lesson.blobUrl && (
        <div className="h-[75vh] w-full overflow-hidden rounded-2xl border">
          <iframe src={lesson.blobUrl} className="size-full" title="PDF" />
        </div>
      )}
      {(lesson.type === "text" || ((lesson.type === "video" || lesson.type === "pdf") && lesson.content)) && (
        <article
          className="prose prose-neutral max-w-none dark:prose-invert prose-headings:font-semibold prose-a:text-primary"
          dangerouslySetInnerHTML={{ __html: lesson.content }}
        />
      )}

      <div className="flex flex-wrap items-center gap-3 rounded-2xl border bg-card p-4">
        {done ? (
          <>
            <CheckCircle2 className="size-5 text-brand-green-600" />
            <span className="font-medium">Lección completada</span>
            <Button className="ml-auto" render={<a href={nextHref} />}>Continuar</Button>
          </>
        ) : (
          <>
            <Zap className="size-5 text-brand-gold" />
            <span className="text-sm text-muted-foreground">Marca esta lección como completada para ganar <strong>+{lesson.xpReward} XP</strong>.</span>
            <Button onClick={markDone} disabled={pending} className="ml-auto gap-2">
              {pending ? <Loader2 className="size-4 animate-spin" /> : <CheckCircle2 className="size-4" />}
              Marcar como completada
            </Button>
          </>
        )}
      </div>
    </div>
  );
}
