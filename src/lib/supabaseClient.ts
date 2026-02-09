import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import type { Database } from '../types'

// 支持 SUPABASE_URL / SUPABASE_ANON_KEY 或 VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY
const supabaseUrl =
  import.meta.env.SUPABASE_URL ?? import.meta.env.VITE_SUPABASE_URL ?? ''
const supabaseAnonKey =
  import.meta.env.SUPABASE_ANON_KEY ?? import.meta.env.VITE_SUPABASE_ANON_KEY ?? ''

if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    'Missing Supabase env. Add to .env: SUPABASE_URL, SUPABASE_ANON_KEY (or VITE_ prefixed)'
  )
}

export const supabase: SupabaseClient<Database> = createClient<Database>(
  supabaseUrl,
  supabaseAnonKey
)
