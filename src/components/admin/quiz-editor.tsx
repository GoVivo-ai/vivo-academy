"use client";

import { useEffect, useState, useTransition } from "react";
import { toast } from "sonner";
import { Check, Loader2, Plus, Save, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { getQuizForEditor, saveQuizAction, type QuestionInput } from "@/app/(app)/admin/actions";
import { cn } from "@/lib/utils";

const typeLabel = { multiple: "Opción múltiple", truefalse: "Verdadero / Falso", order: "Ordenar", short: "Respuesta corta" } as const;

const blank = (type: QuestionInput["type"] = "multiple"): QuestionInput => ({
  type,
  prompt: "",
  explanation: "",
  accepted: [],
  options: type === "truefalse" ? [{ text: "Verdadero", correct: true }] : type === "short" ? [] : [{ text: "", correct: true }, { text: "", correct: false }, { text: "", correct: false }],
});

export function QuizEditor({ lessonId, courseId, onSaved }: { lessonId: string; courseId: string; onSaved: () => void }) {
  const [data, setData] = useState<{ title: string; passScore: number; shuffle: boolean; questions: QuestionInput[] } | null>(null);
  const [pending, start] = useTransition();

  useEffect(() => {
    getQuizForEditor(lessonId).then((q) => setData(q ?? { title: "Quiz", passScore: 70, shuffle: true, questions: [blank()] }));
  }, [lessonId]);

  if (!data) return <div className="flex justify-center p-10"><Loader2 className="size-6 animate-spin" /></div>;

  const setQ = (i: number, patch: Partial<QuestionInput>) => setData({ ...data, questions: data.questions.map((q, j) => (j === i ? { ...q, ...patch } : q)) });
  const move = (i: number, d: -1 | 1) => {
    const qs = [...data.questions];
    const j = i + d;
    if (j < 0 || j >= qs.length) return;
    [qs[i], qs[j]] = [qs[j], qs[i]];
    setData({ ...data, questions: qs });
  };

  const save = () =>
    start(async () => {
      await saveQuizAction(lessonId, courseId, data);
      toast.success("Quiz guardado");
      onSaved();
    });

  return (
    <div className="space-y-5">
      <div className="grid gap-3 sm:grid-cols-3">
        <div className="sm:col-span-2"><Label>Título del quiz</Label><Input value={data.title} onChange={(e) => setData({ ...data, title: e.target.value })} /></div>
        <div><Label>Puntaje para aprobar (%)</Label><Input type="number" min={1} max={100} value={data.passScore} onChange={(e) => setData({ ...data, passScore: Number(e.target.value) })} /></div>
        <div className="flex items-center gap-2 sm:col-span-3"><Switch checked={data.shuffle} onCheckedChange={(v) => setData({ ...data, shuffle: v })} /><Label>Mezclar el orden de las opciones</Label></div>
      </div>

      <div className="space-y-4">
        {data.questions.map((q, i) => (
          <div key={i} className="rounded-2xl border p-4">
            <div className="mb-3 flex items-center gap-2">
              <span className="grid size-7 place-items-center rounded-lg bg-primary/10 text-sm font-bold text-primary">{i + 1}</span>
              <select value={q.type} onChange={(e) => setQ(i, { ...blank(e.target.value as QuestionInput["type"]), prompt: q.prompt, explanation: q.explanation })} className="h-8 rounded-lg border bg-background px-2 text-sm">
                {Object.entries(typeLabel).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
              </select>
              <span className="ml-auto flex gap-0.5">
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, -1)}><ChevronUp className="size-4" /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => move(i, 1)}><ChevronDown className="size-4" /></Button>
                <Button size="icon-sm" variant="ghost" onClick={() => setData({ ...data, questions: data.questions.filter((_, j) => j !== i) })}><Trash2 className="size-4 text-destructive" /></Button>
              </span>
            </div>
            <Input value={q.prompt} onChange={(e) => setQ(i, { prompt: e.target.value })} placeholder="Escribe la pregunta…" className="mb-3" />

            {(q.type === "multiple") && (
              <div className="space-y-2">
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <button type="button" title="Marcar como correcta" onClick={() => setQ(i, { options: q.options.map((x, k) => ({ ...x, correct: k === oi })) })} className={cn("grid size-8 shrink-0 place-items-center rounded-lg border", o.correct ? "border-brand-green bg-brand-green text-brand-navy" : "text-muted-foreground")}><Check className="size-4" /></button>
                    <Input value={o.text} onChange={(e) => setQ(i, { options: q.options.map((x, k) => (k === oi ? { ...x, text: e.target.value } : x)) })} placeholder={`Opción ${oi + 1}`} />
                    {q.options.length > 2 && <Button size="icon-sm" variant="ghost" onClick={() => setQ(i, { options: q.options.filter((_, k) => k !== oi) })}><Trash2 className="size-4" /></Button>}
                  </div>
                ))}
                {q.options.length < 6 && <Button size="sm" variant="ghost" onClick={() => setQ(i, { options: [...q.options, { text: "", correct: false }] })}><Plus className="size-4" />Opción</Button>}
              </div>
            )}
            {q.type === "truefalse" && (
              <div className="flex gap-2">
                {[true, false].map((v) => (
                  <button key={String(v)} type="button" onClick={() => setQ(i, { options: [{ text: "Verdadero", correct: v }] })} className={cn("flex-1 rounded-xl border-2 p-3 text-sm font-medium", (q.options[0]?.correct ?? true) === v ? "border-brand-green bg-brand-green/10" : "")}>La respuesta correcta es {v ? "Verdadero" : "Falso"}</button>
                ))}
              </div>
            )}
            {q.type === "order" && (
              <div className="space-y-2">
                <p className="text-xs text-muted-foreground">Escribe los elementos en el orden correcto. Se mostrarán mezclados.</p>
                {q.options.map((o, oi) => (
                  <div key={oi} className="flex items-center gap-2">
                    <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-muted text-sm font-bold">{oi + 1}</span>
                    <Input value={o.text} onChange={(e) => setQ(i, { options: q.options.map((x, k) => (k === oi ? { ...x, text: e.target.value, correct: true } : x)) })} placeholder={`Paso ${oi + 1}`} />
                    {q.options.length > 2 && <Button size="icon-sm" variant="ghost" onClick={() => setQ(i, { options: q.options.filter((_, k) => k !== oi) })}><Trash2 className="size-4" /></Button>}
                  </div>
                ))}
                {q.options.length < 8 && <Button size="sm" variant="ghost" onClick={() => setQ(i, { options: [...q.options, { text: "", correct: true }] })}><Plus className="size-4" />Elemento</Button>}
              </div>
            )}
            {q.type === "short" && (
              <div>
                <Label>Respuestas aceptadas (separadas por coma, sin distinguir mayúsculas ni tildes)</Label>
                <Input value={q.accepted.join(", ")} onChange={(e) => setQ(i, { accepted: e.target.value.split(",").map((s) => s.trim()) })} placeholder="academia, la academia" />
              </div>
            )}
            <div className="mt-3"><Input value={q.explanation} onChange={(e) => setQ(i, { explanation: e.target.value })} placeholder="Explicación que verá el estudiante (opcional)" className="text-sm" /></div>
          </div>
        ))}
      </div>

      <div className="flex flex-wrap justify-between gap-2">
        <Button variant="outline" onClick={() => setData({ ...data, questions: [...data.questions, blank()] })}><Plus className="size-4" />Agregar pregunta</Button>
        <Button onClick={save} disabled={pending}>{pending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}Guardar quiz</Button>
      </div>
    </div>
  );
}
