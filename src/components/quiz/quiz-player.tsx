"use client";

import { useMemo, useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "motion/react";
import { DndContext, closestCenter, PointerSensor, KeyboardSensor, useSensor, useSensors, type DragEndEvent } from "@dnd-kit/core";
import { SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { ArrowRight, Check, GripVertical, Loader2, RotateCcw, X, Lightbulb } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { celebrate, fireConfetti } from "@/components/gamification/celebrate";
import { FlameIcon, TrophyIcon, BoltIcon } from "@/components/brand/icons";
import { checkAnswerAction, submitQuizAction } from "@/app/(app)/cursos/[slug]/actions";
import type { QuizAnswers, QuizResult } from "@/lib/quiz";
import { cn } from "@/lib/utils";

type PublicQuiz = {
  id: string;
  title: string;
  passScore: number;
  questions: Array<{ id: string; type: "multiple" | "truefalse" | "order" | "short"; prompt: string; options: Array<{ id: string; text: string }> }>;
};
type Feedback = { correct: boolean; correctText: string; explanation: string | null };

const blankAnswers = (quiz: PublicQuiz): QuizAnswers =>
  Object.fromEntries(
    quiz.questions.map((q) => [
      q.id,
      q.type === "order" ? { type: "order", optionIds: q.options.map((o) => o.id) } : q.type === "short" ? { type: "short", text: "" } : { type: q.type, optionId: null },
    ]),
  );

const PRAISE = ["¡Correcto!", "¡Eso es!", "¡Genial!", "¡Imparable!"];

export function QuizPlayer({ quiz, lessonId, slug, best, nextHref }: { quiz: PublicQuiz; lessonId: string; slug: string; best: { score: number; passed: boolean } | null; nextHref: string }) {
  const [i, setI] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswers>(() => blankAnswers(quiz));
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [combo, setCombo] = useState(0);
  const [bestCombo, setBestCombo] = useState(0);
  const [corrects, setCorrects] = useState(0);
  const [result, setResult] = useState<QuizResult | null>(null);
  const [pending, start] = useTransition();
  const router = useRouter();
  const q = quiz.questions[i];
  const isLast = i === quiz.questions.length - 1;

  const answered = useMemo(() => {
    const a = answers[q.id];
    if (!a) return false;
    if (a.type === "short") return a.text.trim().length > 0;
    if (a.type === "order") return true;
    return a.optionId !== null;
  }, [answers, q.id]);

  const check = () =>
    start(async () => {
      const fb = await checkAnswerAction(lessonId, q.id, answers[q.id]);
      setFeedback(fb);
      if (fb.correct) {
        const n = combo + 1;
        setCombo(n);
        setBestCombo((b) => Math.max(b, n));
        setCorrects((c) => c + 1);
        if (n >= 3) fireConfetti(false);
      } else {
        setCombo(0);
      }
    });

  const next = () => {
    setFeedback(null);
    if (!isLast) {
      setI(i + 1);
      return;
    }
    start(async () => {
      const r = await submitQuizAction(lessonId, slug, answers);
      setResult(r);
      celebrate(r);
      router.refresh();
    });
  };

  const reset = () => {
    setResult(null);
    setFeedback(null);
    setI(0);
    setCombo(0);
    setCorrects(0);
    setBestCombo(0);
    setAnswers(blankAnswers(quiz));
  };

  if (result) {
    return (
      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="space-y-6">
        <div className={cn("relative overflow-hidden rounded-[2rem] p-8 text-center text-white", result.passed ? "bg-brand-hero" : "bg-gradient-to-br from-rose-500 to-rose-700")}>
          <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 200, damping: 12, delay: 0.2 }} className="mx-auto grid size-24 place-items-center rounded-full bg-white/15">
            <TrophyIcon size={56} onDark active={result.passed} />
          </motion.div>
          <motion.p initial={{ y: 10, opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ delay: 0.4 }} className="mt-3 font-heading text-6xl font-bold">
            {result.score}%
          </motion.p>
          <p className="mt-1 text-lg">{result.passed ? (result.score === 100 ? "¡Perfecto! 🎯" : "¡Aprobado! 🎉") : `Necesitas ${quiz.passScore}% para aprobar`}</p>
          <div className="mt-4 flex flex-wrap justify-center gap-2 text-sm">
            {result.awarded > 0 && <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-bold"><BoltIcon size={16} />+{result.awarded} XP</span>}
            {bestCombo >= 2 && <span className="flex items-center gap-1 rounded-full bg-white/15 px-3 py-1 font-bold"><FlameIcon size={16} />Mejor combo x{bestCombo}</span>}
          </div>
        </div>

        <div className="space-y-3">
          {quiz.questions.map((qq, n) => {
            const r = result.perQuestion.find((p) => p.questionId === qq.id)!;
            return (
              <div key={qq.id} className={cn("rounded-2xl border p-4", r.correct ? "border-brand-green/60 bg-brand-green/10" : "border-rose-300 bg-rose-50 dark:bg-rose-950/30")}>
                <div className="flex items-start gap-3">
                  <span className={cn("mt-0.5 grid size-6 shrink-0 place-items-center rounded-full", r.correct ? "bg-brand-green text-brand-navy" : "bg-rose-500 text-white")}>
                    {r.correct ? <Check className="size-4" /> : <X className="size-4" />}
                  </span>
                  <div className="space-y-1">
                    <p className="font-semibold">{n + 1}. {qq.prompt}</p>
                    {!r.correct && <p className="text-sm">Respuesta correcta: <strong>{r.correctText}</strong></p>}
                    {r.explanation && <p className="text-sm text-muted-foreground">{r.explanation}</p>}
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div className="flex flex-wrap gap-3">
          <Button variant="outline" onClick={reset} className="gap-2"><RotateCcw className="size-4" />Intentar de nuevo</Button>
          {result.passed && <Button className="gap-2" render={<a href={nextHref} />}>Continuar<ArrowRight className="size-4" /></Button>}
        </div>
      </motion.div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <div className="flex h-3 flex-1 gap-1">
          {quiz.questions.map((qq, n) => (
            <motion.span key={qq.id} className={cn("h-full flex-1 rounded-full", n < i ? "bg-brand-green" : n === i ? "bg-brand-swoosh" : "bg-muted")} initial={false} animate={{ scaleY: n === i ? 1.3 : 1 }} />
          ))}
        </div>
        <span className="text-sm font-bold tabular-nums text-muted-foreground">{i + 1}/{quiz.questions.length}</span>
        <AnimatePresence>
          {combo >= 2 && (
            <motion.span key={combo} initial={{ scale: 0.5, rotate: -10, opacity: 0 }} animate={{ scale: [1.3, 1], rotate: 0, opacity: 1 }} exit={{ scale: 0.5, opacity: 0 }} className="flex items-center gap-1 rounded-full bg-brand-navy px-3 py-1 font-heading text-sm font-bold text-brand-yellow">
              <FlameIcon size={18} />Combo x{combo}
            </motion.span>
          )}
        </AnimatePresence>
      </div>
      {best && <p className="text-xs text-muted-foreground">Tu mejor intento: <strong>{best.score}%</strong>{best.passed ? " · aprobado ✅" : ""}</p>}

      <AnimatePresence mode="wait">
        <motion.div key={q.id} initial={{ opacity: 0, x: 40 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -40 }} transition={{ duration: 0.25 }} className="rounded-[2rem] border bg-card p-6 shadow-sm">
          <p className="font-sans text-xs font-bold uppercase tracking-[0.2em] text-brand-green-600">
            {q.type === "multiple" ? "Opción múltiple" : q.type === "truefalse" ? "Verdadero o falso" : q.type === "order" ? "Ordena los elementos" : "Respuesta corta"}
          </p>
          <h2 className="mt-2 text-2xl font-bold">{q.prompt}</h2>

          <div className="mt-6">
            {(q.type === "multiple" || q.type === "truefalse") && (
              <div className={cn("grid gap-3", q.type === "truefalse" ? "grid-cols-2" : "sm:grid-cols-2")}>
                {q.options.map((o, oi) => {
                  const a = answers[q.id];
                  const sel = a?.type !== "order" && a?.type !== "short" && a?.optionId === o.id;
                  const state = feedback ? (feedback.correctText === o.text ? "right" : sel ? "wrong" : null) : null;
                  return (
                    <motion.button
                      key={o.id}
                      whileTap={feedback ? {} : { scale: 0.97 }}
                      disabled={!!feedback}
                      onClick={() => setAnswers({ ...answers, [q.id]: { type: q.type as "multiple" | "truefalse", optionId: o.id } })}
                      className={cn(
                        "flex items-center gap-3 rounded-2xl border-2 p-4 text-left transition-all",
                        !feedback && "hover:border-brand-green/70 hover:bg-brand-green/5",
                        sel && !feedback && "border-brand-navy bg-brand-navy/5 shadow-md",
                        !sel && !feedback && "border-border",
                        state === "right" && "border-brand-green bg-brand-green/15",
                        state === "wrong" && "border-rose-400 bg-rose-50 dark:bg-rose-950/30",
                        feedback && !state && "opacity-50",
                      )}
                    >
                      <span className={cn("grid size-9 shrink-0 place-items-center rounded-xl font-heading text-sm font-bold", state === "right" ? "bg-brand-green text-brand-navy" : state === "wrong" ? "bg-rose-500 text-white" : sel ? "bg-brand-navy text-white" : "bg-muted")}>
                        {q.type === "truefalse" ? (oi === 0 ? "V" : "F") : String.fromCharCode(65 + oi)}
                      </span>
                      <span className="font-semibold">{o.text}</span>
                    </motion.button>
                  );
                })}
              </div>
            )}

            {q.type === "order" && (
              <OrderList
                disabled={!!feedback}
                items={(answers[q.id] as { optionIds: string[] }).optionIds.map((id) => q.options.find((o) => o.id === id)!)}
                onChange={(ids) => setAnswers({ ...answers, [q.id]: { type: "order", optionIds: ids } })}
              />
            )}

            {q.type === "short" && (
              <Input
                autoFocus
                disabled={!!feedback}
                placeholder="Escribe tu respuesta…"
                value={(answers[q.id] as { text: string }).text}
                onChange={(e) => setAnswers({ ...answers, [q.id]: { type: "short", text: e.target.value } })}
                onKeyDown={(e) => e.key === "Enter" && answered && !feedback && check()}
                className="h-12 rounded-2xl text-lg"
              />
            )}
          </div>
        </motion.div>
      </AnimatePresence>

      <AnimatePresence>
        {feedback && (
          <motion.div initial={{ y: 30, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 30, opacity: 0 }} className={cn("flex flex-wrap items-center gap-4 rounded-[2rem] p-5", feedback.correct ? "bg-brand-green text-brand-navy" : "bg-rose-500 text-white")}>
            <motion.span initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 300, damping: 12 }} className={cn("grid size-12 shrink-0 place-items-center rounded-full", feedback.correct ? "bg-brand-navy text-brand-green" : "bg-white text-rose-500")}>
              {feedback.correct ? <Check className="size-7" strokeWidth={3} /> : <X className="size-7" strokeWidth={3} />}
            </motion.span>
            <div className="min-w-0 flex-1">
              <p className="font-heading text-xl font-bold">{feedback.correct ? (PRAISE[Math.min(PRAISE.length - 1, Math.max(0, combo - 1))] ?? "¡Correcto!") : "Casi…"}</p>
              {!feedback.correct && <p className="text-sm">Respuesta correcta: <strong>{feedback.correctText}</strong></p>}
              {feedback.explanation && <p className="mt-0.5 flex items-start gap-1 text-sm opacity-90"><Lightbulb className="mt-0.5 size-4 shrink-0" />{feedback.explanation}</p>}
            </div>
            <Button onClick={next} disabled={pending} className={cn("h-11 rounded-full px-6 font-bold", feedback.correct ? "bg-brand-navy text-white hover:bg-brand-navy-700" : "bg-white text-rose-600 hover:bg-white/90")}>
              {pending && <Loader2 className="size-4 animate-spin" />}
              {isLast ? "Ver resultado" : "Continuar"}
              <ArrowRight className="size-4" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>

      {!feedback && (
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">{corrects} correctas hasta ahora</p>
          <Button disabled={!answered || pending} onClick={check} className="h-11 rounded-full px-6 font-bold">
            {pending && <Loader2 className="size-4 animate-spin" />}Comprobar
          </Button>
        </div>
      )}
    </div>
  );
}

function OrderList({ items, onChange, disabled }: { items: Array<{ id: string; text: string }>; onChange: (ids: string[]) => void; disabled?: boolean }) {
  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 4 } }), useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }));
  const ids = items.map((i) => i.id);
  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (over && active.id !== over.id) onChange(arrayMove(ids, ids.indexOf(String(active.id)), ids.indexOf(String(over.id))));
  };
  return (
    <DndContext id="quiz-order" sensors={sensors} collisionDetection={closestCenter} onDragEnd={disabled ? undefined : onDragEnd}>
      <SortableContext items={ids} strategy={verticalListSortingStrategy}>
        <ul className="space-y-2">
          {items.map((it, n) => <SortableItem key={it.id} id={it.id} text={it.text} n={n} disabled={disabled} />)}
        </ul>
      </SortableContext>
      {!disabled && <p className="mt-2 text-xs text-muted-foreground">Arrastra para ordenar.</p>}
    </DndContext>
  );
}

function SortableItem({ id, text, n, disabled }: { id: string; text: string; n: number; disabled?: boolean }) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id, disabled });
  return (
    <li
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={cn("flex items-center gap-3 rounded-2xl border-2 bg-card p-3 touch-none", isDragging && "relative z-10 border-brand-green shadow-lg")}
      {...attributes}
      {...listeners}
    >
      <GripVertical className="size-4 text-muted-foreground" />
      <span className="grid size-8 place-items-center rounded-xl bg-brand-navy font-heading text-sm font-bold text-white">{n + 1}</span>
      <span className="font-semibold">{text}</span>
    </li>
  );
}
