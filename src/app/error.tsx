"use client";

import Link from "next/link";
import { useEffect } from "react";
import { RotateCcw, Home, AlertTriangle } from "lucide-react";
import { VivoLogo } from "@/components/brand/logo";

export default function ErrorPage({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <main className="grid min-h-screen place-items-center bg-background p-6">
      <div className="w-full max-w-md rounded-[2rem] border bg-card p-8 text-center shadow-sm">
        <div className="mb-6 flex justify-center"><VivoLogo height={30} /></div>
        <span className="mx-auto grid size-16 place-items-center rounded-2xl bg-brand-yellow/20 text-brand-navy dark:text-brand-yellow">
          <AlertTriangle className="size-8" />
        </span>
        <h1 className="mt-4 font-heading text-2xl font-bold">Algo se rompió por aquí</h1>
        <p className="mt-2 text-muted-foreground">No es culpa tuya. Vuelve a intentarlo y, si sigue pasando, avísale al equipo.</p>
        {error.digest && <p className="mt-3 font-mono text-[11px] text-muted-foreground">Código: {error.digest}</p>}
        <div className="mt-6 flex justify-center gap-2">
          <button onClick={reset} className="inline-flex h-11 items-center gap-2 rounded-full bg-brand-green px-5 font-bold text-brand-navy transition hover:bg-brand-green/90">
            <RotateCcw className="size-4" />Reintentar
          </button>
          <Link href="/inicio" className="inline-flex h-11 items-center gap-2 rounded-full border px-5 font-bold transition hover:bg-muted">
            <Home className="size-4" />Ir al inicio
          </Link>
        </div>
      </div>
    </main>
  );
}
