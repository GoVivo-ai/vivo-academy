"use client";

import { motion } from "motion/react";
import { FlameIcon, TrophyIcon, CertIcon } from "@/components/brand/icons";

export function LoginForm({ domain, error, children }: { domain?: string; error: string | null; children: React.ReactNode }) {
  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: 0.2 }} className="relative w-full max-w-sm space-y-8">
      <div className="space-y-3 text-center">
        <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", stiffness: 260, damping: 18, delay: 0.3 }} className="mx-auto flex w-fit items-center gap-1">
          {[FlameIcon, TrophyIcon, CertIcon].map((I, i) => (
            <motion.span key={i} animate={{ y: [0, -6, 0] }} transition={{ duration: 2, repeat: Infinity, delay: i * 0.25 }} className="grid size-12 place-items-center rounded-2xl bg-brand-navy shadow-lg shadow-brand-navy/20"><I size={28} onDark /></motion.span>
          ))}
        </motion.div>
        <p className="font-sans text-xs font-bold uppercase tracking-[0.25em] text-brand-green-600">Vivo Academy</p>
        <h2 className="font-heading text-3xl font-bold text-brand-navy">¡Hola de nuevo! 👋</h2>
        <p className="text-muted-foreground">Entra con tu correo corporativo{domain ? ` @${domain}` : ""} y sigue sumando XP.</p>
      </div>

      {error && (
        <motion.div initial={{ opacity: 0, x: -8 }} animate={{ opacity: 1, x: [0, 8, -8, 0] }} className="rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
          {error === "AccessDenied" ? `Solo se permite el acceso con cuentas ${domain ? `@${domain}` : "corporativas"}.` : error === "AccountDisabled" ? "Tu cuenta está desactivada. Habla con un administrador." : "No pudimos iniciar sesión. Intenta de nuevo."}
        </motion.div>
      )}

      {children}

      <p className="text-center text-xs text-muted-foreground">Tu progreso, racha e insignias se guardan automáticamente.</p>
    </motion.div>
  );
}
