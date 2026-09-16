"use client";

/**
 * Insignias de Vivo Academy: medallón hexagonal con los colores de la marca
 * (marco propio) + icono del set Phosphor. Se animan cuando están desbloqueadas.
 */
import { motion } from "motion/react";
import {
  RocketLaunchIcon,
  GraduationCapIcon,
  BooksIcon,
  FlameIcon,
  CrownSimpleIcon,
  TargetIcon,
  CrosshairSimpleIcon,
  BroadcastIcon,
  StarIcon,
  TrophyIcon,
  DiamondIcon,
  LockSimpleIcon,
  MedalIcon,
  type Icon,
} from "@phosphor-icons/react";

const NAVY = "#011640";
const NAVY_L = "#0b2a6b";
const GREEN = "#04d98b";
const GREEN_D = "#03a86c";
const WHITE = "#ffffff";

type Tier = "bronce" | "plata" | "oro" | "esmeralda" | "diamante";

const TIERS: Record<Tier, { a: string; b: string; ring: string; ink: string }> = {
  bronce: { a: "#efb478", b: "#c9793a", ring: "#a35f27", ink: "#6b3410" },
  plata: { a: "#f1f5fb", b: "#b3c1d6", ring: "#8e9cb3", ink: NAVY },
  oro: { a: "#ffe45c", b: "#e0a800", ring: "#b98900", ink: "#7a5c00" },
  esmeralda: { a: GREEN, b: GREEN_D, ring: "#02754c", ink: NAVY },
  diamante: { a: "#a8f4ff", b: "#3ec6f0", ring: "#1f9dc4", ink: "#07485c" },
};

const ART: Record<string, { tier: Tier; icon: Icon }> = {
  "primera-leccion": { tier: "bronce", icon: RocketLaunchIcon },
  "primer-curso": { tier: "oro", icon: GraduationCapIcon },
  "tres-cursos": { tier: "esmeralda", icon: BooksIcon },
  "racha-3": { tier: "bronce", icon: FlameIcon },
  "racha-7": { tier: "plata", icon: FlameIcon },
  "racha-30": { tier: "oro", icon: CrownSimpleIcon },
  "quiz-perfecto": { tier: "esmeralda", icon: TargetIcon },
  "cinco-perfectos": { tier: "oro", icon: CrosshairSimpleIcon },
  "primera-clase": { tier: "plata", icon: BroadcastIcon },
  "cinco-clases": { tier: "oro", icon: StarIcon },
  "nivel-5": { tier: "oro", icon: TrophyIcon },
  "xp-1000": { tier: "diamante", icon: DiamondIcon },
};

const FALLBACK = { tier: "plata" as Tier, icon: MedalIcon };

export function BadgeArt({ id, size = 96, earned = true, className }: { id: string; size?: number; earned?: boolean; className?: string }) {
  const art = ART[id] ?? FALLBACK;
  const t = TIERS[art.tier];
  const gid = `bg-${id}`;
  const sid = `sh-${id}`;
  const a = earned ? t.a : "#e3e8f1";
  const b = earned ? t.b : "#c2cbdb";
  const ring = earned ? t.ring : "#aab5c8";
  const ink = earned ? t.ink : "#8d99ad";
  const Symbol = earned ? art.icon : LockSimpleIcon;
  // desfase estable por id para que no destellen todas a la vez
  const shineDelay = ([...id].reduce((n, c) => n + c.charCodeAt(0), 0) % 40) / 10;
  const h = Math.round(size * 1.08);

  return (
    <motion.div
      className={className}
      style={{ width: size, height: h, position: "relative" }}
      initial={false}
      animate={earned ? { y: [0, -3, 0] } : {}}
      transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
    >
      <svg viewBox="0 0 100 108" width={size} height={h} className="absolute inset-0" aria-hidden>
        <defs>
          <linearGradient id={gid} x1="0" y1="0" x2="0.6" y2="1">
            <stop offset="0" stopColor={a} />
            <stop offset="1" stopColor={b} />
          </linearGradient>
          <linearGradient id={sid} x1="0" y1="0" x2="1" y2="1">
            <stop offset="0" stopColor={WHITE} stopOpacity="0" />
            <stop offset="0.5" stopColor={WHITE} stopOpacity="0.55" />
            <stop offset="0.9" stopColor={WHITE} stopOpacity="0" />
          </linearGradient>
          <clipPath id={`clip-${id}`}>
            <path d="M50 3 L91 26 V80 L50 103 L9 80 V26 Z" />
          </clipPath>
        </defs>

        {/* cintas */}
        <path d="M31 78 L22 104 L37 97 L44 106 Z" fill={earned ? NAVY : "#c2cbdb"} />
        <path d="M69 78 L78 104 L63 97 L56 106 Z" fill={earned ? NAVY_L : "#aab5c8"} />

        {/* medallón */}
        <path d="M50 3 L91 26 V80 L50 103 L9 80 V26 Z" fill={ring} />
        <path d="M50 9 L86 29 V77 L50 97 L14 77 V29 Z" fill={`url(#${gid})`} />
        <path d="M50 15 L81 32 V74 L50 91 L19 74 V32 Z" fill="none" stroke={WHITE} strokeOpacity={earned ? 0.5 : 0.7} strokeWidth="1.6" />

        {earned && (
          <g clipPath={`url(#clip-${id})`}>
            {/* El skew va en el grupo: motion sobrescribe el transform del elemento que anima. */}
            <g transform="skewX(-18)">
              <motion.rect
                x="0"
                y="-6"
                width="34"
                height="120"
                fill={`url(#${sid})`}
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: [-50, -18, 92, 124], opacity: [0, 1, 1, 0] }}
                transition={{ duration: 1.4, times: [0, 0.2, 0.8, 1], repeat: Infinity, repeatDelay: 5, delay: shineDelay, ease: "linear" }}
              />
            </g>
          </g>
        )}
      </svg>

      {/* icono */}
      <motion.span
        className="absolute left-1/2 grid -translate-x-1/2 place-items-center"
        style={{ top: `${(52 / 108) * 100}%`, translateY: "-50%" }}
        animate={earned ? { scale: [1, 1.07, 1] } : {}}
        transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
      >
        <Symbol size={Math.round(size * 0.44)} weight={earned ? "fill" : "bold"} color={ink} />
      </motion.span>
    </motion.div>
  );
}
