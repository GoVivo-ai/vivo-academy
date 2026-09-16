"use client";

import { useEffect, useState } from "react";
import confetti from "canvas-confetti";
import { toast } from "sonner";
import { AnimatePresence, motion } from "motion/react";
import { Award, Sparkles, Zap, Trophy, ArrowRight } from "lucide-react";
import { levelName } from "@/lib/levels";
import { BadgeArt } from "@/components/brand/badge-art";

export type Celebration = {
  awarded?: number;
  newBadges?: Array<{ id: string; title: string; icon: string; description: string }>;
  levelUp?: number | null;
  courseCompleted?: boolean;
  certificateCode?: string;
};

type Event =
  | { kind: "badge"; badge: { id: string; title: string; icon: string; description: string } }
  | { kind: "level"; level: number }
  | { kind: "course"; certificateCode?: string };

const EVT = "vivo:celebrate";

export function fireConfetti(big = false) {
  const base = { spread: 70, startVelocity: 45, ticks: 200, zIndex: 9999, colors: ["#04d98b", "#f2e205", "#ffffff", "#0b2a6b"] };
  confetti({ ...base, particleCount: big ? 160 : 70, origin: { x: 0.5, y: 0.6 } });
  if (big) {
    setTimeout(() => confetti({ ...base, particleCount: 80, angle: 60, origin: { x: 0, y: 0.7 } }), 250);
    setTimeout(() => confetti({ ...base, particleCount: 80, angle: 120, origin: { x: 1, y: 0.7 } }), 400);
  }
}

/** Dispara toasts, confeti y la pantalla de celebración según lo ocurrido. */
export function celebrate(c: Celebration) {
  const big = !!c.courseCompleted || !!c.levelUp || (c.newBadges?.length ?? 0) > 0;
  if ((c.awarded ?? 0) > 0) {
    toast.success(`+${c.awarded} XP`, { icon: <Zap className="size-4 fill-brand-yellow text-brand-yellow" />, duration: 2500 });
    fireConfetti(big);
    window.dispatchEvent(new CustomEvent("vivo:xp", { detail: c.awarded }));
  }
  const queue: Event[] = [];
  if (c.levelUp) queue.push({ kind: "level", level: c.levelUp });
  c.newBadges?.forEach((badge) => queue.push({ kind: "badge", badge }));
  if (c.courseCompleted) queue.push({ kind: "course", certificateCode: c.certificateCode });
  if (queue.length) window.dispatchEvent(new CustomEvent(EVT, { detail: queue }));
}

export function CelebrateOnMount({ data }: { data: Celebration }) {
  useEffect(() => {
    celebrate(data);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
  return null;
}

/** Overlay global: muestra una tarjeta por cada evento (nivel, insignia, curso). Móntalo una vez en el layout. */
export function CelebrationOverlay() {
  const [queue, setQueue] = useState<Event[]>([]);
  useEffect(() => {
    const on = (e: globalThis.Event) => setQueue((q) => [...q, ...((e as CustomEvent<Event[]>).detail ?? [])]);
    window.addEventListener(EVT, on);
    return () => window.removeEventListener(EVT, on);
  }, []);
  const current = queue[0];
  useEffect(() => {
    if (current) fireConfetti(true);
  }, [current]);
  const next = () => setQueue((q) => q.slice(1));

  return (
    <AnimatePresence>
      {current && (
        <motion.div key={queue.length} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[100] grid place-items-center bg-brand-navy/80 p-4 backdrop-blur-sm" onClick={next}>
          <motion.div
            initial={{ scale: 0.6, rotateY: 90, opacity: 0 }}
            animate={{ scale: 1, rotateY: 0, opacity: 1 }}
            exit={{ scale: 0.8, opacity: 0 }}
            transition={{ type: "spring", stiffness: 220, damping: 18 }}
            onClick={(e) => e.stopPropagation()}
            className="relative w-full max-w-sm overflow-hidden rounded-[2rem] bg-white p-8 text-center text-brand-navy shadow-2xl"
          >
            <div className="absolute -left-16 -top-16 size-48 rounded-full bg-brand-green/20 blur-2xl" />
            <div className="absolute -bottom-16 -right-16 size-48 rounded-full bg-brand-yellow/30 blur-2xl" />
            <div className="relative">
              {current.kind === "level" && (
                <>
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-brand-green-600">¡Subiste de nivel!</p>
                  <motion.div animate={{ scale: [1, 1.15, 1], rotate: [0, -6, 6, 0] }} transition={{ duration: 1.2, repeat: Infinity, repeatDelay: 1 }} className="mx-auto mt-4 grid size-28 place-items-center rounded-full bg-brand-hero text-white shadow-xl shadow-brand-navy/30">
                    <span className="font-heading text-5xl font-bold">{current.level}</span>
                  </motion.div>
                  <h2 className="mt-5 font-heading text-3xl font-bold">{levelName(current.level)}</h2>
                  <p className="mt-1 text-muted-foreground">Sigue así: cada lección te acerca al siguiente nivel.</p>
                </>
              )}
              {current.kind === "badge" && (
                <>
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-brand-green-600">Insignia desbloqueada</p>
                  <div className="mx-auto mt-4 grid place-items-center">
                    <BadgeArt id={current.badge.id} size={128} />
                  </div>
                  <h2 className="mt-5 font-heading text-3xl font-bold">{current.badge.title}</h2>
                  <p className="mt-1 text-muted-foreground">{current.badge.description}</p>
                </>
              )}
              {current.kind === "course" && (
                <>
                  <p className="font-sans text-xs font-bold uppercase tracking-[0.3em] text-brand-green-600">Curso completado</p>
                  <motion.div animate={{ rotate: [0, 8, -8, 0] }} transition={{ duration: 2, repeat: Infinity }} className="mx-auto mt-4 grid size-28 place-items-center rounded-full bg-brand-green text-brand-navy shadow-xl shadow-brand-green/40">
                    <Trophy className="size-14" />
                  </motion.div>
                  <h2 className="mt-5 font-heading text-3xl font-bold">¡Lo lograste!</h2>
                  <p className="mt-1 text-muted-foreground">Tu certificado ya está listo para descargar y compartir.</p>
                </>
              )}
              <div className="mt-6 flex justify-center gap-2">
                {current.kind === "course" && current.certificateCode && (
                  <a href={`/certificados/${current.certificateCode}`} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-navy px-5 font-bold text-white hover:bg-brand-navy-700"><Award className="size-4" />Ver certificado</a>
                )}
                <button onClick={next} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-green px-6 font-bold text-brand-navy hover:bg-brand-green/90">
                  {queue.length > 1 ? "Siguiente" : "¡Genial!"} {queue.length > 1 ? <ArrowRight className="size-4" /> : <Sparkles className="size-4" />}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
