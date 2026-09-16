"use client";

import Link from "next/link";
import { motion } from "motion/react";
import { CheckCircle2, Circle, ArrowRight } from "lucide-react";
import { FlameIcon, BoltIcon, MedalIcon, TrophyIcon, GiftIcon } from "@/components/brand/icons";
import { LevelRing } from "./level-ring";
import { CountUp } from "./count-up";
import { VivoMark } from "@/components/brand/logo";
import type { Mission } from "@/lib/missions";
import { cn } from "@/lib/utils";

type Props = {
  firstName: string;
  xp: number;
  level: number;
  levelName: string;
  levelPct: number;
  xpInLevel: number;
  xpToNext: number;
  streak: number;
  streakBest: number;
  doneToday: boolean;
  atRisk: boolean;
  badges: number;
  rank: number | null;
  week: Array<{ day: string; active: boolean; label: string }>;
  missions: Mission[];
  allDone: boolean;
  bonus: number;
};

const item = { hidden: { opacity: 0, y: 18 }, show: { opacity: 1, y: 0 } };

export function HomeHud(p: Props) {
  return (
    <motion.section initial="hidden" animate="show" variants={{ show: { transition: { staggerChildren: 0.08 } } }} className="grid gap-4 lg:grid-cols-[1.5fr_1fr]">
      {/* HUD principal */}
      <motion.div variants={item} className="relative overflow-hidden rounded-[2rem] bg-brand-hero p-6 text-white md:p-8">
        <VivoMark variant="white" size={320} className="pointer-events-none absolute -bottom-28 -right-20 opacity-[0.12]" />
        <div className="absolute -left-10 -top-16 size-48 rounded-full bg-brand-yellow/10 blur-2xl" />
        <div className="relative flex flex-col gap-6 sm:flex-row sm:items-center">
          <LevelRing pct={p.levelPct} size={132} stroke={10}>
            <div className="text-center">
              <p className="text-[11px] font-bold uppercase tracking-widest text-white/70">Nivel</p>
              <p className="font-heading text-4xl font-bold leading-none">{p.level}</p>
            </div>
          </LevelRing>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-white/80">{p.doneToday ? "¡Ya cumpliste hoy! 🎉" : "Hoy es un buen día para subir de nivel"}</p>
            <h1 className="mt-1 font-heading text-3xl font-bold md:text-4xl">Hola, {p.firstName} 👋</h1>
            <p className="mt-1 font-heading text-lg font-bold text-brand-green">{p.levelName}</p>
            <div className="mt-4">
              <div className="flex justify-between text-xs text-white/80">
                <span className="flex items-center gap-1"><BoltIcon size={16} /><CountUp value={p.xp} /> XP</span>
                <span>{p.xpInLevel} / {p.xpToNext} para nivel {p.level + 1}</span>
              </div>
              <div className="mt-1.5 h-3 w-full overflow-hidden rounded-full bg-white/20">
                <motion.div className="h-full rounded-full bg-brand-swoosh" initial={{ width: 0 }} animate={{ width: `${p.levelPct}%` }} transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1], delay: 0.3 }} />
              </div>
            </div>
          </div>
        </div>
        <div className="relative mt-6 grid grid-cols-3 gap-3">
          <Stat icon={<MedalIcon size={18} onDark />} label="Insignias" value={p.badges} href="/perfil" />
          <Stat icon={<TrophyIcon size={18} onDark />} label="Ranking" value={p.rank ? `#${p.rank}` : "—"} href="/ranking" />
          <Stat icon={<FlameIcon size={18} active={p.doneToday} onDark />} label="Mejor racha" value={p.streakBest} href="/perfil" />
        </div>
      </motion.div>

      {/* Racha */}
      <motion.div variants={item} className={cn("relative overflow-hidden rounded-[2rem] border bg-card p-6", p.doneToday && "border-brand-yellow")}>
        <div className="flex items-start justify-between">
          <div>
            <h2 className="font-heading text-lg font-bold">Racha</h2>
            <p className="text-sm text-muted-foreground">{p.doneToday ? "Asegurada por hoy. ¡Vuelve mañana!" : p.atRisk ? "⚠️ Se pierde hoy si no haces nada" : "Completa una lección para encenderla"}</p>
          </div>
          <span className={cn("grid size-14 place-items-center rounded-2xl", p.doneToday ? "bg-brand-navy" : "bg-muted")}>
            <FlameIcon size={36} active={p.doneToday || p.atRisk} onDark={p.doneToday} />
          </span>
        </div>
        <p className="my-3 font-heading text-6xl font-bold tabular-nums text-brand-navy dark:text-white"><CountUp value={p.streak} /><span className="ml-2 text-base font-bold text-muted-foreground">días</span></p>
        <div className="grid grid-cols-7 gap-1.5">
          {p.week.map((d, i) => (
            <motion.div key={d.day} initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ delay: 0.4 + i * 0.06, type: "spring", stiffness: 300 }} className="flex flex-col items-center gap-1">
              <span className={cn("grid size-9 place-items-center rounded-xl text-sm font-bold", d.active ? "bg-brand-green text-brand-navy shadow-md shadow-brand-green/40" : "bg-muted text-muted-foreground", i === 6 && !d.active && "ring-2 ring-brand-yellow")}>{d.active ? <FlameIcon size={20} /> : d.label}</span>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* Misiones diarias */}
      <motion.div variants={item} className="relative overflow-hidden rounded-[2rem] border bg-card p-6 lg:col-span-2">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="flex items-center gap-2 font-heading text-lg font-bold"><GiftIcon size={26} />Misiones de hoy</h2>
            <p className="text-sm text-muted-foreground">Completa las tres y gana <strong className="text-brand-navy dark:text-brand-green">+{p.bonus} XP</strong> extra.</p>
          </div>
          <div className="flex items-center gap-2 text-sm font-bold">
            <span className="h-2 w-28 overflow-hidden rounded-full bg-muted"><motion.span className="block h-full bg-brand-swoosh" initial={{ width: 0 }} animate={{ width: `${(p.missions.filter((m) => m.done).length / p.missions.length) * 100}%` }} transition={{ duration: 1, delay: 0.5 }} /></span>
            {p.missions.filter((m) => m.done).length}/{p.missions.length}
          </div>
        </div>
        <ul className="mt-4 grid gap-3 sm:grid-cols-3">
          {p.missions.map((m, i) => (
            <motion.li key={m.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 + i * 0.1 }}>
              <Link href={m.href} className={cn("group flex items-center gap-3 rounded-2xl border-2 p-4 transition hover:-translate-y-0.5 hover:shadow-md", m.done ? "border-brand-green bg-brand-green/10" : "border-border hover:border-brand-green/50")}>
                {m.done ? <CheckCircle2 className="size-6 shrink-0 text-brand-green-600" /> : <Circle className="size-6 shrink-0 text-muted-foreground/40" />}
                <div className="min-w-0 flex-1">
                  <p className={cn("font-semibold leading-tight", m.done && "line-through opacity-70")}>{m.title}</p>
                  <p className="text-xs text-muted-foreground">+{m.xp} XP</p>
                </div>
                {!m.done && <ArrowRight className="size-4 text-muted-foreground opacity-0 transition group-hover:opacity-100" />}
              </Link>
            </motion.li>
          ))}
        </ul>
        {p.allDone && <motion.p initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="mt-4 rounded-2xl bg-brand-yellow/20 p-3 text-center font-heading font-bold text-brand-navy dark:text-brand-yellow">🎁 ¡Misiones completas! Bono de +{p.bonus} XP entregado.</motion.p>}
      </motion.div>
    </motion.section>
  );
}

function Stat({ icon, label, value, href }: { icon: React.ReactNode; label: string; value: string | number; href: string }) {
  return (
    <Link href={href} className="rounded-2xl bg-white/12 px-3 py-2.5 backdrop-blur transition hover:bg-white/20">
      <p className="flex items-center gap-1 text-[11px] text-white/75">{icon}{label}</p>
      <p className="font-heading text-xl font-bold">{value}</p>
    </Link>
  );
}
