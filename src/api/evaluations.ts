import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { Evaluation, EvaluationInsert, EvaluationUpdate, Verdict } from '../types'
import { handleError } from './utils'

// Fetch all
export async function fetchEvaluations(): Promise<ApiResponse<Evaluation[]>> {
  const { data, error } = await supabase.from('evaluations').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

// Fetch by id
export async function fetchEvaluation(id: string): Promise<ApiResponse<Evaluation | null>> {
  const { data, error } = await supabase.from('evaluations').select('*').eq('id', id).single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Fetch with filters (judge / question / verdict)
export async function fetchEvaluationsFiltered(filters: {
  judgeId?: string
  questionId?: string
  verdict?: Verdict
}): Promise<ApiResponse<Evaluation[]>> {
  let query = supabase.from('evaluations').select('*')

  if (filters.judgeId) query = query.eq('judge_id', filters.judgeId)
  if (filters.questionId) query = query.eq('question_id', filters.questionId)
  if (filters.verdict) query = query.eq('verdict', filters.verdict)

  const { data, error } = await query.order('created_at', { ascending: false })
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

// Create
export async function createEvaluation(
  payload: EvaluationInsert
): Promise<ApiResponse<Evaluation>> {
  const { data, error } = await supabase.from('evaluations').insert(payload as never).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Update
export async function updateEvaluation(
  id: string,
  payload: EvaluationUpdate
): Promise<ApiResponse<Evaluation>> {
  const { data, error } = await supabase.from('evaluations').update(payload as never).eq('id', id).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Delete
export async function deleteEvaluation(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('evaluations').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}
