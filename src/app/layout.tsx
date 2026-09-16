import type { Metadata } from "next";
import { Nunito, Nunito_Sans, Geist_Mono } from "next/font/google";
import { cookies } from "next/headers";
import { ThemeProvider } from "@/components/theme";
import { Toaster } from "@/components/ui/sonner";
import "./globals.css";

// Fuentes variables, como las declara el Design System (tokens/typography.json).
// Sin `weight` next/font sirve el archivo variable: un solo archivo por familia y
// todo el eje de peso disponible, en vez de cuatro cortes estáticos.
const nunito = Nunito({ variable: "--font-nunito", subsets: ["latin"] });
const nunitoSans = Nunito_Sans({ variable: "--font-nunito-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({ variable: "--font-geist-mono", subsets: ["latin"] });

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Vivo Academy";

export const metadata: Metadata = {
  title: { default: appName, template: `%s · ${appName}` },
  description: "Academia interna de Vivo para aprender, crecer y certificarte.",
  icons: {
    icon: [
      { url: "/favicon.svg", type: "image/svg+xml" },
      { url: "/favicon.png", type: "image/png", sizes: "512x512" },
    ],
    apple: { url: "/apple-icon.png", sizes: "180x180" },
  },
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const theme = (await cookies()).get("theme")?.value === "dark" ? "dark" : "light";
  return (
    <html lang="es" className={`${nunito.variable} ${nunitoSans.variable} ${geistMono.variable} h-full antialiased ${theme === "dark" ? "dark" : ""}`} style={{ colorScheme: theme }}>
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <ThemeProvider initial={theme}>
          {children}
          <Toaster richColors position="top-center" />
        </ThemeProvider>
      </body>
    </html>
  );
}
