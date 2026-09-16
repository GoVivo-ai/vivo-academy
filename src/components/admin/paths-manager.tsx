"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Plus, Trash2, Pencil, Save, Loader2, Users, ChevronUp, ChevronDown, X, UserPlus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { assignPathToUsersAction, deletePathAction, savePathAction } from "@/app/(app)/admin/actions";
import { cn } from "@/lib/utils";

type Path = { id: string; title: string; description: string; jobRole: string | null; courseIds: string[]; assigned: number };
type CourseOpt = { id: string; title: string };
type Person = { id: string; name: string | null; jobRole: string | null };

export function PathsManager({ paths, courses, people, jobRoles }: { paths: Path[]; courses: CourseOpt[]; people: Person[]; jobRoles: string[] }) {
  const router = useRouter();
  const [editing, setEditing] = useState<Partial<Path> | null>(null);
  const [assigning, setAssigning] = useState<Path | null>(null);
  const [, start] = useTransition();
  const byId = new Map(courses.map((c) => [c.id, c.title]));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div><h1 className="text-2xl font-bold">Rutas de aprendizaje</h1><p className="text-sm text-muted-foreground">Secuencias de cursos que se asignan automáticamente por cargo.</p></div>
        <Button onClick={() => setEditing({ title: "", description: "", jobRole: null, courseIds: [] })}><Plus className="size-4" />Nueva ruta</Button>
      </div>

      {paths.length === 0 ? (
        <p className="rounded-2xl border border-dashed p-10 text-center text-sm text-muted-foreground">Aún no hay rutas. Crea una y asígnale un cargo.</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {paths.map((p) => (
            <div key={p.id} className="rounded-2xl border bg-card p-5">
              <div className="flex items-start justify-between gap-2">
                <div><h3 className="font-semibold">{p.title}</h3><p className="text-sm text-muted-foreground">{p.description}</p></div>
                <div className="flex gap-1">
                  <Button size="icon-sm" variant="ghost" title="Asignar personas" onClick={() => setAssigning(p)}><UserPlus className="size-4" /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => setEditing(p)}><Pencil className="size-4" /></Button>
                  <Button size="icon-sm" variant="ghost" onClick={() => confirm("¿Eliminar ruta?") && start(async () => { await deletePathAction(p.id); router.refresh(); })}><Trash2 className="size-4 text-destructive" /></Button>
                </div>
              </div>
              <div className="mt-3 flex flex-wrap gap-2 text-xs">
                {p.jobRole ? <Badge>Cargo: {p.jobRole}</Badge> : <Badge variant="secondary">Asignación manual</Badge>}
                <Badge variant="outline"><Users className="size-3" />{p.assigned} personas</Badge>
              </div>
              <ol className="mt-3 space-y-1 text-sm">
                {p.courseIds.map((id, i) => <li key={id} className="flex items-center gap-2"><span className="grid size-5 place-items-center rounded-md bg-muted text-xs font-bold">{i + 1}</span>{byId.get(id) ?? "Curso eliminado"}</li>)}
              </ol>
            </div>
          ))}
        </div>
      )}

      {editing && <PathDialog path={editing} courses={courses} jobRoles={jobRoles} onClose={() => { setEditing(null); router.refresh(); }} />}
      {assigning && <AssignDialog path={assigning} people={people} onClose={() => { setAssigning(null); router.refresh(); }} />}
    </div>
  );
}

function PathDialog({ path, courses, jobRoles, onClose }: { path: Partial<Path>; courses: CourseOpt[]; jobRoles: string[]; onClose: () => void }) {
  const [form, setForm] = useState({ title: path.title ?? "", description: path.description ?? "", jobRole: path.jobRole ?? "", courseIds: path.courseIds ?? [] });
  const [pending, start] = useTransition();
  const available = courses.filter((c) => !form.courseIds.includes(c.id));
  const move = (i: number, d: -1 | 1) => { const ids = [...form.courseIds]; const j = i + d; if (j < 0 || j >= ids.length) return; [ids[i], ids[j]] = [ids[j], ids[i]]; setForm({ ...form, courseIds: ids }); };

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
        <DialogHeader><DialogTitle>{path.id ? "Editar ruta" : "Nueva ruta"}</DialogTitle></DialogHeader>
        <div className="space-y-4">
          <div><Label>Título</Label><Input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus /></div>
          <div><Label>Descripción</Label><Textarea rows={2} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Cargo (se asigna automáticamente a quien tenga este cargo)</Label>
            <Input list="jobroles" value={form.jobRole} onChange={(e) => setForm({ ...form, jobRole: e.target.value })} placeholder="Ej: Servicio al cliente (vacío = manual)" />
            <datalist id="jobroles">{jobRoles.map((r) => <option key={r} value={r} />)}</datalist>
          </div>
          <div>
            <Label>Cursos en orden</Label>
            <ol className="mt-1 space-y-1">
              {form.courseIds.map((id, i) => (
                <li key={id} className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-sm">
                  <span className="grid size-6 place-items-center rounded-md bg-muted text-xs font-bold">{i + 1}</span>
                  <span className="flex-1">{courses.find((c) => c.id === id)?.title}</span>
                  <Button size="icon-xs" variant="ghost" onClick={() => move(i, -1)}><ChevronUp className="size-3.5" /></Button>
                  <Button size="icon-xs" variant="ghost" onClick={() => move(i, 1)}><ChevronDown className="size-3.5" /></Button>
                  <Button size="icon-xs" variant="ghost" onClick={() => setForm({ ...form, courseIds: form.courseIds.filter((x) => x !== id) })}><X className="size-3.5" /></Button>
                </li>
              ))}
            </ol>
            {available.length > 0 && (
              <select className="mt-2 h-9 w-full rounded-lg border bg-background px-3 text-sm" value="" onChange={(e) => e.target.value && setForm({ ...form, courseIds: [...form.courseIds, e.target.value] })}>
                <option value="">+ Agregar curso…</option>
                {available.map((c) => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            )}
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={onClose}>Cancelar</Button>
            <Button disabled={pending || !form.title.trim()} onClick={() => start(async () => { await savePathAction({ id: path.id, title: form.title, description: form.description, jobRole: form.jobRole.trim() || null, courseIds: form.courseIds }); toast.success("Ruta guardada"); onClose(); })}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Guardar</Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function AssignDialog({ path, people, onClose }: { path: Path; people: Person[]; onClose: () => void }) {
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [q, setQ] = useState("");
  const [pending, start] = useTransition();
  const list = people.filter((p) => (p.name ?? "").toLowerCase().includes(q.toLowerCase()));
  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent>
        <DialogHeader><DialogTitle>Asignar “{path.title}”</DialogTitle></DialogHeader>
        <Input placeholder="Buscar persona…" value={q} onChange={(e) => setQ(e.target.value)} />
        <ul className="max-h-72 space-y-1 overflow-y-auto">
          {list.map((p) => (
            <li key={p.id}>
              <label className={cn("flex cursor-pointer items-center gap-3 rounded-lg px-2 py-1.5 text-sm hover:bg-muted", sel.has(p.id) && "bg-primary/10")}>
                <input type="checkbox" checked={sel.has(p.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(p.id); else n.delete(p.id); setSel(n); }} />
                <span className="flex-1">{p.name}</span><span className="text-xs text-muted-foreground">{p.jobRole}</span>
              </label>
            </li>
          ))}
        </ul>
        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>Cancelar</Button>
          <Button disabled={pending || sel.size === 0} onClick={() => start(async () => { await assignPathToUsersAction(path.id, [...sel]); toast.success(`Ruta asignada a ${sel.size} personas`); onClose(); })}>{pending && <Loader2 className="size-4 animate-spin" />}Asignar ({sel.size})</Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
