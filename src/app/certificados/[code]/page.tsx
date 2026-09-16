import Link from "next/link";
import { notFound } from "next/navigation";
import { eq } from "drizzle-orm";
import { Award, CheckCircle2, Download, Share2 } from "lucide-react";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { fmtDate } from "@/lib/format";
import { auth } from "@/auth";
import { AcademyBrand } from "@/components/brand/logo";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Vivo Academy";

export async function generateMetadata({ params }: PageProps<"/certificados/[code]">) {
  const { code } = await params;
  return { title: `Certificado ${code}` };
}

export default async function CertificatePage({ params }: PageProps<"/certificados/[code]">) {
  const { code } = await params;
  const cert = await db.query.certificates.findFirst({ where: eq(certificates.code, code), with: { user: true, course: true } });
  if (!cert) notFound();
  const session = await auth();
  const isOwner = session?.user?.id === cert.userId;

  return (
    <main className="min-h-screen bg-muted/40 px-4 py-10">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex items-center justify-between">
          <Link href={session ? "/inicio" : "/login"} aria-label={appName}><AcademyBrand variant="blue" /></Link>
          <span className="flex items-center gap-1 rounded-full border border-brand-green/60 bg-brand-green/10 px-3 py-1 text-sm text-brand-green-600 dark:bg-brand-green/15 dark:text-brand-green"><CheckCircle2 className="size-4" />Certificado verificado</span>
        </div>

        <div className="relative overflow-hidden rounded-3xl border-4 border-double border-brand-navy/40 bg-white p-8 text-center text-brand-navy shadow-xl md:p-14">
          <div className="absolute -left-16 -top-16 size-48 rounded-full bg-brand-green/15" />
          <div className="absolute -bottom-20 -right-16 size-56 rounded-full bg-brand-yellow/25" />
          <div className="relative space-y-4">
            <Award className="mx-auto size-14 text-brand-green-600" />
            <p className="text-xs font-semibold uppercase tracking-[0.3em] text-gray-500">Certificado de finalización</p>
            <p className="text-gray-600">Se otorga a</p>
            <h1 className="text-3xl font-bold md:text-4xl">{cert.user.name}</h1>
            <p className="text-gray-600">por completar satisfactoriamente el curso</p>
            <h2 className="text-2xl font-semibold text-brand-navy">{cert.course.title}</h2>
            <p className="pt-4 text-sm text-gray-500">{fmtDate(cert.issuedAt)} · {appName}</p>
            <p className="font-mono text-xs text-gray-400">Código de verificación: {cert.code}</p>
          </div>
        </div>

        <div className="flex flex-wrap justify-center gap-3">
          <a href={`/api/certificates/${cert.code}/pdf`} className="inline-flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"><Download className="size-4" />Descargar PDF</a>
          {isOwner && (
            <a href={`https://www.linkedin.com/profile/add?startTask=CERTIFICATION_NAME&name=${encodeURIComponent(cert.course.title)}&organizationName=${encodeURIComponent(appName)}&certId=${cert.code}&certUrl=${encodeURIComponent(`${process.env.NEXT_PUBLIC_APP_URL ?? ""}/certificados/${cert.code}`)}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-2 rounded-lg border px-4 py-2 text-sm font-medium hover:bg-muted"><Share2 className="size-4" />Agregar a LinkedIn</a>
          )}
        </div>
        <p className="text-center text-xs text-muted-foreground">Cualquier persona puede verificar este certificado con su código en esta página.</p>
      </div>
    </main>
  );
}
