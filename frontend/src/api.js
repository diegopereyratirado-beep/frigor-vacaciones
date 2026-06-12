const BASE = '/api'

export function getSession() {
  const raw = localStorage.getItem('frigor_session')
  return raw ? JSON.parse(raw) : null
}

export function setSession(session) {
  localStorage.setItem('frigor_session', JSON.stringify(session))
}

export function clearSession() {
  localStorage.removeItem('frigor_session')
}

async function request(path, { method = 'GET', body, formData } = {}) {
  const session = getSession()
  const headers = {}
  if (session?.access_token) headers.Authorization = `Bearer ${session.access_token}`
  if (body) headers['Content-Type'] = 'application/json'

  const res = await fetch(`${BASE}${path}`, {
    method,
    headers,
    body: formData || (body ? JSON.stringify(body) : undefined),
  })

  if (res.status === 401) {
    clearSession()
    window.location.href = '/'
    throw new Error('Sesión expirada')
  }

  const data = await res.json().catch(() => null)
  if (!res.ok) {
    throw new Error(data?.detail || 'Error de servidor')
  }
  return data
}

export const api = {
  login: (username, password) =>
    request('/auth/login', { method: 'POST', body: { username, password } }),
  changePassword: (actual, nueva) =>
    request('/auth/change-password', { method: 'POST', body: { actual, nueva } }),

  myDashboard: () => request('/employees/me'),
  myRequests: () => request('/vacations/mine'),
  createRequest: (data) => request('/vacations', { method: 'POST', body: data }),

  employees: (q, area) => {
    const params = new URLSearchParams()
    if (q) params.set('q', q)
    if (area) params.set('area', area)
    const qs = params.toString()
    return request(`/employees${qs ? `?${qs}` : ''}`)
  },
  areas: () => request('/employees/areas'),
  createEmployee: (data) => request('/employees', { method: 'POST', body: data }),
  importExcel: (file) => {
    const fd = new FormData()
    fd.append('file', file)
    return request('/employees/import', { method: 'POST', formData: fd })
  },

  allRequests: (estado) =>
    request(`/vacations${estado ? `?estado=${estado}` : ''}`),
  approve: (id, comentario) =>
    request(`/vacations/${id}/approve`, { method: 'POST', body: { comentario } }),
  reject: (id, comentario) =>
    request(`/vacations/${id}/reject`, { method: 'POST', body: { comentario } }),

  notifications: () => request('/notifications'),
  markAllRead: () => request('/notifications/read-all', { method: 'POST' }),
}
