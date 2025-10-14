# Ciclo de Vida de Incidencias

Definición de estados y reglas aplicadas en backend (ver `controllers/tecnicoController.js`).

| Estado        | Significado                                                                 | Puede pasar a                           |
|---------------|------------------------------------------------------------------------------|-----------------------------------------|
| abierta       | Recién creada, sin trabajo técnico iniciado                                 | en_proceso, en_espera, descartada       |
| en_proceso    | Técnico trabajando activamente                                              | en_espera, resuelta, descartada         |
| en_espera     | Bloqueada / esperando insumos / beneficiario (opcional)                     | en_proceso, resuelta, descartada        |
| resuelta      | Solución aplicada; pendiente confirmación beneficiario                      | cerrada                                 |
| cerrada       | Confirmada/conforme. Fin del ciclo                                          | (final)                                 |
| descartada    | No procede (duplicada / fuera de alcance / errónea)                         | (final)                                 |

## Reglas claves

## Campos de fecha relevantes

Ajustar esta tabla si se modifica el flujo en el futuro.

## Validación del Beneficiario (Nuevo Flujo)

Cuando una incidencia pasa a estado `resuelta`, queda pendiente la confirmación del beneficiario:

1. El beneficiario visualiza la incidencia `resuelta` en su historial y se le muestran dos acciones:
	- "Sí, estoy conforme" → confirma que la solución funcionó.
	- "No, falta corregir" → rechaza la solución indicando un comentario.
2. Endpoint: `POST /api/beneficiario/incidencias/:id/validar` con body `{ conforme: boolean, comentario?: string }`.
3. Reglas backend:
	- Solo disponible si la incidencia pertenece al beneficiario y su estado actual es `resuelta`.
	- `conforme = true` → estado pasa a `cerrada`; se setean `fecha_cerrada`, `fecha_resuelta` (si faltaba), `conforme_beneficiario=true`, `fecha_conformidad_beneficiario`.
	- `conforme = false` → estado regresa a `en_proceso`; se limpia `conforme_beneficiario`, se mantiene trazabilidad y se exige `comentario` justificando el rechazo.
4. Historial:
	- Evento `validacion_beneficiario` (resuelta→cerrada).
	- Evento `rechazo_beneficiario` (resuelta→en_proceso) con comentario.
5. Métricas:
	- `finalizadas` siguen computando `resuelta + cerrada`. Una incidencia rechazada deja de computar como finalizada hasta que vuelva a `resuelta` o `cerrada`.

Esto asegura un ciclo de retroalimentación donde el beneficiario valida la efectividad de la solución antes del cierre definitivo.
