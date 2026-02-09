import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { QuestionTemplate, QuestionTemplateInsert, QuestionTemplateUpdate } from '../types'
import { handleError } from './utils'

export async function createQuestionTemplate(
  payload: QuestionTemplateInsert
): Promise<ApiResponse<QuestionTemplate>> {
  const { data, error } = await supabase
    .from('question_templates')
    .insert(payload as never)
    .select()
    .single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function fetchQuestionTemplates(): Promise<ApiResponse<QuestionTemplate[]>> {
  const { data, error } = await supabase.from('question_templates').select('*')
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

export async function updateQuestionTemplate(
  id: string,
  payload: QuestionTemplateUpdate
): Promise<ApiResponse<QuestionTemplate>> {
  const { data, error } = await supabase
    .from('question_templates')
    .update(payload as never)
    .eq('id', id)
    .select()
    .single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function deleteQuestionTemplate(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('question_templates').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}
