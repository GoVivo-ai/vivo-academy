"use client";

import { useEffect, useMemo, useState, useTransition } from "react";
import { motion } from "motion/react";
import { BarChart3, Check, Eye, Play, Plus, Square, Trash2, Trophy, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useLive } from "./live-store";
import { quizPoints, type LivePoll } from "@/lib/live/protocol";
import { savePollResultAction } from "@/app/(app)/en-vivo/actions";
import { cn } from "@/lib/utils";
import { nowMs } from "@/lib/time";

export function PollPanel({ sessionId }: { sessionId: string }) {
  const { state, isHost } = useLive();
  if (!state.poll) return isHost ? <PollCreator /> : <p className="p-6 text-center text-sm text-white/50">El instructor aún no ha lanzado ninguna encuesta.</p>;
  return <PollView sessionId={sessionId} />;
}

function PollCreator() {
  const { send } = useLive();
  const [kind, setKind] = useState<"encuesta" | "quiz">("encuesta");
  const [question, setQuestion] = useState("");
  const [options, setOptions] = useState(["", ""]);
  const [correct, setCorrect] = useState(0);
  const [seconds, setSeconds] = useState(20);
  const valid = question.trim() && options.filter((o) => o.trim()).length >= 2;

  const launch = () => {
    const opts = options.map((o) => o.trim()).filter(Boolean);
    const poll: LivePoll = {
      id: `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`,
      kind,
      question: question.trim(),
      options: opts,
      correctIndex: kind === "quiz" ? Math.min(correct, opts.length - 1) : null,
      seconds: kind === "quiz" ? seconds : 120,
      startedAt: Date.now(),
    };
    void send({ t: "poll_start", poll });
  };

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div className="grid grid-cols-2 gap-1 rounded-xl bg-white/10 p-1">
        {(["encuesta", "quiz"] as const).map((k) => (
          <button key={k} onClick={() => setKind(k)} className={cn("rounded-lg py-1.5 text-sm font-medium capitalize", kind === k ? "bg-white text-black" : "text-white/70")}>{k === "quiz" ? "Quiz (con puntos)" : "Encuesta"}</button>
        ))}
      </div>
      <textarea value={question} onChange={(e) => setQuestion(e.target.value)} placeholder="Escribe la pregunta…" rows={2} className="w-full rounded-xl bg-white/10 p-3 text-sm outline-none placeholder:text-white/40 focus:ring-2 focus:ring-brand-green" />
      <div className="space-y-2">
        {options.map((o, i) => (
          <div key={i} className="flex items-center gap-2">
            {kind === "quiz" && (
              <button onClick={() => setCorrect(i)} title="Marcar como correcta" className={cn("grid size-8 shrink-0 place-items-center rounded-lg", correct === i ? "bg-brand-green text-brand-navy" : "bg-white/10 text-white/40")}><Check className="size-4" /></button>
            )}
            <input value={o} onChange={(e) => setOptions(options.map((x, j) => (j === i ? e.target.value : x)))} placeholder={`Opción ${i + 1}`} className="h-9 flex-1 rounded-lg bg-white/10 px-3 text-sm outline-none placeholder:text-white/40 focus:ring-2 focus:ring-brand-green" />
            {options.length > 2 && <button onClick={() => setOptions(options.filter((_, j) => j !== i))} className="rounded-lg p-1.5 hover:bg-white/10"><Trash2 className="size-4 text-white/50" /></button>}
          </div>
        ))}
        {options.length < 6 && <button onClick={() => setOptions([...options, ""])} className="flex items-center gap-1 text-sm text-brand-green hover:underline"><Plus className="size-4" />Agregar opción</button>}
      </div>
      {kind === "quiz" && (
        <label className="flex items-center justify-between text-sm">
          Tiempo para responder
          <select value={seconds} onChange={(e) => setSeconds(Number(e.target.value))} className="rounded-lg bg-white/10 px-2 py-1">
            {[10, 15, 20, 30, 45, 60].map((s) => <option key={s} value={s} className="text-black">{s} s</option>)}
          </select>
        </label>
      )}
      <Button disabled={!valid} onClick={launch} className="w-full bg-brand-green text-brand-navy hover:bg-brand-green/90"><Play className="size-4" />Lanzar {kind}</Button>
    </div>
  );
}

function PollView({ sessionId }: { sessionId: string }) {
  const { state, isHost, send, me } = useLive();
  const poll = state.poll!;
  const [pending, start] = useTransition();
  const [saved, setSaved] = useState(false);
  const closed = !!poll.closedAt;
  const mine = state.answers.find((a) => a.identity === me.id);
  const [now, setNow] = useState(() => nowMs());
  useEffect(() => {
    if (closed) return;
    const t = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(t);
  }, [closed]);
  const remaining = Math.max(0, Math.ceil((poll.startedAt + poll.seconds * 1000 - now) / 1000));

  // Auto-cierre por tiempo (solo host emite)
  useEffect(() => {
    if (isHost && !closed && remaining === 0) void send({ t: "poll_close", pollId: poll.id });
  }, [isHost, closed, remaining, poll.id, send]);

  const counts = useMemo(() => poll.options.map((_, i) => state.answers.filter((a) => a.optionIndex === i).length), [poll.options, state.answers]);
  const total = state.answers.length || 1;

  const answer = (i: number) => {
    if (closed || mine) return;
    void send({ t: "poll_answer", answer: { pollId: poll.id, identity: me.id, name: me.name, optionIndex: i, responseMs: nowMs() - poll.startedAt } });
  };

  const reveal = () => start(async () => {
    if (!closed) await send({ t: "poll_close", pollId: poll.id });
    await send({ t: "poll_reveal", pollId: poll.id });
    if (!saved) {
      await savePollResultAction(sessionId, poll, state.answers);
      setSaved(true);
    }
  });

  const podium = useMemo(() => {
    if (poll.kind !== "quiz") return [];
    return state.answers
      .map((a) => ({ name: a.name, identity: a.identity, points: quizPoints(a.optionIndex === poll.correctIndex, a.responseMs, poll.seconds) }))
      .sort((a, b) => b.points - a.points)
      .slice(0, 5);
  }, [poll, state.answers]);

  const showResults = state.revealed || isHost || (poll.kind === "encuesta" && !!mine);

  return (
    <div className="flex h-full flex-col overflow-y-auto p-4">
      <div className="mb-3 flex items-center justify-between text-xs uppercase tracking-wide text-white/50">
        <span className="flex items-center gap-1"><BarChart3 className="size-3.5" />{poll.kind}</span>
        {!closed ? <span className={cn("font-bold tabular-nums", remaining <= 5 && "text-red-400")}>{remaining}s</span> : <span>Cerrada</span>}
      </div>
      <h3 className="text-lg font-semibold">{poll.question}</h3>

      <div className="mt-4 space-y-2">
        {poll.options.map((o, i) => {
          const pct = Math.round((counts[i] / total) * 100);
          const isCorrect = poll.kind === "quiz" && state.revealed && poll.correctIndex === i;
          const isMine = mine?.optionIndex === i;
          return (
            <button key={i} disabled={closed || !!mine || isHost} onClick={() => answer(i)} className={cn("relative w-full overflow-hidden rounded-xl border-2 p-3 text-left text-sm transition", isMine ? "border-brand-green" : "border-white/10", isCorrect && "border-brand-green", !closed && !mine && !isHost && "hover:border-brand-green")}>
              {showResults && <motion.span initial={{ width: 0 }} animate={{ width: `${pct}%` }} className={cn("absolute inset-y-0 left-0", isCorrect ? "bg-brand-green/30" : "bg-brand-green/25")} />}
              <span className="relative flex items-center justify-between gap-2">
                <span className="flex items-center gap-2"><span className="grid size-6 place-items-center rounded-md bg-white/10 text-xs font-bold">{String.fromCharCode(65 + i)}</span>{o}</span>
                {showResults && <span className="tabular-nums text-white/70">{counts[i]} · {pct}%</span>}
                {isCorrect && <Check className="size-4 text-brand-green" />}
              </span>
            </button>
          );
        })}
      </div>

      <p className="mt-3 text-xs text-white/50">{state.answers.length} {state.answers.length === 1 ? "respuesta" : "respuestas"}{mine && !isHost ? " · ya respondiste ✅" : ""}</p>

      {state.revealed && poll.kind === "quiz" && podium.length > 0 && (
        <div className="mt-4 rounded-2xl bg-gradient-to-br from-brand-yellow/20 to-brand-green/20 p-4">
          <p className="mb-2 flex items-center gap-1 font-semibold"><Trophy className="size-4 text-brand-yellow" />Podio</p>
          <ol className="space-y-1 text-sm">
            {podium.map((p, i) => (
              <li key={p.identity} className={cn("flex items-center justify-between rounded-lg px-2 py-1", p.identity === me.id && "bg-white/10")}>
                <span>{["🥇", "🥈", "🥉", "4.", "5."][i]} {p.name}</span><span className="font-bold tabular-nums">{p.points}</span>
              </li>
            ))}
          </ol>
        </div>
      )}

      {isHost && (
        <div className="mt-auto flex gap-2 pt-4">
          {!closed && <Button variant="outline" className="flex-1 border-white/20 bg-transparent text-white hover:bg-white/10 hover:text-white" onClick={() => send({ t: "poll_close", pollId: poll.id })}><Square className="size-4" />Cerrar</Button>}
          {!state.revealed && <Button className="flex-1 bg-brand-green text-brand-navy hover:bg-brand-green/90" disabled={pending} onClick={reveal}><Eye className="size-4" />Revelar resultados</Button>}
          {state.revealed && <Button className="flex-1 bg-white text-black hover:bg-white/90" onClick={() => send({ t: "poll_start", poll: { ...poll, id: "" } })} style={{ display: "none" }} />}
          {state.revealed && <NewPollButton />}
        </div>
      )}
    </div>
  );
}

function NewPollButton() {
  const { send } = useLive();
  // "Nueva encuesta": limpiamos estado local enviando un poll_start vacío no es válido; usamos poll_close + reset por medio de sync.
  // Implementación simple: mostramos el creador encima.
  const [creating, setCreating] = useState(false);
  if (creating) {
    return (
      <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 p-4 sm:items-center">
        <div className="w-full max-w-md rounded-2xl bg-brand-navy shadow-2xl">
          <div className="flex items-center justify-between border-b border-white/10 px-4 py-3"><p className="font-semibold">Nueva encuesta o quiz</p><button onClick={() => setCreating(false)}><X className="size-5" /></button></div>
          <PollCreatorWrapper onLaunched={() => setCreating(false)} />
        </div>
      </div>
    );
  }
  void send;
  return <Button className="flex-1 bg-white text-black hover:bg-white/90" onClick={() => setCreating(true)}><Plus className="size-4" />Nueva</Button>;
}

function PollCreatorWrapper({ onLaunched }: { onLaunched: () => void }) {
  const { state } = useLive();
  const startId = state.poll?.id;
  useEffect(() => {
    if (state.poll?.id !== startId) onLaunched();
  }, [state.poll?.id, startId, onLaunched]);
  return <PollCreator />;
}
