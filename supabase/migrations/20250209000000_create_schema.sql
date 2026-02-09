-- AI Judge Challenge Schema
-- Run with: supabase db push (or apply via Supabase Dashboard SQL Editor)

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Verdict enum for evaluations
CREATE TYPE verdict_type AS ENUM ('pass', 'fail', 'partial', 'pending');

-- ============ SUBMISSIONS ============
CREATE TABLE submissions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  queue_id TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_submissions_queue_id ON submissions(queue_id);
CREATE INDEX idx_submissions_created_at ON submissions(created_at DESC);

-- ============ QUESTION TEMPLATES ============
-- Required by judge_assignments; questions reference these templates
CREATE TABLE question_templates (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ QUESTIONS ============
-- Each submission has questions (linked to templates)
CREATE TABLE questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_template_id UUID NOT NULL REFERENCES question_templates(id) ON DELETE RESTRICT,
  content TEXT, -- optional override; defaults to template content
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_questions_submission_id ON questions(submission_id);
CREATE INDEX idx_questions_template_id ON questions(question_template_id);

-- ============ ANSWERS ============
-- One answer per submission + question
CREATE TABLE answers (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  content TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, question_id)
);

CREATE INDEX idx_answers_submission_id ON answers(submission_id);
CREATE INDEX idx_answers_question_id ON answers(question_id);

-- ============ JUDGES ============
CREATE TABLE judges (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============ JUDGE ASSIGNMENTS ============
-- Which judges evaluate which question templates
CREATE TABLE judge_assignments (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  question_template_id UUID NOT NULL REFERENCES question_templates(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(question_template_id, judge_id)
);

CREATE INDEX idx_judge_assignments_template ON judge_assignments(question_template_id);
CREATE INDEX idx_judge_assignments_judge ON judge_assignments(judge_id);

-- ============ EVALUATIONS ============
-- One evaluation per submission + question + judge
CREATE TABLE evaluations (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  submission_id UUID NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  question_id UUID NOT NULL REFERENCES questions(id) ON DELETE CASCADE,
  judge_id UUID NOT NULL REFERENCES judges(id) ON DELETE CASCADE,
  verdict verdict_type NOT NULL DEFAULT 'pending',
  reasoning TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(submission_id, question_id, judge_id)
);

-- Indexes for filtering (judge / question / verdict)
CREATE INDEX idx_evaluations_judge_id ON evaluations(judge_id);
CREATE INDEX idx_evaluations_question_id ON evaluations(question_id);
CREATE INDEX idx_evaluations_verdict ON evaluations(verdict);
CREATE INDEX idx_evaluations_submission_id ON evaluations(submission_id);
CREATE INDEX idx_evaluations_created_at ON evaluations(created_at DESC);

-- Optional: composite index for common filter combinations
CREATE INDEX idx_evaluations_judge_verdict ON evaluations(judge_id, verdict);
CREATE INDEX idx_evaluations_question_verdict ON evaluations(question_id, verdict);

-- ============ ROW LEVEL SECURITY (optional, enable if using Supabase Auth) ============
-- ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE questions ENABLE ROW LEVEL SECURITY;
-- ... add policies as needed
