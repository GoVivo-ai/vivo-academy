import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "../src/db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const { badges, courses, modules, lessons, quizzes, questions, options, learningPaths, pathCourses } = schema;

async function main() {
  // ---- Insignias ----
  await db
    .insert(badges)
    .values([
      { id: "primera-leccion", title: "Primer paso", description: "Completaste tu primera lección.", icon: "🚀", rule: { kind: "lessons_completed", value: 1 }, xpBonus: 10 },
      { id: "primer-curso", title: "Graduado", description: "Completaste tu primer curso.", icon: "🎓", rule: { kind: "courses_completed", value: 1 }, xpBonus: 50 },
      { id: "tres-cursos", title: "Coleccionista", description: "Completaste 3 cursos.", icon: "📚", rule: { kind: "courses_completed", value: 3 }, xpBonus: 100 },
      { id: "racha-3", title: "Calentando", description: "3 días seguidos aprendiendo.", icon: "🔥", rule: { kind: "streak", value: 3 }, xpBonus: 20 },
      { id: "racha-7", title: "Imparable", description: "7 días seguidos aprendiendo.", icon: "⚡", rule: { kind: "streak", value: 7 }, xpBonus: 50 },
      { id: "racha-30", title: "Leyenda de la constancia", description: "30 días seguidos aprendiendo.", icon: "👑", rule: { kind: "streak", value: 30 }, xpBonus: 200 },
      { id: "quiz-perfecto", title: "Perfeccionista", description: "Sacaste 100% en un quiz.", icon: "🎯", rule: { kind: "perfect_quizzes", value: 1 }, xpBonus: 20 },
      { id: "cinco-perfectos", title: "Francotirador", description: "5 quizzes con 100%.", icon: "🏹", rule: { kind: "perfect_quizzes", value: 5 }, xpBonus: 80 },
      { id: "primera-clase", title: "Presente", description: "Asististe a tu primera clase en vivo.", icon: "📡", rule: { kind: "live_attended", value: 1 }, xpBonus: 20 },
      { id: "cinco-clases", title: "Alumno estrella", description: "Asististe a 5 clases en vivo.", icon: "⭐", rule: { kind: "live_attended", value: 5 }, xpBonus: 80 },
      { id: "nivel-5", title: "Experto en ascenso", description: "Alcanzaste el nivel 5.", icon: "🏆", rule: { kind: "level", value: 5 }, xpBonus: 0 },
      { id: "xp-1000", title: "Mil puntos", description: "Acumulaste 1,000 XP.", icon: "💎", rule: { kind: "xp", value: 1000 }, xpBonus: 0 },
    ])
    .onConflictDoNothing();

  // ---- Curso 1: Bienvenida ----
  const [c1] = await db
    .insert(courses)
    .values({
      slug: "bienvenida-a-vivo",
      title: "Bienvenida a Vivo",
      description: "Conoce la cultura, los valores y cómo trabajamos. El punto de partida para todo nuevo colaborador.",
      category: "Cultura",
      level: "basico",
      estimatedMinutes: 25,
      published: true,
      cover: "https://images.unsplash.com/photo-1522202176988-66273c2fd55f?w=1200&q=80",
    })
    .onConflictDoNothing()
    .returning();
  if (c1) {
    const [m1] = await db.insert(modules).values({ courseId: c1.id, title: "Quiénes somos", order: 0 }).returning();
    const [m2] = await db.insert(modules).values({ courseId: c1.id, title: "Cómo trabajamos", order: 1 }).returning();
    await db.insert(lessons).values([
      {
        moduleId: m1.id,
        type: "text",
        title: "Nuestra historia y propósito",
        order: 0,
        durationSec: 300,
        content: `<h2>Por qué existimos</h2><p>Vivo nació para ayudar a las personas y a las empresas a crecer con soluciones simples y humanas. Cada colaborador es parte de esa promesa.</p><h3>Nuestros valores</h3><ul><li><strong>Cercanía:</strong> tratamos a cada cliente como a un amigo.</li><li><strong>Claridad:</strong> decimos las cosas de forma simple y honesta.</li><li><strong>Impulso:</strong> nos movemos rápido y aprendemos siempre.</li></ul><blockquote>“Lo que hacemos importa porque a alguien le cambia el día.”</blockquote>`,
      },
      {
        moduleId: m1.id,
        type: "embed",
        title: "Video: un día en Vivo",
        order: 1,
        durationSec: 240,
        content: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      },
      {
        moduleId: m2.id,
        type: "text",
        title: "Herramientas y canales de comunicación",
        order: 0,
        durationSec: 300,
        content: `<h2>Canales</h2><p>Usamos chat para lo urgente, correo para lo formal y esta academia para aprender.</p><h3>Reglas de oro</h3><ol><li>Responde en menos de 4 horas hábiles.</li><li>Documenta las decisiones importantes.</li><li>Pide ayuda temprano.</li></ol>`,
      },
      { moduleId: m2.id, type: "quiz", title: "Quiz: cultura Vivo", order: 1, durationSec: 180, xpReward: 25 },
    ]);
    const quizLesson = (await db.select().from(lessons).where(schema._sql`${lessons.moduleId} = ${m2.id} and ${lessons.type} = 'quiz'`))[0];
    const [q] = await db.insert(quizzes).values({ lessonId: quizLesson.id, title: "Cultura Vivo", passScore: 70 }).returning();
    const [q1] = await db.insert(questions).values({ quizId: q.id, type: "multiple", prompt: "¿Cuál de estos es un valor de Vivo?", explanation: "Cercanía, claridad e impulso son nuestros tres valores.", order: 0 }).returning();
    await db.insert(options).values([
      { questionId: q1.id, text: "Cercanía", correct: true, order: 0 },
      { questionId: q1.id, text: "Burocracia", correct: false, order: 1 },
      { questionId: q1.id, text: "Silencio", correct: false, order: 2 },
      { questionId: q1.id, text: "Competencia interna", correct: false, order: 3 },
    ]);
    const [q2] = await db.insert(questions).values({ quizId: q.id, type: "truefalse", prompt: "Debemos responder los mensajes en menos de 4 horas hábiles.", explanation: "Sí, es una de las reglas de oro.", order: 1 }).returning();
    await db.insert(options).values([
      { questionId: q2.id, text: "Verdadero", correct: true, order: 0 },
      { questionId: q2.id, text: "Falso", correct: false, order: 1 },
    ]);
    const [q3] = await db.insert(questions).values({ quizId: q.id, type: "order", prompt: "Ordena las reglas de oro tal como aparecen en la lección.", explanation: "Responder rápido, documentar y pedir ayuda temprano.", order: 2 }).returning();
    await db.insert(options).values([
      { questionId: q3.id, text: "Responde en menos de 4 horas hábiles", correct: true, order: 0 },
      { questionId: q3.id, text: "Documenta las decisiones importantes", correct: true, order: 1 },
      { questionId: q3.id, text: "Pide ayuda temprano", correct: true, order: 2 },
    ]);
    const [q4] = await db.insert(questions).values({ quizId: q.id, type: "short", prompt: "¿Cómo se llama la plataforma donde aprendemos?", explanation: "Esta academia.", meta: { accepted: ["academia", "vivo academy", "la academia"] }, order: 3 }).returning();
    void q4;
  }

  // ---- Curso 2: Atención al cliente ----
  const [c2] = await db
    .insert(courses)
    .values({
      slug: "atencion-al-cliente-excepcional",
      title: "Atención al cliente excepcional",
      description: "Técnicas prácticas para escuchar, resolver y sorprender a nuestros clientes en cada contacto.",
      category: "Servicio",
      level: "intermedio",
      estimatedMinutes: 45,
      published: true,
      cover: "https://images.unsplash.com/photo-1553877522-43269d4ea984?w=1200&q=80",
    })
    .onConflictDoNothing()
    .returning();
  if (c2) {
    const [m1] = await db.insert(modules).values({ courseId: c2.id, title: "Escucha activa", order: 0 }).returning();
    const [m2] = await db.insert(modules).values({ courseId: c2.id, title: "Resolver con empatía", order: 1 }).returning();
    await db.insert(lessons).values([
      { moduleId: m1.id, type: "text", title: "Las 3 capas de la escucha", order: 0, durationSec: 420, content: `<h2>Escuchar es más que oír</h2><p>Existen tres capas: <strong>hechos</strong> (qué pasó), <strong>emoción</strong> (cómo se siente) y <strong>necesidad</strong> (qué espera). Un gran agente identifica las tres antes de responder.</p><h3>Frases que ayudan</h3><ul><li>“Entiendo que esto te generó…”</li><li>“Déjame confirmar lo que entendí…”</li><li>“Lo que necesitas es… ¿correcto?”</li></ul>` },
      { moduleId: m1.id, type: "text", title: "Preguntas poderosas", order: 1, durationSec: 360, content: `<h2>Preguntas abiertas vs. cerradas</h2><p>Las abiertas invitan a contar; las cerradas confirman. Usa primero abiertas y termina con cerradas.</p><p><em>Ejemplo:</em> “¿Qué pasó exactamente cuando intentaste pagar?” y luego “¿Te apareció un mensaje de error?”</p>` },
      { moduleId: m2.id, type: "text", title: "El método L.A.S.T.", order: 0, durationSec: 480, content: `<h2>L.A.S.T.</h2><ol><li><strong>Listen</strong>: escucha sin interrumpir.</li><li><strong>Apologize</strong>: reconoce el impacto.</li><li><strong>Solve</strong>: ofrece una solución concreta.</li><li><strong>Thank</strong>: agradece la confianza.</li></ol>` },
      { moduleId: m2.id, type: "quiz", title: "Quiz: atención excepcional", order: 1, durationSec: 240, xpReward: 25 },
    ]);
    const quizLesson = (await db.select().from(lessons).where(schema._sql`${lessons.moduleId} = ${m2.id} and ${lessons.type} = 'quiz'`))[0];
    const [q] = await db.insert(quizzes).values({ lessonId: quizLesson.id, title: "Atención excepcional", passScore: 70 }).returning();
    const [q1] = await db.insert(questions).values({ quizId: q.id, type: "multiple", prompt: "¿Cuáles son las tres capas de la escucha?", explanation: "Hechos, emoción y necesidad.", order: 0 }).returning();
    await db.insert(options).values([
      { questionId: q1.id, text: "Hechos, emoción y necesidad", correct: true, order: 0 },
      { questionId: q1.id, text: "Precio, producto y plazo", correct: false, order: 1 },
      { questionId: q1.id, text: "Saludo, cuerpo y despedida", correct: false, order: 2 },
    ]);
    const [q2] = await db.insert(questions).values({ quizId: q.id, type: "order", prompt: "Ordena los pasos del método L.A.S.T.", explanation: "Listen, Apologize, Solve, Thank.", order: 1 }).returning();
    await db.insert(options).values([
      { questionId: q2.id, text: "Escuchar", correct: true, order: 0 },
      { questionId: q2.id, text: "Reconocer el impacto", correct: true, order: 1 },
      { questionId: q2.id, text: "Ofrecer una solución", correct: true, order: 2 },
      { questionId: q2.id, text: "Agradecer", correct: true, order: 3 },
    ]);
    const [q3] = await db.insert(questions).values({ quizId: q.id, type: "truefalse", prompt: "Las preguntas cerradas sirven para confirmar información.", explanation: "Correcto: cierran y confirman.", order: 2 }).returning();
    await db.insert(options).values([
      { questionId: q3.id, text: "Verdadero", correct: true, order: 0 },
      { questionId: q3.id, text: "Falso", correct: false, order: 1 },
    ]);
  }

  // ---- Ruta ----
  if (c1 && c2) {
    const [p] = await db
      .insert(learningPaths)
      .values({ title: "Onboarding equipo de servicio", description: "Todo lo que necesita un nuevo integrante del equipo de atención.", jobRole: "Servicio al cliente" })
      .returning();
    await db.insert(pathCourses).values([
      { pathId: p.id, courseId: c1.id, order: 0 },
      { pathId: p.id, courseId: c2.id, order: 1 },
    ]);
  }

  console.log("Seed completado ✅");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
