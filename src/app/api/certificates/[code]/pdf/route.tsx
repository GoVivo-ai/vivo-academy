import { NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { Document, Page, Text, View, StyleSheet, renderToBuffer } from "@react-pdf/renderer";
import { db } from "@/db";
import { certificates } from "@/db/schema";
import { fmtDate } from "@/lib/format";

const appName = process.env.NEXT_PUBLIC_APP_NAME ?? "Vivo Academy";

const s = StyleSheet.create({
  page: { padding: 48, fontFamily: "Helvetica", backgroundColor: "#ffffff" },
  frame: { flex: 1, borderWidth: 4, borderColor: "#011640", borderStyle: "solid", padding: 40, justifyContent: "center", alignItems: "center" },
  brand: { fontSize: 12, color: "#6b7280", letterSpacing: 4, textTransform: "uppercase", marginBottom: 24 },
  label: { fontSize: 12, color: "#6b7280", marginBottom: 8 },
  name: { fontSize: 32, fontFamily: "Helvetica-Bold", color: "#111827", marginBottom: 16 },
  course: { fontSize: 22, fontFamily: "Helvetica-Bold", color: "#03a86c", marginBottom: 24, textAlign: "center" },
  meta: { fontSize: 10, color: "#6b7280", marginTop: 8 },
  code: { fontSize: 9, color: "#9ca3af", marginTop: 4, fontFamily: "Courier" },
  bar: { position: "absolute", top: 0, left: 0, right: 0, height: 10, backgroundColor: "#04d98b" },
});

export async function GET(_req: Request, { params }: RouteContext<"/api/certificates/[code]/pdf">) {
  const { code } = await params;
  const cert = await db.query.certificates.findFirst({ where: eq(certificates.code, code), with: { user: true, course: true } });
  if (!cert) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const buffer = await renderToBuffer(
    <Document title={`Certificado ${cert.code}`} author={appName}>
      <Page size="A4" orientation="landscape" style={s.page}>
        <View style={s.bar} />
        <View style={s.frame}>
          <Text style={s.brand}>{appName}</Text>
          <Text style={s.label}>CERTIFICADO DE FINALIZACIÓN</Text>
          <Text style={s.label}>Se otorga a</Text>
          <Text style={s.name}>{cert.user.name}</Text>
          <Text style={s.label}>por completar satisfactoriamente el curso</Text>
          <Text style={s.course}>{cert.course.title}</Text>
          <Text style={s.meta}>{fmtDate(cert.issuedAt)}</Text>
          <Text style={s.code}>Código de verificación: {cert.code}</Text>
        </View>
      </Page>
    </Document>,
  );

  return new NextResponse(new Uint8Array(buffer), {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `inline; filename="certificado-${cert.code}.pdf"`,
    },
  });
}
