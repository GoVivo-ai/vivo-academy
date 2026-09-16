import { and, count, eq, isNull } from "drizzle-orm";
import { auth, signOut } from "@/auth";
import { redirect } from "next/navigation";
import { db } from "@/db";
import { notifications, users } from "@/db/schema";
import { levelProgress, streakStatus } from "@/lib/gamification";
import { Sidebar, MobileNav } from "@/components/layout/sidebar";
import { Topbar } from "@/components/layout/topbar";
import { TooltipProvider } from "@/components/ui/tooltip";
import { CelebrationOverlay } from "@/components/gamification/celebrate";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Vivo Academy";

export default async function AppLayout({ children }: LayoutProps<"/">) {
  const session = await auth();
  if (!session?.user) redirect("/login");

  const [u] = await db.select().from(users).where(eq(users.id, session.user.id));
  if (!u) redirect("/login");
  if (!u.active) redirect("/login?error=AccountDisabled");
  const [{ unread }] = await db
    .select({ unread: count() })
    .from(notifications)
    .where(and(eq(notifications.userId, u.id), isNull(notifications.readAt)));

  const lp = levelProgress(u.xp);
  const st = streakStatus(u);
  const isStaff = u.role === "admin" || u.role === "instructor";

  return (
    <TooltipProvider>
      <div className="flex min-h-screen">
        <aside className="hidden w-64 shrink-0 bg-sidebar md:block">
          <div className="sticky top-0 h-screen">
            <Sidebar isStaff={isStaff} />
          </div>
        </aside>
        <div className="flex min-w-0 flex-1 flex-col">
          <Topbar
            appName={appName}
            user={{
              name: u.name,
              email: u.email,
              image: u.image,
              xp: u.xp,
              level: lp.level,
              levelName: lp.name,
              levelPct: lp.pct,
              streak: u.streakCurrent,
              streakDoneToday: st.doneToday,
              streakAtRisk: st.atRisk,
              unread,
              isStaff,
            }}
            onSignOut={async () => {
              "use server";
              await signOut({ redirectTo: "/login" });
            }}
          />
          <main className="flex-1 px-4 pb-24 pt-6 md:px-10 md:pb-12 md:pt-8">{children}</main>
        </div>
      </div>
      <MobileNav isStaff={isStaff} />
      <CelebrationOverlay />
    </TooltipProvider>
  );
}
