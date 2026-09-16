import { asc, desc, eq } from "drizzle-orm";
import { db } from "@/db";
import { courses, learningPaths, pathCourses, users } from "@/db/schema";
import { PathsManager } from "@/components/admin/paths-manager";

export const metadata = { title: "Rutas · Admin" };

export default async function AdminPaths() {
  const [paths, allCourses, people] = await Promise.all([
    db.query.learningPaths.findMany({ with: { courses: { orderBy: [asc(pathCourses.order)] }, assignments: true }, orderBy: [desc(learningPaths.createdAt)] }),
    db.select({ id: courses.id, title: courses.title, published: courses.published }).from(courses).where(eq(courses.published, true)).orderBy(asc(courses.title)),
    db.select({ id: users.id, name: users.name, jobRole: users.jobRole }).from(users).orderBy(asc(users.name)),
  ]);
  const jobRoles = Array.from(new Set(people.map((p) => p.jobRole).filter((x): x is string => !!x))).sort();
  return (
    <PathsManager
      paths={paths.map((p) => ({ id: p.id, title: p.title, description: p.description, jobRole: p.jobRole, courseIds: p.courses.map((c) => c.courseId), assigned: p.assignments.length }))}
      courses={allCourses}
      people={people}
      jobRoles={jobRoles}
    />
  );
}
