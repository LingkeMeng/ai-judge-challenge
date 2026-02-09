import type { ImportData } from '../types'
import { createSubmission } from '../api/submissions'
import { createQuestionTemplate } from '../api/questionTemplates'
import { createQuestion } from '../api/questions'
import { createAnswer } from '../api/answers'

export interface ImportResult {
  submissionsCount: number
  questionsCount: number
  answersCount: number
  errors: string[]
}

export function parseImportJson(text: string): ImportData {
  const data = JSON.parse(text) as unknown
  if (!data || typeof data !== 'object') {
    throw new Error('Invalid JSON: root must be an object')
  }
  const obj = data as Record<string, unknown>
  if (!Array.isArray(obj.submissions)) {
    throw new Error('Invalid JSON: "submissions" must be an array')
  }
  for (let i = 0; i < obj.submissions.length; i++) {
    const s = obj.submissions[i]
    if (!s || typeof s !== 'object') {
      throw new Error(`Invalid JSON: submissions[${i}] must be an object`)
    }
    const sub = s as Record<string, unknown>
    if (typeof sub.queueId !== 'string') {
      throw new Error(`Invalid JSON: submissions[${i}].queueId must be a string`)
    }
    if (!Array.isArray(sub.questions)) {
      throw new Error(`Invalid JSON: submissions[${i}].questions must be an array`)
    }
    for (let j = 0; j < sub.questions.length; j++) {
      const q = sub.questions[j]
      if (!q || typeof q !== 'object') {
        throw new Error(`Invalid JSON: submissions[${i}].questions[${j}] must be an object`)
      }
      const qObj = q as Record<string, unknown>
      if (typeof qObj.content !== 'string') {
        throw new Error(`Invalid JSON: submissions[${i}].questions[${j}].content must be a string`)
      }
      if (typeof qObj.answer !== 'string') {
        throw new Error(`Invalid JSON: submissions[${i}].questions[${j}].answer must be a string`)
      }
    }
  }
  return data as ImportData
}

export async function importToSupabase(data: ImportData): Promise<ImportResult> {
  const result: ImportResult = {
    submissionsCount: 0,
    questionsCount: 0,
    answersCount: 0,
    errors: [],
  }

  for (const sub of data.submissions) {
    const subRes = await createSubmission({ queue_id: sub.queueId })
    if (subRes.error) {
      result.errors.push(`Submission ${sub.queueId}: ${subRes.error.message}`)
      continue
    }
    if (!subRes.data) continue

    const submissionId = subRes.data.id
    result.submissionsCount++

    for (const q of sub.questions) {
      const tmplRes = await createQuestionTemplate({ content: q.content })
      if (tmplRes.error) {
        result.errors.push(`Question template: ${tmplRes.error.message}`)
        continue
      }
      if (!tmplRes.data) continue

      const questionRes = await createQuestion({
        submission_id: submissionId,
        question_template_id: tmplRes.data.id,
        content: q.content,
      })
      if (questionRes.error) {
        result.errors.push(`Question: ${questionRes.error.message}`)
        continue
      }
      if (!questionRes.data) continue

      result.questionsCount++

      const ansRes = await createAnswer({
        submission_id: submissionId,
        question_id: questionRes.data.id,
        content: q.answer,
      })
      if (ansRes.error) {
        result.errors.push(`Answer: ${ansRes.error.message}`)
        continue
      }
      result.answersCount++
    }
  }

  return result
}
