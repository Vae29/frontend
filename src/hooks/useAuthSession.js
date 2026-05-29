import { useEffect, useState } from 'react'
import { getSession, subscribeSessionChange } from '../services/authSession'

export default function useAuthSession() {
  const [session, setSessionState] = useState(() => getSession())

  useEffect(() => {
    const unsubscribe = subscribeSessionChange((newSession) => {
      setSessionState(newSession)
    })

    setSessionState(getSession())
    return unsubscribe
  }, [])

  return session
}
