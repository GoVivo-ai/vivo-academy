/** Funciones puras de nivel (sin base de datos), seguras para el cliente. */
export const LEVEL_NAMES = ["Aprendiz", "Explorador", "Practicante", "Experto", "Mentor", "Leyenda"] as const;

/** XP total necesario para alcanzar el nivel `level` (nivel 1 = 0 XP). */
export function xpForLevel(level: number) {
  if (level <= 1) return 0;
  return Math.round(100 * Math.pow(level - 1, 1.5));
}

export function levelFromXp(xp: number) {
  let level = 1;
  while (xp >= xpForLevel(level + 1)) level++;
  return level;
}

export function levelName(level: number) {
  const idx = Math.min(LEVEL_NAMES.length - 1, Math.floor((level - 1) / 3));
  return LEVEL_NAMES[idx];
}

export function levelProgress(xp: number) {
  const level = levelFromXp(xp);
  const current = xpForLevel(level);
  const next = xpForLevel(level + 1);
  const pct = Math.round(((xp - current) / (next - current)) * 100);
  return { level, current, next, pct: Math.max(0, Math.min(100, pct)), name: levelName(level) };
}
