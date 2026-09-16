import NextAuth, { type DefaultSession } from "next-auth";
import Google from "next-auth/providers/google";
import { DrizzleAdapter } from "@auth/drizzle-adapter";
import { eq } from "drizzle-orm";
import { db } from "@/db";
import { users, accounts, sessions, verificationTokens } from "@/db/schema";
import { assignPathsForUser } from "@/lib/paths";

declare module "next-auth" {
  interface Session {
    user: {
      id: string;
      role: "admin" | "instructor" | "colaborador";
      jobRole: string | null;
    } & DefaultSession["user"];
  }
}

/** Dominios permitidos, separados por coma (p. ej. "govivo.ai,govivo.co"). */
const allowedDomains = (process.env.ALLOWED_EMAIL_DOMAIN ?? "")
  .split(",")
  .map((d) => d.trim().toLowerCase())
  .filter(Boolean);
const allowedDomain = allowedDomains[0];

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: DrizzleAdapter(db, {
    usersTable: users,
    accountsTable: accounts,
    sessionsTable: sessions,
    verificationTokensTable: verificationTokens,
  }),
  session: { strategy: "database" },
  providers: [
    Google({
      authorization: {
        params: {
          prompt: "select_account",
          ...(allowedDomains.length === 1 ? { hd: allowedDomain } : {}),
        },
      },
    }),
  ],
  pages: { signIn: "/login", error: "/login" },
  callbacks: {
    async signIn({ profile, user }) {
      const email = (profile?.email ?? user.email ?? "").toLowerCase();
      if (!email) return false;
      if (allowedDomains.length && !allowedDomains.some((d) => email.endsWith(`@${d}`))) return false;
      if (profile && "email_verified" in profile && profile.email_verified === false) return false;
      // Cuenta desactivada por un administrador
      const [existing] = await db.select({ active: users.active }).from(users).where(eq(users.email, email)).limit(1);
      if (existing && !existing.active) return "/login?error=AccountDisabled";
      return true;
    },
    async session({ session, user }) {
      const [row] = await db
        .select({ role: users.role, jobRole: users.jobRole })
        .from(users)
        .where(eq(users.id, user.id))
        .limit(1);
      session.user.id = user.id;
      session.user.role = row?.role ?? "colaborador";
      session.user.jobRole = row?.jobRole ?? null;
      return session;
    },
  },
  events: {
    async createUser({ user }) {
      // El primer usuario en registrarse es admin.
      const all = await db.select({ id: users.id }).from(users).limit(2);
      if (all.length === 1 && user.id) {
        await db.update(users).set({ role: "admin" }).where(eq(users.id, user.id));
      }
      if (user.id) await assignPathsForUser(user.id);
    },
  },
});

export async function requireUser() {
  const session = await auth();
  if (!session?.user) {
    const { redirect } = await import("next/navigation");
    redirect("/login");
  }
  return session!.user;
}

export async function requireRole(...roles: Array<"admin" | "instructor">) {
  const user = await requireUser();
  if (user.role !== "admin" && !roles.includes(user.role as "instructor")) {
    const { redirect } = await import("next/navigation");
    redirect("/inicio");
  }
  return user;
}
