/**
 * The API client.
 *
 * Every call goes through one place so the error shape is consistent: the
 * server answers validation failures with `{ errors: { field: message } }` and
 * everything else with `{ error: message }`, and callers should not each have
 * to remember that. `ApiError` carries the field errors through, which is what
 * the join form renders beside its inputs.
 */
export class ApiError extends Error {
  constructor(message, { status, errors } = {}) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.errors = errors ?? null
  }
}

async function request(path, options = {}) {
  let res
  try {
    res = await fetch(`/api${path}`, {
      headers: options.body ? { 'content-type': 'application/json' } : undefined,
      ...options,
    })
  } catch {
    /* fetch only rejects on a transport failure, so this really is "the API
       isn't reachable" rather than any HTTP status. */
    throw new ApiError('Cannot reach the server. Is the API running?')
  }

  const body = await res.json().catch(() => null)
  if (!res.ok) {
    throw new ApiError(body?.error ?? 'Something went wrong.', {
      status: res.status,
      errors: body?.errors,
    })
  }
  return body
}

export const getSections = () => request('/sections')
export const getPanels = (slug) => request(`/sections/${slug}/panels`)
export const joinRecce = (payload) =>
  request('/members', { method: 'POST', body: JSON.stringify(payload) })
