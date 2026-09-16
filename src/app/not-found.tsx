import Link from "next/link";
import { Home, Compass } from "lucide-react";
import { VivoLogo } from "@/components/brand/logo";

export default function NotFound() {
  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-[2rem] border bg-card p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center"><VivoLogo height={30} /></div>
        <p className="font-heading text-6xl font-bold text-brand-green-600">404</p>
        <h1 className="mt-2 font-heading text-2xl font-bold">Esta página no existe</h1>
        <p className="mt-2 text-muted-foreground">Puede que el curso se haya movido o que el enlace esté mal escrito.</p>
        <div className="mt-6 flex justify-center gap-2">
          <Link href="/inicio" className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-green px-5 font-bold text-brand-navy transition hover:bg-brand-green/90">
            <Home className="size-4" />Ir al inicio
          </Link>
          <Link href="/cursos" className="inline-flex h-11 items-center gap-2 rounded-full border px-5 font-bold transition hover:bg-muted">
            <Compass className="size-4" />Ver cursos
          </Link>
        </div>
      </div>
    </main>
  );
}
