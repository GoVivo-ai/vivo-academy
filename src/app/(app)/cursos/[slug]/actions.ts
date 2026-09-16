"use server";

import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { requireUser } from "@/auth";
import { completeLesson, enroll } from "@/lib/courses";
import { gradeQuiz, checkAnswer, type QuizAnswers, type QuizAnswer } from "@/lib/quiz";

export async function enrollAction(courseId: string, slug: string, firstLessonId: string) {
  const me = await requireUser();
  await enroll(me.id, courseId);
  revalidatePath(`/cursos/${slug}`);
  redirect(firstLessonId ? `/cursos/${slug}/${firstLessonId}` : `/cursos/${slug}`);
}

export async function completeLessonAction(lessonId: string, slug: string) {
  const me = await requireUser();
  const r = await completeLesson(me.id, lessonId);
  revalidatePath(`/cursos/${slug}`);
  revalidatePath("/inicio");
  return r;
}

export async function checkAnswerAction(lessonId: string, questionId: string, answer: QuizAnswer) {
  await requireUser();
  return checkAnswer(lessonId, questionId, answer);
}

export async function submitQuizAction(lessonId: string, slug: string, answers: QuizAnswers) {
  const me = await requireUser();
  const r = await gradeQuiz(me.id, lessonId, answers);
  revalidatePath(`/cursos/${slug}`);
  revalidatePath("/inicio");
  return r;
}
