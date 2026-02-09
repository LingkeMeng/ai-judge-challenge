import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { Judge, JudgeInsert, JudgeUpdate } from '../types'
import { handleError } from './utils'

// Fetch all
export async function fetchJudges(): Promise<ApiResponse<Judge[]>> {
  const { data, error } = await supabase.from('judges').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

// Fetch by id
export async function fetchJudge(id: string): Promise<ApiResponse<Judge | null>> {
  const { data, error } = await supabase.from('judges').select('*').eq('id', id).single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Create
export async function createJudge(payload: JudgeInsert): Promise<ApiResponse<Judge>> {
  const { data, error } = await supabase.from('judges').insert(payload as never).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Update
export async function updateJudge(id: string, payload: JudgeUpdate): Promise<ApiResponse<Judge>> {
  const { data, error } = await supabase.from('judges').update(payload as never).eq('id', id).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Delete
export async function deleteJudge(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('judges').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}
