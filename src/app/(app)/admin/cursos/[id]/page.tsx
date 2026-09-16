import { notFound } from "next/navigation";
import { asc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, lessons, modules, resources } from "@/db/schema";
import { CourseEditor } from "@/components/admin/course-editor";

export default async function AdminCourseEditor({ params }: PageProps<"/admin/cursos/[id]">) {
  const { id } = await params;
  const course = await db.query.courses.findFirst({
    where: eq(courses.id, id),
    with: {
      modules: { orderBy: [asc(modules.order)], with: { lessons: { orderBy: [asc(lessons.order)] } } },
      resources: { orderBy: [asc(resources.order)] },
    },
  });
  if (!course) notFound();
  return <CourseEditor course={course} />;
}
