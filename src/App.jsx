import { useEffect, useState } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { getSession, setAccessToken, setSession, clearTokens } from './services/authSession'
import { refreshSession } from './services/authApi'
import useAuthSession from './hooks/useAuthSession'
import Login from './pages/login'
import AdminPanel from './pages/admin-panel'
import WorkerPanel from './pages/worker-panel'

function normalizeRole(role) {
  const value = String(role || '')
    .trim()
    .toLowerCase()
    .replace(/á/g, 'a')
    .replace(/é/g, 'e')
    .replace(/í/g, 'i')
    .replace(/ó/g, 'o')
    .replace(/ú/g, 'u')

  if (value === 'admin' || value === 'administrador' || value === '1') return 'admin'
  if (value === 'worker' || value === 'trabajador' || value === '2') return 'worker'
  return ''
}

function RequireAdmin({ children }) {
  const s = useAuthSession()
  if (!s) {
    return <Navigate to="/" replace />
  }
  if (normalizeRole(s.role) !== 'admin') {
    return <Navigate to="/" replace />
  }
  return children
}

function RequireWorker({ children }) {
  const s = useAuthSession()
  if (!s) {
    return <Navigate to="/" replace />
  }
  if (normalizeRole(s.role) !== 'worker') {
    return <Navigate to="/" replace />
  }
  return children
}

function AppRoutes() {
  useEffect(() => {
    // Limpiar tokens cuando se cierre la pestaña
    const handleBeforeUnload = (e) => {
      // Al cerrar la pestaña, el access token en memoria se pierde automáticamente
      // El refresh token en la cookie se pierde cuando el navegador se cierra (si sameSite=strict)
    }

    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload)
    }
  }, [])

  return (
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
  )
}

export default function App() {
  const [loadingSession, setLoadingSession] = useState(true)

  useEffect(() => {
    let timeoutId = null
    
    async function initializeSession() {
      try {
        const current = getSession()
        if (current) {
          setSession(current)
        }

        const result = await refreshSession()
        if (result.success && result.data) {
          const { id, email, nombre, apellidos = '', role, accessToken } = result.data
          setAccessToken(accessToken)
          setSession({ id, email, nombre, apellidos, role })
        } else {
          clearTokens()
        }
      } catch (error) {
        clearTokens()
      } finally {
        timeoutId = setTimeout(() => {
          setLoadingSession(false)
        }, 100)
      }
    }

    initializeSession()
    
    return () => {
      if (timeoutId) clearTimeout(timeoutId)
    }
  }, [])

  if (loadingSession) {
    return null
  }

  return (
    <BrowserRouter>
      <AppRoutes />
    </BrowserRouter>
  )
}
