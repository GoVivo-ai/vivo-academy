"use client";

import { motion } from "motion/react";
import { CheckCircle2, Sparkles, Star } from "lucide-react";
import { FlameIcon, TrophyIcon, CertIcon, LiveIcon, BoltIcon } from "@/components/brand/icons";
import { VivoLogo, VivoMark } from "@/components/brand/logo";

const float = (delay = 0, y = 12, dur = 5) => ({
  animate: { y: [0, -y, 0], rotate: [0, 1.5, 0] },
  transition: { duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay },
});

const appear = (delay: number) => ({
  initial: { opacity: 0, y: 24, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  transition: { duration: 0.6, delay, ease: [0.22, 1, 0.36, 1] as const },
});

/** Panel izquierdo del login: escena animada tipo "academia gamificada". */
export function LoginScene() {
  return (
    <section className="relative hidden lg:flex flex-col overflow-hidden bg-brand-navy p-12 text-white">
      {/* Fondo vivo */}
      <div aria-hidden className="absolute -left-40 top-10 size-[560px] rounded-full bg-brand-green/25 blur-3xl" />
      <div aria-hidden className="absolute -right-32 bottom-0 size-[480px] rounded-full bg-brand-yellow/15 blur-3xl" />
      <motion.div aria-hidden className="pointer-events-none absolute -bottom-44 -right-56 opacity-[0.08]" animate={{ rotate: [0, 6, 0] }} transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}>
        <VivoMark variant="white" size={700} />
      </motion.div>
      {/* Partículas */}
      {[...Array(14)].map((_, i) => (
        <motion.span
          key={i}
          aria-hidden
          className="absolute size-1.5 rounded-full"
          style={{ left: `${8 + ((i * 37) % 84)}%`, top: `${10 + ((i * 53) % 80)}%`, backgroundColor: i % 3 === 0 ? "var(--brand-yellow)" : "var(--brand-green)" }}
          animate={{ y: [0, -30, 0], opacity: [0.2, 0.9, 0.2], scale: [1, 1.6, 1] }}
          transition={{ duration: 4 + (i % 5), repeat: Infinity, delay: i * 0.35, ease: "easeInOut" }}
        />
      ))}

      <motion.div className="relative" initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.6 }}>
        <VivoLogo variant="white" height={40} />
      </motion.div>

      <div className="relative my-auto grid grid-cols-[1fr_300px] items-center gap-10">
        <div className="space-y-7">
          <motion.p {...appear(0.1)} className="inline-flex items-center gap-2 rounded-full border border-brand-green/40 bg-brand-green/10 px-3 py-1 font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-green">
            <Sparkles className="size-3.5" /> Vivo Academy
          </motion.p>
          <motion.h1 {...appear(0.2)} className="font-heading text-[54px] font-bold leading-[1.02]">
            Aprende jugando,<br />
            <span className="text-brand-gradient">sube de nivel</span><br />
            con tu equipo.
          </motion.h1>
          <motion.p {...appear(0.35)} className="max-w-md text-lg text-white/75">
            Cursos cortos, quizzes, clases en vivo y una racha que no querrás perder. Cada lección suma XP.
          </motion.p>
          <motion.ul {...appear(0.5)} className="flex flex-wrap gap-2 text-sm">
            {[
              { icon: FlameIcon, t: "Racha diaria" },
              { icon: TrophyIcon, t: "Ranking" },
              { icon: LiveIcon, t: "Clases en vivo" },
              { icon: CertIcon, t: "Certificados" },
            ].map((f) => (
              <li key={f.t} className="flex items-center gap-1.5 rounded-full bg-white/10 px-3 py-1.5 font-semibold text-white/90">
                <f.icon size={22} onDark />{f.t}
              </li>
            ))}
          </motion.ul>
        </div>

        {/* Tarjetas flotantes */}
        <div className="relative h-[420px]">
          <motion.div {...appear(0.4)} className="absolute left-0 top-2 w-64">
            <motion.div {...float(0, 10, 5)} className="rounded-3xl bg-white p-4 text-brand-navy shadow-2xl shadow-black/30">
              <div className="flex items-center justify-between">
                <span className="font-heading text-sm font-bold">Lección completada</span>
                <CheckCircle2 className="size-5 text-brand-green" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">Atención al cliente · Escucha activa</p>
              <div className="mt-3 h-2 overflow-hidden rounded-full bg-muted">
                <motion.div className="h-full bg-brand-swoosh" initial={{ width: "20%" }} animate={{ width: ["20%", "100%"] }} transition={{ duration: 2.4, delay: 1, repeat: Infinity, repeatDelay: 3 }} />
              </div>
            </motion.div>
          </motion.div>

          <motion.div {...appear(0.6)} className="absolute right-0 top-28">
            <motion.div {...float(0.8, 14, 6)} className="flex items-center gap-3 rounded-full bg-brand-navy-700 py-2 pl-2 pr-5 shadow-xl ring-1 ring-white/10">
              <span className="grid size-10 place-items-center rounded-full bg-white"><BoltIcon size={24} /></span>
              <div><p className="font-heading text-lg font-bold leading-none">+25 XP</p><p className="text-[11px] text-white/60">Quiz aprobado</p></div>
            </motion.div>
          </motion.div>

          <motion.div {...appear(0.75)} className="absolute left-6 top-52 w-56">
            <motion.div {...float(1.4, 12, 5.5)} className="rounded-3xl bg-brand-green p-4 text-brand-navy shadow-2xl shadow-brand-green/30">
              <div className="flex items-center gap-2"><FlameIcon size={30} /><span className="font-heading text-3xl font-bold">7</span><span className="text-sm font-bold">días de racha</span></div>
              <div className="mt-3 flex gap-1">
                {[...Array(7)].map((_, i) => (
                  <motion.span key={i} className="h-6 flex-1 rounded-md bg-brand-navy/15" animate={{ backgroundColor: ["rgba(1,22,64,0.15)", "rgba(1,22,64,0.9)", "rgba(1,22,64,0.9)"] }} transition={{ duration: 3, delay: 1.5 + i * 0.25, repeat: Infinity, repeatDelay: 2 }} />
                ))}
              </div>
            </motion.div>
          </motion.div>

          <motion.div {...appear(0.9)} className="absolute right-4 bottom-2">
            <motion.div {...float(2, 10, 6.5)} className="flex items-center gap-3 rounded-2xl bg-white p-3 pr-5 text-brand-navy shadow-2xl shadow-black/30">
              <span className="grid size-11 place-items-center rounded-xl bg-brand-yellow/30 text-2xl">🏆</span>
              <div><p className="font-heading text-sm font-bold">Nueva insignia</p><p className="text-xs text-muted-foreground">Graduado</p></div>
              <motion.span animate={{ rotate: [0, 20, -20, 0], scale: [1, 1.3, 1] }} transition={{ duration: 2, repeat: Infinity, repeatDelay: 1.5 }}><Star className="size-5 fill-brand-yellow text-brand-yellow" /></motion.span>
            </motion.div>
          </motion.div>
        </div>
      </div>

      <motion.p {...appear(1.1)} className="relative text-sm text-white/50">Academia interna · Vivo · #TuMarcaNoPuedeParar</motion.p>
    </section>
  );
}
