'use client'
import { useState, useEffect, useCallback } from 'react'
import { AppUser } from '@/types'
import { login as apiLogin, logout as apiLogout, clearTokens } from '@/lib/api'
import { ROLE_HOME } from '@/lib/utils'
import { useRouter } from 'next/navigation'

export function useAuth() {
  const router = useRouter()
  const [user, setUser] = useState<AppUser | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('dc_user')
    if (stored) setUser(JSON.parse(stored))
    setLoading(false)
  }, [])

  const login = useCallback(
    async (credentials: { login: string; password: string }) => {
      const data = await apiLogin(credentials)
      const u = data.user as AppUser
      setUser(u)
      router.push(ROLE_HOME[u.role] ?? '/dashboard')
      return u
    },
    [router],
  )

  const logout = useCallback(async () => {
    const tokens = localStorage.getItem('dc_tokens')
    const refresh = tokens ? JSON.parse(tokens).refresh : null
    if (refresh) await apiLogout(refresh)
    else clearTokens()
    setUser(null)
    router.push('/login')
  }, [router])

  return { user, loading, login, logout }
}
