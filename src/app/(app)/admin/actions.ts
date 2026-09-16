"use server";

import { and, asc, count, eq, inArray, max, sql } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole, requireUser } from "@/auth";
import { db } from "@/db";
import {
  courses,
  learningPaths,
  lessons,
  liveSessions,
  modules,
  notifications,
  options,
  pathAssignments,
  pathCourses,
  questions,
  quizzes,
  resources,
  users,
  sessions,
  xpEvents,
  userBadges,
  lessonProgress,
  quizAttempts,
  certificates,
  enrollments,
} from "@/db/schema";
import { slugify } from "@/lib/format";
import { assignPathsForUser } from "@/lib/paths";
import { nanoid } from "nanoid";

const staff = () => requireRole("instructor");

// ---------- Cursos ----------
export async function createCourseAction(formData: FormData) {
  const me = await staff();
  const title = String(formData.get("title") ?? "").trim();
  if (!title) return;
  let slug = slugify(title) || nanoid(6);
  const exists = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, slug));
  if (exists.length) slug = `${slug}-${nanoid(4).toLowerCase()}`;
  const [c] = await db.insert(courses).values({ title, slug, instructorId: me.id }).returning();
  await db.insert(modules).values({ courseId: c.id, title: "Módulo 1", order: 0 });
  revalidatePath("/admin/cursos");
  redirect(`/admin/cursos/${c.id}`);
}

export async function updateCourseAction(id: string, data: { title: string; description: string; category: string; level: "basico" | "intermedio" | "avanzado"; estimatedMinutes: number; cover: string | null; published: boolean }) {
  await staff();
  const wasPublished = (await db.select({ p: courses.published }).from(courses).where(eq(courses.id, id)))[0]?.p;
  await db.update(courses).set({ ...data, updatedAt: new Date() }).where(eq(courses.id, id));
  if (data.published && !wasPublished) {
    const all = await db.select({ id: users.id }).from(users);
    if (all.length) {
      await db.insert(notifications).values(all.map((u) => ({ userId: u.id, type: "course", title: `Nuevo curso: ${data.title}`, body: "Ya está disponible en el catálogo.", href: `/cursos` })));
    }
  }
  revalidatePath("/admin/cursos");
  revalidatePath(`/admin/cursos/${id}`);
  revalidatePath("/cursos");
}

export async function deleteCourseAction(id: string) {
  await requireRole();
  await db.delete(courses).where(eq(courses.id, id));
  revalidatePath("/admin/cursos");
  redirect("/admin/cursos");
}

export async function togglePublishAction(id: string, published: boolean) {
  await staff();
  await db.update(courses).set({ published }).where(eq(courses.id, id));
  revalidatePath("/admin/cursos");
  revalidatePath("/cursos");
}

// ---------- Módulos ----------
export async function addModuleAction(courseId: string, title: string) {
  await staff();
  const [{ m }] = await db.select({ m: max(modules.order) }).from(modules).where(eq(modules.courseId, courseId));
  await db.insert(modules).values({ courseId, title: title || "Nuevo módulo", order: (m ?? -1) + 1 });
  revalidatePath(`/admin/cursos/${courseId}`);
}
export async function renameModuleAction(id: string, title: string) {
  await staff();
  await db.update(modules).set({ title }).where(eq(modules.id, id));
}
export async function deleteModuleAction(id: string, courseId: string) {
  await staff();
  await db.delete(modules).where(eq(modules.id, id));
  revalidatePath(`/admin/cursos/${courseId}`);
}
export async function reorderModulesAction(courseId: string, ids: string[]) {
  await staff();
  await Promise.all(ids.map((id, i) => db.update(modules).set({ order: i }).where(and(eq(modules.id, id), eq(modules.courseId, courseId)))));
  revalidatePath(`/admin/cursos/${courseId}`);
}

// ---------- Lecciones ----------
export type LessonInput = {
  type: "video" | "text" | "pdf" | "embed" | "quiz";
  title: string;
  content: string;
  blobUrl: string | null;
  durationSec: number;
  xpReward: number;
};

export async function addLessonAction(moduleId: string, courseId: string, input: LessonInput) {
  await staff();
  const [{ m }] = await db.select({ m: max(lessons.order) }).from(lessons).where(eq(lessons.moduleId, moduleId));
  const [l] = await db.insert(lessons).values({ moduleId, ...input, order: (m ?? -1) + 1 }).returning();
  if (input.type === "quiz") await db.insert(quizzes).values({ lessonId: l.id, title: input.title }).onConflictDoNothing();
  revalidatePath(`/admin/cursos/${courseId}`);
  return l.id;
}
export async function updateLessonAction(id: string, courseId: string, input: LessonInput) {
  await staff();
  await db.update(lessons).set(input).where(eq(lessons.id, id));
  if (input.type === "quiz") await db.insert(quizzes).values({ lessonId: id, title: input.title }).onConflictDoNothing();
  revalidatePath(`/admin/cursos/${courseId}`);
}
export async function deleteLessonAction(id: string, courseId: string) {
  await staff();
  await db.delete(lessons).where(eq(lessons.id, id));
  revalidatePath(`/admin/cursos/${courseId}`);
}
export async function reorderLessonsAction(courseId: string, moduleId: string, ids: string[]) {
  await staff();
  await Promise.all(ids.map((id, i) => db.update(lessons).set({ order: i, moduleId }).where(eq(lessons.id, id))));
  revalidatePath(`/admin/cursos/${courseId}`);
}

// ---------- Material de apoyo ----------
export type ResourceInput = {
  kind: "pdf" | "doc" | "sheet" | "slide" | "image" | "video" | "zip" | "link";
  title: string;
  description: string;
  url: string;
  sizeBytes: number | null;
  lessonId: string | null;
};

export async function addResourceAction(courseId: string, input: ResourceInput) {
  await staff();
  const [{ m }] = await db.select({ m: max(resources.order) }).from(resources).where(eq(resources.courseId, courseId));
  await db.insert(resources).values({ courseId, ...input, order: (m ?? -1) + 1 });
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function updateResourceAction(id: string, courseId: string, input: ResourceInput) {
  await staff();
  await db.update(resources).set(input).where(eq(resources.id, id));
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function deleteResourceAction(id: string, courseId: string) {
  await staff();
  await db.delete(resources).where(eq(resources.id, id));
  revalidatePath(`/admin/cursos/${courseId}`);
}

// ---------- Quiz ----------
export type QuestionInput = {
  id?: string;
  type: "multiple" | "truefalse" | "order" | "short";
  prompt: string;
  explanation: string;
  accepted: string[];
  options: Array<{ id?: string; text: string; correct: boolean }>;
};

export async function saveQuizAction(lessonId: string, courseId: string, data: { title: string; passScore: number; shuffle: boolean; questions: QuestionInput[] }) {
  await staff();
  const [q] = await db
    .insert(quizzes)
    .values({ lessonId, title: data.title, passScore: data.passScore, shuffle: data.shuffle })
    .onConflictDoUpdate({ target: quizzes.lessonId, set: { title: data.title, passScore: data.passScore, shuffle: data.shuffle } })
    .returning();
  // Reemplazo completo (simple y seguro para <50 usuarios)
  await db.delete(questions).where(eq(questions.quizId, q.id));
  for (const [i, qq] of data.questions.entries()) {
    if (!qq.prompt.trim()) continue;
    const [row] = await db
      .insert(questions)
      .values({ quizId: q.id, type: qq.type, prompt: qq.prompt, explanation: qq.explanation || null, meta: { accepted: qq.accepted.filter(Boolean) }, order: i })
      .returning();
    const opts = qq.type === "truefalse" ? [{ text: "Verdadero", correct: qq.options[0]?.correct ?? true }, { text: "Falso", correct: !(qq.options[0]?.correct ?? true) }] : qq.type === "short" ? [] : qq.options.filter((o) => o.text.trim());
    if (opts.length) await db.insert(options).values(opts.map((o, j) => ({ questionId: row.id, text: o.text, correct: qq.type === "order" ? true : o.correct, order: j })));
  }
  revalidatePath(`/admin/cursos/${courseId}`);
}

export async function getQuizForEditor(lessonId: string) {
  await staff();
  const q = await db.query.quizzes.findFirst({ where: eq(quizzes.lessonId, lessonId), with: { questions: { orderBy: [asc(questions.order)], with: { options: { orderBy: [asc(options.order)] } } } } });
  if (!q) return null;
  return {
    title: q.title,
    passScore: q.passScore,
    shuffle: q.shuffle,
    questions: q.questions.map((qq) => ({
      id: qq.id,
      type: qq.type,
      prompt: qq.prompt,
      explanation: qq.explanation ?? "",
      accepted: qq.meta?.accepted ?? [],
      options: qq.type === "truefalse" ? [{ id: qq.options[0]?.id, text: "Verdadero", correct: qq.options[0]?.correct ?? true }] : qq.options.map((o) => ({ id: o.id, text: o.text, correct: o.correct })),
    })),
  };
}

// ---------- Rutas ----------
export async function savePathAction(data: { id?: string; title: string; description: string; jobRole: string | null; courseIds: string[] }) {
  await staff();
  let id = data.id;
  if (id) {
    await db.update(learningPaths).set({ title: data.title, description: data.description, jobRole: data.jobRole }).where(eq(learningPaths.id, id));
    await db.delete(pathCourses).where(eq(pathCourses.pathId, id));
  } else {
    const [p] = await db.insert(learningPaths).values({ title: data.title, description: data.description, jobRole: data.jobRole }).returning();
    id = p.id;
  }
  if (data.courseIds.length) await db.insert(pathCourses).values(data.courseIds.map((courseId, i) => ({ pathId: id!, courseId, order: i })));
  // Asignar automáticamente a usuarios con ese cargo
  if (data.jobRole) {
    const targets = await db.select({ id: users.id }).from(users).where(eq(users.jobRole, data.jobRole));
    for (const t of targets) await assignPathsForUser(t.id);
  }
  revalidatePath("/admin/rutas");
  revalidatePath("/rutas");
}
export async function deletePathAction(id: string) {
  await staff();
  await db.delete(learningPaths).where(eq(learningPaths.id, id));
  revalidatePath("/admin/rutas");
}
export async function assignPathToUsersAction(pathId: string, userIds: string[]) {
  await staff();
  if (userIds.length === 0) return;
  await db.insert(pathAssignments).values(userIds.map((userId) => ({ pathId, userId }))).onConflictDoNothing();
  const [p] = await db.select().from(learningPaths).where(eq(learningPaths.id, pathId));
  await db.insert(notifications).values(userIds.map((userId) => ({ userId, type: "path", title: `Nueva ruta asignada: ${p.title}`, body: "Revisa tu ruta de aprendizaje.", href: "/rutas" })));
  revalidatePath("/admin/rutas");
}

// ---------- Sesiones en vivo ----------
export async function createLiveSessionAction(formData: FormData) {
  const me = await staff();
  const title = String(formData.get("title") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const scheduledAt = new Date(String(formData.get("scheduledAt")));
  const durationMin = Number(formData.get("durationMin") || 60);
  const courseId = String(formData.get("courseId") || "") || null;
  if (!title || isNaN(scheduledAt.getTime())) return;
  const [s] = await db.insert(liveSessions).values({ title, description, hostId: me.id, scheduledAt, durationMin, courseId, roomName: `vivo-${nanoid(10)}` }).returning();
  const all = await db.select({ id: users.id }).from(users);
  if (all.length) {
    await db.insert(notifications).values(all.map((u) => ({ userId: u.id, type: "live", title: `Nueva clase en vivo: ${title}`, body: `Programada para ${scheduledAt.toLocaleString("es-CO", { timeZone: "America/Bogota", dateStyle: "medium", timeStyle: "short" })}.`, href: `/en-vivo/${s.id}` })));
  }
  revalidatePath("/admin/en-vivo");
  revalidatePath("/en-vivo");
  revalidatePath("/inicio");
}
export async function cancelLiveSessionAction(id: string) {
  await staff();
  await db.update(liveSessions).set({ status: "cancelada" }).where(eq(liveSessions.id, id));
  revalidatePath("/admin/en-vivo");
  revalidatePath("/en-vivo");
}
export async function deleteLiveSessionAction(id: string) {
  await requireRole();
  await db.delete(liveSessions).where(eq(liveSessions.id, id));
  revalidatePath("/admin/en-vivo");
  revalidatePath("/en-vivo");
}

// ---------- Usuarios ----------
export async function updateUserAction(id: string, data: { role: "admin" | "instructor" | "colaborador"; jobRole: string | null }) {
  const me = await requireRole();
  if (me.id === id && data.role !== "admin") throw new Error("No puedes quitarte el rol de administrador.");
  await db.update(users).set(data).where(eq(users.id, id));
  await assignPathsForUser(id);
  revalidatePath("/admin/usuarios");
}

/** Activa o desactiva una cuenta. Al desactivar se cierran sus sesiones abiertas. */
export async function setUserActiveAction(id: string, active: boolean) {
  const me = await requireRole();
  if (me.id === id && !active) throw new Error("No puedes desactivar tu propia cuenta.");
  if (!active) {
    const [target] = await db.select({ role: users.role }).from(users).where(eq(users.id, id));
    if (target?.role === "admin") {
      const [{ admins }] = await db.select({ admins: count() }).from(users).where(and(eq(users.role, "admin"), eq(users.active, true)));
      if (admins <= 1) throw new Error("Debe quedar al menos un administrador activo.");
    }
  }
  await db.update(users).set({ active }).where(eq(users.id, id));
  if (!active) await db.delete(sessions).where(eq(sessions.userId, id));
  revalidatePath("/admin/usuarios");
}

/** Borra el progreso de una persona: XP, racha, insignias, inscripciones, quizzes y certificados. */
export async function resetUserProgressAction(id: string) {
  await requireRole();
  await Promise.all([
    db.delete(xpEvents).where(eq(xpEvents.userId, id)),
    db.delete(userBadges).where(eq(userBadges.userId, id)),
    db.delete(lessonProgress).where(eq(lessonProgress.userId, id)),
    db.delete(quizAttempts).where(eq(quizAttempts.userId, id)),
    db.delete(certificates).where(eq(certificates.userId, id)),
    db.delete(enrollments).where(eq(enrollments.userId, id)),
    db.delete(notifications).where(eq(notifications.userId, id)),
  ]);
  await db.update(users).set({ xp: 0, level: 1, streakCurrent: 0, streakBest: 0, lastActivityDate: null }).where(eq(users.id, id));
  revalidatePath("/admin/usuarios");
  revalidatePath("/", "layout");
}

export async function bulkSetJobRoleAction(ids: string[], jobRole: string) {
  await requireRole();
  if (!ids.length) return;
  await db.update(users).set({ jobRole }).where(inArray(users.id, ids));
  for (const id of ids) await assignPathsForUser(id);
  revalidatePath("/admin/usuarios");
}

export async function listJobRolesAction() {
  await requireUser();
  const rows = await db.selectDistinct({ jobRole: users.jobRole }).from(users).where(sql`${users.jobRole} is not null`);
  return rows.map((r) => r.jobRole!).sort();
}
