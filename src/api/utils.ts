import type { ApiResponse } from '../types'

export function handleError(err: unknown): ApiResponse<never>['error'] {
  if (err && typeof err === 'object' && 'message' in err) {
    return {
      message: (err as { message: string }).message,
      code: (err as { code?: string }).code,
      details: err,
    }
  }
  return { message: String(err) }
}
