import { BrowserRouter, Routes, Route } from 'react-router-dom'
import { Layout } from './components'
import { HomePage, UploadPage, JudgesPage, QueuePage } from './pages'
import './App.css'

function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<HomePage />} />
          <Route path="upload" element={<UploadPage />} />
          <Route path="judges" element={<JudgesPage />} />
          <Route path="queue" element={<QueuePage />} />
        </Route>
      </Routes>
    </BrowserRouter>
  )
}

export default App
