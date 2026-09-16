/**
 * SOLO PARA DESARROLLO LOCAL: crea (o reutiliza) un usuario de prueba y una sesión válida
 * para probar la app sin pasar por Google. Imprime el valor de la cookie authjs.session-token.
 *
 *   pnpm tsx scripts/dev-session.ts [email] [role]
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import { randomUUID } from "node:crypto";
import * as schema from "../src/db/schema";

if (process.env.VERCEL_ENV === "production") {
  console.error("No ejecutar en producción");
  process.exit(1);
}

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const email = process.argv[2] ?? `prueba@${process.env.ALLOWED_EMAIL_DOMAIN ?? "example.com"}`;
const role = (process.argv[3] ?? "admin") as "admin" | "instructor" | "colaborador";

async function main() {
  let [u] = await db.select().from(schema.users).where(eq(schema.users.email, email));
  if (!u) {
    [u] = await db.insert(schema.users).values({ email, name: role === "admin" ? "Ana Admin" : "Carlos Colaborador", role, jobRole: "Servicio al cliente", emailVerified: new Date() }).returning();
  } else {
    await db.update(schema.users).set({ role }).where(eq(schema.users.id, u.id));
  }
  const token = randomUUID();
  await db.insert(schema.sessions).values({ sessionToken: token, userId: u.id, expires: new Date(Date.now() + 7 * 86_400_000) });
  console.log(JSON.stringify({ userId: u.id, email, role, token }));
}
main();
