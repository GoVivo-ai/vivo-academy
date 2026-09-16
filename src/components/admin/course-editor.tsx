"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { DndContext, closestCenter, PointerSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { ChevronLeft, GripVertical, Plus, Trash2, Pencil, Save, Eye, FileText, Video, Link2, HelpCircle, Loader2, ImageIcon, ExternalLink, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { RichEditor } from "./rich-editor";
import { QuizEditor } from "./quiz-editor";
import { ResourcesEditor } from "./resources-editor";
import type { Course, Lesson, Module } from "@/db/schema";
import { addLessonAction, addModuleAction, deleteCourseAction, deleteLessonAction, deleteModuleAction, renameModuleAction, reorderLessonsAction, reorderModulesAction, updateCourseAction, updateLessonAction, type LessonInput } from "@/app/(app)/admin/actions";
import { cn } from "@/lib/utils";

type ResourceRow = { id: string; kind: "pdf" | "doc" | "sheet" | "slide" | "image" | "video" | "zip" | "link"; title: string; description: string; url: string; sizeBytes: number | null; lessonId: string | null };
type CourseWithContent = Course & { modules: Array<Module & { lessons: Lesson[] }>; resources: ResourceRow[] };
const typeIcon = { video: Video, text: FileText, pdf: FileText, embed: Link2, quiz: HelpCircle } as const;
const typeLabel = { video: "Video", text: "Texto", pdf: "PDF", embed: "Enlace/Embed", quiz: "Quiz" } as const;

export function CourseEditor({ course }: { course: CourseWithContent }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [meta, setMeta] = useState({ title: course.title, description: course.description, category: course.category, level: course.level, estimatedMinutes: course.estimatedMinutes, cover: course.cover, published: course.published });
  const [lessonDialog, setLessonDialog] = useState<{ moduleId: string; lesson?: Lesson } | null>(null);
  const [quizDialog, setQuizDialog] = useState<Lesson | null>(null);
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const save = () =>
    start(async () => {
      await updateCourseAction(course.id, meta);
      toast.success("Curso guardado");
      router.refresh();
    });

  const uploadCover = async (f: File) => {
    const id = toast.loading("Subiendo portada…");
    try {
      const b = await upload(`covers/${f.name}`, f, { access: "public", handleUploadUrl: "/api/upload" });
      setMeta({ ...meta, cover: b.url });
      toast.success("Portada lista. Recuerda guardar.", { id });
    } catch (e) {
      toast.error((e as Error).message, { id });
    }
  };

  const onModuleDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = course.modules.map((m) => m.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    start(async () => {
      await reorderModulesAction(course.id, next);
      router.refresh();
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <Link href="/admin/cursos" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"><ChevronLeft className="size-4" />Cursos</Link>
        <div className="flex items-center gap-2">
          <Button variant="outline" render={<Link href={`/cursos/${course.slug}`} target="_blank" />}><Eye className="size-4" />Vista previa</Button>
          <Button onClick={save} disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Guardar</Button>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        {/* Contenido */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <h2 className="mb-3 font-semibold">Información del curso</h2>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><Label>Título</Label><Input value={meta.title} onChange={(e) => setMeta({ ...meta, title: e.target.value })} /></div>
              <div className="sm:col-span-2"><Label>Descripción</Label><Textarea rows={3} value={meta.description} onChange={(e) => setMeta({ ...meta, description: e.target.value })} /></div>
              <div><Label>Área / categoría</Label><Input value={meta.category} onChange={(e) => setMeta({ ...meta, category: e.target.value })} placeholder="Ventas, Servicio, Cultura…" /></div>
              <div><Label>Nivel</Label>
                <select value={meta.level} onChange={(e) => setMeta({ ...meta, level: e.target.value as typeof meta.level })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm">
                  <option value="basico">Básico</option><option value="intermedio">Intermedio</option><option value="avanzado">Avanzado</option>
                </select>
              </div>
              <div><Label>Duración estimada (min)</Label><Input type="number" min={1} value={meta.estimatedMinutes} onChange={(e) => setMeta({ ...meta, estimatedMinutes: Number(e.target.value) })} /></div>
              <div className="flex items-center gap-3 pt-5"><Switch checked={meta.published} onCheckedChange={(v) => setMeta({ ...meta, published: v })} /><Label>Publicado</Label></div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h2 className="font-semibold">Módulos y lecciones</h2>
              <form action={(fd) => start(async () => { await addModuleAction(course.id, String(fd.get("title") ?? "")); router.refresh(); })} className="flex gap-2">
                <Input name="title" placeholder="Nuevo módulo" className="h-8 w-44" />
                <Button type="submit" size="sm" variant="outline"><Plus className="size-4" />Módulo</Button>
              </form>
            </div>
            <DndContext id={`modules-${course.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onModuleDragEnd}>
              <SortableContext items={course.modules.map((m) => m.id)} strategy={verticalListSortingStrategy}>
                {course.modules.map((m, mi) => (
                  <ModuleCard key={m.id} module={m} index={mi} courseId={course.id} onAddLesson={() => setLessonDialog({ moduleId: m.id })} onEditLesson={(l) => setLessonDialog({ moduleId: m.id, lesson: l })} onEditQuiz={(l) => setQuizDialog(l)} />
                ))}
              </SortableContext>
            </DndContext>
            {course.modules.length === 0 && <p className="rounded-2xl border border-dashed p-6 text-center text-sm text-muted-foreground">Agrega un módulo para empezar.</p>}
          </div>
        </div>

        {/* Lateral */}
        <div className="space-y-4">
          <div className="rounded-2xl border bg-card p-5">
            <h3 className="mb-2 font-semibold">Portada</h3>
            <div className="aspect-video overflow-hidden rounded-xl bg-gradient-to-br from-brand-green to-brand-yellow">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              {meta.cover && <img src={meta.cover} alt="" className="size-full object-cover" />}
            </div>
            <div className="mt-3 flex gap-2">
              <label className="flex cursor-pointer items-center gap-1 rounded-lg border px-3 py-1.5 text-sm hover:bg-muted"><ImageIcon className="size-4" />Subir<input type="file" accept="image/*" className="hidden" onChange={(e) => e.target.files?.[0] && uploadCover(e.target.files[0])} /></label>
              <Input placeholder="o pega una URL" value={meta.cover ?? ""} onChange={(e) => setMeta({ ...meta, cover: e.target.value || null })} className="h-8" />
            </div>
          </div>
          <div className="rounded-2xl border bg-card p-5 text-sm">
            <h3 className="mb-2 font-semibold">Resumen</h3>
            <p>{course.modules.length} módulos · {course.modules.reduce((s, m) => s + m.lessons.length, 0)} lecciones</p>
            <p className="text-muted-foreground">Slug: <code>{course.slug}</code></p>
            <Badge className="mt-2" variant={course.published ? "default" : "secondary"}>{course.published ? "Publicado" : "Borrador"}</Badge>
          </div>
          <ResourcesEditor courseId={course.id} items={course.resources} lessons={course.modules.flatMap((m) => m.lessons).map((l) => ({ id: l.id, title: l.title }))} />
          <Button variant="destructive" className="w-full" onClick={() => confirm("¿Eliminar este curso y todo su contenido?") && start(() => deleteCourseAction(course.id))}><Trash2 className="size-4" />Eliminar curso</Button>
        </div>
      </div>

      {lessonDialog && <LessonDialog courseId={course.id} moduleId={lessonDialog.moduleId} lesson={lessonDialog.lesson} onClose={() => { setLessonDialog(null); router.refresh(); }} onOpenQuiz={(l) => { setLessonDialog(null); setQuizDialog(l); }} />}
      {quizDialog && <Dialog open onOpenChange={(o) => !o && setQuizDialog(null)}><DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>Quiz: {quizDialog.title}</DialogTitle></DialogHeader><QuizEditor lessonId={quizDialog.id} courseId={course.id} onSaved={() => { setQuizDialog(null); router.refresh(); }} /></DialogContent></Dialog>}
    </div>
  );
}

function ModuleCard({ module: m, index, courseId, onAddLesson, onEditLesson, onEditQuiz }: { module: Module & { lessons: Lesson[] }; index: number; courseId: string; onAddLesson: () => void; onEditLesson: (l: Lesson) => void; onEditQuiz: (l: Lesson) => void }) {
  const router = useRouter();
  const [, start] = useTransition();
  const [title, setTitle] = useState(m.title);
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: m.id });
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 6 } }));

  const onLessonDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const ids = m.lessons.map((l) => l.id);
    const next = arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id)));
    start(async () => { await reorderLessonsAction(courseId, m.id, next); router.refresh(); });
  };

  return (
    <div ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="overflow-hidden rounded-2xl border bg-card">
      <div className="flex items-center gap-2 border-b bg-muted/40 px-3 py-2">
        <button {...attributes} {...listeners} className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"><GripVertical className="size-4" /></button>
        <span className="grid size-6 place-items-center rounded-md bg-primary/10 text-xs font-bold text-primary">{index + 1}</span>
        <input value={title} onChange={(e) => setTitle(e.target.value)} onBlur={() => title !== m.title && start(() => renameModuleAction(m.id, title))} className="flex-1 bg-transparent font-medium outline-none" />
        <Button size="sm" variant="ghost" onClick={onAddLesson}><Plus className="size-4" />Lección</Button>
        <Button size="sm" variant="ghost" onClick={() => confirm("¿Eliminar módulo y sus lecciones?") && start(async () => { await deleteModuleAction(m.id, courseId); router.refresh(); })}><Trash2 className="size-4 text-destructive" /></Button>
      </div>
      <DndContext id={`lessons-${m.id}`} sensors={sensors} collisionDetection={closestCenter} onDragEnd={onLessonDragEnd}>
        <SortableContext items={m.lessons.map((l) => l.id)} strategy={verticalListSortingStrategy}>
          <ul className="divide-y">
            {m.lessons.map((l) => <LessonRow key={l.id} lesson={l} courseId={courseId} onEdit={() => onEditLesson(l)} onEditQuiz={() => onEditQuiz(l)} />)}
            {m.lessons.length === 0 && <li className="px-4 py-3 text-sm text-muted-foreground">Sin lecciones todavía.</li>}
          </ul>
        </SortableContext>
      </DndContext>
    </div>
  );
}

function LessonRow({ lesson: l, courseId, onEdit, onEditQuiz }: { lesson: Lesson; courseId: string; onEdit: () => void; onEditQuiz: () => void }) {
  const router = useRouter();
  const [, start] = useTransition();
  const { attributes, listeners, setNodeRef, transform, transition } = useSortable({ id: l.id });
  const Icon = typeIcon[l.type];
  return (
    <li ref={setNodeRef} style={{ transform: CSS.Transform.toString(transform), transition }} className="flex items-center gap-2 bg-card px-3 py-2 text-sm">
      <button {...attributes} {...listeners} className="cursor-grab touch-none rounded p-1 text-muted-foreground hover:bg-muted"><GripVertical className="size-4" /></button>
      <Icon className="size-4 text-muted-foreground" />
      <span className="flex-1 truncate">{l.title}</span>
      <Badge variant="outline" className="text-xs">{typeLabel[l.type]}</Badge>
      <span className="text-xs text-muted-foreground">+{l.xpReward} XP</span>
      {l.type === "quiz" && <Button size="sm" variant="outline" onClick={onEditQuiz}><HelpCircle className="size-4" />Preguntas</Button>}
      <Button size="icon-sm" variant="ghost" onClick={onEdit}><Pencil className="size-4" /></Button>
      <Button size="icon-sm" variant="ghost" onClick={() => confirm("¿Eliminar lección?") && start(async () => { await deleteLessonAction(l.id, courseId); router.refresh(); })}><Trash2 className="size-4 text-destructive" /></Button>
    </li>
  );
}

function LessonDialog({ courseId, moduleId, lesson, onClose, onOpenQuiz }: { courseId: string; moduleId: string; lesson?: Lesson; onClose: () => void; onOpenQuiz: (l: Lesson) => void }) {
  const [form, setForm] = useState<LessonInput>({
    type: lesson?.type ?? "text",
    title: lesson?.title ?? "",
    content: lesson?.content ?? "",
    blobUrl: lesson?.blobUrl ?? null,
    durationSec: lesson?.durationSec ?? 300,
    xpReward: lesson?.xpReward ?? 10,
  });
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState<number | null>(null);

  const doUpload = async (f: File) => {
    setUploading(0);
    try {
      const b = await upload(`${form.type === "video" ? "videos" : "docs"}/${f.name}`, f, {
        access: "public",
        handleUploadUrl: "/api/upload",
        multipart: f.size > 20 * 1024 * 1024,
        onUploadProgress: (p) => setUploading(p.percentage),
      });
      setForm((x) => ({ ...x, blobUrl: b.url }));
      toast.success("Archivo subido");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const submit = () =>
    start(async () => {
      if (!form.title.trim()) {
        toast.error("Escribe un título");
        return;
      }
      if (lesson) {
        await updateLessonAction(lesson.id, courseId, form);
        toast.success("Lección actualizada");
        onClose();
      } else {
        const id = await addLessonAction(moduleId, courseId, form);
        toast.success("Lección creada");
        if (form.type === "quiz") onOpenQuiz({ ...form, id, moduleId, order: 0 } as Lesson);
        else onClose();
      }
    });

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader><DialogTitle>{lesson ? "Editar lección" : "Nueva lección"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div className="grid grid-cols-5 gap-2">
            {(Object.keys(typeLabel) as Array<keyof typeof typeLabel>).map((t) => {
              const I = typeIcon[t];
              return (
                <button key={t} type="button" onClick={() => setForm({ ...form, type: t, xpReward: t === "quiz" ? 25 : form.xpReward })} className={cn("flex flex-col items-center gap-1 rounded-xl border-2 p-3 text-xs font-medium", form.type === t ? "border-primary bg-primary/5 text-primary" : "hover:bg-muted")}>
                  <I className="size-5" />{typeLabel[t]}
                </button>
              );
            })}
          </div>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="sm:col-span-3"><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus /></div>
            <div><Label>Duración (min)</Label><Input type="number" min={1} value={Math.round(form.durationSec / 60)} onChange={(e) => setForm({ ...form, durationSec: Number(e.target.value) * 60 })} /></div>
            <div><Label>XP al completar</Label><Input type="number" min={0} value={form.xpReward} onChange={(e) => setForm({ ...form, xpReward: Number(e.target.value) })} /></div>
          </div>

          {(form.type === "video" || form.type === "pdf") && (
            <div className="rounded-xl border border-dashed p-4">
              <Label>{form.type === "video" ? "Archivo de video (mp4, webm, mov)" : "Archivo PDF"}</Label>
              <div className="mt-2 flex flex-wrap items-center gap-3">
                <label className="flex cursor-pointer items-center gap-2 rounded-lg bg-primary px-3 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90">
                  {uploading !== null ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}
                  {uploading !== null ? `Subiendo ${Math.round(uploading)}%` : "Elegir archivo"}
                  <input type="file" accept={form.type === "video" ? "video/*" : "application/pdf"} className="hidden" onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])} disabled={uploading !== null} />
                </label>
                {form.blobUrl && <a href={form.blobUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 text-sm text-primary hover:underline"><Check className="size-4 text-brand-green-600" />Archivo listo<ExternalLink className="size-3.5" /></a>}
              </div>
              {uploading !== null && <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted"><div className="h-full bg-primary transition-all" style={{ width: `${uploading}%` }} /></div>}
            </div>
          )}
          {form.type === "embed" && (
            <div><Label>URL del video (YouTube, Loom, Vimeo) o página</Label><Input value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} placeholder="https://www.youtube.com/watch?v=…" /></div>
          )}
          {form.type === "text" && (
            <div><Label>Contenido</Label><div className="mt-1"><RichEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} /></div></div>
          )}
          {(form.type === "video" || form.type === "pdf") && (
            <div><Label>Notas o descripción (opcional)</Label><div className="mt-1"><RichEditor value={form.content} onChange={(html) => setForm({ ...form, content: html })} /></div></div>
          )}
          {form.type === "quiz" && <p className="rounded-xl bg-muted p-3 text-sm text-muted-foreground">Guarda la lección y luego agrega las preguntas con el botón <strong>Preguntas</strong>.</p>}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button onClick={submit} disabled={pending || uploading !== null}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Guardar lección</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
