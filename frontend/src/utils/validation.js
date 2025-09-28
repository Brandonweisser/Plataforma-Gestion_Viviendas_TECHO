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

export function validateRut(rut) {
  if (!rut || typeof rut !== 'string') return { ok: false, message: 'RUT es obligatorio' }
  
  // Limpiar RUT (quitar puntos y guiones)
  const cleanRut = rut.replace(/[.-]/g, '').toLowerCase()
  
  // Verificar formato: 7-8 dígitos + 1 dígito verificador o 'k'
  if (!/^[0-9]{7,8}[0-9k]$/.test(cleanRut)) {
    return { ok: false, message: 'RUT debe tener formato válido (ej: 12345678-9)' }
  }
  
  const body = cleanRut.slice(0, -1)
  const dv = cleanRut.slice(-1)
  
  // Calcular dígito verificador
  let sum = 0
  let multiplier = 2
  
  for (let i = body.length - 1; i >= 0; i--) {
    sum += parseInt(body[i]) * multiplier
    multiplier = multiplier === 7 ? 2 : multiplier + 1
  }
  
  const remainder = sum % 11
  const calculatedDV = remainder === 0 ? '0' : remainder === 1 ? 'k' : (11 - remainder).toString()
  
  if (dv !== calculatedDV) {
    return { ok: false, message: 'RUT inválido, verifique el dígito verificador' }
  }
  
  return { ok: true }
}

export function collectRegisterValidation({ name, email, password, confirm, rut }) {
  const errors = []
  if (isEmpty(name)) errors.push('El nombre es obligatorio')
  if (isEmpty(email)) errors.push('El correo es obligatorio')
  else if (!isValidEmail(email)) errors.push('El correo no es válido')
  if (isEmpty(rut)) errors.push('El RUT es obligatorio')
  else {
    const rutValidation = validateRut(rut)
    if (!rutValidation.ok) errors.push(rutValidation.message)
  }
  if (isEmpty(password)) errors.push('La contraseña es obligatoria')
  else {
    const res = validatePasswordBasic(password)
    if (!res.ok) errors.push(res.message)
  }
  if (password && confirm && password !== confirm) errors.push('Las contraseñas no coinciden')
  return errors
}
