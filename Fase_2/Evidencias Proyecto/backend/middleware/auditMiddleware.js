import { supabase } from '../supabaseClient.js';

/**
 * Middleware para registrar acciones en audit_log
 * Captura automáticamente IP y user-agent
 */
const auditMiddleware = {
  /**
   * Registra una acción en la tabla audit_log
   * @param {Object} params - Parámetros del log
   * @param {Object} params.req - Objeto request de Express
   * @param {number} params.actor_uid - ID del usuario que realiza la acción
   * @param {string} params.actor_email - Email del usuario
   * @param {string} params.actor_rol - Rol del usuario
   * @param {string} params.action - Código de la acción (ej: 'auth.login.success')
   * @param {string} params.entity_type - Tipo de entidad (ej: 'user', 'incidencia')
   * @param {number} params.entity_id - ID de la entidad
   * @param {Object} params.details - Detalles adicionales en formato JSON
   */
  async logAudit({ req, actor_uid, actor_email, actor_rol, action, entity_type, entity_id, details = {} }) {
    try {
      const ip = this.getClientIp(req);
      const user_agent = req.headers['user-agent'] || null;

      const { error } = await supabase
        .from('audit_log')
        .insert({
          actor_uid,
          actor_email,
          actor_rol,
          action,
          entity_type,
          entity_id,
          details,
          ip,
          user_agent
        });

      if (error) {
        console.error('Error registrando en audit_log:', error);
      }
    } catch (error) {
      // No fallar la operación principal si falla el logging
      console.error('Error en auditMiddleware.logAudit:', error);
    }
  },

  /**
   * Obtiene la IP real del cliente considerando proxies
   * @param {Object} req - Objeto request de Express
   * @returns {string} - IP del cliente
   */
  getClientIp(req) {
    return req.headers['x-forwarded-for']?.split(',')[0]?.trim() ||
           req.headers['x-real-ip'] ||
           req.connection?.remoteAddress ||
           req.socket?.remoteAddress ||
           null;
  },

  /**
   * Middleware Express para adjuntar función de logging al request
   */
  attachLogger(req, res, next) {
    req.logAudit = async (params) => {
      await auditMiddleware.logAudit({ req, ...params });
    };
    next();
  }
};

export default auditMiddleware;
