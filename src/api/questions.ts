import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { Question, QuestionInsert, QuestionUpdate } from '../types'
import { handleError } from './utils'

export async function fetchQuestions(): Promise<ApiResponse<Question[]>> {
  const { data, error } = await supabase.from('questions').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

export async function fetchQuestionsBySubmission(submissionId: string): Promise<ApiResponse<Question[]>> {
  const { data, error } = await supabase.from('questions').select('*').eq('submission_id', submissionId)
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

export async function createQuestion(payload: QuestionInsert): Promise<ApiResponse<Question>> {
  const { data, error } = await supabase.from('questions').insert(payload as never).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function updateQuestion(id: string, payload: QuestionUpdate): Promise<ApiResponse<Question>> {
  const { data, error } = await supabase.from('questions').update(payload as never).eq('id', id).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function deleteQuestion(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('questions').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}
