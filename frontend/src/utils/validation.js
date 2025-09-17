// Utilidades de validación reutilizables

export function isEmpty(value) {
  return !value || value.trim() === ''
}

export function isValidEmail(email) {
  if (isEmpty(email)) return false
  // Regex simple pero suficiente para validación básica de UI
  const re = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/
  return re.test(email.trim().toLowerCase())
}

export function validatePasswordBasic(password) {
  // Reglas mínimas: longitud >= 6
  if (!password || password.length < 6) {
    return { ok: false, message: 'La contraseña debe tener al menos 6 caracteres' }
  }
  return { ok: true }
}

export function decodeJwt(token) {
  try {
    if (!token) return null
    const [, payload] = token.split('.')
    if (!payload) return null
    const json = atob(payload.replace(/-/g, '+').replace(/_/g, '/'))
    return JSON.parse(json)
  } catch {
    return null
  }
}

export function collectLoginValidation({ email, password }) {
  const errors = []
  if (isEmpty(email)) errors.push('El correo es obligatorio')
  else if (!isValidEmail(email)) errors.push('El correo no es válido')
  if (isEmpty(password)) errors.push('La contraseña es obligatoria')
  else {
    const res = validatePasswordBasic(password)
    if (!res.ok) errors.push(res.message)
  }
  return errors
}

export function collectRegisterValidation({ name, email, password, confirm }) {
  const errors = []
  if (isEmpty(name)) errors.push('El nombre es obligatorio')
  if (isEmpty(email)) errors.push('El correo es obligatorio')
  else if (!isValidEmail(email)) errors.push('El correo no es válido')
  if (isEmpty(password)) errors.push('La contraseña es obligatoria')
  else {
    const res = validatePasswordBasic(password)
    if (!res.ok) errors.push(res.message)
  }
  if (password && confirm && password !== confirm) errors.push('Las contraseñas no coinciden')
  return errors
}
