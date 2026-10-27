// Talks to the backend. In development Vite forwards /api to http://localhost:5000 (see vite.config.js).
const API = import.meta.env?.VITE_API_URL || '/api'
const TOKEN_KEY = 'staff-token'

// Browser storage can be blocked (private window etc.), so every access is guarded.
export function getToken() {
  try { return localStorage.getItem(TOKEN_KEY) } catch { return null }
}
export function saveToken(token) {
  try { localStorage.setItem(TOKEN_KEY, token) } catch { /* stays logged in until refresh */ }
}
export function clearToken() {
  try { localStorage.removeItem(TOKEN_KEY) } catch { /* nothing saved */ }
}

// api('/items')  |  api('/transactions', { method: 'POST', body: {...} })
export async function api(path, { method = 'GET', body } = {}) {
  const headers = {}
  const token = getToken()
  if (token) headers.Authorization = `Bearer ${token}`
  if (body) headers['Content-Type'] = 'application/json'

  let res
  try {
    res = await fetch(`${API}${path}`, { method, headers, body: body ? JSON.stringify(body) : undefined })
  } catch {
    throw new Error('Cannot reach the server. Check that the backend is running.')
  }
  const data = await res.json().catch(() => ({}))
  if (res.status === 401 && token && !path.startsWith('/auth/login')) {
    clearToken() // token expired (they last 8 hours) -> back to the login page
    window.location.assign('/')
    throw new Error('Your session has expired. Please log in again.')
  }
  if (!res.ok) throw new Error(data.error || 'Something went wrong')
  return data
}

// Lists are paged (max 100 per page); this fetches every page.
export async function apiAll(path) {
  const sep = path.includes('?') ? '&' : '?'
  const all = []
  for (let page = 1; page <= 50; page++) {
    const r = await api(`${path}${sep}limit=100&page=${page}`)
    all.push(...r.data)
    if (all.length >= r.total || !r.data.length) break
  }
  return all
}
