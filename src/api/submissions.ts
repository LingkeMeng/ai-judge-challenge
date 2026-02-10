import { supabase } from '../lib/supabaseClient'
import type { ApiResponse } from '../types'
import type { Submission, SubmissionInsert, SubmissionUpdate } from '../types'
import { handleError } from './utils'

// Fetch all
export async function fetchSubmissions(): Promise<ApiResponse<Submission[]>> {
  const { data, error } = await supabase.from('submissions').select('*').order('created_at', { ascending: false })
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

// Fetch distinct queue IDs
export async function fetchQueueIds(): Promise<ApiResponse<string[]>> {
  const { data, error } = await supabase
    .from('submissions')
    .select('queue_id')
  if (error) return { data: null, error: handleError(error) }
  const ids = [...new Set((data ?? []).map((r) => r.queue_id))]
  return { data: ids.sort(), error: null }
}

// Fetch by queueId
export async function fetchSubmissionsByQueueId(queueId: string): Promise<ApiResponse<Submission[]>> {
  const { data, error } = await supabase
    .from('submissions')
    .select('*')
    .eq('queue_id', queueId)
    .order('created_at', { ascending: false })
  if (error) return { data: null, error: handleError(error) }
  return { data: data ?? [], error: null }
}

// Fetch by id
export async function fetchSubmission(id: string): Promise<ApiResponse<Submission | null>> {
  const { data, error } = await supabase.from('submissions').select('*').eq('id', id).single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Create
export async function createSubmission(
  payload: SubmissionInsert
): Promise<ApiResponse<Submission>> {
  const { data, error } = await supabase.from('submissions').insert(payload as never).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Update
export async function updateSubmission(
  id: string,
  payload: SubmissionUpdate
): Promise<ApiResponse<Submission>> {
  const { data, error } = await supabase.from('submissions').update(payload as never).eq('id', id).select().single()
  if (error) return { data: null, error: handleError(error) }
  return { data, error: null }
}

// Delete
export async function deleteSubmission(id: string): Promise<ApiResponse<void>> {
  const { error } = await supabase.from('submissions').delete().eq('id', id)
  if (error) return { data: null, error: handleError(error) }
  return { data: undefined, error: null }
}
