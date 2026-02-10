import { useState, useEffect, useCallback } from 'react'
import { fetchEvaluations } from '../api/evaluations'
import { fetchJudges } from '../api/judges'
import { supabase } from '../lib/supabaseClient'
import type { Evaluation, Judge, Verdict } from '../types'

interface EvaluationWithDetails extends Evaluation {
  judgeName?: string
  questionContent?: string
  questionId?: string
  queueId?: string
}

const VERDICT_LABELS: Record<Verdict, string> = {
  pass: 'pass',
  fail: 'fail',
  partial: 'inconclusive',
  pending: 'pending',
}

export function ResultsPage() {
  const [evaluations, setEvaluations] = useState<EvaluationWithDetails[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filterVerdicts, setFilterVerdicts] = useState<Verdict[]>([])
  const [filterJudgeIds, setFilterJudgeIds] = useState<string[]>([])
  const [filterQuestionIds, setFilterQuestionIds] = useState<string[]>([])
  const [judges, setJudges] = useState<Judge[]>([])
  const [uniqueQuestions, setUniqueQuestions] = useState<Array<{ id: string; content: string }>>([])

  const loadData = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const { data: evals, error: evalsErr } = await fetchEvaluations()
      if (evalsErr) {
        setError(evalsErr.message)
        setLoading(false)
        return
      }
      const { data: judgeList } = await fetchJudges()
      setJudges(judgeList ?? [])

      const submissionIds = [...new Set((evals ?? []).map((e) => e.submission_id))]
      const questionIds = [...new Set((evals ?? []).map((e) => e.question_id))]

      const { data: subs } = await supabase
        .from('submissions')
        .select('id, queue_id')
        .in('id', submissionIds)
      const submissionMap = new Map((subs ?? []).map((s) => [s.id, s.queue_id]))

      const { data: qs } = await supabase
        .from('questions')
        .select('id, content')
        .in('id', questionIds)
      const questionMap = new Map((qs ?? []).map((q) => [q.id, q.content]))
      setUniqueQuestions([...questionMap.entries()].map(([id, content]) => ({ id, content: content ?? '' })))

      const judgeMap = new Map((judgeList ?? []).map((j) => [j.id, j.name]))

      const enriched: EvaluationWithDetails[] = (evals ?? []).map((e) => ({
        ...e,
        judgeName: judgeMap.get(e.judge_id),
        questionContent: questionMap.get(e.question_id) ?? undefined,
        queueId: submissionMap.get(e.submission_id),
      }))
      setEvaluations(enriched)
    } catch (err) {
      setError(err instanceof Error ? err.message : '加载失败')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadData()
  }, [loadData])

  const filtered = evaluations.filter((e) => {
    if (filterJudgeIds.length && !filterJudgeIds.includes(e.judge_id)) return false
    if (filterQuestionIds.length && !filterQuestionIds.includes(e.question_id)) return false
    if (filterVerdicts.length && !filterVerdicts.includes(e.verdict)) return false
    return true
  })

  const passCount = filtered.filter((e) => e.verdict === 'pass').length
  const totalCount = filtered.length
  const passRate = totalCount > 0 ? Math.round((passCount / totalCount) * 100) : 0

  const toggleVerdict = (v: Verdict) => {
    setFilterVerdicts((prev) =>
      prev.includes(v) ? prev.filter((x) => x !== v) : [...prev, v]
    )
  }
  const toggleJudge = (id: string) => {
    setFilterJudgeIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }
  const toggleQuestion = (id: string) => {
    setFilterQuestionIds((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    )
  }

  return (
    <div style={{ padding: '2rem', maxWidth: 1200 }}>
      <h1>Results</h1>
      <p>Evaluation results from Run AI Judges.</p>

      {!loading && filtered.length > 0 && (
        <div
          style={{
            marginBottom: '1.5rem',
            padding: '1rem',
            background: '#1a2a1a',
            color: '#afa',
            borderRadius: 8,
          }}
        >
          <strong>Pass rate: {passRate}% pass of {totalCount} evaluations</strong>
        </div>
      )}

      <div style={{ marginBottom: '1.5rem', display: 'flex', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <strong>Verdict:</strong>
          <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.25rem' }}>
            {(['pass', 'fail', 'partial'] as const).map((v) => (
              <label key={v} style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                <input
                  type="checkbox"
                  checked={filterVerdicts.includes(v)}
                  onChange={() => toggleVerdict(v)}
                />
                {VERDICT_LABELS[v]}
              </label>
            ))}
          </div>
        </div>
        <div>
          <strong>Judge:</strong>
          <select
            multiple
            value={filterJudgeIds}
            onChange={(e) =>
              setFilterJudgeIds(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={{ minWidth: 150, minHeight: 60, marginTop: '0.25rem' }}
          >
            {judges.map((j) => (
              <option key={j.id} value={j.id}>
                {j.name}
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.85em', color: '#888', marginLeft: '0.25rem' }}>Ctrl+click</span>
        </div>
        <div>
          <strong>Question:</strong>
          <select
            multiple
            value={filterQuestionIds}
            onChange={(e) =>
              setFilterQuestionIds(Array.from(e.target.selectedOptions, (o) => o.value))
            }
            style={{ minWidth: 200, minHeight: 60, marginTop: '0.25rem' }}
          >
            {uniqueQuestions.map((q) => (
              <option key={q.id} value={q.id}>
                {(q.content || q.id).slice(0, 40)}...
              </option>
            ))}
          </select>
          <span style={{ fontSize: '0.85em', color: '#888', marginLeft: '0.25rem' }}>Ctrl+click</span>
        </div>
      </div>

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

      {!loading && evaluations.length === 0 && (
        <p>暂无 evaluations，请先在 Queues 页面运行 Run AI Judges。</p>
      )}

      {!loading && evaluations.length > 0 && filtered.length === 0 && (
        <p>当前筛选条件下无结果。</p>
      )}

      {!loading && filtered.length > 0 && (
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '2px solid #444' }}>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Submission</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Question</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Judge</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Verdict</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Reasoning</th>
                <th style={{ textAlign: 'left', padding: '0.75rem' }}>Created</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((e) => (
                <tr key={e.id} style={{ borderBottom: '1px solid #333' }}>
                  <td style={{ padding: '0.75rem' }}>{e.queueId ?? '-'}</td>
                  <td style={{ padding: '0.75rem', maxWidth: 200 }} title={e.questionContent ?? ''}>
                    {(e.questionContent ?? '-').slice(0, 50)}
                    {(e.questionContent?.length ?? 0) > 50 ? '...' : ''}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{e.judgeName ?? '-'}</td>
                  <td style={{ padding: '0.75rem' }}>{VERDICT_LABELS[e.verdict] ?? e.verdict}</td>
                  <td style={{ padding: '0.75rem', maxWidth: 300 }} title={e.reasoning ?? ''}>
                    {(e.reasoning ?? '-').slice(0, 80)}
                    {(e.reasoning?.length ?? 0) > 80 ? '...' : ''}
                  </td>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(e.created_at).toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
