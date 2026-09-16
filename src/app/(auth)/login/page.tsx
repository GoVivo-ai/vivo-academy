import { signIn } from "@/auth";
import { Button } from "@/components/ui/button";
import { VivoLogo } from "@/components/brand/logo";
import { GoogleIcon } from "@/components/brand/google-icon";
import { LoginScene } from "@/components/auth/login-scene";
import { LoginForm } from "@/components/auth/login-form";

const domain = process.env.ALLOWED_EMAIL_DOMAIN?.split(",").map((d) => d.trim()).filter(Boolean).join(" o @");

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const sp = await searchParams;
  const error = typeof sp.error === "string" ? sp.error : null;
  const callbackUrl = typeof sp.callbackUrl === "string" ? sp.callbackUrl : "/inicio";

  async function login() {
    "use server";
    await signIn("google", { redirectTo: callbackUrl });
  }

  return (
    <main className="min-h-screen grid lg:grid-cols-[1.15fr_1fr] bg-background">
      <LoginScene />
      <section className="relative flex items-center justify-center overflow-hidden p-8">
        <div className="absolute -right-24 -top-24 size-72 rounded-full bg-brand-green/10 blur-3xl" />
        <div className="absolute -bottom-24 -left-24 size-72 rounded-full bg-brand-yellow/10 blur-3xl" />
        <LoginForm domain={domain} error={error}>
          <form action={login}>
            <Button type="submit" size="lg" className="group h-13 w-full gap-3 rounded-full text-base font-bold shadow-lg shadow-brand-navy/20 transition-transform hover:-translate-y-0.5 active:translate-y-0">
              <span className="grid size-7 place-items-center rounded-full bg-white"><GoogleIcon className="size-4" /></span>
              Continuar con Google
            </Button>
          </form>
        </LoginForm>
        <div className="absolute left-8 top-8 lg:hidden"><VivoLogo height={30} /></div>
      </section>
    </main>
  );
}
