import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { quizAttempts, quizzes, questions, options } from "@/db/schema";
import { awardXp, XP } from "./gamification";
import { completeLesson } from "./courses";

export type QuizAnswer =
  | { type: "multiple" | "truefalse"; optionId: string | null }
  | { type: "order"; optionIds: string[] }
  | { type: "short"; text: string };

export type QuizAnswers = Record<string, QuizAnswer>;

export async function getQuizForLesson(lessonId: string) {
  return db.query.quizzes.findFirst({
    where: eq(quizzes.lessonId, lessonId),
    with: {
      questions: {
        orderBy: [asc(questions.order)],
        with: { options: { orderBy: [asc(options.order)] } },
      },
    },
  });
}

/** Versión "pública" del quiz sin revelar respuestas correctas. */
export function publicQuiz(q: NonNullable<Awaited<ReturnType<typeof getQuizForLesson>>>, shuffle = true) {
  const rnd = <T,>(arr: T[]) => (shuffle ? [...arr].sort(() => Math.random() - 0.5) : arr);
  return {
    id: q.id,
    title: q.title,
    passScore: q.passScore,
    questions: q.questions.map((qq) => ({
      id: qq.id,
      type: qq.type,
      prompt: qq.prompt,
      options: (qq.type === "order" ? rnd(qq.options) : qq.type === "truefalse" ? qq.options : rnd(qq.options)).map((o) => ({
        id: o.id,
        text: o.text,
      })),
    })),
  };
}

function normalize(s: string) {
  return s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim();
}

/** Comprueba una sola respuesta (feedback inmediato) sin guardar intento. */
export async function checkAnswer(lessonId: string, questionId: string, answer: QuizAnswer) {
  const quiz = await getQuizForLesson(lessonId);
  const q = quiz?.questions.find((x) => x.id === questionId);
  if (!q) throw new Error("Pregunta no encontrada");
  let correct = false;
  let correctText = "";
  if (q.type === "multiple" || q.type === "truefalse") {
    const right = q.options.find((o) => o.correct);
    correctText = right?.text ?? "";
    correct = answer.type === q.type && answer.optionId === right?.id;
  } else if (q.type === "order") {
    const sorted = [...q.options].sort((x, y) => x.order - y.order);
    correctText = sorted.map((o) => o.text).join(" → ");
    correct = answer.type === "order" && answer.optionIds.length === sorted.length && answer.optionIds.every((id, i) => id === sorted[i].id);
  } else if (q.type === "short") {
    const accepted = (q.meta?.accepted ?? []).map(normalize);
    correctText = q.meta?.accepted?.[0] ?? "";
    correct = answer.type === "short" && accepted.includes(normalize(answer.text));
  }
  return { correct, correctText, explanation: q.explanation };
}

export type QuizResult = {
  score: number;
  passed: boolean;
  perQuestion: Array<{ questionId: string; correct: boolean; explanation: string | null; correctText: string }>;
  awarded: number;
  newBadges: Array<{ id: string; title: string; icon: string; description: string }>;
  levelUp: number | null;
  courseCompleted: boolean;
  certificateCode?: string;
};

export async function gradeQuiz(userId: string, lessonId: string, answers: QuizAnswers): Promise<QuizResult> {
  const quiz = await getQuizForLesson(lessonId);
  if (!quiz) throw new Error("Quiz no encontrado");

  const perQuestion = quiz.questions.map((q) => {
    const a = answers[q.id];
    let correct = false;
    let correctText = "";
    if (q.type === "multiple" || q.type === "truefalse") {
      const right = q.options.find((o) => o.correct);
      correctText = right?.text ?? "";
      correct = !!a && a.type === q.type && a.optionId === right?.id;
    } else if (q.type === "order") {
      const rightOrder = [...q.options].sort((x, y) => x.order - y.order).map((o) => o.id);
      correctText = [...q.options].sort((x, y) => x.order - y.order).map((o) => o.text).join(" → ");
      correct = !!a && a.type === "order" && a.optionIds.length === rightOrder.length && a.optionIds.every((id, i) => id === rightOrder[i]);
    } else if (q.type === "short") {
      const accepted = (q.meta?.accepted ?? []).map(normalize);
      correctText = q.meta?.accepted?.[0] ?? "";
      correct = !!a && a.type === "short" && accepted.includes(normalize(a.text));
    }
    return { questionId: q.id, correct, explanation: q.explanation, correctText };
  });

  const total = perQuestion.length || 1;
  const score = Math.round((perQuestion.filter((p) => p.correct).length / total) * 100);
  const passed = score >= quiz.passScore;

  await db.insert(quizAttempts).values({ userId, quizId: quiz.id, score, passed, answers });

  let awarded = 0;
  let newBadges: QuizResult["newBadges"] = [];
  let levelUp: number | null = null;
  let courseCompleted = false;
  let certificateCode: string | undefined;

  if (passed) {
    const r1 = await awardXp(userId, XP.QUIZ_PASSED, "quiz", quiz.id);
    awarded += r1.awarded;
    newBadges = newBadges.concat(r1.newBadges);
    levelUp = r1.levelUp ?? levelUp;
    if (score === 100) {
      const r2 = await awardXp(userId, XP.QUIZ_PERFECT_BONUS, "quiz_perfect", quiz.id);
      awarded += r2.awarded;
      newBadges = newBadges.concat(r2.newBadges);
      levelUp = r2.levelUp ?? levelUp;
    }
    const r3 = await completeLesson(userId, lessonId);
    awarded += r3.awarded;
    newBadges = newBadges.concat(r3.newBadges);
    levelUp = r3.levelUp ?? levelUp;
    courseCompleted = r3.courseCompleted;
    certificateCode = r3.certificateCode;
  }

  return { score, passed, perQuestion, awarded, newBadges, levelUp, courseCompleted, certificateCode };
}
