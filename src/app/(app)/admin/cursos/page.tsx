import Link from "next/link";
import Image from "next/image";
import { count, desc, eq, sql } from "drizzle-orm";
import { Plus, Pencil, Eye, EyeOff, Users, CheckCircle2 } from "lucide-react";
import { BookIcon } from "@/components/brand/icons";
import { cn } from "@/lib/utils";
import { db } from "@/db";
import { courses, enrollments, users } from "@/db/schema";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { createCourseAction, togglePublishAction } from "../actions";
import { fmtRelative } from "@/lib/format";

export const metadata = { title: "Cursos · Admin" };

export default async function AdminCourses({ searchParams }: PageProps<"/admin/cursos">) {
  const sp = await searchParams;
  const list = await db
    .select({
      c: courses,
      instructor: users.name,
      enrolled: count(enrollments.userId),
      completed: sql<number>`count(${enrollments.completedAt})`.mapWith(Number),
    })
    .from(courses)
    .leftJoin(users, eq(users.id, courses.instructorId))
    .leftJoin(enrollments, eq(enrollments.courseId, courses.id))
    .groupBy(courses.id, users.name)
    .orderBy(desc(courses.updatedAt));

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold">Cursos</h1>
          <p className="text-sm text-muted-foreground">{list.length} cursos · {list.filter((x) => x.c.published).length} publicados</p>
        </div>
        <form action={createCourseAction} className="flex gap-2">
          <Input name="title" placeholder="Título del nuevo curso" required autoFocus={sp.nuevo === "1"} className="h-11 w-64 rounded-full" />
          <Button type="submit" className="h-11 rounded-full px-5 font-bold"><Plus className="size-4" />Crear curso</Button>
        </form>
      </div>

      {list.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-[2rem] border border-dashed p-14 text-center">
          <BookIcon size={44} active />
          <p className="font-heading text-lg font-bold">Aún no hay cursos</p>
          <p className="text-sm text-muted-foreground">Escribe un título arriba y crea el primero.</p>
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {list.map(({ c, instructor, enrolled, completed }) => (
            <div key={c.id} className="group overflow-hidden rounded-[1.75rem] border bg-card transition hover:-translate-y-1 hover:shadow-[0_20px_40px_-24px_rgba(1,22,64,0.5)]">
              <Link href={`/admin/cursos/${c.id}`} className="relative block aspect-[16/7] overflow-hidden bg-muted">
                {c.cover && <Image src={c.cover} alt="" fill sizes="400px" className="object-cover transition duration-500 group-hover:scale-105" />}
                <span className="absolute left-3 top-3 rounded-full bg-brand-navy/85 px-2.5 py-1 font-sans text-[11px] font-bold text-white backdrop-blur">{c.category}</span>
                <span className={cn("absolute right-3 top-3 rounded-full px-2.5 py-1 font-sans text-[11px] font-bold", c.published ? "bg-brand-green text-brand-navy" : "bg-white/90 text-brand-navy")}>{c.published ? "Publicado" : "Borrador"}</span>
              </Link>
              <div className="space-y-3 p-4">
                <div>
                  <Link href={`/admin/cursos/${c.id}`} className="line-clamp-1 font-heading text-lg font-bold hover:text-brand-green-600">{c.title}</Link>
                  <p className="text-xs text-muted-foreground">{instructor ?? "Sin instructor"} · {fmtRelative(c.updatedAt)}</p>
                </div>
                <div className="flex items-center gap-4 text-sm">
                  <span className="flex items-center gap-1.5 font-semibold"><Users className="size-4 text-brand-green-600" />{enrolled}<span className="font-normal text-muted-foreground">inscritos</span></span>
                  <span className="flex items-center gap-1.5 font-semibold"><CheckCircle2 className="size-4 text-brand-green-600" />{completed}<span className="font-normal text-muted-foreground">completaron</span></span>
                </div>
                <div className="flex gap-2 pt-1">
                  <Button size="sm" className="flex-1 rounded-full font-bold" render={<Link href={`/admin/cursos/${c.id}`} />}><Pencil className="size-4" />Editar</Button>
                  <form action={togglePublishAction.bind(null, c.id, !c.published)}>
                    <Button type="submit" size="sm" variant="outline" className="rounded-full" title={c.published ? "Despublicar" : "Publicar"}>{c.published ? <EyeOff className="size-4" /> : <Eye className="size-4" />}</Button>
                  </form>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
