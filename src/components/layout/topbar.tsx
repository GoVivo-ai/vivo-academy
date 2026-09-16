"use client";

import Link from "next/link";
import { useTheme } from "@/components/theme";
import { Moon, Sun, LogOut, Menu, UserRound, Award, Trophy } from "lucide-react";
import { BoltIcon, FlameIcon } from "@/components/brand/icons";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Sheet, SheetContent, SheetTrigger, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Sidebar } from "./sidebar";
import { VivoLogo } from "@/components/brand/logo";
import { NotificationsMenu } from "./notifications-menu";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { useState } from "react";

export type TopbarUser = {
  name: string | null;
  email: string;
  image: string | null;
  xp: number;
  level: number;
  levelName: string;
  levelPct: number;
  streak: number;
  streakDoneToday: boolean;
  streakAtRisk: boolean;
  unread: number;
  isStaff: boolean;
};

export function Topbar({ user, onSignOut }: { user: TopbarUser; appName?: string; onSignOut: () => Promise<void> }) {
  const { resolvedTheme, setTheme } = useTheme();
  const [open, setOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center gap-2 border-b border-border/60 bg-background/80 px-3 backdrop-blur md:px-10">
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetTrigger render={<Button variant="ghost" size="icon" className="md:hidden" aria-label="Menú" />}>
          <Menu className="size-5" />
        </SheetTrigger>
        <SheetContent side="left" className="w-64 p-0">
          <SheetTitle className="sr-only">Navegación</SheetTitle>
          <Sidebar isStaff={user.isStaff} onNavigate={() => setOpen(false)} />
        </SheetContent>
      </Sheet>

      <Link href="/inicio" className="md:hidden" aria-label="Inicio"><VivoLogo height={22} /></Link>

      <div className="ml-auto flex items-center gap-1 md:gap-2">
        {/* XP / nivel */}
        <Tooltip>
          <TooltipTrigger render={<Link href="/perfil" className="hidden sm:flex items-center gap-2 rounded-full bg-brand-navy px-3.5 py-1.5 text-sm text-white shadow-sm transition hover:bg-brand-navy-700" />}>
              <BoltIcon size={18} />
              <span className="font-heading font-bold tabular-nums">{user.xp.toLocaleString("es-CO")} XP</span>
              <span className="text-white/60">· Nv {user.level}</span>
              <span className="ml-1 h-1.5 w-16 overflow-hidden rounded-full bg-white/20">
                <span className="block h-full bg-brand-swoosh" style={{ width: `${user.levelPct}%` }} />
              </span>
            </TooltipTrigger>
          <TooltipContent>{user.levelName} · {user.levelPct}% para el siguiente nivel</TooltipContent>
        </Tooltip>

        {/* Racha */}
        <Tooltip>
          <TooltipTrigger render={<Link
              href="/inicio"
              className={cn(
                "flex items-center gap-1 rounded-full border px-3 py-1.5 text-sm font-heading font-bold tabular-nums transition",
                user.streakDoneToday ? "border-brand-yellow bg-brand-yellow text-brand-navy" : "border-border bg-card text-muted-foreground hover:bg-muted",
              )}
             />}>
              <FlameIcon size={20} active={user.streakDoneToday || user.streakAtRisk} />
              {user.streak}
            </TooltipTrigger>
          <TooltipContent>
            {user.streakDoneToday ? "¡Racha activa hoy!" : user.streakAtRisk ? "Tu racha está en riesgo: completa algo hoy" : "Empieza una racha hoy"}
          </TooltipContent>
        </Tooltip>

        <NotificationsMenu unread={user.unread} />

        <Button
          variant="ghost"
          size="icon"
          aria-label="Cambiar tema"
          onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        >
          <Sun className="size-5 dark:hidden" />
          <Moon className="hidden size-5 dark:block" />
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger render={<button className="ml-1 rounded-full ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2" />}>
              <Avatar className="size-8">
                <AvatarImage src={user.image ?? undefined} alt={user.name ?? ""} />
                <AvatarFallback>{initials(user.name)}</AvatarFallback>
              </Avatar>
            </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-64 overflow-hidden rounded-2xl p-0">
            <div className="flex items-center gap-3 border-b bg-muted p-3">
              <Avatar className="size-10 ring-2 ring-brand-green">
                <AvatarImage src={user.image ?? undefined} alt="" />
                <AvatarFallback className="bg-brand-navy text-white">{initials(user.name)}</AvatarFallback>
              </Avatar>
              <div className="min-w-0">
                <p className="truncate font-heading text-sm font-bold">{user.name}</p>
                <p className="truncate text-xs text-muted-foreground">{user.email}</p>
              </div>
            </div>
            <div className="flex items-center justify-between border-b px-3 py-2 text-xs">
              <span className="font-bold text-muted-foreground">Nivel {user.level} · {user.levelName}</span>
              <span className="font-heading font-bold text-brand-green-600">{user.xp.toLocaleString("es-CO")} XP</span>
            </div>
            <div className="p-1.5">
              <DropdownMenuItem className="rounded-xl" render={<Link href="/perfil" />}><UserRound className="size-4" />Mi perfil</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl" render={<Link href="/perfil#certificados" />}><Award className="size-4" />Mis certificados</DropdownMenuItem>
              <DropdownMenuItem className="rounded-xl" render={<Link href="/ranking" />}><Trophy className="size-4" />Ranking</DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => onSignOut()} className="rounded-xl text-destructive">
                <LogOut className="size-4" /> Cerrar sesión
              </DropdownMenuItem>
            </div>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
