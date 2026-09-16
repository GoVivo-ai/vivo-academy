"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "motion/react";
import { LayoutDashboard, BarChart3, Users } from "lucide-react";
import { BookIcon, RouteIcon, LiveIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils";

export function AdminNav({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname();
  const items = [
    { href: "/admin", label: "Resumen", icon: <LayoutDashboard className="size-[18px]" />, exact: true },
    { href: "/admin/cursos", label: "Cursos", icon: <BookIcon size={22} /> },
    { href: "/admin/rutas", label: "Rutas", icon: <RouteIcon size={22} /> },
    { href: "/admin/en-vivo", label: "Clases en vivo", icon: <LiveIcon size={22} /> },
    ...(isAdmin ? [{ href: "/admin/usuarios", label: "Usuarios", icon: <Users className="size-[18px]" /> }] : []),
    { href: "/admin/reportes", label: "Reportes", icon: <BarChart3 className="size-[18px]" /> },
  ];

  return (
    <div className="sticky top-16 z-20 -mx-1 flex gap-1 overflow-x-auto rounded-full border bg-card/90 p-1.5 shadow-sm backdrop-blur">
      {items.map((it) => {
        const active = it.exact ? pathname === it.href : pathname.startsWith(it.href);
        return (
          <Link key={it.href} href={it.href} className="relative shrink-0">
            {active && <motion.span layoutId="admin-nav" className="absolute inset-0 rounded-full bg-brand-green shadow-md" transition={{ type: "spring", stiffness: 420, damping: 34 }} />}
            <span className={cn("relative flex items-center gap-2 rounded-full px-4 py-2 text-sm font-bold transition-colors", active ? "text-brand-navy" : "text-muted-foreground hover:text-foreground")}>
              <span className={cn(active && "text-brand-navy")}>{it.icon}</span>
              {it.label}
            </span>
          </Link>
        );
      })}
    </div>
  );
}
