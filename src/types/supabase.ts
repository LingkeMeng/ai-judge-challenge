/**
 * Supabase 生成的 Database 类型
 * 可使用 `supabase gen types typescript` 自动生成
 * 此文件为占位，实际使用时替换为生成的内容
 */

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Tables<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Row']

export type Insertable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Insert']

export type Updatable<T extends keyof Database['public']['Tables']> =
  Database['public']['Tables'][T]['Update']

// 引用主 types - 确保 Database 在 index.ts 中定义
import type { Database } from './index'
