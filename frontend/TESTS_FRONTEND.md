# Evidencia Pruebas Unitarias Frontend (Auth + Roles)

Este documento resume el alcance de las pruebas unitarias implementadas para los flujos de **Login**, **Registro** y **Rutas protegidas por Rol** siguiendo el enfoque TDD descrito.

## Objetivos Cubiertos

| Área | Caso | Archivo de Test | Estado |
|------|------|-----------------|--------|
| Login | Campos vacíos (bloquea submit) | `__tests__/Login.test.jsx` | Implementado |
| Login | Email inválido | `__tests__/Login.test.jsx` | Implementado |
| Login | Credenciales incorrectas (401) | `__tests__/Login.test.jsx` | Implementado |
| Login | Login exitoso (token + contexto) | `__tests__/Login.test.jsx` | Implementado |
| Registro | Campos vacíos / validaciones iniciales | `__tests__/registrar.test.jsx` | Implementado |
| Registro | Email inválido | `__tests__/registrar.test.jsx` | Implementado |
| Registro | Contraseñas distintas | `__tests__/registrar.test.jsx` | Implementado |
| Registro | Email duplicado (409) | `__tests__/registrar.test.jsx` | Implementado |
| Registro | Registro exitoso (token + contexto) | `__tests__/registrar.test.jsx` | Implementado |
| Roles | Admin accede a /admin | `__tests__/roles.test.jsx` | Implementado |
| Roles | Técnico bloqueado en /admin | `__tests__/roles.test.jsx` | Implementado |
| Roles | Beneficiario accede a /beneficiario | `__tests__/roles.test.jsx` | Implementado |
| Roles | Usuario no autenticado redirigido | `__tests__/roles.test.jsx` | Implementado |
| Roles | Normalización (admin→administrador) | `__tests__/roles.test.jsx` | Implementado |

## Técnicas Utilizadas
- **React Testing Library** para renderizado y simulación de eventos.
- **Jest mocks** sobre `../services/api` para aislar lógica de red.
- **localStorage** limpiado entre tests para evitar contaminación de estado.
- **Validaciones previas** (sin fetch) probadas verificando que no se llama a la función mock de API.
- **MemoryRouter** para montar subconjuntos de rutas y simular navegación protegida.
- **AuthContext.Provider** manual en tests de roles para inyectar estados simulados (rol / isAuthenticated).

## Decisiones de Diseño
1. Se centralizó la validación en `src/utils/validation.js` para permitir pruebas más simples y reducir duplicación.
2. Se decidió mostrar solo el primer error de validación para mantener la interfaz limpia (podría ampliarse a lista en el futuro).
3. Se decodifica el JWT (cuando existe) para poder redirigir a dashboards específicos según rol.
4. Los tests ahora incluyen verificación de rutas protegidas y normalización de roles.

## Cobertura No Incluida (Próximos Pasos)
- Expiración / refresco de token.
- Flujo de logout y limpieza segura de estado.
- Accesibilidad (focus management, mensajes ARIA).
- Pruebas de navegación tras login/registro (redirigir a dashboard correcto) con mocks de `useNavigate`.
- Errores de backend específicos (500, 429) y mensajes diferenciados.

## Ejecución de Tests
Desde la carpeta `frontend/`:
```
npm test -- --watchAll=false
```
(Asumiendo Create React App; se puede ajustar para CI.)

## Posibles Mejoras Futuras
- Añadir snapshot para estados de error y loading.
- Añadir pruebas de debounce (si se introduce) en validación en vivo.
- Integrar pruebas de integración con un mock server (msw) para flujos más realistas.

## Conclusión
La suite de pruebas cubre validaciones de formularios, flujos exitosos de autenticación y reglas de acceso por rol (incluyendo normalización). La base es estable para ampliar hacia expiración de sesión, refresco de token y pruebas de integración más completas sin refactorizaciones mayores.
