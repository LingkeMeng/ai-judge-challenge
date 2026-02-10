import { useState, useCallback } from 'react'
import { parseImportJson, importToSupabase, type ImportResult } from '../lib/importJson'
const EXPECTED_FORMAT = `[
  {
    "id": "sub_1",
    "queueId": "queue_1",
    "labelingTaskId": "task_1",
    "createdAt": 1690000000000,
    "questions": [
      {
        "rev": 1,
        "data": {
          "id": "q_template_1",
          "questionType": "single_choice_with_reasoning",
          "questionText": "Is the sky blue?"
        }
      }
    ],
    "answers": {
      "q_template_1": { "choice": "yes", "reasoning": "Observed on a clear day." }
    }
  }
]`

export function UploadPage() {
  const [file, setFile] = useState<File | null>(null)
  const [result, setResult] = useState<ImportResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    setFile(f ?? null)
    setResult(null)
    setError(null)
  }, [])

  const handleUpload = useCallback(async () => {
    if (!file) {
      setError('Please select a file')
      return
    }

    if (!file.name.endsWith('.json')) {
      setError('Please upload a .json file')
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const text = await file.text()
      const data = parseImportJson(text)
      const importResult = await importToSupabase(data)
      setResult(importResult)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Invalid JSON')
    } finally {
      setLoading(false)
    }
  }, [file])

  return (
    <div className="upload-page" style={{ padding: '2rem', maxWidth: 600 }}>
      <h1>Upload</h1>
      <p>Upload a JSON file to import submissions, questions, and answers into Supabase.</p>

      <div style={{ marginTop: '1.5rem' }}>
        <input
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ marginBottom: '0.75rem' }}
        />
        <br />
        <button onClick={handleUpload} disabled={loading || !file}>
          {loading ? 'Importing...' : 'Upload & Import'}
        </button>
      </div>

      {error && (
        <div
          role="alert"
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#3d1a1a',
            color: '#faa',
            borderRadius: 8,
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {result && !error && (
        <div
          style={{
            marginTop: '1rem',
            padding: '1rem',
            background: '#1a3d2a',
            color: '#afa',
            borderRadius: 8,
          }}
        >
          <strong>Import successful</strong>
          <ul style={{ margin: '0.5rem 0 0 1rem', paddingLeft: 0 }}>
            <li>Submissions: {result.submissionsCount}</li>
            <li>Questions: {result.questionsCount}</li>
            <li>Answers: {result.answersCount}</li>
          </ul>
          {result.errors.length > 0 && (
            <details style={{ marginTop: '0.75rem' }}>
              <summary>Partial errors ({result.errors.length})</summary>
              <ul style={{ margin: '0.25rem 0 0 1rem', fontSize: '0.9em', color: '#faa' }}>
                {result.errors.slice(0, 5).map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
                {result.errors.length > 5 && (
                  <li>… and {result.errors.length - 5} more</li>
                )}
              </ul>
            </details>
          )}
        </div>
      )}

      <details style={{ marginTop: '2rem' }}>
        <summary>Expected JSON format</summary>
        <pre
          style={{
            marginTop: '0.5rem',
            padding: '1rem',
            background: '#1a1a1a',
            borderRadius: 8,
            overflow: 'auto',
            fontSize: '0.85em',
          }}
        >
          {EXPECTED_FORMAT}
        </pre>
      </details>
    </div>
  )
}
