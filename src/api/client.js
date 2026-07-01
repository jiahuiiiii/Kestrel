const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000'

async function request(path, options = {}) {
  const res = await fetch(`${BASE_URL}${path}`, {
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  })
  if (!res.ok) throw new Error(`${res.status} ${res.statusText}`)
  return res.json()
}

export const api = {
  getTheses: () => request('/theses'),
  getThesis: (id) => request(`/theses/${id}`),
  createThesis: (body) => request('/theses', { method: 'POST', body: JSON.stringify(body) }),
  updateThesis: (id, body) => request(`/theses/${id}`, { method: 'PATCH', body: JSON.stringify(body) }),
  deleteThesis: (id) => request(`/theses/${id}`, { method: 'DELETE' }),

  getProposals: () => request('/proposals'),
  approveProposal: (id) => request(`/proposals/${id}/approve`, { method: 'POST' }),
  rejectProposal: (id) => request(`/proposals/${id}/reject`, { method: 'POST' }),

  getEvaluations: (thesisId) => request(`/evaluations?thesis_id=${thesisId}`),
}
