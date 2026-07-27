const ROOT = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'
const BASE = `${ROOT}/api/v1`

export class ApiError extends Error {
  constructor(status, message, body) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.body = body
  }
}

let onUnauthenticated = null
export function setUnauthenticatedHandler(fn) {
  onUnauthenticated = fn
}

// In-memory token store for WebSocket auth — never persisted to localStorage
let _accessToken = null
export function setAccessToken(token) { _accessToken = token }
export function getAccessToken() { return _accessToken }

function rawFetch(path, { method = 'GET', body, headers } = {}) {
  return fetch(`${BASE}${path}`, {
    method,
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...headers },
    body: body != null ? JSON.stringify(body) : undefined,
  })
}

async function request(path, opts = {}, retry = true) {
  let res = await rawFetch(path, opts)

  if (res.status === 401 && retry && !path.startsWith('/auth/')) {
    const refreshed = await rawFetch('/auth/refresh', { method: 'POST' })
    if (refreshed.ok) {
      // Grab the new token from refresh response
      try {
        const data = await refreshed.json()
        const token = data?.result?.access_token ?? data?.access_token
        if (token) setAccessToken(token)
      } catch { /* non-fatal */ }
      res = await rawFetch(path, opts)
    } else {
      _accessToken = null
      if (onUnauthenticated) onUnauthenticated()
      throw new ApiError(401, 'Not authenticated')
    }
  }

  if (!res.ok) {
    let parsed = null
    try { parsed = await res.json() } catch { }
    const message = parsed?.error?.message || parsed?.detail || `${res.status} ${res.statusText}`
    throw new ApiError(res.status, message, parsed)
  }

  if (res.status === 204) return null
  const json = await res.json()
  // unwrap the DataResponse envelope; SuccessResponse (no `result`) passes through
  return json && Object.prototype.hasOwnProperty.call(json, 'result') ? json.result : json
}

export const api = {
  auth: {
    register: (email, username, password) =>
      request('/auth/register', { method: 'POST', body: { email, username, password } }),
    login: (email, password) =>
      request('/auth/login', { method: 'POST', body: { email, password } }),
    logout: () => request('/auth/logout', { method: 'POST' }),
    me: () => request('/user/me'),
  },

  theses: {
    list: (page = 1, pageSize = 50) => request(`/theses?page=${page}&page_size=${pageSize}`),
    get: (id) => request(`/theses/${id}`),
    create: (body) => request('/theses', { method: 'POST', body }),
    update: (id, body) => request(`/theses/${id}`, { method: 'PUT', body }),
    remove: (id) => request(`/theses/${id}`, { method: 'DELETE' }),
    evaluations: (id, page = 1, pageSize = 20) =>
      request(`/theses/${id}/evaluations?page=${page}&page_size=${pageSize}`),

    // Conditions and catalysts are edited row-by-row, not as a whole thesis —
    // the backend has no bulk-replace endpoint, so EditThesisModal diffs the
    // form against the loaded thesis and calls these per changed row.
    // Both deletes are soft (the row survives with enabled=false).
    addCondition: (id, body) => request(`/theses/${id}/quant-condition`, { method: 'POST', body }),
    updateCondition: (id, conditionId, body) =>
      request(`/theses/${id}/quant-condition/${conditionId}`, { method: 'PUT', body }),
    removeCondition: (id, conditionId) =>
      request(`/theses/${id}/quant-condition/${conditionId}`, { method: 'DELETE' }),

    addCatalyst: (id, body) => request(`/theses/${id}/catalyst`, { method: 'POST', body }),
    updateCatalyst: (id, catalystId, body) =>
      request(`/theses/${id}/catalyst/${catalystId}`, { method: 'PUT', body }),
    removeCatalyst: (id, catalystId) =>
      request(`/theses/${id}/catalyst/${catalystId}`, { method: 'DELETE' }),
  },

  proposals: {
    all: () => request('/proposals'),
    approve: (kind, id) => request(`/proposals/${kind}/${id}/approve`, { method: 'PUT' }),
    reject: (kind, id, reason) =>
      request(`/proposals/${kind}/${id}/reject`, { method: 'PUT', body: { rejection_reason: reason } }),
  },

  stocks: {
    getAllListedStocks: () => request(`/stock/listed`),
  },

  telegram: {
    connect: () => request(`/telegram/connect`, { method: 'POST' }),
    disconnect: () => request(`/telegram/disconnect`, { method: 'DELETE' }),
    getTelegramStatus: () => request(`/telegram/status`),
  },

  notification: {
    getAllAlerts: (page = 1, pageSize = 20) => request(`/alerts?page=${page}&page_size=${pageSize}`),
    get: (id) => request(`/alerts/${id}`),
  }
}
