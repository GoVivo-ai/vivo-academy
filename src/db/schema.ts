import {
  pgTable,
  text,
  integer,
  timestamp,
  boolean,
  jsonb,
  primaryKey,
  pgEnum,
  date,
  real,
  uniqueIndex,
  index,
} from "drizzle-orm/pg-core";
import { relations, sql } from "drizzle-orm";
import type { AdapterAccountType } from "next-auth/adapters";

// ---------- Enums ----------
export const userRoleEnum = pgEnum("user_role", ["admin", "instructor", "colaborador"]);
export const lessonTypeEnum = pgEnum("lesson_type", ["video", "text", "pdf", "embed", "quiz"]);
export const questionTypeEnum = pgEnum("question_type", ["multiple", "truefalse", "order", "short"]);
export const courseLevelEnum = pgEnum("course_level", ["basico", "intermedio", "avanzado"]);
export const liveStatusEnum = pgEnum("live_status", ["programada", "en_curso", "finalizada", "cancelada"]);
export const pollKindEnum = pgEnum("poll_kind", ["encuesta", "quiz"]);
export const resourceKindEnum = pgEnum("resource_kind", ["pdf", "doc", "sheet", "slide", "image", "video", "zip", "link"]);

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

// ---------- Usuarios y auth ----------
export const users = pgTable("users", {
  id: id(),
  name: text("name"),
  email: text("email").notNull().unique(),
  emailVerified: timestamp("email_verified", { mode: "date" }),
  image: text("image"),
  role: userRoleEnum("role").notNull().default("colaborador"),
  /** Cuenta activa: si es false no puede iniciar sesión y sus sesiones se cierran. */
  active: boolean("active").notNull().default(true),
  jobRole: text("job_role"), // cargo / área (ventas, soporte, marketing...)
  xp: integer("xp").notNull().default(0),
  level: integer("level").notNull().default(1),
  streakCurrent: integer("streak_current").notNull().default(0),
  streakBest: integer("streak_best").notNull().default(0),
  lastActivityDate: date("last_activity_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const accounts = pgTable(
  "accounts",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").$type<AdapterAccountType>().notNull(),
    provider: text("provider").notNull(),
    providerAccountId: text("provider_account_id").notNull(),
    refresh_token: text("refresh_token"),
    access_token: text("access_token"),
    expires_at: integer("expires_at"),
    token_type: text("token_type"),
    scope: text("scope"),
    id_token: text("id_token"),
    session_state: text("session_state"),
  },
  (t) => [primaryKey({ columns: [t.provider, t.providerAccountId] })],
);

export const sessions = pgTable("sessions", {
  sessionToken: text("session_token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expires: timestamp("expires", { mode: "date" }).notNull(),
});

export const verificationTokens = pgTable(
  "verification_tokens",
  {
    identifier: text("identifier").notNull(),
    token: text("token").notNull(),
    expires: timestamp("expires", { mode: "date" }).notNull(),
  },
  (t) => [primaryKey({ columns: [t.identifier, t.token] })],
);

// ---------- Cursos ----------
export const courses = pgTable("courses", {
  id: id(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  cover: text("cover"),
  category: text("category").notNull().default("General"),
  level: courseLevelEnum("level").notNull().default("basico"),
  estimatedMinutes: integer("estimated_minutes").notNull().default(30),
  published: boolean("published").notNull().default(false),
  instructorId: text("instructor_id").references(() => users.id, { onDelete: "set null" }),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const modules = pgTable("modules", {
  id: id(),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  order: integer("order").notNull().default(0),
});

export const lessons = pgTable(
  "lessons",
  {
    id: id(),
    moduleId: text("module_id")
      .notNull()
      .references(() => modules.id, { onDelete: "cascade" }),
    type: lessonTypeEnum("type").notNull().default("text"),
    title: text("title").notNull(),
    /** HTML (Tiptap) para text, URL para embed, descripción corta para video/pdf */
    content: text("content").notNull().default(""),
    blobUrl: text("blob_url"),
    durationSec: integer("duration_sec").notNull().default(0),
    order: integer("order").notNull().default(0),
    xpReward: integer("xp_reward").notNull().default(10),
  },
  (t) => [index("lessons_module_idx").on(t.moduleId)],
);

// ---------- Quizzes ----------
export const quizzes = pgTable("quizzes", {
  id: id(),
  lessonId: text("lesson_id")
    .notNull()
    .unique()
    .references(() => lessons.id, { onDelete: "cascade" }),
  title: text("title").notNull(),
  passScore: integer("pass_score").notNull().default(70), // porcentaje
  shuffle: boolean("shuffle").notNull().default(true),
});

export const questions = pgTable("questions", {
  id: id(),
  quizId: text("quiz_id")
    .notNull()
    .references(() => quizzes.id, { onDelete: "cascade" }),
  type: questionTypeEnum("type").notNull().default("multiple"),
  prompt: text("prompt").notNull(),
  explanation: text("explanation"),
  /** Para "short": respuestas aceptadas; para "order": orden correcto de option ids */
  meta: jsonb("meta").$type<{ accepted?: string[] }>().default({}),
  order: integer("order").notNull().default(0),
});

export const options = pgTable("options", {
  id: id(),
  questionId: text("question_id")
    .notNull()
    .references(() => questions.id, { onDelete: "cascade" }),
  text: text("text").notNull(),
  correct: boolean("correct").notNull().default(false),
  order: integer("order").notNull().default(0),
});

export const quizAttempts = pgTable(
  "quiz_attempts",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    quizId: text("quiz_id")
      .notNull()
      .references(() => quizzes.id, { onDelete: "cascade" }),
    score: integer("score").notNull(),
    passed: boolean("passed").notNull(),
    answers: jsonb("answers").$type<Record<string, unknown>>().notNull(),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("attempts_user_quiz_idx").on(t.userId, t.quizId)],
);

// ---------- Material de apoyo ----------
export const resources = pgTable(
  "resources",
  {
    id: id(),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    /** Si se asocia a una lección, aparece también dentro de ella. */
    lessonId: text("lesson_id").references(() => lessons.id, { onDelete: "cascade" }),
    kind: resourceKindEnum("kind").notNull().default("pdf"),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    url: text("url").notNull(),
    sizeBytes: integer("size_bytes"),
    order: integer("order").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("resources_course_idx").on(t.courseId)],
);

// ---------- Progreso ----------
export const enrollments = pgTable(
  "enrollments",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    startedAt: timestamp("started_at").notNull().defaultNow(),
    completedAt: timestamp("completed_at"),
    progressPct: integer("progress_pct").notNull().default(0),
    lastLessonId: text("last_lesson_id"),
  },
  (t) => [primaryKey({ columns: [t.userId, t.courseId] })],
);

export const lessonProgress = pgTable(
  "lesson_progress",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    lessonId: text("lesson_id")
      .notNull()
      .references(() => lessons.id, { onDelete: "cascade" }),
    completedAt: timestamp("completed_at"),
    secondsWatched: integer("seconds_watched").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.userId, t.lessonId] })],
);

// ---------- Rutas de aprendizaje ----------
export const learningPaths = pgTable("learning_paths", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  /** Cargo al que se asigna automáticamente (null = manual) */
  jobRole: text("job_role"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const pathCourses = pgTable(
  "path_courses",
  {
    pathId: text("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    courseId: text("course_id")
      .notNull()
      .references(() => courses.id, { onDelete: "cascade" }),
    order: integer("order").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.pathId, t.courseId] })],
);

export const pathAssignments = pgTable(
  "path_assignments",
  {
    pathId: text("path_id")
      .notNull()
      .references(() => learningPaths.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    assignedAt: timestamp("assigned_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.pathId, t.userId] })],
);

// ---------- Gamificación ----------
export const badges = pgTable("badges", {
  id: text("id").primaryKey(), // slug estable: "primer-curso"
  title: text("title").notNull(),
  description: text("description").notNull(),
  icon: text("icon").notNull(), // emoji
  /** condición evaluada en código: { kind: "courses_completed", value: 1 } */
  rule: jsonb("rule").$type<{ kind: string; value: number }>().notNull(),
  xpBonus: integer("xp_bonus").notNull().default(0),
});

export const userBadges = pgTable(
  "user_badges",
  {
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    badgeId: text("badge_id")
      .notNull()
      .references(() => badges.id, { onDelete: "cascade" }),
    earnedAt: timestamp("earned_at").notNull().defaultNow(),
    seen: boolean("seen").notNull().default(false),
  },
  (t) => [primaryKey({ columns: [t.userId, t.badgeId] })],
);

export const xpEvents = pgTable(
  "xp_events",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    amount: integer("amount").notNull(),
    reason: text("reason").notNull(),
    refId: text("ref_id"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [
    index("xp_user_idx").on(t.userId, t.createdAt),
    uniqueIndex("xp_unique_reason_ref").on(t.userId, t.reason, t.refId),
  ],
);

export const certificates = pgTable("certificates", {
  id: id(),
  code: text("code").notNull().unique(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id")
    .notNull()
    .references(() => courses.id, { onDelete: "cascade" }),
  issuedAt: timestamp("issued_at").notNull().defaultNow(),
  pdfUrl: text("pdf_url"),
});

export const notifications = pgTable(
  "notifications",
  {
    id: id(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    type: text("type").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    href: text("href"),
    readAt: timestamp("read_at"),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [index("notif_user_idx").on(t.userId, t.createdAt)],
);

// ---------- Aula en vivo ----------
export const liveSessions = pgTable("live_sessions", {
  id: id(),
  title: text("title").notNull(),
  description: text("description").notNull().default(""),
  hostId: text("host_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  courseId: text("course_id").references(() => courses.id, { onDelete: "set null" }),
  scheduledAt: timestamp("scheduled_at").notNull(),
  durationMin: integer("duration_min").notNull().default(60),
  roomName: text("room_name").notNull().unique(),
  status: liveStatusEnum("status").notNull().default("programada"),
  recordingUrl: text("recording_url"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const liveAttendance = pgTable(
  "live_attendance",
  {
    sessionId: text("session_id")
      .notNull()
      .references(() => liveSessions.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    joinedAt: timestamp("joined_at").notNull().defaultNow(),
    leftAt: timestamp("left_at"),
    secondsPresent: integer("seconds_present").notNull().default(0),
  },
  (t) => [primaryKey({ columns: [t.sessionId, t.userId] })],
);

export const livePolls = pgTable("live_polls", {
  id: id(),
  sessionId: text("session_id")
    .notNull()
    .references(() => liveSessions.id, { onDelete: "cascade" }),
  kind: pollKindEnum("kind").notNull().default("encuesta"),
  question: text("question").notNull(),
  options: jsonb("options").$type<string[]>().notNull(),
  correctIndex: integer("correct_index"),
  seconds: integer("seconds").notNull().default(20),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  closedAt: timestamp("closed_at"),
});

export const livePollVotes = pgTable(
  "live_poll_votes",
  {
    pollId: text("poll_id")
      .notNull()
      .references(() => livePolls.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    optionIndex: integer("option_index").notNull(),
    responseMs: integer("response_ms").notNull().default(0),
    points: integer("points").notNull().default(0),
    createdAt: timestamp("created_at").notNull().defaultNow(),
  },
  (t) => [primaryKey({ columns: [t.pollId, t.userId] })],
);

// ---------- Relaciones ----------
export const usersRelations = relations(users, ({ many }) => ({
  enrollments: many(enrollments),
  badges: many(userBadges),
  certificates: many(certificates),
}));

export const coursesRelations = relations(courses, ({ many, one }) => ({
  modules: many(modules),
  resources: many(resources),
  enrollments: many(enrollments),
  instructor: one(users, { fields: [courses.instructorId], references: [users.id] }),
}));

export const modulesRelations = relations(modules, ({ one, many }) => ({
  course: one(courses, { fields: [modules.courseId], references: [courses.id] }),
  lessons: many(lessons),
}));

export const lessonsRelations = relations(lessons, ({ one, many }) => ({
  module: one(modules, { fields: [lessons.moduleId], references: [modules.id] }),
  quiz: one(quizzes, { fields: [lessons.id], references: [quizzes.lessonId] }),
  resources: many(resources),
}));

export const resourcesRelations = relations(resources, ({ one }) => ({
  course: one(courses, { fields: [resources.courseId], references: [courses.id] }),
  lesson: one(lessons, { fields: [resources.lessonId], references: [lessons.id] }),
}));

export const quizzesRelations = relations(quizzes, ({ one, many }) => ({
  lesson: one(lessons, { fields: [quizzes.lessonId], references: [lessons.id] }),
  questions: many(questions),
}));

export const questionsRelations = relations(questions, ({ one, many }) => ({
  quiz: one(quizzes, { fields: [questions.quizId], references: [quizzes.id] }),
  options: many(options),
}));

export const optionsRelations = relations(options, ({ one }) => ({
  question: one(questions, { fields: [options.questionId], references: [questions.id] }),
}));

export const enrollmentsRelations = relations(enrollments, ({ one }) => ({
  user: one(users, { fields: [enrollments.userId], references: [users.id] }),
  course: one(courses, { fields: [enrollments.courseId], references: [courses.id] }),
}));

export const learningPathsRelations = relations(learningPaths, ({ many }) => ({
  courses: many(pathCourses),
  assignments: many(pathAssignments),
}));

export const pathCoursesRelations = relations(pathCourses, ({ one }) => ({
  path: one(learningPaths, { fields: [pathCourses.pathId], references: [learningPaths.id] }),
  course: one(courses, { fields: [pathCourses.courseId], references: [courses.id] }),
}));

export const userBadgesRelations = relations(userBadges, ({ one }) => ({
  user: one(users, { fields: [userBadges.userId], references: [users.id] }),
  badge: one(badges, { fields: [userBadges.badgeId], references: [badges.id] }),
}));

export const certificatesRelations = relations(certificates, ({ one }) => ({
  user: one(users, { fields: [certificates.userId], references: [users.id] }),
  course: one(courses, { fields: [certificates.courseId], references: [courses.id] }),
}));

export const liveSessionsRelations = relations(liveSessions, ({ one, many }) => ({
  host: one(users, { fields: [liveSessions.hostId], references: [users.id] }),
  course: one(courses, { fields: [liveSessions.courseId], references: [courses.id] }),
  attendance: many(liveAttendance),
  polls: many(livePolls),
}));

export const liveAttendanceRelations = relations(liveAttendance, ({ one }) => ({
  session: one(liveSessions, { fields: [liveAttendance.sessionId], references: [liveSessions.id] }),
  user: one(users, { fields: [liveAttendance.userId], references: [users.id] }),
}));

export const livePollsRelations = relations(livePolls, ({ one, many }) => ({
  session: one(liveSessions, { fields: [livePolls.sessionId], references: [liveSessions.id] }),
  votes: many(livePollVotes),
}));

export const livePollVotesRelations = relations(livePollVotes, ({ one }) => ({
  poll: one(livePolls, { fields: [livePollVotes.pollId], references: [livePolls.id] }),
  user: one(users, { fields: [livePollVotes.userId], references: [users.id] }),
}));

// tipos útiles
export type User = typeof users.$inferSelect;
export type Course = typeof courses.$inferSelect;
export type Lesson = typeof lessons.$inferSelect;
export type Module = typeof modules.$inferSelect;
export type Badge = typeof badges.$inferSelect;
export type LiveSession = typeof liveSessions.$inferSelect;
export type Resource = typeof resources.$inferSelect;
export const _sql = sql;
export const _real = real;

export const pathAssignmentsRelations = relations(pathAssignments, ({ one }) => ({
  path: one(learningPaths, { fields: [pathAssignments.pathId], references: [learningPaths.id] }),
  user: one(users, { fields: [pathAssignments.userId], references: [users.id] }),
}));
