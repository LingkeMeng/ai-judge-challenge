import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Layout } from './components'
import { HomePage, UploadPage, JudgesPage, QueuePage, QueuesLandingPage, ResultsPage } from './pages'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="judges" element={<JudgesPage />} />
          <Route path="queues" element={<QueuesLandingPage />} />
          <Route path="queues/:queueId" element={<QueuePage />} />
          <Route path="results" element={<ResultsPage />} />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
