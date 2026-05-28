// Sesión con JWT Tokens - Access Token en memoria, Refresh Token en cookie (HttpOnly)
let currentSession = null
let accessToken = null

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
}

// Obtener sesión de usuario
export function getSession() {
  return currentSession
}

// Limpiar sesión y tokens
export function clearTokens() {
  accessToken = null
  currentSession = null
}

// Cerrar sesión (logout)
export function logout() {
  clearTokens()
  // El backend limpia la cookie de refresh token automáticamente
}
