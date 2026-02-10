import { useState, useEffect } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { fetchQueueIds } from '../api/submissions'

export function QueuesLandingPage() {
  const [queueId, setQueueId] = useState('')
  const [queueIds, setQueueIds] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    fetchQueueIds().then(({ data }) => {
      setQueueIds(data ?? [])
      setLoading(false)
    })
  }, [])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (queueId.trim()) navigate(`/queues/${encodeURIComponent(queueId.trim())}`)
  }

  return (
    <div style={{ padding: '2rem' }}>
      <h1>Queues</h1>
      <form onSubmit={handleSubmit} style={{ display: 'flex', gap: '0.5rem', marginTop: '1rem' }}>
        <input
          type="text"
          value={queueId}
          onChange={(e) => setQueueId(e.target.value)}
          placeholder="Queue ID"
          style={{ padding: '0.5rem', minWidth: 200 }}
        />
        <button type="submit">Go</button>
      </form>

      <div style={{ marginTop: '2rem' }}>
        <h3 style={{ marginBottom: '0.75rem' }}>Available Queues</h3>
        {loading ? (
          <p>Loading...</p>
        ) : queueIds.length === 0 ? (
          <p>No queues yet. Import data on the Upload page first.</p>
        ) : (
          <ul style={{ listStyle: 'none', padding: 0, margin: 0 }}>
            {queueIds.map((id) => (
              <li key={id} style={{ marginBottom: '0.5rem' }}>
                <Link to={`/queues/${encodeURIComponent(id)}`} style={{ color: '#646cff' }}>
                  {id}
                </Link>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  )
}
