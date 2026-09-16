import Link from "next/link";
import { desc, eq, gte, sql, sum } from "drizzle-orm";
import { Crown, Flame, Medal } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { users, xpEvents } from "@/db/schema";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { nowMs } from "@/lib/time";

export const metadata = { title: "Ranking" };

type Period = "semana" | "mes" | "historico";

export default async function RankingPage({ searchParams }: PageProps<"/ranking">) {
  const me = await requireUser();
  const sp = await searchParams;
  const period = (["semana", "mes", "historico"].includes(String(sp.periodo)) ? sp.periodo : "semana") as Period;

  const since = period === "semana" ? new Date(nowMs() - 7 * 86_400_000) : period === "mes" ? new Date(nowMs() - 30 * 86_400_000) : null;

  const rows = since
    ? await db
        .select({ id: users.id, name: users.name, image: users.image, jobRole: users.jobRole, streak: users.streakCurrent, xp: sum(xpEvents.amount).mapWith(Number) })
        .from(xpEvents)
        .innerJoin(users, eq(users.id, xpEvents.userId))
        .where(gte(xpEvents.createdAt, since))
        .groupBy(users.id)
        .orderBy(desc(sql`sum(${xpEvents.amount})`))
        .limit(50)
    : await db
        .select({ id: users.id, name: users.name, image: users.image, jobRole: users.jobRole, streak: users.streakCurrent, xp: users.xp })
        .from(users)
        .orderBy(desc(users.xp))
        .limit(50);

  const myIdx = rows.findIndex((r) => r.id === me.id);
  const top3 = rows.slice(0, 3);
  const rest = rows.slice(3);

  const tab = (p: Period, label: string) => (
    <Link href={`/ranking?periodo=${p}`} className={cn("rounded-full px-4 py-1.5 text-sm font-medium transition", period === p ? "bg-primary text-primary-foreground" : "hover:bg-muted")}>
      {label}
    </Link>
  );

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Ranking</h1>
          <p className="text-muted-foreground">{myIdx === -1 ? "Aún no tienes XP en este periodo. ¡Completa una lección!" : `Vas en el puesto #${myIdx + 1}`}</p>
        </div>
        <div className="flex gap-1 rounded-full border p-1">{tab("semana", "Semana")}{tab("mes", "Mes")}{tab("historico", "Histórico")}</div>
      </div>

      {rows.length === 0 ? (
        <p className="rounded-3xl border border-dashed p-12 text-center text-muted-foreground">Nadie ha sumado XP todavía. ¡Sé el primero!</p>
      ) : (
        <>
          <div className="grid grid-cols-3 items-end gap-3">
            {[top3[1], top3[0], top3[2]].map((r, i) => {
              if (!r) return <div key={i} />;
              const place = i === 1 ? 1 : i === 0 ? 2 : 3;
              return (
                <div key={r.id} className={cn("flex flex-col items-center rounded-3xl border bg-card p-4 text-center", place === 1 && "border-brand-yellow bg-gradient-to-b from-brand-yellow/15 to-card pb-8", r.id === me.id && "ring-2 ring-primary")}>
                  {place === 1 && <Crown className="mb-1 size-6 text-brand-gold" />}
                  <Avatar className={cn(place === 1 ? "size-20" : "size-14", "ring-4", place === 1 ? "ring-brand-yellow" : place === 2 ? "ring-slate-300" : "ring-[#cd7f32]")}>
                    <AvatarImage src={r.image ?? undefined} /><AvatarFallback>{initials(r.name)}</AvatarFallback>
                  </Avatar>
                  <p className="mt-2 line-clamp-1 font-semibold">{r.name?.split(" ").slice(0, 2).join(" ")}</p>
                  <p className="text-sm text-muted-foreground">{r.xp.toLocaleString("es-CO")} XP</p>
                  <span className={cn("mt-2 grid size-7 place-items-center rounded-full text-sm font-bold text-white", place === 1 ? "bg-brand-yellow text-brand-navy" : place === 2 ? "bg-slate-400" : "bg-[#cd7f32]")}>{place}</span>
                </div>
              );
            })}
          </div>

          <ol className="divide-y overflow-hidden rounded-3xl border bg-card">
            {rest.map((r, i) => (
              <li key={r.id} className={cn("flex items-center gap-4 px-4 py-3", r.id === me.id && "bg-primary/10")}>
                <span className="w-8 text-center font-bold tabular-nums text-muted-foreground">{i + 4}</span>
                <Avatar className="size-9"><AvatarImage src={r.image ?? undefined} /><AvatarFallback>{initials(r.name)}</AvatarFallback></Avatar>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{r.name}{r.id === me.id && <span className="ml-2 text-xs text-primary">(tú)</span>}</p>
                  <p className="truncate text-xs text-muted-foreground">{r.jobRole ?? "Colaborador"}</p>
                </div>
                {r.streak > 0 && <span className="flex items-center gap-1 text-sm text-brand-gold"><Flame className="size-4 fill-brand-gold" />{r.streak}</span>}
                <span className="font-semibold tabular-nums">{r.xp.toLocaleString("es-CO")} XP</span>
              </li>
            ))}
            {rest.length === 0 && top3.length > 0 && <li className="px-4 py-6 text-center text-sm text-muted-foreground"><Medal className="mx-auto mb-1 size-5" />Todavía hay lugar en el podio.</li>}
          </ol>
        </>
      )}
    </div>
  );
}
