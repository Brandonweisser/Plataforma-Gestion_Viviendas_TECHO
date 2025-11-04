/**
 * Utilidades para manejo de zona horaria de Chile
 * Zona horaria: America/Santiago (UTC-3)
 */

/**
 * Obtiene la fecha/hora actual en zona horaria de Chile
 * @returns {Date} Fecha actual en Chile
 */
export function getNowChile() {
  return new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
}

/**
 * Convierte una fecha a zona horaria de Chile
 * @param {Date|string} date - Fecha a convertir
 * @returns {Date} Fecha en zona horaria de Chile
 */
export function toChileTime(date) {
  const d = typeof date === 'string' ? new Date(date) : date;
  return new Date(d.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
}

/**
 * Obtiene timestamp actual en zona horaria de Chile en formato ISO
 * @returns {string} Timestamp ISO en zona horaria de Chile
 */
export function getChileTimestamp() {
  // Obtener fecha actual en Chile
  const chileDate = new Date(new Date().toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  
  // Convertir a ISO string
  // Nota: ISO string siempre es UTC, pero ajustamos la hora para que corresponda a Chile
  const offset = -3; // UTC-3 (puede ser UTC-4 en horario de verano)
  const utcDate = new Date(chileDate.getTime() - (offset * 60 * 60 * 1000));
  
  return utcDate.toISOString();
}

/**
 * Formatea una fecha en formato chileno (dd/mm/yyyy HH:mm)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatChileDateTime(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Formatea solo la fecha en formato chileno (dd/mm/yyyy)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Fecha formateada
 */
export function formatChileDate(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleDateString('es-CL', {
    timeZone: 'America/Santiago',
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

/**
 * Formatea solo la hora en formato chileno (HH:mm)
 * @param {Date|string} date - Fecha a formatear
 * @returns {string} Hora formateada
 */
export function formatChileTime(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  
  return d.toLocaleTimeString('es-CL', {
    timeZone: 'America/Santiago',
    hour: '2-digit',
    minute: '2-digit',
    hour12: false
  });
}

/**
 * Obtiene el offset actual de Chile respecto a UTC
 * @returns {number} Offset en horas (negativo para UTC-)
 */
export function getChileOffset() {
  const now = new Date();
  const chileDate = new Date(now.toLocaleString('en-US', { timeZone: 'America/Santiago' }));
  const utcDate = new Date(now.toLocaleString('en-US', { timeZone: 'UTC' }));
  
  const diffMs = chileDate.getTime() - utcDate.getTime();
  const diffHours = diffMs / (1000 * 60 * 60);
  
  return diffHours;
}

/**
 * Convierte fecha UTC a texto relativo en español (hace X minutos/horas/días)
 * @param {Date|string} date - Fecha a convertir
 * @returns {string} Texto relativo
 */
export function getRelativeTimeChile(date) {
  if (!date) return '';
  
  const d = typeof date === 'string' ? new Date(date) : date;
  const now = new Date();
  
  const diffMs = now - d;
  const diffSeconds = Math.floor(diffMs / 1000);
  const diffMinutes = Math.floor(diffSeconds / 60);
  const diffHours = Math.floor(diffMinutes / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  if (diffSeconds < 60) return 'hace un momento';
  if (diffMinutes < 60) return `hace ${diffMinutes} minuto${diffMinutes !== 1 ? 's' : ''}`;
  if (diffHours < 24) return `hace ${diffHours} hora${diffHours !== 1 ? 's' : ''}`;
  if (diffDays < 7) return `hace ${diffDays} día${diffDays !== 1 ? 's' : ''}`;
  if (diffDays < 30) return `hace ${Math.floor(diffDays / 7)} semana${Math.floor(diffDays / 7) !== 1 ? 's' : ''}`;
  if (diffDays < 365) return `hace ${Math.floor(diffDays / 30)} mes${Math.floor(diffDays / 30) !== 1 ? 'es' : ''}`;
  return `hace ${Math.floor(diffDays / 365)} año${Math.floor(diffDays / 365) !== 1 ? 's' : ''}`;
}
