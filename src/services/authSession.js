// Sesión en memoria (sin localStorage)
let currentSession = null

export function getSession() {
  return currentSession
}

export function setSession(session) {
  currentSession = session
}

export function clearSession() {
  currentSession = null
}
