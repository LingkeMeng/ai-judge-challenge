import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { Answer, AnswerInsert, AnswerUpdate } from '../types'
import { handleError } from './utils'

export async function createAnswer(payload: AnswerInsert): Promise<ApiResponse<Answer>> {
  const { data, error } = await supabase.from('answers').insert(payload as never).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function fetchAnswersBySubmission(submissionId: string): Promise<ApiResponse<Answer[]>> {
  const { data, error } = await supabase.from('answers').select('*').eq('submission_id', submissionId)
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

export async function updateAnswer(id: string, payload: AnswerUpdate): Promise<ApiResponse<Answer>> {
  const { data, error } = await supabase.from('answers').update(payload as never).eq('id', id).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function deleteAnswer(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('answers').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}
