import Image from "next/image";
import { cn } from "@/lib/utils";

/** Logotipo Vivo (manual de marca). `variant="white"` para fondos azules u oscuros. */
export function VivoLogo({ variant = "blue", className, height = 28 }: { variant?: "blue" | "white"; className?: string; height?: number }) {
  const src = variant === "white" ? "/brand/logo-white.svg" : "/brand/logo.svg";
  return <Image src={src} alt="Vivo" width={Math.round(height * 3.09)} height={height} priority className={cn("w-auto", className)} style={{ height, width: "auto" }} />;
}

/** Isotipo (la "vo" con el degradado). */
export function VivoMark({ variant = "blue", className, size = 32 }: { variant?: "blue" | "white"; className?: string; size?: number }) {
  const src = variant === "white" ? "/brand/mark-white.svg" : "/brand/mark.svg";
  return <Image src={src} alt="" width={Math.round(size * 1.69)} height={size} className={cn("w-auto", className)} style={{ height: size, width: "auto" }} aria-hidden />;
}

/**
 * Unidad `x` del manual de marca: el diámetro del contraforma de la "o" del
 * logotipo. Medida sobre el artwork oficial, x ≈ 0.27 × la altura del logotipo.
 */
const X = 0.27;

/**
 * Marca de la academia: logotipo Vivo + divisoria + "ACADEMY".
 *
 * El panel "Co-Branding" del manual define la separación en unidades `x`: va 1x
 * entre el logotipo y la línea, y 1x entre la línea y lo que sigue. El `gap` del
 * flex reparte justo esa distancia a ambos lados de la divisoria.
 *
 * Ojo: el manual solo documenta el co-branding entre dos logotipos; no cubre el
 * caso logotipo + palabra. La altura de la línea (0.75x del logotipo) sale de
 * medir el diagrama; el peso de "ACADEMY" sigue la jerarquía del Design System
 * (level-04, etiqueta = Nunito Sans Bold). Ambas están pendientes de que Felipe
 * las confirme.
 */
export function AcademyBrand({ variant = "white", className, height = 26 }: { variant?: "blue" | "white"; className?: string; height?: number }) {
  const onDark = variant === "white";
  return (
    <span className={cn("inline-flex items-center", className)} style={{ gap: Math.round(height * X) }}>
      <VivoLogo variant={variant} height={height} />
      <span aria-hidden className={cn("w-px shrink-0 rounded-full", onDark ? "bg-white/30" : "bg-brand-navy/25")} style={{ height: Math.round(height * 0.75) }} />
      <span className={cn("font-sans font-bold uppercase leading-none tracking-[0.2em]", onDark ? "text-brand-green" : "text-brand-green-600")} style={{ fontSize: Math.round(height * 0.5) }}>Academy</span>
    </span>
  );
}
