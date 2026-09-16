import Link from "next/link";
import { desc, eq } from "drizzle-orm";
import { Award, Flame, Trophy, Zap, Download, BookOpen } from "lucide-react";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { badges, certificates, enrollments, userBadges, users } from "@/db/schema";
import { levelProgress, LEVEL_NAMES, xpForLevel } from "@/lib/gamification";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { fmtDate, initials } from "@/lib/format";
import { cn } from "@/lib/utils";
import { BadgeArt } from "@/components/brand/badge-art";

export const metadata = { title: "Perfil" };

export default async function ProfilePage() {
  const me = await requireUser();
  const [u] = await db.select().from(users).where(eq(users.id, me.id));
  const lp = levelProgress(u.xp);
  const [all, mine, certs, enr] = await Promise.all([
    db.select().from(badges),
    db.select().from(userBadges).where(eq(userBadges.userId, me.id)),
    db.query.certificates.findMany({ where: eq(certificates.userId, me.id), with: { course: true }, orderBy: [desc(certificates.issuedAt)] }),
    db.select().from(enrollments).where(eq(enrollments.userId, me.id)),
  ]);
  const mineMap = new Map(mine.map((m) => [m.badgeId, m]));
  const completed = enr.filter((e) => e.completedAt).length;

  return (
    <div className="mx-auto max-w-4xl space-y-8">
      <section className="flex flex-col items-center gap-4 rounded-3xl border bg-card p-6 sm:flex-row sm:items-start">
        <Avatar className="size-24 ring-4 ring-primary/20"><AvatarImage src={u.image ?? undefined} /><AvatarFallback className="text-2xl">{initials(u.name)}</AvatarFallback></Avatar>
        <div className="flex-1 space-y-3 text-center sm:text-left">
          <div>
            <h1 className="text-2xl font-bold">{u.name}</h1>
            <p className="text-muted-foreground">{u.jobRole ?? "Colaborador"} · {u.email}</p>
          </div>
          <div className="flex flex-wrap justify-center gap-2 sm:justify-start">
            <Chip icon={<Trophy className="size-4 text-brand-green-600" />} label={`Nivel ${lp.level} · ${lp.name}`} />
            <Chip icon={<Zap className="size-4 text-brand-gold" />} label={`${u.xp.toLocaleString("es-CO")} XP`} />
            <Chip icon={<Flame className="size-4 text-brand-gold" />} label={`Racha ${u.streakCurrent} · mejor ${u.streakBest}`} />
            <Chip icon={<BookOpen className="size-4 text-brand-green-600" />} label={`${completed} cursos completados`} />
          </div>
          <div>
            <div className="flex justify-between text-xs text-muted-foreground"><span>Nivel {lp.level}</span><span>{u.xp - lp.current}/{lp.next - lp.current} XP</span></div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-muted"><div className="h-full bg-gradient-to-r from-brand-green to-brand-yellow" style={{ width: `${lp.pct}%` }} /></div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Niveles</h2>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {LEVEL_NAMES.map((name, i) => {
            const lvl = i * 3 + 1;
            const reached = lp.level >= lvl;
            return (
              <div key={name} className={cn("min-w-32 rounded-2xl border p-3 text-center", reached ? "border-primary/40 bg-primary/5" : "opacity-60")}>
                <p className="text-xs text-muted-foreground">Nivel {lvl}+</p>
                <p className="font-semibold">{name}</p>
                <p className="text-xs text-muted-foreground">{xpForLevel(lvl).toLocaleString("es-CO")} XP</p>
              </div>
            );
          })}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-lg font-semibold">Insignias <span className="text-sm font-normal text-muted-foreground">{mine.length}/{all.length}</span></h2>
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4">
          {all.map((b) => {
            const got = mineMap.get(b.id);
            return (
              <div key={b.id} className={cn("relative flex flex-col items-center rounded-[1.5rem] border p-4 text-center transition duration-300", got ? "bg-card shadow-sm hover:-translate-y-1 hover:shadow-lg" : "border-dashed bg-muted/20")}>
                <BadgeArt id={b.id} size={84} earned={!!got} />
                <p className={cn("mt-2 font-heading font-bold leading-tight", !got && "text-muted-foreground")}>{b.title}</p>
                <p className="mt-1 text-xs text-muted-foreground">{b.description}</p>
                {got ? <p className="mt-2 rounded-full bg-brand-green/15 px-2 py-0.5 text-[11px] font-bold text-brand-green-600">{fmtDate(got.earnedAt)}</p> : <p className="mt-2 text-[11px] font-semibold text-muted-foreground">Bloqueada</p>}
              </div>
            );
          })}
        </div>
      </section>

      <section id="certificados">
        <h2 className="mb-3 text-lg font-semibold">Certificados</h2>
        {certs.length === 0 ? (
          <p className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">Completa un curso al 100% para obtener tu primer certificado.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {certs.map((c) => (
              <div key={c.id} className="flex items-center gap-4 rounded-2xl border bg-gradient-to-br from-card to-brand-green/10 p-4 dark:to-brand-green/10">
                <span className="grid size-12 shrink-0 place-items-center rounded-xl bg-brand-green/15 text-brand-navy dark:text-brand-green"><Award className="size-6" /></span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{c.course.title}</p>
                  <p className="text-xs text-muted-foreground">{fmtDate(c.issuedAt)} · {c.code}</p>
                </div>
                <Link href={`/certificados/${c.code}`} className="flex items-center gap-1 text-sm font-medium text-primary hover:underline"><Download className="size-4" />Ver</Link>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function Chip({ icon, label }: { icon: React.ReactNode; label: string }) {
  return <span className="flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm">{icon}{label}</span>;
}
