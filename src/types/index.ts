/**
 * Database & API Types for Supabase
 */

// ============ Supabase Database Types ============

export type Verdict = 'pass' | 'fail' | 'partial' | 'pending'

export interface Database {
  public: {
    Tables: {
      submissions: {
        Row: Submission
        Insert: SubmissionInsert
        Update: SubmissionUpdate
      }
      judges: {
        Row: Judge
        Insert: JudgeInsert
        Update: JudgeUpdate
      }
      evaluations: {
        Row: Evaluation
        Insert: EvaluationInsert
        Update: EvaluationUpdate
      }
      question_templates: {
        Row: QuestionTemplate
        Insert: QuestionTemplateInsert
        Update: QuestionTemplateUpdate
      }
      questions: {
        Row: Question
        Insert: QuestionInsert
        Update: QuestionUpdate
      }
      answers: {
        Row: Answer
        Insert: AnswerInsert
        Update: AnswerUpdate
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      verdict_type: Verdict
    }
  }
}

// ============ Entity Types ============

export interface Submission {
  id: string
  queue_id: string
  created_at: string
}

export type SubmissionInsert = Omit<Submission, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type SubmissionUpdate = Partial<Omit<Submission, 'id' | 'created_at'>>

export interface Judge {
  id: string
  name: string
  created_at: string
}

export type JudgeInsert = Omit<Judge, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type JudgeUpdate = Partial<Omit<Judge, 'id' | 'created_at'>>

export interface Evaluation {
  id: string
  submission_id: string
  question_id: string
  judge_id: string
  verdict: Verdict
  reasoning: string | null
  created_at: string
}

export type EvaluationInsert = Omit<Evaluation, 'id' | 'created_at'> & {
  id?: string
  verdict?: Verdict
  created_at?: string
}

export type EvaluationUpdate = Partial<
  Omit<Evaluation, 'id' | 'submission_id' | 'question_id' | 'judge_id' | 'created_at'>
>

export interface User {
  id: string
  email: string
  created_at: string
  updated_at: string
}

export type UserInsert = Omit<User, 'id' | 'created_at' | 'updated_at'> & {
  id?: string
  created_at?: string
  updated_at?: string
}

export type UserUpdate = Partial<Omit<User, 'id' | 'created_at'>>

export interface QuestionTemplate {
  id: string
  content: string
  created_at: string
}

export type QuestionTemplateInsert = Omit<QuestionTemplate, 'id' | 'created_at'> & {
  id?: string
  created_at?: string
}

export type QuestionTemplateUpdate = Partial<Omit<QuestionTemplate, 'id' | 'created_at'>>

export interface Question {
  id: string
  submission_id: string
  question_template_id: string
  content: string | null
  created_at: string
}

export type QuestionInsert = Omit<Question, 'id' | 'created_at'> & {
  id?: string
  content?: string | null
  created_at?: string
}

export type QuestionUpdate = Partial<Omit<Question, 'id' | 'submission_id' | 'created_at'>>

export interface Answer {
  id: string
  submission_id: string
  question_id: string
  content: string | null
  created_at: string
}

export type AnswerInsert = Omit<Answer, 'id' | 'created_at'> & {
  id?: string
  content?: string | null
  created_at?: string
}

export type AnswerUpdate = Partial<Omit<Answer, 'id' | 'submission_id' | 'question_id' | 'created_at'>>

// ============ API Response Types ============

export interface ApiResponse<T> {
  data: T | null
  error: ApiError | null
}

export interface ApiError {
  message: string
  code?: string
  details?: unknown
}

export interface PaginatedResponse<T> {
  data: T[]
  total: number
  page: number
  pageSize: number
}

// ============ Import Types (Upload JSON) ============

export interface ImportQuestion {
  content: string
  answer: string
}

export interface ImportSubmission {
  queueId: string
  questions: ImportQuestion[]
}

export interface ImportData {
  submissions: ImportSubmission[]
}

// ============ Common Types ============

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]
