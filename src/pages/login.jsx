import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import * as Agro from '../services/agroData'
import { loginUser, requestPasswordReset, verifyResetCode } from '../services/authApi'
import { setSession, setAccessToken } from '../services/authSession'
import '../styles/login.css'

export default function Login() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [showResetModal, setShowResetModal] = useState(false)
  const [resetEmail, setResetEmail] = useState('')
  const [resetError, setResetError] = useState('')
  const [resetSuccess, setResetSuccess] = useState('')
  const [resetStep, setResetStep] = useState('email')
  const [enteredCode, setEnteredCode] = useState('')
  const [codeSentAt, setCodeSentAt] = useState(null)
  const [isSendingCode, setIsSendingCode] = useState(false)
  const [codeValidMessage, setCodeValidMessage] = useState('')
  const [recoveredPassword, setRecoveredPassword] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsLoading(true)

    const trimmedEmail = email.trim()
    const trimmedPassword = password.trim()

    if (!trimmedEmail) {
      window.alert('Ingrese el correo electrónico.')
      setIsLoading(false)
      return
    }

    if (!trimmedPassword) {
      window.alert('Ingrese la contraseña.')
      setIsLoading(false)
      return
    }

    const result = await loginUser(trimmedEmail.toLowerCase(), trimmedPassword)

    if (result.success) {
      const { id, email: userEmail, nombre, apellidos = '', role: rawRole, accessToken } = result.data
      const normalizedRole = String(rawRole || '')
        .trim()
        .toLowerCase()
        .replace(/á/g, 'a')
        .replace(/é/g, 'e')
        .replace(/í/g, 'i')
        .replace(/ó/g, 'o')
        .replace(/ú/g, 'u')

      const role =
        normalizedRole === 'admin' ||
        normalizedRole === 'administrador' ||
        normalizedRole === '1'
          ? 'admin'
          : 'worker'

      // Guardar el access token en memoria
      if (accessToken) {
        setAccessToken(accessToken)
      }

      const sessionData = { id, email: userEmail, nombre, apellidos, role }
      if (role === 'worker') {
        const trabajador = Agro.getTrabajadorByEmail(userEmail)
        if (trabajador) {
          sessionData.workerKey = trabajador.key
        }
      }

      // Establecer sección principal al iniciar sesión
      if (role === 'admin') {
        localStorage.setItem('activeSection', 'dashboard')
      } else {
        localStorage.setItem('workerActiveSection', 'inicio')
      }

      setSession(sessionData)
      navigate(role === 'admin' ? '/admin' : '/worker', { replace: true })
    } else {
      window.alert(result.message || 'Credenciales no válidas. Intente nuevamente.')
    }

    setIsLoading(false)
  }

  const handleOpenResetModal = (e) => {
    e.preventDefault()
    setShowResetModal(true)
    setResetEmail('')
    setResetError('')
    setResetSuccess('')
    setResetStep('email')
    setEnteredCode('')
    setCodeSentAt(null)
    setCodeValidMessage('')
  }

  const handleCloseResetModal = () => {
    setShowResetModal(false)
    setResetError('')
    setResetSuccess('')
    setCodeValidMessage('')
  }

  const handleSendResetCode = async () => {
    setResetError('')
    setResetSuccess('')
    setCodeValidMessage('')

    if (!resetEmail.trim()) {
      setResetError('Por favor ingresa tu correo electrónico.')
      return
    }

    setIsSendingCode(true)
    const result = await requestPasswordReset(resetEmail.trim().toLowerCase())
    setIsSendingCode(false)

    if (!result.success) {
      setResetError(result.message)
      return
    }

    setCodeSentAt(Date.now())
    setResetStep('code')
    setResetSuccess('Te enviamos un código de recuperación a tu correo. Revísalo e ingrésalo a continuación.')
  }

  const handleVerifyCode = async () => {
    setResetError('')
    setCodeValidMessage('')
    setRecoveredPassword('')

    if (!enteredCode.trim()) {
      setResetError('Por favor ingresa el código de 4 dígitos.')
      return
    }

    const elapsed = Date.now() - (codeSentAt || 0)
    if (elapsed > 5 * 60 * 1000) {
      setResetError('El código ha vencido. Solicita uno nuevo.')
      return
    }

    const response = await verifyResetCode(resetEmail.trim().toLowerCase(), enteredCode.trim())
    if (!response.success) {
      setResetError(response.message)
      return
    }

    setRecoveredPassword(response.data.password)
    setResetStep('revealed')
    setCodeValidMessage('Código correcto. Aquí está tu contraseña actual:')
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

          <a href="#" className="forgot-password" onClick={handleOpenResetModal}>
            ¿Olvidaste tu contraseña?
          </a>

          {showResetModal && (
            <div
              className="modal-overlay"
              style={{
                position: 'fixed',
                top: 0,
                left: 0,
                right: 0,
                bottom: 0,
                backgroundColor: 'rgba(0, 0, 0, 0.5)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999,
              }}
              onClick={handleCloseResetModal}
            >
              <div
                className="modal-content"
                style={{
                  backgroundColor: 'white',
                  borderRadius: '12px',
                  padding: '32px',
                  width: '100%',
                  maxWidth: '420px',
                  boxShadow: '0 20px 40px rgba(0,0,0,0.2)',
                  position: 'relative',
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <button
                  type="button"
                  onClick={handleCloseResetModal}
                  style={{
                    position: 'absolute',
                    top: '16px',
                    right: '16px',
                    border: 'none',
                    background: 'transparent',
                    fontSize: '18px',
                    cursor: 'pointer',
                  }}
                  aria-label="Cerrar"
                >
                  ✕
                </button>
                <h3 style={{ marginTop: 0, color: '#2f4f28' }}>Recuperar contraseña</h3>
                <p style={{ marginBottom: '24px', lineHeight: '1.5' }}>
                  Ingresa tu correo electrónico y te enviaremos un código de 4 dígitos. El código tiene un límite de 5 minutos.
                </p>

                {resetStep === 'email' && (
                  <>
                    <div style={{ marginBottom: '16px' }}>
                      <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }} htmlFor="resetEmail">
                        Correo electrónico
                      </label>
                      <input
                        id="resetEmail"
                        type="text"
                        value={resetEmail}
                        onChange={(e) => setResetEmail(e.target.value)}
                        placeholder="Correo registrado"
                        style={{
                          width: '100%',
                          padding: '14px 18px',
                          borderRadius: '12px',
                          border: '2px solid #d9d9d9',
                          fontSize: '14px',
                          fontFamily: "var(--font-cuerpo, 'Poppins')",
                          boxSizing: 'border-box',
                          transition: 'all 0.3s ease',
                          backgroundColor: '#fafafa',
                          color: '#333',
                          outline: 'none',
                        }}
                      />
                    </div>

                    <button
                      type="button"
                      onClick={handleSendResetCode}
                      disabled={isSendingCode}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#2f4f28',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginBottom: '20px',
                      }}
                    >
                      {isSendingCode ? 'Enviando...' : 'Enviar contraseña'}
                    </button>
                  </>
                )}

                {resetStep === 'code' && (
                  <div style={{ marginBottom: '20px' }}>
                    <label style={{ display: 'block', marginBottom: '8px', fontWeight: 600 }} htmlFor="resetCode">
                      Código de 4 dígitos
                    </label>
                    <input
                      id="resetCode"
                      type="text"
                      value={enteredCode}
                      onChange={(e) => setEnteredCode(e.target.value)}
                      placeholder="Ingresa el código"
                      maxLength={4}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: '1px solid #ccc',
                        fontSize: '14px',
                      }}
                    />
                    <button
                      type="button"
                      onClick={handleVerifyCode}
                      style={{
                        width: '100%',
                        padding: '12px 14px',
                        borderRadius: '8px',
                        border: 'none',
                        backgroundColor: '#2f4f28',
                        color: 'white',
                        fontWeight: 600,
                        cursor: 'pointer',
                        marginTop: '12px',
                      }}
                    >
                      Verificar código
                    </button>
                    <p style={{ marginTop: '12px', fontSize: '13px', color: '#555' }}>
                      El código caduca 5 minutos después de ser enviado.
                    </p>
                  </div>
                )}

                {resetStep === 'revealed' && (
                  <div style={{ marginBottom: '20px' }}>
                    <p style={{ marginBottom: '12px', color: '#2f4f28', fontWeight: 600 }}>
                      Contraseña actual encontrada:
                    </p>
                    <div
                      style={{
                        width: '100%',
                        padding: '14px',
                        borderRadius: '8px',
                        backgroundColor: '#f4f9f0',
                        border: '1px solid #c8dfc2',
                        color: '#1d3b1c',
                        fontSize: '15px',
                        wordBreak: 'break-all',
                      }}
                    >
                      {recoveredPassword}
                    </div>
                  </div>
                )}

                {resetError && (
                  <p style={{ color: '#e74c3c', marginBottom: '12px' }}>{resetError}</p>
                )}
                {resetSuccess && (
                  <p style={{ color: '#2f4f28', marginBottom: '12px' }}>{resetSuccess}</p>
                )}
                {codeValidMessage && (
                  <p style={{ color: '#2f4f28', marginBottom: '12px' }}>{codeValidMessage}</p>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
