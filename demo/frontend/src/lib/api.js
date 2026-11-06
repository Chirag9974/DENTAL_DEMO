/**
 * Thin API client for the dental clinic Express backend.
 * Every response follows the backend envelope: { success, data, message?, meta?, error?, details? }.
 * Credentials are included so the HttpOnly admin cookie works.
 */

const BASE = (import.meta.env.VITE_API_BASE || '').replace(/\/$/, '');

export class ApiError extends Error {
  constructor(message, status, details) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.details = details; // [{ field, message }] from zod validation
  }

  /** { fieldName: message } for inline form errors */
  fieldErrors() {
    if (!this.details?.length) return {};
    return this.details.reduce((acc, d) => {
      if (!acc[d.field]) acc[d.field] = d.message;
      return acc;
    }, {});
  }
}

async function request(path, { method = 'GET', body, headers = {}, signal } = {}) {
  let res;
  try {
    res = await fetch(`${BASE}${path}`, {
      method,
      credentials: 'include',
      // Patient data and staff sessions must never be served from a cache.
      cache: 'no-store',
      headers: {
        Accept: 'application/json',
        ...(body ? { 'Content-Type': 'application/json' } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal,
    });
  } catch {
    throw new ApiError('Cannot reach the server. Please check your connection and try again.', 0);
  }

  let json = null;
  try {
    json = await res.json();
  } catch {
    /* non-JSON response */
  }

  if (!res.ok) {
    throw new ApiError(json?.error || `Request failed (${res.status})`, res.status, json?.details);
  }
  return json;
}

export const api = {
  // ---- public ----
  getClinic: (signal) => request('/api/clinic', { signal }).then((r) => r.data),
  getServices: (signal) => request('/api/services', { signal }).then((r) => r.data),

  bookAppointment: (payload, idempotencyKey) =>
    request('/api/appointments', {
      method: 'POST',
      body: payload,
      headers: idempotencyKey ? { 'X-Idempotency-Key': idempotencyKey } : {},
    }).then((r) => ({ ...r.data, message: r.message })),

  // ---- admin ----
  login: (email, password) =>
    request('/api/admin/login', { method: 'POST', body: { email, password } }).then((r) => r.data),

  logout: () => request('/api/admin/logout', { method: 'POST' }).then((r) => r.data),

  me: (signal) => request('/api/admin/me', { signal }).then((r) => r.data.admin),

  listAppointments: (query = {}, signal) => {
    const params = new URLSearchParams();
    Object.entries(query).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') params.set(k, String(v));
    });
    const qs = params.toString();
    return request(`/api/admin/appointments${qs ? `?${qs}` : ''}`, { signal }).then((r) => ({
      items: r.data,
      meta: r.meta,
    }));
  },

  getAppointment: (id, signal) => request(`/api/admin/appointments/${id}`, { signal }).then((r) => r.data),

  patchAppointment: (id, patch) =>
    request(`/api/admin/appointments/${id}`, { method: 'PATCH', body: patch }).then((r) => r.data),
};
