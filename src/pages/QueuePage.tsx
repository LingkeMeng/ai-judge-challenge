import { useState, useCallback, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { fetchSubmissionsByQueueId } from '../api/submissions'
import { fetchQuestionsBySubmission } from '../api/questions'
import { fetchAnswersBySubmission } from '../api/answers'
import { fetchJudges } from '../api/judges'
import {
  fetchJudgeAssignmentsByQuestionTemplate,
  setJudgeAssignmentsForQuestionTemplate,
} from '../api/judgeAssignments'
import { runJudges, type RunJudgesResult } from '../lib/runJudges'
import type { Submission, Question, Answer, Judge } from '../types'

interface SubmissionWithDetails {
  submission: Submission
  questions: Array<{
    question: Question
    answer: Answer | null
    assignedJudgeIds: string[]
  }>
}

export function QueuePage() {
  const { queueId: queueIdParam } = useParams<{ queueId: string }>()
  const queueId = queueIdParam ?? ''
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [submissions, setSubmissions] = useState<SubmissionWithDetails[]>([])
  const [judges, setJudges] = useState<Judge[]>([])
  const [selections, setSelections] = useState<Record<string, string[]>>({})
  const [savingId, setSavingId] = useState<string | null>(null)
  const [runResult, setRunResult] = useState<RunJudgesResult | null>(null)
  const [running, setRunning] = useState(false)

  const loadQueue = useCallback(async () => {
    if (!queueId.trim()) return
    setLoading(true)
    setError(null)
    const { data: subs, error: subsErr } = await fetchSubmissionsByQueueId(queueId.trim())
    if (subsErr) {
      setError(subsErr.message)
      setLoading(false)
      return
    }
    const { data: judgeList } = await fetchJudges()
    setJudges((judgeList ?? []).filter((j) => j.active))

    const details: SubmissionWithDetails[] = []
    for (const sub of subs ?? []) {
      const { data: qs } = await fetchQuestionsBySubmission(sub.id)
      const { data: ans } = await fetchAnswersBySubmission(sub.id)
      const questions: SubmissionWithDetails['questions'] = []
      for (const q of qs ?? []) {
        const answer = (ans ?? []).find((a) => a.question_id === q.id) ?? null
        const { data: assignments } = await fetchJudgeAssignmentsByQuestionTemplate(q.question_template_id)
        const assignedJudgeIds = (assignments ?? []).map((a) => a.judge_id)
        questions.push({ question: q, answer, assignedJudgeIds })
      }
      details.push({ submission: sub, questions })
    }
    setSubmissions(details)

    const sel: Record<string, string[]> = {}
    for (const d of details) {
      for (const { question, assignedJudgeIds } of d.questions) {
        if (!(question.question_template_id in sel)) {
          sel[question.question_template_id] = assignedJudgeIds
        }
      }
    }
    setSelections(sel)
    setLoading(false)
  }, [queueId])

  useEffect(() => {
    if (queueId) loadQueue()
  }, [queueId, loadQueue])

  const handleSelectionChange = (questionTemplateId: string, judgeIds: string[]) => {
    setSelections((prev) => ({ ...prev, [questionTemplateId]: judgeIds }))
  }

  const handleSave = async (questionTemplateId: string) => {
    setSavingId(questionTemplateId)
    setError(null)
    const judgeIds = selections[questionTemplateId] ?? []
    const { error: err } = await setJudgeAssignmentsForQuestionTemplate(questionTemplateId, judgeIds)
    if (err) setError(err.message)
    else {
      setSubmissions((prev) =>
        prev.map((s) => ({
          ...s,
          questions: s.questions.map((q) =>
            q.question.question_template_id === questionTemplateId
              ? { ...q, assignedJudgeIds: judgeIds }
              : q
          ),
        }))
      )
    }
    setSavingId(null)
  }

  const handleRunJudges = async () => {
    if (!queueId.trim()) return
    setRunning(true)
    setError(null)
    setRunResult(null)
    try {
      const result = await runJudges(queueId.trim())
      setRunResult(result)
      loadQueue()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Run failed')
    } finally {
      setRunning(false)
    }
  }

  if (!queueId) {
    return (
      <div style={{ padding: '2rem' }}>
        <p>No queue ID. <Link to="/queues">Select a queue</Link></p>
      </div>
    )
  }

  return (
    <div className="queue-page" style={{ padding: '2rem', maxWidth: 1000 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
        <h1 style={{ margin: 0 }}>Queue: {queueId}</h1>
        <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
          <Link to="/queues">← 切换 Queue</Link>
          <button
            type="button"
            onClick={handleRunJudges}
            disabled={loading || running || submissions.length === 0}
          >
            {running ? 'Running...' : 'Run AI Judges'}
          </button>
        </div>
      </div>

      {runResult && (
        <div
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: runResult.planned === 0 ? '#2a2a1a' : runResult.failed > 0 ? '#2a1a1a' : '#1a2a1a',
            color: runResult.planned === 0 ? '#fa0' : runResult.failed > 0 ? '#faa' : '#afa',
            borderRadius: 8,
          }}
        >
          <strong>Run AI Judges 结果：</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: 0 }}>
            <li>Planned: {runResult.planned}</li>
            <li>Completed: {runResult.completed}</li>
            <li>Failed: {runResult.failed}</li>
          </ul>
          {runResult.planned === 0 && runResult.diagnostic && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.9em' }}>
              <strong>诊断：</strong> {runResult.diagnostic.message}
              <br />
              (submissions: {runResult.diagnostic.submissionsCount}, 有答案的题: {runResult.diagnostic.questionsWithAnswersCount}, 分配数: {runResult.diagnostic.totalJudgeAssignments}, active judges: {runResult.diagnostic.activeJudgesCount})
            </p>
          )}
          {runResult.failed > 0 && runResult.failureReasons && runResult.failureReasons.length > 0 && (
            <p style={{ margin: '0.75rem 0 0', fontSize: '0.9em', color: '#faa' }}>
              <strong>失败原因：</strong>
              <ul style={{ margin: '0.25rem 0 0 1rem', paddingLeft: 0 }}>
                {runResult.failureReasons.map((r, i) => (
                  <li key={i}>{r}</li>
                ))}
              </ul>
            </p>
          )}
        </div>
      )}

      {error && (
        <div
          role="alert"
          style={{
            marginBottom: '1rem',
            padding: '1rem',
            background: '#3d1a1a',
            color: '#faa',
            borderRadius: 8,
          }}
        >
          {error}
        </div>
      )}

      {loading && <p>加载中...</p>}

      {!loading && submissions.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {submissions.map(({ submission, questions }) => (
            <div
              key={submission.id}
              style={{
                border: '1px solid #444',
                borderRadius: 8,
                padding: '1rem',
                background: '#1a1a1a',
              }}
            >
              <h3 style={{ marginTop: 0 }}>
                Submission: {submission.queue_id} ({new Date(submission.created_at).toLocaleString()})
              </h3>
              {questions.length === 0 && <p>暂无 questions</p>}
              {questions.map(({ question, answer, assignedJudgeIds }) => (
                <div
                  key={question.id}
                  style={{
                    marginBottom: '1rem',
                    padding: '1rem',
                    background: '#242424',
                    borderRadius: 8,
                  }}
                >
                  <div style={{ marginBottom: '0.5rem' }}>
                    <strong>Question:</strong> {question.content ?? '-'}
                  </div>
                  <div style={{ marginBottom: '0.75rem' }}>
                    <strong>Answer:</strong> {answer?.content ?? '-'}
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                    <label>
                      <strong>Judges:</strong>
                    </label>
                    <select
                      multiple
                      value={selections[question.question_template_id] ?? assignedJudgeIds}
                      onChange={(e) => {
                        const selected = Array.from(e.target.selectedOptions, (o) => o.value)
                        handleSelectionChange(question.question_template_id, selected)
                      }}
                      style={{ minWidth: 200, minHeight: 80 }}
                    >
                      {judges.map((j) => (
                        <option key={j.id} value={j.id}>
                          {j.name}
                        </option>
                      ))}
                    </select>
                    <span style={{ fontSize: '0.85em', color: '#888' }}>Ctrl/Shift 多选</span>
                    <button
                      type="button"
                      onClick={() => handleSave(question.question_template_id)}
                      disabled={savingId === question.question_template_id}
                    >
                      {savingId === question.question_template_id ? '保存中...' : '保存'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {!loading && queueId.trim() && submissions.length === 0 && (
        <p>未找到 queueId 为 "{queueId}" 的 submissions</p>
      )}
    </div>
  )
}
