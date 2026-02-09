import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { JudgeAssignment, JudgeAssignmentInsert } from '../types'
import { handleError } from './utils'

export async function fetchJudgeAssignmentsByQuestionTemplate(
  questionTemplateId: string
): Promise<ApiResponse<JudgeAssignment[]>> {
  const { data, error } = await supabase
    .from('judge_assignments')
    .select('*')
    .eq('question_template_id', questionTemplateId)
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

export async function createJudgeAssignment(
  payload: JudgeAssignmentInsert
): Promise<ApiResponse<JudgeAssignment>> {
  const { data, error } = await supabase
    .from('judge_assignments')
    .insert(payload as never)
    .select()
    .single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

export async function deleteJudgeAssignment(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('judge_assignments').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}

export async function setJudgeAssignmentsForQuestionTemplate(
  questionTemplateId: string,
  judgeIds: string[]
): Promise<ApiResponse<void>> {
  const { error: delErr } = await supabase
    .from('judge_assignments')
    .delete()
    .eq('question_template_id', questionTemplateId)
  if (delErr) return { data: null, error: handleError(delErr) }
  for (const judgeId of judgeIds) {
    const { error } = await supabase
      .from('judge_assignments')
      .insert({ question_template_id: questionTemplateId, judge_id: judgeId } as never)
    if (error) return { data: null, error: handleError(error) }
  }
  return { data: undefined, error: null }
}
