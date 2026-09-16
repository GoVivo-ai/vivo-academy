"use server";

import { and, desc, eq, isNull } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import { db } from "@/db";
import { notifications } from "@/db/schema";

export type NotifItem = { id: string; type: string; title: string; body: string; href: string | null; createdAt: Date; read: boolean };

/** Últimas notificaciones del usuario para el panel flotante. */
export async function listNotificationsAction(): Promise<NotifItem[]> {
  const me = await requireUser();
  const rows = await db.select().from(notifications).where(eq(notifications.userId, me.id)).orderBy(desc(notifications.createdAt)).limit(12);
  return rows.map((n) => ({ id: n.id, type: n.type, title: n.title, body: n.body, href: n.href, createdAt: n.createdAt, read: !!n.readAt }));
}

/** Marca todas como leídas (al abrir el panel). */
export async function markNotificationsReadAction() {
  const me = await requireUser();
  await db.update(notifications).set({ readAt: new Date() }).where(and(eq(notifications.userId, me.id), isNull(notifications.readAt)));
  revalidatePath("/", "layout");
}
