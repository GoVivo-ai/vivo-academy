"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { Check } from "lucide-react";
import { useLive } from "./live-store";
import { cn } from "@/lib/utils";
import { nowMs } from "@/lib/time";

/** Pregunta a pantalla completa para los participantes mientras un quiz está abierto. */
export function QuizOverlay() {
  const { state, isHost, send, me, setPanel } = useLive();
  const poll = state.poll;
  const [now, setNow] = useState(() => nowMs());
  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(t);
  }, []);

  const mine = poll ? state.answers.find((a) => a.identity === me.id) : undefined;
  const show = !!poll && !poll.closedAt && !isHost && !mine && state.panel !== "poll";
  if (!poll) return null;
  const remaining = Math.max(0, Math.ceil((poll.startedAt + poll.seconds * 1000 - now) / 1000));
  const pct = Math.max(0, Math.min(100, ((poll.startedAt + poll.seconds * 1000 - now) / (poll.seconds * 1000)) * 100));
  const colors = ["bg-rose-500", "bg-sky-500", "bg-brand-yellow text-brand-navy", "bg-brand-green", "bg-brand-green", "bg-pink-500"];

  return (
    <AnimatePresence>
      {show && (
        <motion.div initial={{ opacity: 0, scale: 0.96 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.96 }} className="absolute inset-0 z-20 flex flex-col bg-brand-navy-900/95 p-4 sm:p-8">
          <div className="mb-3 flex items-center justify-between text-sm text-white/60">
            <span className="uppercase tracking-wide">{poll.kind === "quiz" ? "Quiz · responde rápido para más puntos" : "Encuesta"}</span>
            <button onClick={() => setPanel("poll")} className="hover:underline">Ver en panel</button>
          </div>
          <div className="mb-4 h-2 overflow-hidden rounded-full bg-white/10"><div className={cn("h-full transition-all", remaining <= 5 ? "bg-red-500" : "bg-brand-green")} style={{ width: `${pct}%` }} /></div>
          <div className="flex items-center justify-between">
            <h2 className="text-2xl font-bold sm:text-3xl">{poll.question}</h2>
            <span className={cn("ml-4 grid size-14 shrink-0 place-items-center rounded-full border-4 text-xl font-bold tabular-nums", remaining <= 5 ? "border-red-500" : "border-brand-green")}>{remaining}</span>
          </div>
          <div className="mt-6 grid flex-1 grid-cols-1 gap-3 sm:grid-cols-2">
            {poll.options.map((o, i) => (
              <motion.button
                key={i}
                whileTap={{ scale: 0.97 }}
                onClick={() => send({ t: "poll_answer", answer: { pollId: poll.id, identity: me.id, name: me.name, optionIndex: i, responseMs: nowMs() - poll.startedAt } })}
                className={cn("flex items-center gap-4 rounded-2xl p-5 text-left text-lg font-semibold text-white shadow-lg transition hover:brightness-110", colors[i % colors.length])}
              >
                <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-black/20 text-xl font-bold">{String.fromCharCode(65 + i)}</span>
                {o}
              </motion.button>
            ))}
          </div>
        </motion.div>
      )}
      {poll && !poll.closedAt && !isHost && mine && state.panel !== "poll" && (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-2 rounded-full bg-brand-green text-brand-navy px-4 py-2 text-sm font-medium shadow-xl">
          <Check className="size-4" />Respuesta enviada. Esperando resultados…
        </motion.div>
      )}
    </AnimatePresence>
  );
}
