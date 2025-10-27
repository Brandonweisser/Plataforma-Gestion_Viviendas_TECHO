# Plazos Legales en Incidencias - TECHO Chile

## 📋 Contenido

- [Marco Legal](#marco-legal)
- [Plazos por Prioridad](#plazos-por-prioridad)
- [Indicadores Visuales](#indicadores-visuales)
- [Cálculo de Días Hábiles](#cálculo-de-días-hábiles)
- [Garantías Legales](#garantías-legales)
- [Procedimiento SERVIU](#procedimiento-serviu)
- [Contacto y Recursos](#contacto-y-recursos)

---

## 🏛 Marco Legal

El sistema de plazos legales implementado en la plataforma de gestión de viviendas TECHO se basa en la normativa chilena vigente:

### Leyes y Decretos Aplicables

1. **LGUC - Ley General de Urbanismo y Construcciones (DFL 458)**
   - Establece las responsabilidades de constructoras sobre defectos en viviendas
   - Define períodos de garantía según tipo de defecto
   - Obliga a responder y resolver incidencias en plazos razonables

2. **DS49 - Decreto Supremo 49**
   - Regula la vivienda social en Chile
   - Establece estándares de calidad y garantías para beneficiarios
   - Define procedimientos de reclamación ante SERVIU

3. **Normativa SERVIU (Servicio de Vivienda y Urbanización)**
   - Procedimientos de queja y reclamo
   - Plazos de respuesta institucional
   - Mecanismos de fiscalización

### Fundamento de los Plazos

Los plazos implementados en el sistema se derivan de:

- **Prácticas estándar del sector construcción** en Chile
- **Criterios de razonabilidad** establecidos por SERVIU
- **Análisis de urgencia** según tipo de defecto (estructural, instalaciones, terminaciones)
- **Derechos del consumidor** según Ley 19.496

---

## ⏱ Plazos por Prioridad

El sistema clasifica las incidencias en tres niveles de prioridad, cada uno con plazos diferenciados para respuesta y resolución.

### Prioridad ALTA

**Categorías incluidas:**
- Problemas estructurales (grietas, fundaciones, muros)
- Fallas en instalaciones críticas (electricidad, agua, gas)
- Riesgos de seguridad inmediatos

| Tipo de Plazo | Días Hábiles | Descripción |
|---------------|--------------|-------------|
| **Respuesta** | 2 días | Tiempo máximo para contactar al beneficiario y evaluar el problema |
| **Resolución** | 5 días | Tiempo máximo para solucionar completamente la incidencia |

**Justificación:** Defectos que comprometen la habitabilidad, seguridad o servicios básicos requieren atención urgente.

### Prioridad MEDIA

**Categorías incluidas:**
- Defectos graves pero no inmediatos (filtraciones, problemas de aislación)
- Fallas en terminaciones mayores (ventanas, puertas con mal funcionamiento)

| Tipo de Plazo | Días Hábiles | Descripción |
|---------------|--------------|-------------|
| **Respuesta** | 5 días | Tiempo máximo para contactar y evaluar |
| **Resolución** | 10 días | Tiempo máximo para solucionar |

**Justificación:** Problemas que afectan la calidad de vida pero no representan riesgo inmediato.

### Prioridad BAJA

**Categorías incluidas:**
- Terminaciones menores (pintura, pequeñas imperfecciones)
- Problemas estéticos o de acabado

| Tipo de Plazo | Días Hábiles | Descripción |
|---------------|--------------|-------------|
| **Respuesta** | 10 días | Tiempo máximo para contactar y evaluar |
| **Resolución** | 20 días | Tiempo máximo para solucionar |

**Justificación:** Defectos que no afectan la funcionalidad básica de la vivienda.

---

## 🎨 Indicadores Visuales

El sistema utiliza un código de colores intuitivo para mostrar el estado de los plazos:

### 🟢 Verde - Dentro del Plazo
**Condiciones:**
- Quedan más de 2 días hábiles para el vencimiento
- O se ha transcurrido menos del 50% del plazo total
- O quedan más del 20% de los días del plazo

**Interpretación:** La incidencia está siendo gestionada con tiempo suficiente.

### 🟡 Amarillo - Próximo a Vencer
**Condiciones:**
- Quedan 2 días hábiles o menos
- O se ha transcurrido el 80% o más del plazo

**Interpretación:** **URGENTE** - Se requiere acción inmediata para resolver antes del vencimiento.

### 🔴 Rojo - Plazo Vencido
**Condiciones:**
- La fecha límite de resolución ha sido superada
- `dias_restantes` es negativo

**Interpretación:** **INCUMPLIMIENTO LEGAL** - El beneficiario puede presentar queja formal ante SERVIU.

### Ejemplos Visuales

En la interfaz, los indicadores se muestran así:

```
✓ Dentro del plazo legal
  5 días hábiles restantes (hasta 2025-01-20)
  Según LGUC y normativa SERVIU.

⏱ Próximo a vencer - Quedan 2 días
  2 días hábiles restantes (hasta 2025-01-15)
  Según LGUC y normativa SERVIU.

⚠ Plazo legal vencido
  Plazo vencido hace 3 días hábiles
  Según LGUC y normativa SERVIU.
```

---

## 📆 Cálculo de Días Hábiles

Los plazos se calculan en **días hábiles** (lunes a viernes), excluyendo:

- Sábados y domingos
- Feriados nacionales (implementación futura)

### Algoritmo de Cálculo

El sistema utiliza las siguientes funciones:

1. **`esDiaHabil(fecha)`**: Verifica si una fecha es día hábil (lunes-viernes)

2. **`sumarDiasHabiles(fechaInicio, diasHabiles)`**: Suma N días hábiles a una fecha

3. **`calcularDiasHabilesEntre(fechaInicio, fechaFin)`**: Cuenta días hábiles entre dos fechas

4. **`calcularEstadoPlazos(incidencia)`**: Función principal que calcula el estado completo:
   - `estado_plazo`: 'dentro_plazo' | 'proximo_vencer' | 'vencido'
   - `dias_restantes`: Número de días hábiles hasta vencimiento (negativo si vencido)
   - `fecha_limite_respuesta`: Fecha límite para contactar al beneficiario
   - `fecha_limite_resolucion`: Fecha límite para resolver completamente
   - `porcentaje_transcurrido`: % del plazo que ya pasó (0-100+)
   - `texto_estado`: Descripción legible del estado

### Ejemplo de Cálculo

**Incidencia Prioridad ALTA reportada el lunes 6 de enero de 2025:**

- **Fecha reporte:** 2025-01-06 (lunes)
- **Plazo respuesta:** 2 días hábiles
  - Fecha límite: 2025-01-08 (miércoles)
- **Plazo resolución:** 5 días hábiles
  - Fecha límite: 2025-01-13 (lunes siguiente)
  - Se excluyen: sábado 11 y domingo 12

**Estado el viernes 10 de enero:**
- Días transcurridos: 4 días hábiles
- Días restantes: 1 día hábil
- Porcentaje: 80%
- Indicador: 🟡 Amarillo (próximo a vencer)

---

## 🛡️ Garantías Legales

Además de los plazos de respuesta, las viviendas cuentan con garantías legales según el DS49:

### Estructura (10 años)

Cubre defectos en:
- Fundaciones y cimientos
- Muros y pilares estructurales
- Techumbres y cubiertas
- Vigas y elementos de soporte

**Responsabilidad:** Constructora debe reparar sin costo cualquier defecto estructural detectado en este período.

### Instalaciones (5 años)

Cubre defectos en:
- Instalación eléctrica (cableado, enchufes, tableros)
- Instalación de agua potable (cañerías, llaves, estanques)
- Instalación de gas (si aplica)
- Sistema de alcantarillado y evacuación de aguas

**Responsabilidad:** Constructora debe reparar o reemplazar componentes defectuosos.

### Terminaciones (3 años)

Cubre defectos en:
- Pisos (cerámica, baldosas, madera)
- Puertas y ventanas (marcos, hojas, vidrios)
- Pintura y revestimientos
- Artefactos sanitarios (lavamanos, inodoro, ducha)

**Responsabilidad:** Constructora debe reparar o reemplazar terminaciones con defectos de fabricación o instalación.

### Cómo Invocar las Garantías

1. **Reportar la incidencia** en esta plataforma con descripción detallada y fotos
2. **Verificar el plazo de garantía** aplicable según tipo de defecto
3. **El técnico evaluará** si el defecto está cubierto por garantía
4. **La constructora está obligada** a reparar sin costo si está dentro del plazo

---

## 📝 Procedimiento SERVIU

Si el plazo legal vence sin resolución satisfactoria, el beneficiario puede presentar queja formal ante SERVIU:

### Paso 1: Documentación

Reunir:
- Número de la incidencia (ej: #1234)
- Fecha de reporte
- Descripción del problema
- Fotos del defecto
- Registro de comunicaciones con TECHO

### Paso 2: Presentación de Queja

**Canales de atención SERVIU:**

- **Presencial:** Oficinas SERVIU regionales (ver direcciones abajo)
- **Online:** Portal de reclamos SERVIU (https://www.serviu.gob.cl/reclamos)
- **Teléfono:** 600 600 0102 (línea nacional)
- **Email:** oirs@minvu.cl

### Paso 3: Seguimiento

SERVIU tiene 30 días hábiles para:
1. Recepcionar la queja
2. Investigar el caso
3. Notificar a la constructora
4. Mediar para solución

### Paso 4: Fiscalización

Si la constructora no responde, SERVIU puede:
- Aplicar multas según gravedad del incumplimiento
- Exigir reparación inmediata
- Iniciar proceso judicial en casos extremos

---

## 📞 Contacto y Recursos

### TECHO Chile - Soporte Técnico

- **Email:** soporte.viviendas@techo.org
- **Teléfono:** +56 2 1234 5678
- **Horario:** Lunes a viernes, 9:00 - 18:00 hrs

### SERVIU Metropolitano

- **Dirección:** Mac Iver 52, Santiago Centro
- **Teléfono:** (2) 2840 3000
- **Email:** serviu.metropolitano@minvu.cl

### SERVIU Regiones

Para encontrar la oficina SERVIU de tu región:
- **Web:** https://www.serviu.gob.cl/oficinas-regionales
- **Teléfono nacional:** 600 600 0102

### Recursos Legales

- **SERNAC (Servicio Nacional del Consumidor):** https://www.sernac.cl
- **Defensoría de la Vivienda:** https://defensoriadelavivienda.cl
- **Ley General de Urbanismo (DFL 458):** [Texto completo en BCN](https://www.bcn.cl/leychile)

---

## 🔄 Actualizaciones

**Última actualización:** Enero 2025  
**Versión:** 1.0

**Próximas mejoras:**
- Integración automática de calendario de feriados nacionales
- Notificaciones automáticas por correo electrónico cuando el plazo esté próximo a vencer
- Dashboard de estadísticas de cumplimiento de plazos para administradores
- Generación automática de reportes para SERVIU

---

## 📚 Referencias Legales

1. **DFL 458 (LGUC)** - Ley General de Urbanismo y Construcciones
   - https://www.bcn.cl/leychile/navegar?idNorma=13560

2. **DS 49** - Decreto Supremo 49, Reglamento del Programa de Vivienda Social
   - https://www.bcn.cl/leychile/navegar?idNorma=8068

3. **Ley 19.496** - Ley de Protección de los Derechos de los Consumidores
   - https://www.bcn.cl/leychile/navegar?idNorma=61438

4. **Normativa SERVIU** - Manuales y circulares técnicas
   - https://www.serviu.gob.cl/normativa

---

**Nota:** Este documento es una guía informativa. En caso de dudas legales específicas, consulta con un abogado especializado en derecho de la vivienda o contacta directamente a SERVIU.
