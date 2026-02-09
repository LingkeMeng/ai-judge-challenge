import { useState, useEffect, useCallback } from 'react'
import { fetchJudges, createJudge, updateJudge } from '../api/judges'
import type { Judge } from '../types'

interface JudgeFormData {
  name: string
  prompt: string
  modelName: string
  active: boolean
}

const emptyForm: JudgeFormData = {
  name: '',
  prompt: '',
  modelName: '',
  active: true,
}

export function JudgesPage() {
  const [judges, setJudges] = useState<Judge[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [modalOpen, setModalOpen] = useState<'create' | 'edit' | null>(null)
  const [editingJudge, setEditingJudge] = useState<Judge | null>(null)
  const [form, setForm] = useState<JudgeFormData>(emptyForm)

  const loadJudges = useCallback(async () => {
    setLoading(true)
    const { data, error: err } = await fetchJudges()
    if (err) setError(err.message)
    else setJudges(data ?? [])
    setLoading(false)
  }, [])

  useEffect(() => {
    loadJudges()
  }, [loadJudges])

  const openCreate = () => {
    setForm(emptyForm)
    setEditingJudge(null)
    setModalOpen('create')
    setError(null)
  }

  const openEdit = (judge: Judge) => {
    setForm({
      name: judge.name,
      prompt: judge.prompt ?? '',
      modelName: judge.model_name ?? '',
      active: judge.active,
    })
    setEditingJudge(judge)
    setModalOpen('edit')
    setError(null)
  }

  const closeModal = () => {
    setModalOpen(null)
    setEditingJudge(null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    if (modalOpen === 'create') {
      const { data, error: err } = await createJudge({
        name: form.name,
        prompt: form.prompt || null,
        model_name: form.modelName || null,
        active: form.active,
      })
      if (err) setError(err.message)
      else {
        closeModal()
        loadJudges()
      }
    } else if (modalOpen === 'edit' && editingJudge) {
      const { error: err } = await updateJudge(editingJudge.id, {
        name: form.name,
        prompt: form.prompt || null,
        model_name: form.modelName || null,
        active: form.active,
      })
      if (err) setError(err.message)
      else {
        closeModal()
        loadJudges()
      }
    }
  }

  const handleDeactivate = async (judge: Judge) => {
    if (!confirm(`确定要停用 "${judge.name}" 吗？`)) return
    const { error: err } = await updateJudge(judge.id, { active: false })
    if (err) setError(err.message)
    else loadJudges()
  }

  return (
    <div className="judges-page" style={{ padding: '2rem', maxWidth: 900 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
        <h1>Judges</h1>
        <button onClick={openCreate}>新建 Judge</button>
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

      {loading ? (
        <p>加载中...</p>
      ) : (
        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #444' }}>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Name</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Model</th>
              <th style={{ textAlign: 'left', padding: '0.75rem' }}>Active</th>
              <th style={{ textAlign: 'right', padding: '0.75rem' }}>操作</th>
            </tr>
          </thead>
          <tbody>
            {judges.map((j) => (
              <tr key={j.id} style={{ borderBottom: '1px solid #333' }}>
                <td style={{ padding: '0.75rem' }}>{j.name}</td>
                <td style={{ padding: '0.75rem' }}>{j.model_name ?? '-'}</td>
                <td style={{ padding: '0.75rem' }}>{j.active ? '是' : '否'}</td>
                <td style={{ padding: '0.75rem', textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={() => openEdit(j)}
                    style={{ marginRight: '0.5rem' }}
                  >
                    编辑
                  </button>
                  {j.active && (
                    <button
                      type="button"
                      onClick={() => handleDeactivate(j)}
                      style={{ color: '#f88' }}
                    >
                      停用
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {judges.length === 0 && !loading && <p>暂无 judges，点击「新建 Judge」添加</p>}

      {modalOpen && (
        <div
          role="dialog"
          aria-modal="true"
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.6)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 1000,
          }}
          onClick={closeModal}
        >
          <div
            style={{
              background: '#242424',
              padding: '2rem',
              borderRadius: 12,
              minWidth: 400,
              maxWidth: 500,
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <h2 style={{ marginTop: 0 }}>
              {modalOpen === 'create' ? '新建 Judge' : '编辑 Judge'}
            </h2>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="judge-name" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Name *
                </label>
                <input
                  id="judge-name"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  required
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="judge-prompt" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Prompt
                </label>
                <textarea
                  id="judge-prompt"
                  value={form.prompt}
                  onChange={(e) => setForm((f) => ({ ...f, prompt: e.target.value }))}
                  rows={4}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label htmlFor="judge-model" style={{ display: 'block', marginBottom: '0.25rem' }}>
                  Model Name
                </label>
                <input
                  id="judge-model"
                  value={form.modelName}
                  onChange={(e) => setForm((f) => ({ ...f, modelName: e.target.value }))}
                  style={{ width: '100%', padding: '0.5rem' }}
                />
              </div>
              <div style={{ marginBottom: '1.5rem' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <input
                    type="checkbox"
                    checked={form.active}
                    onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
                  />
                  Active
                </label>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end' }}>
                <button type="button" onClick={closeModal}>
                  取消
                </button>
                <button type="submit">
                  {modalOpen === 'create' ? '创建' : '保存'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
