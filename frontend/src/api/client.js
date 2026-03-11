const BASE = '/api'

export async function fetchCompanies() {
  const r = await fetch(`${BASE}/companies`)
  return r.json()
}

export async function fetchSummary() {
  const r = await fetch(`${BASE}/companies/summary`)
  return r.json()
}

export async function fetchBenford(id) {
  const r = await fetch(`${BASE}/companies/${id}/benford`)
  return r.json()
}

export async function fetchAnomalies(id) {
  const r = await fetch(`${BASE}/companies/${id}/anomalies`)
  return r.json()
}

export async function fetchRisk(id) {
  const r = await fetch(`${BASE}/companies/${id}/risk`)
  return r.json()
}

export async function fetchFinancials(id) {
  const r = await fetch(`${BASE}/companies/${id}/financials`)
  return r.json()
}

export async function fetchTxnSummary(id) {
  const r = await fetch(`${BASE}/companies/${id}/transactions/summary`)
  return r.json()
}
