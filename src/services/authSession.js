// Sesión con JWT Tokens - Access Token en memoria, Refresh Token en cookie (HttpOnly)
const SESSION_STORAGE_KEY = 'authSession'
let currentSession = null
let accessToken = null
const sessionChangeListeners = new Set()

function saveSessionToStorage(session) {
  if (session) {
    try {
      localStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(session))
    } catch (error) {
      console.error('Error al guardar la sesión en localStorage:', error)
    }
  } else {
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }
}

function loadSessionFromStorage() {
  if (currentSession) return currentSession

  try {
    const stored = localStorage.getItem(SESSION_STORAGE_KEY)
    if (stored) {
      currentSession = JSON.parse(stored)
      return currentSession
    }
  } catch (error) {
    console.error('Error al leer la sesión desde localStorage:', error)
    localStorage.removeItem(SESSION_STORAGE_KEY)
  }

  return null
}

function notifySessionChange(session) {
  for (const listener of sessionChangeListeners) {
    try {
      listener(session)
    } catch (error) {
      console.error('Error en listener de sesión:', error)
    }
  }
}

export function subscribeSessionChange(listener) {
  sessionChangeListeners.add(listener)
  return () => {
    sessionChangeListeners.delete(listener)
  }
}

// Guardar Access Token en memoria
export function setAccessToken(token) {
  accessToken = token
}

// Obtener Access Token
export function getAccessToken() {
  return accessToken
}

// Guardar sesión de usuario
export function setSession(session) {
  currentSession = session
  saveSessionToStorage(session)
  notifySessionChange(session)
}

// Obtener sesión de usuario
export function getSession() {
  return currentSession || loadSessionFromStorage()
}

// Limpiar sesión y tokens
export function clearTokens() {
  accessToken = null
  currentSession = null
  saveSessionToStorage(null)
  notifySessionChange(null)
}

// Cerrar sesión (logout)
export function logout() {
  clearTokens()
  // El backend limpia la cookie de refresh token automáticamente
}
