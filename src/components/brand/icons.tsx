"use client";

/**
 * Iconos propios de Vivo Academy: formas redondeadas, duotono azul/verde/amarillo
 * y micro-animaciones. `active` intensifica la animación (ítem seleccionado).
 */
import { motion } from "motion/react";

const NAVY = "#011640";
const GREEN = "#04d98b";
const YELLOW = "#f2e205";

type P = { size?: number; active?: boolean; className?: string; onDark?: boolean };
const loop = (dur: number, delay = 0) => ({ duration: dur, repeat: Infinity, ease: "easeInOut" as const, delay });

/** Tamaño óptico común (media geométrica de la caja de tinta) y grosor de trazo común. */
const INK = 34;
const TRAZO = 3.6;
/** Tope de la dimensión mayor: evita que una forma apaisada (la cámara) se estire a lo ancho. */
const MAX = 38;

/** Escala que lleva la caja de tinta al tamaño óptico común, sin pasarse de `MAX`. */
const escala = ([, , w, h]: [number, number, number, number]) =>
  Math.min(INK / Math.sqrt(w * h), MAX / Math.max(w, h));

/**
 * Caja óptica compartida. Cada icono declara la caja de tinta de su dibujo
 * (`[x, y, ancho, alto]` medida sobre el viewBox de 48) y aquí se normaliza: todos
 * acaban con el mismo peso visual y centrados en (24, 24). El `strokeWidth` se
 * compensa con la escala para que el trazo pese igual en toda la familia; por eso
 * los contornos no llevan `strokeWidth` propio, lo heredan de aquí.
 */
function Optica({ box, children }: { box: [number, number, number, number]; children: React.ReactNode }) {
  const [x, y, w, h] = box;
  const s = escala(box);
  const tx = (24 - s * (x + w / 2)).toFixed(2);
  const ty = (24 - s * (y + h / 2)).toFixed(2);
  return (
    <g transform={`translate(${tx} ${ty}) scale(${s.toFixed(4)})`} strokeWidth={+(TRAZO / s).toFixed(2)}>
      {children}
    </g>
  );
}

/** Grosor de un trazo secundario, compensado por la escala del icono. */
const fino = (box: [number, number, number, number], grosor = 2.4) => +(grosor / escala(box)).toFixed(2);

/** Inicio: casita con puerta verde y humo que sube. */
export function HomeIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[8, 9.8, 32, 28.2]}>
        <motion.path d="M8 24 24 10l16 14" stroke={base} strokeLinecap="round" strokeLinejoin="round" animate={active ? { y: [0, -1.5, 0] } : {}} transition={loop(1.6)} />
        <path d="M12 22v16h24V22" stroke={base} strokeLinecap="round" strokeLinejoin="round" />
        <motion.rect x="20" y="27" width="8" height="11" rx="3" fill={GREEN} animate={active ? { scaleY: [1, 1.08, 1] } : {}} style={{ originY: 1 }} transition={loop(1.6)} />
        <motion.circle cx="33" cy="12" r="2.2" fill={YELLOW} animate={{ y: [0, -5, 0], opacity: [0, 1, 0] }} transition={loop(2.2)} />
      </Optica>
    </svg>
  );
}

/** Cursos: libro que pasa páginas. */
export function BookIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[8, 10, 32, 28]}>
        <path d="M8 10h12a4 4 0 0 1 4 4v24a4 4 0 0 0-4-4H8z" fill={GREEN} opacity="0.9" />
        <path d="M40 10H28a4 4 0 0 0-4 4v24a4 4 0 0 1 4-4h12z" stroke={base} strokeLinejoin="round" />
        <motion.path d="M24 14v24" stroke={base} strokeLinecap="round" />
        <motion.path d="M28 16h8M28 22h8" stroke={base} strokeWidth={fino([8, 10, 32, 28])} strokeLinecap="round" animate={active ? { opacity: [1, 0.3, 1] } : {}} transition={loop(1.4)} />
        <motion.path d="M24 14c-3 1-5 4-5 8v14c0-4 2-7 5-8z" fill={YELLOW} animate={active ? { rotateY: [0, 180, 0] } : { rotateY: [0, 0] }} style={{ originX: "24px", originY: "26px" }} transition={loop(2.4)} />
      </Optica>
    </svg>
  );
}

/** Mi ruta: camino con nodos y una bandera. */
export function RouteIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[5, 4, 41, 39]}>
        <motion.path d="M10 38c10 0 8-14 18-14s8-12 12-12" stroke={base} strokeLinecap="round" strokeDasharray="6 5" animate={active ? { strokeDashoffset: [0, -22] } : {}} transition={{ duration: 1.2, repeat: Infinity, ease: "linear" }} />
        <circle cx="10" cy="38" r="5" fill={GREEN} />
        <circle cx="28" cy="24" r="4" fill={GREEN} opacity="0.7" />
        <motion.path d="M40 12V4h-2v8" fill={base} animate={active ? { rotate: [0, -8, 0] } : {}} style={{ originX: "39px", originY: "12px" }} transition={loop(1.6)} />
        <motion.path d="M40 4h6l-2 3 2 3h-6z" fill={YELLOW} animate={{ skewX: [0, -8, 0] }} transition={loop(1.2)} />
      </Optica>
    </svg>
  );
}

/** En vivo: cámara con ondas que pulsan y punto rojo. */
export function LiveIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[6, 14, 34, 20]}>
        <rect x="6" y="14" width="24" height="20" rx="6" fill={GREEN} />
        <path d="M30 22l10-6v16l-10-6z" fill={base} />
        <motion.circle cx="13" cy="21" r="2.5" fill={active ? "#f43f5e" : base} animate={{ opacity: [1, 0.2, 1] }} transition={loop(1)} />
        {[0, 1].map((i) => (
          <motion.circle key={i} cx="18" cy="24" r="6" stroke={onDark ? YELLOW : NAVY} strokeWidth={fino([6, 14, 34, 20], 1.8)} animate={{ scale: [0.6, 1.5], opacity: [0.8, 0] }} style={{ originX: "18px", originY: "24px" }} transition={{ duration: 1.8, repeat: Infinity, delay: i * 0.9, ease: "easeOut" }} />
        ))}
      </Optica>
    </svg>
  );
}

/** Ranking: podio con barras que suben y estrella. */
export function RankIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[6, 4, 36, 38]}>
        <motion.rect x="6" y="28" width="10" height="14" rx="3" fill={base} opacity="0.55" animate={active ? { scaleY: [1, 0.85, 1] } : {}} style={{ originY: 1 }} transition={loop(1.8, 0.2)} />
        <motion.rect x="19" y="16" width="10" height="26" rx="3" fill={GREEN} animate={active ? { scaleY: [1, 1.08, 1] } : {}} style={{ originY: 1 }} transition={loop(1.8)} />
        <motion.rect x="32" y="24" width="10" height="18" rx="3" fill={base} opacity="0.55" animate={active ? { scaleY: [1, 0.9, 1] } : {}} style={{ originY: 1 }} transition={loop(1.8, 0.4)} />
        <motion.path d="M24 4l2 4.2 4.6.5-3.4 3.1.9 4.6L24 14l-4.1 2.4.9-4.6-3.4-3.1 4.6-.5z" fill={YELLOW} animate={{ rotate: [0, 12, -12, 0], scale: [1, 1.15, 1] }} style={{ originX: "24px", originY: "10px" }} transition={loop(2.4)} />
      </Optica>
    </svg>
  );
}

/** Perfil: avatar con anillo de nivel que gira. */
export function ProfileIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[4, 4, 40, 40]}>
        <motion.circle cx="24" cy="24" r="20" stroke={GREEN} strokeDasharray="80 46" strokeLinecap="round" animate={{ rotate: active ? 360 : [0, 20, 0] }} style={{ originX: "24px", originY: "24px" }} transition={active ? { duration: 3, repeat: Infinity, ease: "linear" } : loop(3)} />
        <circle cx="24" cy="19" r="6.5" fill={base} />
        <path d="M12 38c2-7 7-10 12-10s10 3 12 10" fill={base} />
        <motion.circle cx="34" cy="10" r="3" fill={YELLOW} animate={{ scale: [1, 1.4, 1] }} style={{ originX: "34px", originY: "10px" }} transition={loop(1.4)} />
      </Optica>
    </svg>
  );
}

/** Administrar: engranaje que gira despacio. */
export function AdminIcon({ size = 24, active, className, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[4, 4, 40, 40]}>
        <motion.g animate={{ rotate: active ? 360 : [0, 15, 0] }} style={{ originX: "24px", originY: "24px" }} transition={active ? { duration: 6, repeat: Infinity, ease: "linear" } : loop(3)}>
          {[0, 45, 90, 135].map((a) => <rect key={a} x="21" y="4" width="6" height="40" rx="3" fill={base} transform={`rotate(${a} 24 24)`} />)}
          <circle cx="24" cy="24" r="10" fill={base} />
          <circle cx="24" cy="24" r="5" fill={GREEN} />
        </motion.g>
      </Optica>
    </svg>
  );
}

/** Racha: llama viva. */
export function FlameIcon({ size = 24, active = true, className, onDark }: P & { off?: boolean }) {
  const outer = active ? YELLOW : onDark ? "#ffffff55" : "#c3cbe0";
  const inner = active ? GREEN : onDark ? "#ffffff33" : "#e6e9f2";
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[14, 4, 20, 33]}>
        <motion.path d="M24 4c2 8 10 10 10 20a10 10 0 0 1-20 0c0-4 2-7 4-9 0 4 2 6 4 6 0-7-2-11 2-17z" fill={outer} animate={active ? { scaleX: [1, 0.92, 1.06, 1], scaleY: [1, 1.06, 0.96, 1] } : {}} style={{ originX: "24px", originY: "34px" }} transition={loop(0.9)} />
        <motion.path d="M24 22c1 4 5 5 5 10a5 5 0 0 1-10 0c0-3 2-5 3-6 0 2 1 3 2 3 0-3-1-5 0-7z" fill={inner} animate={active ? { scaleY: [1, 1.15, 0.9, 1] } : {}} style={{ originX: "24px", originY: "37px" }} transition={loop(0.7, 0.2)} />
      </Optica>
    </svg>
  );
}

/** XP: rayo con destello. */
export function BoltIcon({ size = 24, className, active = true }: P) {
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[10, 4, 30.5, 40]}>
        <motion.path d="M27 4 10 27h11l-2 17 17-24H25z" fill={YELLOW} stroke={NAVY} strokeWidth={fino([10, 4, 30.5, 40], 2.5)} strokeLinejoin="round" animate={active ? { scale: [1, 1.08, 1] } : {}} style={{ originX: "24px", originY: "24px" }} transition={loop(1.2)} />
        <motion.circle cx="38" cy="10" r="2.5" fill={GREEN} animate={{ opacity: [0, 1, 0], scale: [0.5, 1.4, 0.5] }} transition={loop(1.6)} />
      </Optica>
    </svg>
  );
}

/** Insignia/medalla con cinta y brillo. */
export function MedalIcon({ size = 24, className, active = true, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[12, 4, 24, 38]}>
        <path d="M16 4h6l3 12-6 2z" fill={GREEN} />
        <path d="M32 4h-6l-3 12 6 2z" fill={GREEN} opacity="0.7" />
        <motion.circle cx="24" cy="30" r="12" fill={YELLOW} stroke={base} strokeWidth={fino([12, 4, 24, 38], 3)} animate={active ? { rotate: [0, -6, 6, 0] } : {}} style={{ originX: "24px", originY: "30px" }} transition={loop(2.4)} />
        <path d="M24 22l2.3 4.7 5.2.8-3.8 3.6.9 5.2-4.6-2.5-4.6 2.5.9-5.2-3.8-3.6 5.2-.8z" fill={base} />
        <motion.path d="M14 20l3-3" stroke="#fff" strokeWidth={fino([12, 4, 24, 38], 2.5)} strokeLinecap="round" animate={{ opacity: [0, 1, 0], x: [0, 6, 12] }} transition={loop(1.8)} />
      </Optica>
    </svg>
  );
}

/** Trofeo con brillo. */
export function TrophyIcon({ size = 24, className, active = true, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[7.7, 6, 32.7, 34]}>
        <motion.g animate={active ? { y: [0, -2, 0] } : {}} transition={loop(1.8)}>
          <path d="M14 6h20v12a10 10 0 0 1-20 0z" fill={YELLOW} stroke={base} strokeWidth={fino([7.7, 6, 32.7, 34], 3)} />
          <path d="M14 10H8a6 6 0 0 0 6 8M34 10h6a6 6 0 0 1-6 8" stroke={base} strokeWidth={fino([7.7, 6, 32.7, 34], 3)} strokeLinecap="round" />
          <path d="M24 28v6M16 40h16l-2-6H18z" fill={GREEN} stroke={base} strokeWidth={fino([7.7, 6, 32.7, 34], 3)} strokeLinejoin="round" />
        </motion.g>
        <motion.circle cx="20" cy="12" r="2" fill="#fff" animate={{ opacity: [0, 1, 0], scale: [0.5, 1.6, 0.5] }} transition={loop(1.5, 0.3)} />
      </Optica>
    </svg>
  );
}

/** Certificado con sello. */
export function CertIcon({ size = 24, className, active = true, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[6, 8, 36, 35]}>
        <rect x="6" y="8" width="36" height="28" rx="5" stroke={base} strokeWidth={fino([6, 8, 36, 35], 3)} />
        <path d="M13 17h16M13 24h10" stroke={base} strokeWidth={fino([6, 8, 36, 35], 2.5)} strokeLinecap="round" opacity="0.6" />
        <motion.circle cx="34" cy="30" r="7" fill={GREEN} stroke={base} strokeWidth={fino([6, 8, 36, 35], 2.5)} animate={active ? { scale: [1, 1.12, 1] } : {}} style={{ originX: "34px", originY: "30px" }} transition={loop(1.6)} />
        <path d="M31 30l2 2 4-4" stroke={base} strokeWidth={fino([6, 8, 36, 35], 2.5)} strokeLinecap="round" strokeLinejoin="round" />
        <motion.path d="M31 37l-2 6 5-3 5 3-2-6" fill={YELLOW} animate={{ y: [0, 1.5, 0] }} transition={loop(1.6)} />
      </Optica>
    </svg>
  );
}

/** Regalo (misiones). */
export function GiftIcon({ size = 24, className, active = true, onDark }: P) {
  const base = onDark ? "#ffffff" : NAVY;
  return (
    <svg viewBox="0 0 48 48" width={size} height={size} className={className} fill="none">
      <Optica box={[6, 5.7, 36, 36.3]}>
        <motion.g animate={active ? { rotate: [0, -4, 4, 0] } : {}} style={{ originX: "24px", originY: "40px" }} transition={loop(2)}>
          <rect x="8" y="20" width="32" height="22" rx="4" fill={GREEN} />
          <rect x="6" y="13" width="36" height="9" rx="3" fill={base} />
          <path d="M24 13v29" stroke={YELLOW} strokeWidth={fino([6, 5.7, 36, 36.3], 4)} />
          <path d="M24 13c-6 0-9-3-8-6s6-1 8 6zm0 0c6 0 9-3 8-6s-6-1-8 6z" fill={YELLOW} stroke={base} strokeWidth={fino([6, 5.7, 36, 36.3], 2)} />
        </motion.g>
      </Optica>
    </svg>
  );
}

export const navIcons = { HomeIcon, BookIcon, RouteIcon, LiveIcon, RankIcon, ProfileIcon, AdminIcon };
