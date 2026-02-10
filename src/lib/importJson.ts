import type { ImportData, ImportSubmission } from '../types'
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

function formatAnswer(answer: { choice?: string; reasoning?: string }): string {
  const parts: string[] = []
  if (answer.choice != null) parts.push(`choice: ${answer.choice}`)
  if (answer.reasoning != null) parts.push(`reasoning: ${answer.reasoning}`)
  return parts.join(', ') || ''
}

export function parseImportJson(text: string): ImportData {
  const data = JSON.parse(text) as unknown
  if (!Array.isArray(data)) {
    throw new Error('Invalid JSON: root must be an array of submissions')
  }
  for (let i = 0; i < data.length; i++) {
    const s = data[i]
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
      const qData = qObj.data
      if (!qData || typeof qData !== 'object') {
        throw new Error(`Invalid JSON: submissions[${i}].questions[${j}].data must be an object`)
      }
      const d = qData as Record<string, unknown>
      if (typeof d.id !== 'string') {
        throw new Error(`Invalid JSON: submissions[${i}].questions[${j}].data.id must be a string`)
      }
      if (typeof d.questionText !== 'string') {
        throw new Error(`Invalid JSON: submissions[${i}].questions[${j}].data.questionText must be a string`)
      }
    }
    if (!sub.answers || typeof sub.answers !== 'object') {
      throw new Error(`Invalid JSON: submissions[${i}].answers must be an object`)
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

  for (let i = 0; i < data.length; i++) {
    const sub = data[i] as ImportSubmission
    const subRes = await createSubmission({ queue_id: sub.queueId })
    if (subRes.error) {
      result.errors.push(`Submission ${i} (${sub.queueId}): ${subRes.error.message}`)
      continue
    }
    if (!subRes.data) continue

    const submissionId = subRes.data.id
    result.submissionsCount++

    const answersObj = sub.answers ?? {}
    for (const q of sub.questions) {
      const tmplId = q.data.id
      const questionText = q.data.questionText

      const tmplRes = await createQuestionTemplate({ content: questionText })
      if (tmplRes.error) {
        result.errors.push(`Question template ${tmplId}: ${tmplRes.error.message}`)
        continue
      }
      if (!tmplRes.data) continue

      const questionRes = await createQuestion({
        submission_id: submissionId,
        question_template_id: tmplRes.data.id,
        content: questionText,
      })
      if (questionRes.error) {
        result.errors.push(`Question ${tmplId}: ${questionRes.error.message}`)
        continue
      }
      if (!questionRes.data) continue

      result.questionsCount++

      const answerRaw = answersObj[tmplId]
      const answerContent = answerRaw ? formatAnswer(answerRaw) : ''

      const ansRes = await createAnswer({
        submission_id: submissionId,
        question_id: questionRes.data.id,
        content: answerContent,
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
