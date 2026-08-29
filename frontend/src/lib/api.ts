const API_BASE = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api'

function getTokens() {
  if (typeof window === 'undefined') return null
  const raw = localStorage.getItem('dc_tokens')
  return raw ? JSON.parse(raw) : null
}

function setTokens(tokens: { access: string; refresh: string }) {
  localStorage.setItem('dc_tokens', JSON.stringify(tokens))
}

export function clearTokens() {
  localStorage.removeItem('dc_tokens')
  localStorage.removeItem('dc_user')
}

async function refreshAccess(): Promise<string | null> {
  const tokens = getTokens()
  if (!tokens?.refresh) return null
  const res = await fetch(`${API_BASE}/auth/refresh/`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh: tokens.refresh }),
  })
  if (!res.ok) {
    clearTokens()
    return null
  }
  const data = await res.json()
  setTokens({ access: data.access, refresh: data.refresh ?? tokens.refresh })
  return data.access
}

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const tokens = getTokens()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (tokens?.access) {
    headers['Authorization'] = `Bearer ${tokens.access}`
  }

  let res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccess()
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`
      res = await fetch(`${API_BASE}${path}`, { ...options, headers })
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err
  }

  if (res.status === 204) return undefined as T
  return res.json()
}

export async function apiUpload<T>(path: string, formData: FormData, method = 'POST'): Promise<T> {
  const tokens = getTokens()
  const headers: Record<string, string> = {}
  if (tokens?.access) headers['Authorization'] = `Bearer ${tokens.access}`

  let res = await fetch(`${API_BASE}${path}`, { method, headers, body: formData })

  if (res.status === 401 && tokens?.refresh) {
    const newAccess = await refreshAccess()
    if (newAccess) {
      headers['Authorization'] = `Bearer ${newAccess}`
      res = await fetch(`${API_BASE}${path}`, { method, headers, body: formData })
    }
  }

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw err
  }
  return res.json()
}

export async function login(credentials: { login: string; password: string }) {
  const data = await apiFetch<{ access: string; refresh: string; user: unknown }>(
    '/auth/login/',
    { method: 'POST', body: JSON.stringify(credentials) },
  )
  setTokens({ access: data.access, refresh: data.refresh })
  localStorage.setItem('dc_user', JSON.stringify(data.user))
  return data
}

export async function logout(refresh: string) {
  await apiFetch('/auth/logout/', {
    method: 'POST',
    body: JSON.stringify({ refresh }),
  }).catch(() => null)
  clearTokens()
}
