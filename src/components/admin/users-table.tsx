"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, Search, RotateCcw, ShieldCheck, UserRoundCog, UserRound } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { FlameIcon, BoltIcon } from "@/components/brand/icons";
import { bulkSetJobRoleAction, resetUserProgressAction, setUserActiveAction, updateUserAction } from "@/app/(app)/admin/actions";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";

type U = {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
  role: "admin" | "instructor" | "colaborador";
  active: boolean;
  jobRole: string | null;
  xp: number;
  level: number;
  streak: number;
};

const roleMeta = {
  admin: { label: "Administrador", icon: ShieldCheck, cls: "bg-brand-navy text-white" },
  instructor: { label: "Instructor", icon: UserRoundCog, cls: "bg-brand-green text-brand-navy" },
  colaborador: { label: "Colaborador", icon: UserRound, cls: "bg-muted text-muted-foreground" },
} as const;

export function UsersTable({ users, jobRoles, meId }: { users: U[]; jobRoles: string[]; meId: string }) {
  const router = useRouter();
  const [q, setQ] = useState("");
  const [filter, setFilter] = useState<"todos" | "activos" | "inactivos">("todos");
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [bulkRole, setBulkRole] = useState("");
  const [pending, start] = useTransition();

  const list = users.filter((u) => {
    if (filter === "activos" && !u.active) return false;
    if (filter === "inactivos" && u.active) return false;
    return `${u.name} ${u.email} ${u.jobRole}`.toLowerCase().includes(q.toLowerCase());
  });

  const run = (fn: () => Promise<void>, ok: string) =>
    start(async () => {
      try {
        await fn();
        toast.success(ok);
        router.refresh();
      } catch (e) {
        toast.error((e as Error).message);
      }
    });

  const update = (u: U, patch: Partial<Pick<U, "role" | "jobRole">>) =>
    run(() => updateUserAction(u.id, { role: patch.role ?? u.role, jobRole: patch.jobRole !== undefined ? patch.jobRole : u.jobRole }), "Actualizado");

  const chip = (v: typeof filter, label: string, n: number) => (
    <button key={v} onClick={() => setFilter(v)} className={cn("rounded-full px-3.5 py-1.5 text-sm font-bold transition", filter === v ? "bg-brand-navy text-white" : "text-muted-foreground hover:text-foreground")}>
      {label} <span className={cn("ml-1 rounded-full px-1.5 text-xs", filter === v ? "bg-white/20" : "bg-muted")}>{n}</span>
    </button>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative">
          <Search className="absolute left-3 top-3 size-4 text-muted-foreground" />
          <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Buscar persona…" className="h-10 w-64 rounded-full pl-9" />
        </div>
        <div className="flex gap-1 rounded-full border bg-card p-1">
          {chip("todos", "Todos", users.length)}
          {chip("activos", "Activos", users.filter((u) => u.active).length)}
          {chip("inactivos", "Inactivos", users.filter((u) => !u.active).length)}
        </div>
        {sel.size > 0 && (
          <div className="flex items-center gap-2 rounded-full border bg-muted/40 px-3 py-1.5 text-sm">
            <span className="font-semibold">{sel.size} seleccionados</span>
            <Input list="jobroles-bulk" value={bulkRole} onChange={(e) => setBulkRole(e.target.value)} placeholder="Asignar cargo" className="h-8 w-44 rounded-full" />
            <datalist id="jobroles-bulk">{jobRoles.map((r) => <option key={r} value={r} />)}</datalist>
            <Button size="sm" className="rounded-full" disabled={!bulkRole.trim() || pending} onClick={() => run(async () => { await bulkSetJobRoleAction([...sel], bulkRole.trim()); setSel(new Set()); }, "Cargo asignado")}>
              {pending && <Loader2 className="size-4 animate-spin" />}Aplicar
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {list.map((u) => {
          const meta = roleMeta[u.role];
          const RoleIcon = meta.icon;
          return (
            <div key={u.id} className={cn("relative overflow-hidden rounded-[1.5rem] border bg-card p-4 transition", !u.active && "border-dashed bg-muted/30")}>
              <div className="flex items-start gap-3">
                <label className="mt-1 cursor-pointer">
                  <input type="checkbox" checked={sel.has(u.id)} onChange={(e) => { const n = new Set(sel); if (e.target.checked) n.add(u.id); else n.delete(u.id); setSel(n); }} className="size-4 accent-[#04d98b]" />
                </label>
                <Avatar className={cn("size-11", !u.active && "grayscale")}>
                  <AvatarImage src={u.image ?? undefined} />
                  <AvatarFallback>{initials(u.name)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-heading font-bold leading-tight">
                    {u.name}
                    {u.id === meId && <span className="ml-1 text-xs font-semibold text-brand-green-600">(tú)</span>}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">{u.email}</p>
                  <span className={cn("mt-1.5 inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-bold", meta.cls)}>
                    <RoleIcon className="size-3" />{meta.label}
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <Switch checked={u.active} disabled={pending || u.id === meId} onCheckedChange={(v) => run(() => setUserActiveAction(u.id, v), v ? "Cuenta activada" : "Cuenta desactivada")} />
                  <span className={cn("text-[11px] font-bold", u.active ? "text-brand-green-600" : "text-muted-foreground")}>{u.active ? "Activa" : "Inactiva"}</span>
                </div>
              </div>

              <div className="mt-3 grid gap-2 sm:grid-cols-2">
                <label className="text-xs font-semibold text-muted-foreground">
                  Rol
                  <select value={u.role} disabled={u.id === meId || pending} onChange={(e) => update(u, { role: e.target.value as U["role"] })} className="mt-1 h-9 w-full rounded-xl border bg-background px-2 text-sm font-normal text-foreground">
                    <option value="colaborador">Colaborador</option>
                    <option value="instructor">Instructor</option>
                    <option value="admin">Administrador</option>
                  </select>
                </label>
                <label className="text-xs font-semibold text-muted-foreground">
                  Cargo
                  <input list="jobroles-row" defaultValue={u.jobRole ?? ""} onBlur={(e) => e.target.value.trim() !== (u.jobRole ?? "") && update(u, { jobRole: e.target.value.trim() || null })} placeholder="Sin cargo" className="mt-1 h-9 w-full rounded-xl border bg-background px-3 text-sm font-normal text-foreground" />
                </label>
              </div>

              <div className="mt-3 flex items-center justify-between border-t pt-3">
                <div className="flex items-center gap-3 text-sm">
                  <span className="flex items-center gap-1 font-bold tabular-nums"><BoltIcon size={16} />{u.xp}</span>
                  <span className="text-muted-foreground">Nv {u.level}</span>
                  {u.streak > 0 && <span className="flex items-center gap-1 font-bold tabular-nums"><FlameIcon size={16} />{u.streak}</span>}
                </div>
                <Button
                  size="sm"
                  variant="ghost"
                  className="rounded-full text-xs"
                  disabled={pending}
                  onClick={() => confirm(`¿Borrar todo el progreso de ${u.name}? Se pierden XP, racha, insignias, certificados e inscripciones.`) && run(() => resetUserProgressAction(u.id), "Progreso reiniciado")}
                >
                  <RotateCcw className="size-3.5" />Reiniciar progreso
                </Button>
              </div>
            </div>
          );
        })}
        {list.length === 0 && <p className="col-span-full rounded-[1.5rem] border border-dashed p-10 text-center text-sm text-muted-foreground">Nadie coincide con la búsqueda.</p>}
      </div>
      <datalist id="jobroles-row">{jobRoles.map((r) => <option key={r} value={r} />)}</datalist>
    </div>
  );
}
