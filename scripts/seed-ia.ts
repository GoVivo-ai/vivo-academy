/**
 * Carga la ruta "IA en el día a día" con tres cursos, sus lecciones y quizzes.
 * Es idempotente: si un curso ya existe (por slug) lo omite.
 *
 *   pnpm tsx scripts/seed-ia.ts
 */
import { config } from "dotenv";
config({ path: ".env.local" });
import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import { eq } from "drizzle-orm";
import * as schema from "../src/db/schema";

const db = drizzle(neon(process.env.DATABASE_URL!), { schema });
const { courses, modules, lessons, quizzes, questions, options, learningPaths, pathCourses } = schema;

type Q =
  | { type: "multiple"; prompt: string; explanation: string; options: Array<[string, boolean]> }
  | { type: "truefalse"; prompt: string; explanation: string; correct: boolean }
  | { type: "order"; prompt: string; explanation: string; steps: string[] }
  | { type: "short"; prompt: string; explanation: string; accepted: string[] };

type Lesson = { title: string; minutes: number; html?: string; quiz?: { title: string; questions: Q[] } };
type Module = { title: string; lessons: Lesson[] };
type Course = {
  slug: string;
  title: string;
  description: string;
  category: string;
  level: "basico" | "intermedio" | "avanzado";
  minutes: number;
  cover: string;
  modules: Module[];
};

const P = (s: string) => s.trim();

const COURSES: Course[] = [
  {
    slug: "ia-para-el-dia-a-dia",
    title: "IA para el día a día",
    description: "Qué es realmente un modelo de lenguaje, para qué sirve, en qué falla y cómo empezar a usarlo hoy en tu trabajo.",
    category: "Inteligencia Artificial",
    level: "basico",
    minutes: 35,
    cover: "https://images.unsplash.com/photo-1620712943543-bcc4688e7485?w=1200&q=80",
    modules: [
      {
        title: "Entender la herramienta",
        lessons: [
          {
            title: "Qué es (y qué no es) un modelo de lenguaje",
            minutes: 6,
            html: P(`
<h2>Una máquina de continuar texto</h2>
<p>Un modelo de lenguaje como ChatGPT, Claude o Gemini no "sabe" cosas como una base de datos. Lo que hace es <strong>predecir la continuación más probable</strong> de un texto, palabra por palabra, a partir de todo lo que leyó durante su entrenamiento.</p>
<p>Eso explica sus dos caras:</p>
<ul>
<li><strong>Es brillante</strong> redactando, resumiendo, reformulando, traduciendo, clasificando y explicando.</li>
<li><strong>Es poco confiable</strong> con datos exactos: fechas, cifras, nombres propios, precios o normativas.</li>
</ul>
<h3>La regla mental</h3>
<blockquote>Trátalo como un practicante muy rápido y muy leído, pero que a veces inventa con total seguridad. Todo lo que produzca, tú lo firmas.</blockquote>
<h3>Qué significa "alucinar"</h3>
<p>Cuando el modelo no tiene la información, no dice "no sé": genera algo que <em>suena</em> correcto. A eso se le llama alucinación. No es un error puntual, es parte de cómo funciona. Por eso la verificación es tuya, no suya.</p>
<h3>Lo que sí cambia tu día</h3>
<p>La ganancia real no es "que haga tu trabajo", es <strong>quitarte la página en blanco</strong>. Pasar de cero a un primer borrador en 30 segundos cambia por completo el ritmo de una tarea.</p>
`),
          },
          {
            title: "Casos reales en Vivo",
            minutes: 7,
            html: P(`
<h2>Dónde gana tiempo cada área</h2>
<h3>Servicio y soporte</h3>
<ul>
<li>Reescribir una respuesta técnica en lenguaje simple y amable.</li>
<li>Resumir un hilo largo de conversación antes de escalarlo.</li>
<li>Redactar tres versiones de una disculpa y elegir el tono correcto.</li>
</ul>
<h3>Ventas</h3>
<ul>
<li>Preparar preguntas de descubrimiento para una reunión.</li>
<li>Convertir notas sueltas en un correo de seguimiento claro.</li>
<li>Anticipar objeciones y practicar respuestas.</li>
</ul>
<h3>Marketing y contenido</h3>
<ul>
<li>Generar 20 titulares para elegir 2.</li>
<li>Adaptar un mismo mensaje a distintos formatos y públicos.</li>
<li>Sacar ideas de guion a partir de un caso de cliente.</li>
</ul>
<h3>Administración y operaciones</h3>
<ul>
<li>Convertir una reunión en acta con tareas y responsables.</li>
<li>Ordenar y clasificar listas largas.</li>
<li>Explicar un documento denso en cinco puntos.</li>
</ul>
<h3>Dónde NO conviene</h3>
<p>Decisiones legales o financieras sin revisión, cifras oficiales, promesas a clientes, y cualquier cosa que salga con tu nombre sin que la hayas leído completa.</p>
`),
          },
        ],
      },
      {
        title: "Empezar bien",
        lessons: [
          {
            title: "Tu primera conversación productiva",
            minutes: 8,
            html: P(`
<h2>El error más común</h2>
<p>Pedir algo demasiado corto: <em>"escribe un correo para un cliente molesto"</em>. El resultado será genérico porque la pregunta fue genérica.</p>
<h2>La versión que sí funciona</h2>
<p>Dale cuatro cosas: <strong>rol, contexto, tarea y formato</strong>.</p>
<blockquote>Eres asesor de servicio de Vivo. Un cliente lleva tres días esperando la activación de su plan y ya escribió dos veces sin respuesta. Escribe un correo de máximo 120 palabras que reconozca la demora, dé una fecha concreta de solución y ofrezca una compensación. Tono cercano, sin tecnicismos, sin excusas internas.</blockquote>
<h3>Después del primer resultado</h3>
<p>Casi nunca el primer intento es el bueno. Corrige con instrucciones cortas:</p>
<ul>
<li>"Más corto, la mitad."</li>
<li>"Menos formal, como si le escribiera a un conocido."</li>
<li>"Quita la parte de la compensación y cierra con una pregunta."</li>
</ul>
<h3>Trabaja por iteraciones, no por milagros</h3>
<p>Tres correcciones de diez segundos superan siempre a un prompt perfecto escrito de una sola vez.</p>
`),
          },
          {
            title: "Quiz: fundamentos de IA",
            minutes: 4,
            quiz: {
              title: "Fundamentos de IA",
              questions: [
                {
                  type: "multiple",
                  prompt: "¿Por qué un modelo de lenguaje se equivoca con datos exactos como cifras o fechas?",
                  explanation: "Predice el texto más probable; no consulta una fuente de verdad.",
                  options: [
                    ["Porque predice texto probable, no consulta una base de datos", true],
                    ["Porque su información siempre está desactualizada", false],
                    ["Porque no fue entrenado con números", false],
                    ["Porque necesita conexión a internet para responder", false],
                  ],
                },
                {
                  type: "truefalse",
                  prompt: "Si el modelo no sabe algo, avisa que no lo sabe.",
                  explanation: "Falso: tiende a generar una respuesta plausible. A eso se le llama alucinación.",
                  correct: false,
                },
                {
                  type: "order",
                  prompt: "Ordena los cuatro elementos de un buen encargo, tal como se explicó.",
                  explanation: "Rol, contexto, tarea y formato.",
                  steps: ["Rol que debe asumir", "Contexto de la situación", "Tarea concreta", "Formato de la respuesta"],
                },
                {
                  type: "short",
                  prompt: "¿Cómo se llama cuando la IA inventa información que suena creíble?",
                  explanation: "Se llama alucinación.",
                  accepted: ["alucinacion", "alucinación", "alucinaciones", "alucinar"],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "prompts-que-funcionan",
    title: "Prompts que funcionan",
    description: "Del encargo vago al resultado que sirve. Estructura, contexto, ejemplos y técnicas de iteración para sacar respuestas de calidad.",
    category: "Inteligencia Artificial",
    level: "intermedio",
    minutes: 45,
    cover: "https://images.unsplash.com/photo-1655720828018-edd2daec9349?w=1200&q=80",
    modules: [
      {
        title: "La anatomía de un buen prompt",
        lessons: [
          {
            title: "La fórmula R.C.T.F.",
            minutes: 8,
            html: P(`
<h2>Rol · Contexto · Tarea · Formato</h2>
<p>Cuatro bloques que convierten cualquier petición floja en un encargo profesional.</p>
<h3>1. Rol</h3>
<p>Le dices desde qué experiencia debe responder. Cambia el vocabulario, las prioridades y hasta lo que decide omitir.</p>
<p><em>"Eres editor de una revista de negocios con 15 años corrigiendo textos ajenos."</em></p>
<h3>2. Contexto</h3>
<p>Lo que la IA no puede adivinar: para quién es, qué pasó antes, qué restricciones existen.</p>
<p><em>"El lector es un gerente de pyme sin conocimientos técnicos. Ya rechazó una propuesta nuestra por considerarla cara."</em></p>
<h3>3. Tarea</h3>
<p>Un verbo claro y un entregable único. Si pides tres cosas a la vez, harás tres cosas a medias.</p>
<p><em>"Reescribe este párrafo para que se entienda en una sola lectura."</em></p>
<h3>4. Formato</h3>
<p>Extensión, estructura, tono y lo que no debe aparecer.</p>
<p><em>"Máximo 80 palabras, en dos párrafos, sin viñetas, sin la palabra 'sinergia'."</em></p>
<h3>Antes y después</h3>
<p><strong>Antes:</strong> "hazme un resumen de esta reunión".</p>
<p><strong>Después:</strong> "Eres jefe de operaciones. Del acta que te paso, extrae solo los compromisos: quién, qué y para cuándo. Formato de tabla, sin comentarios adicionales. Si un compromiso no tiene responsable claro, márcalo como PENDIENTE."</p>
`),
          },
          {
            title: "Enseñar con ejemplos",
            minutes: 7,
            html: P(`
<h2>Un ejemplo vale más que tres adjetivos</h2>
<p>Describir un tono ("cercano pero profesional") es ambiguo. Mostrarlo no lo es. Esta técnica se llama <strong>few-shot</strong>: das dos o tres ejemplos del resultado que quieres y el modelo copia el patrón.</p>
<h3>Cómo se ve</h3>
<blockquote>
Convierte cada queja en una respuesta siguiendo este estilo.<br /><br />
Queja: "Llevo una hora esperando"<br />
Respuesta: "Una hora es demasiado y lo entiendo. Ya tomé tu caso, te escribo en 10 minutos con una solución."<br /><br />
Queja: "Me cobraron de más"<br />
Respuesta: "Revisé y tienes razón, hubo un cobro doble. Lo devuelvo hoy mismo y te confirmo por aquí."<br /><br />
Queja: "Nadie me contesta el chat"<br />
Respuesta:
</blockquote>
<h3>Por qué funciona tan bien</h3>
<p>El modelo detecta el patrón oculto: frases cortas, reconocer primero, acción concreta y compromiso de tiempo. Ninguna de esas reglas tuvo que escribirse.</p>
<h3>Regla práctica</h3>
<p>Dos ejemplos suelen bastar. Cinco es desperdicio. Y que sean <strong>ejemplos reales tuyos</strong>, no inventados: así el resultado suena a tu empresa y no a un manual.</p>
`),
          },
        ],
      },
      {
        title: "Sacarle más",
        lessons: [
          {
            title: "Iterar, criticar y comparar",
            minutes: 8,
            html: P(`
<h2>Tres movimientos que suben la calidad</h2>
<h3>1. Pedir opciones, no una respuesta</h3>
<p>"Dame tres versiones con enfoques distintos y explica en una línea cuándo usar cada una." Elegir entre opciones es más rápido y más honesto que corregir una sola.</p>
<h3>2. Hacer que se critique</h3>
<p>"Revisa lo que acabas de escribir y señala sus tres debilidades más grandes. Luego reescríbelo corrigiéndolas." La segunda versión suele ser notablemente mejor.</p>
<h3>3. Pedir que piense antes de responder</h3>
<p>Para problemas con varios pasos: "Antes de responder, lista los factores que debes considerar. Después da tu recomendación." Ordenar el razonamiento reduce errores.</p>
<h2>Cuando algo sale mal</h2>
<table>
<thead><tr><th>Síntoma</th><th>Causa probable</th><th>Arreglo</th></tr></thead>
<tbody>
<tr><td>Suena genérico</td><td>Falta contexto propio</td><td>Pega un ejemplo real tuyo</td></tr>
<tr><td>Muy largo</td><td>No diste límite</td><td>Fija palabras o frases exactas</td></tr>
<tr><td>Se inventa datos</td><td>Le pediste hechos</td><td>Dale tú los datos y que solo redacte</td></tr>
<tr><td>Ignora una instrucción</td><td>Iba enterrada en el texto</td><td>Ponla al final y en mayúsculas</td></tr>
</tbody>
</table>
`),
          },
          {
            title: "Quiz: prompts que funcionan",
            minutes: 5,
            quiz: {
              title: "Prompts que funcionan",
              questions: [
                {
                  type: "multiple",
                  prompt: "El resultado suena genérico y podría ser de cualquier empresa. ¿Cuál es el mejor arreglo?",
                  explanation: "Lo que hace único un resultado es el contexto propio: ejemplos y datos reales tuyos.",
                  options: [
                    ["Pegar un ejemplo real de tu empresa para que copie el patrón", true],
                    ["Pedirle que sea más creativo", false],
                    ["Repetir la misma instrucción con más énfasis", false],
                    ["Alargar el texto pedido", false],
                  ],
                },
                {
                  type: "truefalse",
                  prompt: "Dar dos o tres ejemplos del resultado deseado suele funcionar mejor que describir el tono con adjetivos.",
                  explanation: "Correcto: la técnica few-shot transmite reglas que serían difíciles de escribir.",
                  correct: true,
                },
                {
                  type: "multiple",
                  prompt: "¿Qué instrucción hace que la IA mejore su propia respuesta?",
                  explanation: "Pedirle que critique su resultado y lo reescriba corrigiendo las debilidades.",
                  options: [
                    ["Señala las tres debilidades de tu respuesta y reescríbela", true],
                    ["Hazlo mejor", false],
                    ["Estás seguro?", false],
                    ["Vuelve a intentarlo", false],
                  ],
                },
                {
                  type: "order",
                  prompt: "Ordena los bloques de la fórmula R.C.T.F.",
                  explanation: "Rol, Contexto, Tarea y Formato.",
                  steps: ["Rol", "Contexto", "Tarea", "Formato"],
                },
                {
                  type: "short",
                  prompt: "¿Cómo se llama la técnica de dar ejemplos del resultado esperado dentro del prompt?",
                  explanation: "Se conoce como few-shot.",
                  accepted: ["few shot", "fewshot", "few-shot", "pocos ejemplos"],
                },
              ],
            },
          },
        ],
      },
    ],
  },
  {
    slug: "ia-con-responsabilidad",
    title: "IA con responsabilidad",
    description: "Qué información nunca se pega en una IA, cómo verificar lo que produce y qué reglas seguimos en Vivo para usarla sin poner en riesgo al cliente.",
    category: "Inteligencia Artificial",
    level: "basico",
    minutes: 30,
    cover: "https://images.unsplash.com/photo-1633265486064-086b219458ec?w=1200&q=80",
    modules: [
      {
        title: "Los límites",
        lessons: [
          {
            title: "Qué nunca se pega en una IA",
            minutes: 7,
            html: P(`
<h2>La pregunta que resuelve el 90% de los casos</h2>
<blockquote>¿Me incomodaría que esto apareciera en un buscador con el nombre del cliente al lado?</blockquote>
<p>Si la respuesta es sí, no va.</p>
<h3>Nunca</h3>
<ul>
<li>Cédulas, direcciones, teléfonos y correos de clientes.</li>
<li>Datos bancarios, tarjetas o credenciales de cualquier tipo.</li>
<li>Contratos, propuestas económicas y tarifas confidenciales.</li>
<li>Historias clínicas, información laboral sensible o datos de menores.</li>
<li>Código propietario con llaves o secretos incrustados.</li>
</ul>
<h3>Cómo trabajar igual, pero seguro</h3>
<p><strong>Anonimiza.</strong> Reemplaza lo identificable por marcadores y luego lo devuelves tú:</p>
<blockquote>El cliente [NOMBRE] con plan [PLAN] reporta una falla desde [FECHA]…</blockquote>
<p><strong>Abstrae.</strong> En vez de pegar el contrato, describe la situación: "Un cliente quiere terminar antes de tiempo un contrato de 12 meses en el mes 4. ¿Qué opciones de negociación existen?".</p>
<h3>Una nota sobre las cuentas</h3>
<p>Usa siempre la cuenta corporativa que la empresa te asigne. Las cuentas personales gratuitas pueden usar tus conversaciones para entrenar el modelo.</p>
`),
          },
          {
            title: "Verificar antes de enviar",
            minutes: 6,
            html: P(`
<h2>El filtro de tres preguntas</h2>
<p>Antes de que algo salga con tu nombre:</p>
<ol>
<li><strong>¿Hay algún dato verificable?</strong> Cifras, fechas, nombres, normas, enlaces. Cada uno se confirma en la fuente. Sin excepciones.</li>
<li><strong>¿Suena a nosotros?</strong> Si suena a manual corporativo genérico, reescríbelo con tus palabras.</li>
<li><strong>¿Prometo algo que no puedo cumplir?</strong> La IA es optimista por naturaleza: promete plazos, descuentos y soluciones que nadie autorizó.</li>
</ol>
<h3>El riesgo del enlace inventado</h3>
<p>Los modelos generan URLs y referencias que parecen reales y no existen. Si vas a citar algo, ábrelo primero.</p>
<h3>Responsabilidad</h3>
<p>Si un cliente recibe información equivocada, la responsabilidad es de quien envió el mensaje. "Lo escribió la IA" no es una explicación válida frente a un cliente ni frente al equipo.</p>
`),
          },
          {
            title: "Quiz: uso responsable",
            minutes: 4,
            quiz: {
              title: "Uso responsable",
              questions: [
                {
                  type: "multiple",
                  prompt: "Necesitas ayuda para responder el reclamo de un cliente. ¿Cuál es la forma correcta?",
                  explanation: "Anonimizar: describes la situación sin datos que identifiquen a la persona.",
                  options: [
                    ["Describir la situación reemplazando los datos personales por marcadores", true],
                    ["Pegar la conversación completa para que tenga todo el contexto", false],
                    ["Pegar solo la cédula, que es un dato corto", false],
                    ["Subir el contrato firmado en PDF", false],
                  ],
                },
                {
                  type: "truefalse",
                  prompt: "Si la IA cita una fuente con enlace, se puede asumir que el enlace existe.",
                  explanation: "Falso: los modelos generan enlaces y referencias inexistentes. Ábrelos antes de citarlos.",
                  correct: false,
                },
                {
                  type: "multiple",
                  prompt: "¿Cuál es la pregunta guía para decidir si un dato se puede pegar en una IA?",
                  explanation: "Si te incomodaría verlo público junto al nombre del cliente, no va.",
                  options: [
                    ["¿Me incomodaría que esto fuera público con el nombre del cliente al lado?", true],
                    ["¿Es un texto largo o corto?", false],
                    ["¿La IA lo va a entender?", false],
                    ["¿Tengo permiso de mi jefe directo?", false],
                  ],
                },
                {
                  type: "short",
                  prompt: "¿Qué se debe hacer con los datos personales antes de pedir ayuda a una IA?",
                  explanation: "Anonimizarlos, reemplazándolos por marcadores.",
                  accepted: ["anonimizar", "anonimizarlos", "quitarlos", "reemplazarlos"],
                },
              ],
            },
          },
        ],
      },
    ],
  },
];

async function main() {
  const created: string[] = [];

  for (const c of COURSES) {
    const exists = await db.select({ id: courses.id }).from(courses).where(eq(courses.slug, c.slug));
    if (exists.length) {
      console.log(`— ya existe: ${c.title}`);
      continue;
    }
    const [course] = await db
      .insert(courses)
      .values({ slug: c.slug, title: c.title, description: c.description, category: c.category, level: c.level, estimatedMinutes: c.minutes, cover: c.cover, published: true })
      .returning();
    created.push(course.id);

    for (const [mi, m] of c.modules.entries()) {
      const [mod] = await db.insert(modules).values({ courseId: course.id, title: m.title, order: mi }).returning();

      for (const [li, l] of m.lessons.entries()) {
        const isQuiz = !!l.quiz;
        const [lesson] = await db
          .insert(lessons)
          .values({
            moduleId: mod.id,
            type: isQuiz ? "quiz" : "text",
            title: l.title,
            content: l.html ?? "",
            durationSec: l.minutes * 60,
            order: li,
            xpReward: isQuiz ? 25 : 10,
          })
          .returning();

        if (!l.quiz) continue;
        const [quiz] = await db.insert(quizzes).values({ lessonId: lesson.id, title: l.quiz.title, passScore: 70 }).returning();

        for (const [qi, q] of l.quiz.questions.entries()) {
          const [row] = await db
            .insert(questions)
            .values({
              quizId: quiz.id,
              type: q.type,
              prompt: q.prompt,
              explanation: q.explanation,
              meta: q.type === "short" ? { accepted: q.accepted } : {},
              order: qi,
            })
            .returning();

          if (q.type === "multiple") {
            await db.insert(options).values(q.options.map(([text, correct], j) => ({ questionId: row.id, text, correct, order: j })));
          } else if (q.type === "truefalse") {
            await db.insert(options).values([
              { questionId: row.id, text: "Verdadero", correct: q.correct, order: 0 },
              { questionId: row.id, text: "Falso", correct: !q.correct, order: 1 },
            ]);
          } else if (q.type === "order") {
            await db.insert(options).values(q.steps.map((text, j) => ({ questionId: row.id, text, correct: true, order: j })));
          }
        }
      }
    }
    console.log(`✓ ${c.title}`);
  }

  // Ruta de aprendizaje con los tres cursos
  const routeTitle = "IA en el día a día";
  const existingRoute = await db.select({ id: learningPaths.id }).from(learningPaths).where(eq(learningPaths.title, routeTitle));
  if (existingRoute.length === 0) {
    const all = await db.select({ id: courses.id, slug: courses.slug }).from(courses);
    const order = COURSES.map((c) => all.find((x) => x.slug === c.slug)?.id).filter((x): x is string => !!x);
    if (order.length) {
      const [path] = await db
        .insert(learningPaths)
        .values({ title: routeTitle, description: "Entiende la herramienta, aprende a pedirle bien las cosas y úsala sin poner en riesgo al cliente." })
        .returning();
      await db.insert(pathCourses).values(order.map((courseId, i) => ({ pathId: path.id, courseId, order: i })));
      console.log(`✓ ruta "${routeTitle}" con ${order.length} cursos`);
    }
  } else {
    console.log(`— la ruta "${routeTitle}" ya existe`);
  }

  console.log("Listo.");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
