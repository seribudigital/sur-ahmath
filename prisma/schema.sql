-- Database Schema for Sur'ahMath (PostgreSQL)

-- Create Custom ENUM Types
CREATE TYPE "Role" AS ENUM ('ADMIN', 'TEACHER', 'STUDENT', 'PARENT');
CREATE TYPE "OperationType" AS ENUM ('MULTIPLICATION', 'DIVISION');
CREATE TYPE "ExamType" AS ENUM ('DIAGNOSTIC', 'WEEKLY', 'MONTHLY', 'MASTERY', 'POST_TEST');

-- 1. Create 'users' table
CREATE TABLE "users" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "email" VARCHAR(255) UNIQUE NOT NULL,
    "password_hash" VARCHAR(255) NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create 'teachers' table
CREATE TABLE "teachers" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "nama" VARCHAR(255) NOT NULL,
    "school" VARCHAR(255) NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 3. Create 'parents' table
CREATE TABLE "parents" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID UNIQUE REFERENCES "users"("id") ON DELETE CASCADE,
    "nama" VARCHAR(255) NOT NULL,
    "kontak" VARCHAR(100) NOT NULL,
    "unique_token" VARCHAR(255) UNIQUE NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 4. Create 'students' table
CREATE TABLE "students" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "user_id" UUID UNIQUE NOT NULL REFERENCES "users"("id") ON DELETE CASCADE,
    "nama" VARCHAR(255) NOT NULL,
    "kelas" VARCHAR(50) NOT NULL,
    "school" VARCHAR(255) NOT NULL,
    "parent_id" UUID REFERENCES "parents"("id") ON DELETE SET NULL,
    "teacher_id" UUID REFERENCES "teachers"("id") ON DELETE SET NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 5. Create 'practice_sessions' table
CREATE TABLE "practice_sessions" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "operation_type" "OperationType" NOT NULL,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "duration" INTEGER NOT NULL, -- Duration in seconds
    "total_questions" INTEGER NOT NULL,
    "correct_answers" INTEGER NOT NULL,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 6. Create 'question_logs' table
CREATE TABLE "question_logs" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "session_id" UUID NOT NULL REFERENCES "practice_sessions"("id") ON DELETE CASCADE,
    "operation_type" "OperationType" NOT NULL,
    "operand_1" INTEGER NOT NULL,
    "operand_2" INTEGER NOT NULL,
    "user_answer" INTEGER NOT NULL,
    "correct" BOOLEAN NOT NULL,
    "response_time" INTEGER NOT NULL, -- Response time in milliseconds
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 7. Create 'exams' table
CREATE TABLE "exams" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "exam_type" "ExamType" NOT NULL,
    "operation_type" "OperationType" NOT NULL,
    "score" DOUBLE PRECISION NOT NULL, -- Score percentage (0.0 to 100.0)
    "status_remedial" BOOLEAN NOT NULL DEFAULT FALSE,
    "date" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "verified_by_guru" BOOLEAN NOT NULL DEFAULT FALSE,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- 8. Create 'reports' table
CREATE TABLE "reports" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL REFERENCES "students"("id") ON DELETE CASCADE,
    "period" VARCHAR(50) NOT NULL, -- E.g. '2026-W25' or '2026-M06'
    "accuracy" DOUBLE PRECISION NOT NULL,
    "speed" DOUBLE PRECISION NOT NULL,
    "activity_score" DOUBLE PRECISION NOT NULL,
    "teacher_comment" TEXT,
    "created_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for Optimization
-- Index for query optimization on operand_1 and operand_2 to generate Mastery Heatmap
CREATE INDEX "idx_question_logs_operands" ON "question_logs"("operand_1", "operand_2");

-- Index to query correct/incorrect answers for a session quickly
CREATE INDEX "idx_question_logs_session_correct" ON "question_logs"("session_id", "correct");

-- Index for searching student sessions
CREATE INDEX "idx_practice_sessions_student" ON "practice_sessions"("student_id");

-- Index for searching student exams
CREATE INDEX "idx_exams_student" ON "exams"("student_id");

-- Index for filtering students by teacher for class dashboard
CREATE INDEX "idx_students_teacher" ON "students"("teacher_id");
