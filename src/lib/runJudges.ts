import OpenAI from 'openai'
import { fetchSubmissionsByQueueId } from '../api/submissions'
import { fetchQuestionsBySubmission } from '../api/questions'
import { fetchAnswersBySubmission } from '../api/answers'
import { fetchJudgeAssignmentsByQuestionTemplate } from '../api/judgeAssignments'
import { fetchJudges } from '../api/judges'
import { createEvaluation } from '../api/evaluations'
import type { Verdict } from '../types'

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY ?? import.meta.env.OPENAI_API_KEY ?? ''

const DEFAULT_MODEL = 'gpt-4o-mini'

interface JudgeResult {
  verdict: 'pass' | 'fail' | 'inconclusive'
  reasoning: string
}

function parseJudgeOutput(text: string): JudgeResult {
  const trimmed = text.trim()
  const jsonMatch = trimmed.match(/\{[\s\S]*\}/)
  if (!jsonMatch) throw new Error('No JSON found in response')
  const parsed = JSON.parse(jsonMatch[0]) as unknown
  if (!parsed || typeof parsed !== 'object') throw new Error('Invalid JSON')
  const obj = parsed as Record<string, unknown>
  const verdict = obj.verdict
  if (verdict !== 'pass' && verdict !== 'fail' && verdict !== 'inconclusive') {
    throw new Error(`Invalid verdict: ${String(verdict)}`)
  }
  const reasoning = typeof obj.reasoning === 'string' ? obj.reasoning : String(obj.reasoning ?? '')
  return { verdict, reasoning }
}

function mapVerdict(v: JudgeResult['verdict']): Verdict {
  if (v === 'inconclusive') return 'partial'
  return v
}

async function callJudge(
  systemRubric: string,
  questionText: string,
  userAnswer: string,
  model: string
): Promise<JudgeResult> {
  const openai = new OpenAI({ apiKey: OPENAI_API_KEY, dangerouslyAllowBrowser: true })
  const response = await openai.chat.completions.create({
    model,
    messages: [
      {
        role: 'system',
        content: systemRubric,
      },
      {
        role: 'user',
        content: `Question: ${questionText}\n\nUser Answer: ${userAnswer}\n\nRespond with JSON only: { "verdict": "pass" | "fail" | "inconclusive", "reasoning": "..." }`,
      },
    ],
    response_format: { type: 'json_object' },
  })
  const content = response.choices[0]?.message?.content
  if (!content) throw new Error('Empty response from OpenAI')
  return parseJudgeOutput(content)
}

export interface RunJudgesResult {
  planned: number
  completed: number
  failed: number
  failureReasons?: string[]
  diagnostic?: RunJudgesDiagnostic
}

export interface RunJudgesDiagnostic {
  submissionsCount: number
  questionsWithAnswersCount: number
  totalJudgeAssignments: number
  activeJudgesCount: number
  message: string
}

export async function getRunJudgesDiagnostics(queueId: string): Promise<RunJudgesDiagnostic | null> {
  const { data: subs } = await fetchSubmissionsByQueueId(queueId.trim())
  if (!subs?.length) {
    return { submissionsCount: 0, questionsWithAnswersCount: 0, totalJudgeAssignments: 0, activeJudgesCount: 0, message: '无 submissions' }
  }

  const { data: judges } = await fetchJudges()
  const activeJudges = (judges ?? []).filter((j) => j.active !== false)

  let questionsWithAnswers = 0
  let totalAssignments = 0

  for (const sub of subs) {
    const { data: qs } = await fetchQuestionsBySubmission(sub.id)
    const { data: ans } = await fetchAnswersBySubmission(sub.id)
    for (const q of qs ?? []) {
      const answer = (ans ?? []).find((a) => a.question_id === q.id)
      if (!answer?.content) continue
      questionsWithAnswers++
      const { data: assignments } = await fetchJudgeAssignmentsByQuestionTemplate(q.question_template_id)
      totalAssignments += (assignments ?? []).length
    }
  }

  let message = ''
  if (activeJudges.length === 0) message = '无 active Judge，请在 Judges 页面创建'
  else if (questionsWithAnswers === 0) message = '无带答案的 question'
  else if (totalAssignments === 0) message = '无 Judge 分配，请为每题选择 Judge 并点击「保存」'
  else message = `可运行 ${questionsWithAnswers} 题 × 分配数 = ${totalAssignments} 个任务`

  return {
    submissionsCount: subs.length,
    questionsWithAnswersCount: questionsWithAnswers,
    totalJudgeAssignments: totalAssignments,
    activeJudgesCount: activeJudges.length,
    message,
  }
}

export async function runJudges(queueId: string): Promise<RunJudgesResult> {
  if (!OPENAI_API_KEY) {
    throw new Error('Missing OPENAI_API_KEY or VITE_OPENAI_API_KEY in .env')
  }

  const diagnostic = await getRunJudgesDiagnostics(queueId)
  if (!diagnostic) return { planned: 0, completed: 0, failed: 0 }

  const { data: subs, error: subsErr } = await fetchSubmissionsByQueueId(queueId.trim())
  if (subsErr) throw new Error(subsErr.message)
  if (!subs?.length) return { planned: 0, completed: 0, failed: 0, diagnostic }

  const { data: judges } = await fetchJudges()
  const judgeMap = new Map((judges ?? []).map((j) => [j.id, j]))

  const tasks: Array<{
    submissionId: string
    questionId: string
    judgeId: string
    questionText: string
    userAnswer: string
    systemRubric: string
    model: string
  }> = []

  for (const sub of subs) {
    const { data: qs } = await fetchQuestionsBySubmission(sub.id)
    const { data: ans } = await fetchAnswersBySubmission(sub.id)
    for (const q of qs ?? []) {
      const answer = (ans ?? []).find((a) => a.question_id === q.id)
      if (!answer?.content) continue
      const { data: assignments } = await fetchJudgeAssignmentsByQuestionTemplate(q.question_template_id)
      for (const a of assignments ?? []) {
        const judge = judgeMap.get(a.judge_id)
        if (!judge || judge.active === false) continue
        const rubric = judge.prompt?.trim() || 'Evaluate the answer. Return JSON: { "verdict": "pass"|"fail"|"inconclusive", "reasoning": "..." }'
        tasks.push({
          submissionId: sub.id,
          questionId: q.id,
          judgeId: judge.id,
          questionText: q.content ?? '',
          userAnswer: answer.content,
          systemRubric: rubric,
          model: judge.model_name?.trim() || DEFAULT_MODEL,
        })
      }
    }
  }

  let completed = 0
  let failed = 0
  const failureReasons: string[] = []

  for (const task of tasks) {
    try {
      const result = await callJudge(
        task.systemRubric,
        task.questionText,
        task.userAnswer,
        task.model
      )
      const { error } = await createEvaluation({
        submission_id: task.submissionId,
        question_id: task.questionId,
        judge_id: task.judgeId,
        verdict: mapVerdict(result.verdict),
        reasoning: result.reasoning,
      })
      if (error) throw new Error(error.message)
      completed++
    } catch (err) {
      failed++
      const msg = err instanceof Error ? err.message : String(err)
      if (!failureReasons.includes(msg)) failureReasons.push(msg)
    }
  }

  return {
    planned: tasks.length,
    completed,
    failed,
    failureReasons: failureReasons.length > 0 ? failureReasons : undefined,
    diagnostic,
  }
}
