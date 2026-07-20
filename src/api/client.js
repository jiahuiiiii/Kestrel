// Typed fetch wrapper for the Kestrel FastAPI backend.
//
// Auth is cookie-first: login/register set an HttpOnly access-token cookie that
// the browser auto-sends to /api/v1/*, so every request just needs
// `credentials: 'include'` — no token juggling in JS (also safer against XSS).
// When the 15-min access token expires a call 401s; we transparently hit
// /auth/refresh (which uses the HttpOnly refresh cookie) once and retry.
//
// The backend wraps success bodies in { status, result: <payload> }; `request`
// unwraps `.result` so callers get the payload directly.

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

// AuthContext registers a handler so an unrecoverable 401 drops the user.
let onUnauthenticated = null
export function setUnauthenticatedHandler(fn) {
  onUnauthenticated = fn
}

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
      res = await rawFetch(path, opts) // retry the original call with the fresh cookie
    } else {
      if (onUnauthenticated) onUnauthenticated()
      throw new ApiError(401, 'Not authenticated')
    }
  }

  if (!res.ok) {
    let parsed = null
    try { parsed = await res.json() } catch { /* non-JSON error body */ }
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
    // kind is one of 'theses' | 'quant' | 'catalyst'
    approve: (kind, id) => request(`/proposals/${kind}/${id}/approve`, { method: 'PUT' }),
    reject: (kind, id, reason) =>
      request(`/proposals/${kind}/${id}/reject`, { method: 'PUT', body: { rejection_reason: reason } }),
  },

  stocks: {
    getAllListedStocks: () => request(`/stock/listed`),
  }
}
