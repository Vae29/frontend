import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { loginUser } from '../services/authApi'
import { setSession } from '../services/authSession'
import '../styles/login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    if (!password) {
      window.alert('Ingrese la contraseña.')
      setIsLoading(false)
      return
    }

    const result = await loginUser(email, password)

    if (result.success) {
      const { id, email: userEmail, nombre, role } = result.data
      setSession({ id, email: userEmail, nombre, role })
      navigate(role === 'admin' ? '/admin' : '/worker', { replace: true })
    } else {
      window.alert(result.message || 'Credenciales no válidas. Intente nuevamente.')
    }

    setIsLoading(false)
  }

  return (
    <div className="container login-page">
      <div className="left-section">
        <div className="welcome-container">
          <div className="logo-container">
            <div className="circle-illustration">
              <img src="/recursos/logo.png" alt="Logo AgroGestión" />
            </div>
          </div>
          <div className="text-container">
            <h1>
              Bienvenido a
              <br />
              AgroGestión
            </h1>
            <p>Sistema de Gestión Agrícola</p>
          </div>
        </div>
      </div>

      <div className="right-section">
        <div className="login-card">
          <h2>Inicia sesión en AgroGestión</h2>

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label htmlFor="email">Correo electrónico</label>
              <input
                type="email"
                id="email"
                name="email"
                placeholder="Ingrese su correo electrónico"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Contraseña</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  name="password"
                  placeholder="Ingrese su contraseña"
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="toggle-password"
                  id="togglePassword"
                  title="Mostrar/ocultar contraseña"
                  onClick={() => setShowPassword((v) => !v)}
                >
                  <svg
                    className="eye-icon-open"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: showPassword ? 'none' : 'block' }}
                  >
                    <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                    <circle cx="12" cy="12" r="3" />
                  </svg>
                  <svg
                    className="eye-icon-closed"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    stroke="currentColor"
                    strokeWidth="2"
                    fill="none"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    style={{ display: showPassword ? 'block' : 'none' }}
                  >
                    <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24" />
                    <line x1="1" y1="1" x2="23" y2="23" />
                  </svg>
                </button>
              </div>
            </div>

            <button type="submit" className="login-btn" disabled={isLoading}>
              {isLoading ? 'Autenticando...' : 'Iniciar sesión'}
            </button>
          </form>

          <a href="#" className="forgot-password" onClick={(e) => e.preventDefault()}>
            ¿Olvidaste tu contraseña?
          </a>
        </div>
      </div>
    </div>
  )
}
