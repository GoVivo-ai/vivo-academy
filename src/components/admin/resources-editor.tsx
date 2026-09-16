"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { upload } from "@vercel/blob/client";
import { Loader2, Plus, Trash2, UploadCloud, Link2, Paperclip, ExternalLink } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addResourceAction, deleteResourceAction, type ResourceInput } from "@/app/(app)/admin/actions";
import { fmtSize } from "@/components/courses/resource-list";
import { cn } from "@/lib/utils";

type Kind = ResourceInput["kind"];
type Row = { id: string; kind: Kind; title: string; description: string; url: string; sizeBytes: number | null; lessonId: string | null };

const KIND_LABEL: Record<Kind, string> = { pdf: "PDF", doc: "Documento", sheet: "Hoja de cálculo", slide: "Presentación", image: "Imagen", video: "Video", zip: "Archivo comprimido", link: "Enlace" };

/** Deduce el tipo a partir de la extensión o del tipo MIME. */
function kindFromFile(f: File): Kind {
  const n = f.name.toLowerCase();
  if (n.endsWith(".pdf")) return "pdf";
  if (/\.(docx?|rtf|txt)$/.test(n)) return "doc";
  if (/\.(xlsx?|csv)$/.test(n)) return "sheet";
  if (/\.(pptx?)$/.test(n)) return "slide";
  if (/\.(png|jpe?g|webp|gif|svg)$/.test(n)) return "image";
  if (/\.(mp4|webm|mov)$/.test(n)) return "video";
  if (/\.(zip|rar|7z)$/.test(n)) return "zip";
  return "doc";
}

export function ResourcesEditor({ courseId, items, lessons }: { courseId: string; items: Row[]; lessons: Array<{ id: string; title: string }> }) {
  const router = useRouter();
  const [pending, start] = useTransition();
  const [uploading, setUploading] = useState<number | null>(null);
  const [draft, setDraft] = useState<ResourceInput>({ kind: "link", title: "", description: "", url: "", sizeBytes: null, lessonId: null });
  const [mode, setMode] = useState<"file" | "link">("file");

  const lessonName = (id: string | null) => (id ? lessons.find((l) => l.id === id)?.title ?? "Lección eliminada" : null);

  const doUpload = async (f: File) => {
    setUploading(0);
    try {
      const b = await upload(`material/${f.name}`, f, {
        access: "public",
        handleUploadUrl: "/api/upload",
        multipart: f.size > 20 * 1024 * 1024,
        onUploadProgress: (p) => setUploading(p.percentage),
      });
      setDraft((d) => ({ ...d, url: b.url, kind: kindFromFile(f), title: d.title || f.name.replace(/\.[^.]+$/, ""), sizeBytes: f.size }));
      toast.success("Archivo subido. Ponle nombre y agrégalo.");
    } catch (e) {
      toast.error((e as Error).message);
    } finally {
      setUploading(null);
    }
  };

  const add = () =>
    start(async () => {
      if (!draft.url.trim()) {
        toast.error("Sube un archivo o pega un enlace");
        return;
      }
      if (!draft.title.trim()) {
        toast.error("Ponle un nombre al material");
        return;
      }
      await addResourceAction(courseId, { ...draft, title: draft.title.trim(), description: draft.description.trim() });
      setDraft({ kind: mode === "link" ? "link" : "pdf", title: "", description: "", url: "", sizeBytes: null, lessonId: null });
      toast.success("Material agregado");
      router.refresh();
    });

  const remove = (id: string) =>
    start(async () => {
      await deleteResourceAction(id, courseId);
      toast.success("Material eliminado");
      router.refresh();
    });

  return (
    <div className="rounded-2xl border bg-card p-5">
      <h2 className="mb-1 flex items-center gap-2 font-heading font-bold"><Paperclip className="size-4 text-brand-green-600" />Material de apoyo</h2>
      <p className="mb-4 text-sm text-muted-foreground">Guías, plantillas, presentaciones o enlaces. Aparecen al final del curso y, si eliges una lección, también dentro de ella.</p>

      {items.length > 0 && (
        <ul className="mb-4 space-y-2">
          {items.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-xl border px-3 py-2 text-sm">
              <span className="rounded-lg bg-muted px-2 py-0.5 text-[11px] font-bold text-muted-foreground">{KIND_LABEL[r.kind]}</span>
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold">{r.title}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {[fmtSize(r.sizeBytes), lessonName(r.lessonId), r.description].filter(Boolean).join(" · ") || "Curso completo"}
                </p>
              </div>
              <a href={r.url} target="_blank" rel="noreferrer" className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted" title="Abrir"><ExternalLink className="size-4" /></a>
              <Button size="icon-sm" variant="ghost" disabled={pending} onClick={() => confirm("¿Eliminar este material?") && remove(r.id)}><Trash2 className="size-4 text-destructive" /></Button>
            </li>
          ))}
        </ul>
      )}

      <div className="rounded-2xl border border-dashed p-4">
        <div className="mb-3 grid grid-cols-2 gap-1 rounded-full bg-muted p-1">
          {(["file", "link"] as const).map((m) => (
            <button key={m} onClick={() => { setMode(m); setDraft((d) => ({ ...d, url: "", sizeBytes: null, kind: m === "link" ? "link" : "pdf" })); }} className={cn("flex items-center justify-center gap-1.5 rounded-full py-1.5 text-sm font-bold transition", mode === m ? "bg-card shadow-sm" : "text-muted-foreground")}>
              {m === "file" ? <><UploadCloud className="size-4" />Subir archivo</> : <><Link2 className="size-4" />Enlace externo</>}
            </button>
          ))}
        </div>

        {mode === "file" ? (
          <div className="flex flex-wrap items-center gap-3">
            <label className="flex cursor-pointer items-center gap-2 rounded-full bg-primary px-4 py-2 text-sm font-bold text-primary-foreground hover:bg-primary/90">
              {uploading !== null ? <Loader2 className="size-4 animate-spin" /> : <UploadCloud className="size-4" />}
              {uploading !== null ? `Subiendo ${Math.round(uploading)}%` : "Elegir archivo"}
              <input type="file" className="hidden" disabled={uploading !== null} accept=".pdf,.doc,.docx,.xls,.xlsx,.csv,.ppt,.pptx,.txt,.zip,.png,.jpg,.jpeg,.webp,.mp4" onChange={(e) => e.target.files?.[0] && doUpload(e.target.files[0])} />
            </label>
            {draft.url && <span className="text-sm font-semibold text-brand-green-600">Archivo listo{draft.sizeBytes ? ` · ${fmtSize(draft.sizeBytes)}` : ""}</span>}
          </div>
        ) : (
          <div>
            <Label>URL</Label>
            <Input value={draft.url} onChange={(e) => setDraft({ ...draft, url: e.target.value, kind: "link" })} placeholder="https://…" />
          </div>
        )}

        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div>
            <Label>Nombre</Label>
            <Input value={draft.title} onChange={(e) => setDraft({ ...draft, title: e.target.value })} placeholder="Plantilla de prompts" />
          </div>
          <div>
            <Label>Nota corta (opcional)</Label>
            <Input value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="Imprímela y tenla a mano" />
          </div>
          <div>
            <Label>Tipo</Label>
            <select value={draft.kind} onChange={(e) => setDraft({ ...draft, kind: e.target.value as Kind })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm">
              {(Object.keys(KIND_LABEL) as Kind[]).map((k) => <option key={k} value={k}>{KIND_LABEL[k]}</option>)}
            </select>
          </div>
          <div>
            <Label>Asociar a una lección (opcional)</Label>
            <select value={draft.lessonId ?? ""} onChange={(e) => setDraft({ ...draft, lessonId: e.target.value || null })} className="mt-1 h-9 w-full rounded-lg border bg-background px-3 text-sm">
              <option value="">Todo el curso</option>
              {lessons.map((l) => <option key={l.id} value={l.id}>{l.title}</option>)}
            </select>
          </div>
        </div>

        <Button onClick={add} disabled={pending || uploading !== null} className="mt-3 w-full rounded-full font-bold">
          {pending ? <Loader2 className="size-4 animate-spin" /> : <Plus className="size-4" />}Agregar material
        </Button>
      </div>
    </div>
  );
}
