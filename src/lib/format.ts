import { format, formatDistanceToNow, isToday, isTomorrow } from "date-fns";
import { es } from "date-fns/locale";

export function fmtDate(d: Date | string) {
  return format(new Date(d), "d 'de' MMMM, yyyy", { locale: es });
}

export function fmtDateTime(d: Date | string) {
  const date = new Date(d);
  const time = format(date, "h:mm a", { locale: es });
  if (isToday(date)) return `Hoy, ${time}`;
  if (isTomorrow(date)) return `Mañana, ${time}`;
  return `${format(date, "EEE d MMM", { locale: es })}, ${time}`;
}

export function fmtRelative(d: Date | string) {
  return formatDistanceToNow(new Date(d), { locale: es, addSuffix: true });
}

export function fmtMinutes(min: number) {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m ? `${h} h ${m} min` : `${h} h`;
}

export function initials(name?: string | null) {
  if (!name) return "?";
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0]!.toUpperCase())
    .join("");
}

export function slugify(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}
