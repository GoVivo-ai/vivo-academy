"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { AcademyBrand, VivoMark } from "@/components/brand/logo";
import { HomeIcon, BookIcon, RouteIcon, LiveIcon, RankIcon, ProfileIcon, AdminIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

type Item = { href: string; label: string; icon: typeof HomeIcon };

const items: Item[] = [
  { href: "/inicio", label: "Inicio", icon: HomeIcon },
  { href: "/cursos", label: "Cursos", icon: BookIcon },
  { href: "/rutas", label: "Mi ruta", icon: RouteIcon },
  { href: "/en-vivo", label: "En vivo", icon: LiveIcon },
  { href: "/ranking", label: "Ranking", icon: RankIcon },
  { href: "/perfil", label: "Perfil", icon: ProfileIcon },
];

export function Sidebar({ isStaff, onNavigate }: { isStaff: boolean; appName?: string; onNavigate?: () => void }) {
  const pathname = usePathname();
  const all = isStaff ? [...items, { href: "/admin", label: "Administrar", icon: AdminIcon }] : items;

  return (
    <nav className="relative flex h-full flex-col gap-1.5 overflow-hidden bg-sidebar p-4 text-sidebar-foreground">
      <VivoMark variant="white" size={260} className="pointer-events-none absolute -bottom-16 -right-24 opacity-[0.06]" />
      <Link href="/inicio" className="relative mb-6 flex items-center px-2 pt-1" onClick={onNavigate} aria-label="Ir al inicio">
        <AcademyBrand variant="white" />
      </Link>
      {all.map((it) => {
        const active = pathname === it.href || pathname.startsWith(it.href + "/");
        return (
          <Link key={it.href} href={it.href} onClick={onNavigate} className="group relative block">
            {active && <motion.span layoutId="nav-active" className="absolute inset-0 rounded-2xl bg-brand-green shadow-[0_8px_24px_-8px_rgba(4,217,139,0.9)]" transition={{ type: "spring", stiffness: 380, damping: 32 }} />}
            <span className={cn("relative flex items-center gap-3 rounded-2xl px-3 py-2 text-[15px] font-semibold transition-colors duration-150", active ? "text-brand-navy" : "text-white/75 group-hover:text-white")}>
              <span className={cn("grid size-9 place-items-center rounded-xl transition", active ? "bg-white/40" : "bg-white/5 group-hover:bg-white/10")}>
                <it.icon size={24} active={active} onDark={!active} />
              </span>
              {it.label}
            </span>
          </Link>
        );
      })}
      <p className="relative mt-auto px-2 pb-10 pl-14 text-[11px] leading-tight text-white/40 md:pb-2 md:pl-2">Aprende · compite · certifícate</p>
    </nav>
  );
}

/** Barra inferior para móvil */
export function MobileNav({ isStaff }: { isStaff: boolean }) {
  const pathname = usePathname();
  const all = isStaff ? [...items.slice(0, 4), { href: "/admin", label: "Admin", icon: AdminIcon }] : items.slice(0, 5);
  return (
    <nav className="fixed inset-x-0 bottom-0 z-40 grid grid-cols-5 border-t border-sidebar-border bg-sidebar text-sidebar-foreground md:hidden">
      {all.map((it) => {
        const active = pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className={cn("flex flex-col items-center gap-0.5 py-2 text-[11px] font-semibold", active ? "text-brand-green" : "text-white/60")}>
            <span className={cn("grid size-9 place-items-center rounded-xl", active && "bg-brand-green")}><it.icon size={22} active={active} onDark={!active} /></span>
            {it.label}
          </Link>
        );
      })}
    </nav>
  );
}
