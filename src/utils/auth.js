export function getStoredToken() {
  try {
    return globalThis.localStorage?.getItem('badminton-token') || ''
  } catch {
    return ''
  }
}

export function setStoredToken(token) {
  try {
    globalThis.localStorage?.setItem('badminton-token', token)
  } catch {
    // ignore storage errors in test or non-browser environments
  }
}

export function clearStoredToken() {
  try {
    globalThis.localStorage?.removeItem('badminton-token')
  } catch {
    // ignore storage errors in test or non-browser environments
  }
}
