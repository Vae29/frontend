import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getSession } from './services/authSession'
import Login from './pages/login'
import AdminPanel from './pages/admin-panel'
import WorkerPanel from './pages/worker-panel'

function RequireAdmin({ children }) {
  const s = getSession()
  if (!s || s.role !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

function RequireWorker({ children }) {
  const s = getSession()
  if (!s || s.role !== 'worker') {
    return <Navigate to="/" replace />
  }
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Login />} />
        <Route
          path="/admin"
          element={
            <RequireAdmin>
              <AdminPanel />
            </RequireAdmin>
          }
        />
        <Route
          path="/worker"
          element={
            <RequireWorker>
              <WorkerPanel />
            </RequireWorker>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
