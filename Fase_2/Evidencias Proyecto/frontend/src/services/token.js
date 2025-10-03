export function getToken() {
  try { return localStorage.getItem('token') } catch { return null }
}
