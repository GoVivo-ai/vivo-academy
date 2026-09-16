"use client";

import { createContext, useCallback, useContext, useMemo, useState } from "react";

type Theme = "light" | "dark";
const Ctx = createContext<{ theme: Theme; resolvedTheme: Theme; setTheme: (t: Theme) => void } | null>(null);

/** Proveedor de tema sin script inyectado: el servidor lee la cookie y pone la clase en <html>. */
export function ThemeProvider({ initial, children }: { initial: Theme; children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(initial);
  const setTheme = useCallback((t: Theme) => {
    setThemeState(t);
    document.documentElement.classList.toggle("dark", t === "dark");
    document.documentElement.style.colorScheme = t;
    document.cookie = `theme=${t}; path=/; max-age=31536000; samesite=lax`;
  }, []);
  const value = useMemo(() => ({ theme, resolvedTheme: theme, setTheme }), [theme, setTheme]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const c = useContext(Ctx);
  if (!c) throw new Error("useTheme fuera de ThemeProvider");
  return c;
}
