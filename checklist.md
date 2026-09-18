# ✅ Checklist de FocusFlow

Este fichero recoge en todo momento qué está hecho y qué queda pendiente en el desarrollo de FocusFlow. Se actualiza en cada sesión de trabajo.

## 👉 Empezar aquí la próxima sesión

Las Fases 1, 2, 3 y 4 están completas y con commit/push hecho a `main`, con el historial y las estadísticas de Pomodoro, con iconos PNG para la PWA, y con una batería de tests completa: **backend 43 tests (42 unitarios + 1 e2e) / frontend 56 tests**, cubriendo las 8 páginas de React, `EstrategiaJwt`, y con el e2e real (`pnpm test:e2e`) ya ejecutado con éxito contra Postgres de verdad.

No queda ningún punto abierto del roadmap original ni de la lista de tests. La app está en un estado sólido para seguir añadiendo funcionalidad nueva si se decide (no hay nada pendiente obligatorio).

Antes de continuar, recuerda levantar Docker (`docker compose up -d` en la raíz del proyecto) — Postgres no arranca solo.

## Documentación

- [x] README.md inicial con visión, características, stack tecnológico, estructura de carpetas y roadmap.
- [x] checklist.md de seguimiento (este fichero).
- [x] comandos.md con explicación de los comandos usados (no se sube a GitHub).

## Tests automatizados

- [x] Backend: `vitest` ya venía configurado en el scaffold de NestJS (`pnpm test`, `pnpm test:watch`, `pnpm test:cov`) pero no había ningún test real, solo el de ejemplo (`aplicacion.controller.spec.ts`). Se añadieron tests unitarios para los tres servicios con lógica de negocio, mockeando `ServicioPrisma` por completo (no necesitan Postgres/Docker):
  - `autenticacion.service.spec.ts`: rechaza registro con correo duplicado, la contraseña guardada nunca es la de texto plano (se comprueba con `bcrypt.compare`), login rechaza correo inexistente y contraseña incorrecta, `obtenerUsuarioPorId` nunca devuelve el hash.
  - `objetivos.service.spec.ts`: cálculo de `totalTareas`/`tareasCompletadas` al listar, y que `actualizar`/`eliminar` **no llegan a tocar la base de datos** si el objetivo pertenece a otro usuario (aislamiento por usuario).
  - `tareas.service.spec.ts`: mismo aislamiento por usuario para tareas, y que no se puede crear/mover una tarea a un objetivo que no es del usuario.
  - `autenticacion.controller.spec.ts`, `objetivos.controller.spec.ts`, `tareas.controller.spec.ts`: comprueban que cada controlador delega en su servicio pasando el `usuario.id` que llega del decorador `@UsuarioActual()` (el de la petición autenticada), nunca uno que pudiera venir en el body o en la query.
  - Se corrigió además `backend/test/app.e2e-spec.ts`: era el test e2e de ejemplo del scaffold de Nest, sin adaptar nunca al proyecto real (importaba un `AppModule` inexistente desde `src/app.module.js` y un tipo `supertest/types` que no existe en la versión instalada de `supertest`). Ahora importa `AplicacionModule` y comprueba el mensaje real de la API. **Ejecutado con éxito** (`pnpm test:e2e`, con Docker/Postgres levantados): arranca la aplicación Nest completa de verdad (con conexión real a la base de datos) y comprueba la respuesta de `GET /`.
- [x] Frontend: no había ninguna herramienta de test instalada. Se añadió `vitest` + `@testing-library/react` (config en `vite.config.ts`, fichero de setup en `src/pruebas/configuracion.ts`, scripts `pnpm test`/`pnpm test:watch`):
  - `pomodoroSlice.test.ts`: lógica pura del temporizador (tick, cambio de fase trabajo↔descanso, y el caso más delicado — cada 4º ciclo pasa a descanso *largo* en vez de corto).
  - `interfazSlice.test.ts`: cambio de idioma, alternar tema claro/oscuro y su persistencia en `localStorage`.
  - `tareasSlice.test.ts` / `objetivosSlice.test.ts`: los `extraReducers` de los thunks (cargar/crear/eliminar/cambiar estado) probados sin red real, despachando directamente las acciones `.fulfilled`/`.rejected` que exponen los thunks de Redux Toolkit.
  - `sesionSlice.test.ts`: login/registro guardan el token en `localStorage`, `cerrarSesion` y un `restaurarSesion.rejected` (token caducado) lo borran, y un caso con `vi.resetModules()` + import dinámico para comprobar que si ya había un token guardado *antes* de arrancar la app, el estado inicial empieza en modo "restaurando sesión".
  - `SelectorTema.test.tsx`: test de componente con Redux Toolkit + react-intl reales; simula el clic del usuario y comprueba que cambia el estado y el `aria-pressed`.
  - Al escribir estos tests se detectó y arregló un bug real en `interfazSlice.ts`: si `window.matchMedia` no existe (algunos entornos), el código original (`window.matchMedia?.(...).matches`) lanzaba un `TypeError` porque el `?.` solo protegía la llamada, no el `.matches` posterior.
- [x] Backend, ronda 2: `jwt.strategy.spec.ts` (`EstrategiaJwt` lee `JWT_SECRET` del `ConfigService` al construirse — falla rápido si falta — y `validate()` mapea `sub`→`id` sin filtrar más campos de la carga útil). Se extrajo la fábrica del decorador `@UsuarioActual()` a una función exportada aparte (`obtenerUsuarioActual` en `usuario-actual.decorator.ts`) siguiendo el patrón que documenta NestJS para poder probarla sin un `ExecutionContext` real (`usuario-actual.decorator.spec.ts`): comprueba que devuelve exactamente lo que `EstrategiaJwt` dejó en `request.user`. No se tocaron `AuthGuard('jwt')` ni `PassportStrategy` en sí (son de Passport/Nest, no código propio que probar).
- [x] Frontend, ronda 2: se creó un helper compartido `src/pruebas/render.tsx` (`renderizarPagina`) que monta cualquier página con una tienda Redux nueva + `IntlProvider` + `MemoryRouter`, aceptando un `estadoPrecargado` parcial. Truco usado en casi todos los tests de páginas: **sin token de sesión**, los thunks que se despachan al montar (`cargarTareas`, `cargarObjetivos`, `cargarHistorialPomodoro`...) se rechazan al instante con "No autenticado" sin tocar la red, así que se puede precargar directamente el estado que se quiere comprobar sin mockear `fetch` — solo hace falta mockear `fetch` de verdad en los tests que comprueban una acción de escritura (login, registro, crear un objetivo). Con esto, **las 8 páginas ya tienen test**: `PaginaInicio`, `PaginaLogin`, `PaginaRegistro`, `PaginaObjetivos`, `PaginaKanban`, `PaginaEisenhower`, `PaginaPomodoro`, `PaginaEstadisticas` (esta última valida de verdad, a través del componente real, el cálculo de pomodoros "hoy"/"esta semana"/minutos escrito en la ronda anterior).

## Fase 1 — MVP

- [x] Scaffolding del monorepo (`/frontend` y `/backend`).
- [x] Backend: proyecto NestJS + TypeScript inicial (renombrado a convención en castellano: `AplicacionModule`, `AplicacionController`, `AplicacionService`).
- [x] Backend: configuración de Prisma + PostgreSQL (schema inicial con modelo `Usuario`, `ServicioPrisma`/`ModuloPrisma` conectados al `AplicacionModule`).
- [x] Backend: `docker-compose.yml` con PostgreSQL para desarrollo local (Docker Desktop instalado, contenedor `focusflow-postgres` levantado y probado).
- [x] Backend: primera migración de Prisma aplicada (tabla `usuarios` creada en la base de datos real).
- [x] Backend: conexión de Prisma a PostgreSQL en tiempo de ejecución probada (`pnpm start:dev` arranca y conecta sin errores).
- [x] Backend: registro de usuario (`POST /autenticacion/registro`, email + contraseña segura validada, hash con bcrypt).
- [x] Backend: login de usuario (`POST /autenticacion/login`, JWT firmado con `@nestjs/jwt`).
- [x] Backend: ruta protegida de ejemplo `GET /autenticacion/perfil` (guard JWT con Passport, `EstrategiaJwt`).
- [x] Backend: CRUD de objetivos (`/objetivos`) y tareas (`/tareas`), con progreso (`totalTareas`/`tareasCompletadas`) calculado en el listado, aislamiento por usuario y borrado en cascada objetivo → tareas.
- [x] Frontend: proyecto React + TypeScript (Vite) inicial.
- [x] Frontend: Tailwind CSS v4 + shadcn/ui configurados (preset "nova", base Radix, alias `@/*`).
- [x] Frontend: Redux Toolkit configurado (store base en `src/almacen/`, slice `interfazSlice` para el idioma).
- [x] Frontend: selector de idioma funcional (react-intl) probado en navegador con los 6 idiomas.
- [x] Frontend: formulario de registro/login conectado al backend (`PaginaRegistro`, `PaginaLogin`, slice `sesionSlice` con token persistido en `localStorage` y restauración de sesión al recargar).
- [x] Frontend: gestión de tareas/objetivos desde la UI (`PaginaObjetivos`, ruta `/objetivos` protegida con `RutaProtegida`): crear objetivos, añadir tareas dentro de un objetivo o sueltas, marcar como completadas con checkbox, barra de progreso, eliminar objetivo/tarea.
- [x] Frontend: temporizador Pomodoro funcional (`PaginaPomodoro`, ruta `/pomodoro` protegida): trabajo 25 min → descanso corto 5 min, descanso largo de 20 min cada 4 ciclos, botones Iniciar/Pausar/Reiniciar, aviso sonoro (Web Audio, sin ficheros externos) al cambiar de fase.

## Fase 2 — Organización

- [x] Tablero Kanban (`PaginaKanban`, ruta `/kanban` protegida): 3 columnas (Por hacer / En proceso / Hecha), tareas movibles con flechas ←/→, etiqueta con el objetivo al que pertenece cada tarea, captura rápida de tareas nuevas directamente desde el tablero.
- [x] Matriz de Eisenhower (`PaginaEisenhower`, ruta `/eisenhower` protegida): 4 cuadrantes (Hacer ya / Planificar / Delegar / Eliminar) según los campos `Tarea.urgente` y `Tarea.importante`; cada tarjeta tiene botones para alternar ambos criterios y moverla de cuadrante al instante.
- [x] Captura rápida estilo GTD (`CapturaRapida`): barra flotante fija visible en todas las páginas protegidas (Objetivos, Kanban, Eisenhower, Pomodoro), con un único campo de texto para anotar cualquier tarea al vuelo sin objetivo asignado; luego se organiza (Kanban/Eisenhower/objetivo) desde cualquiera de las otras vistas.

## Fase 3 — Analítica

- [x] Estadísticas de progreso visual (`PaginaEstadisticas`, ruta `/estadisticas` protegida): % global completado, distribución de tareas por estado (gráfico de barra apilada con leyenda, paleta validada para daltonismo), progreso por objetivo (barras reutilizadas de Objetivos).
- [x] Detección/marcado de tareas de alto impacto (Pareto 80/20): campo `Tarea.esAltoImpacto`, marcado con ★ desde el tablero Kanban, visualizado en Estadísticas con recuento, porcentaje sobre el total y listado de las tareas marcadas.

## Fase 4 — Pulido

- [x] Selector de idioma funcional (react-intl) con los 6 idiomas: castellano, valenciano, gallego, vasco, catalán, inglés (mensajes de ejemplo únicamente, ver pendiente de traducciones completas).
- [x] Traducciones completas para los 6 idiomas de todo lo construido hasta ahora (auth, objetivos/tareas, Pomodoro, Kanban, Eisenhower, captura rápida, estadísticas/Pareto).
- [x] Locale de `Intl.NumberFormat`/`DateTimeFormat` para eu/gl/va/ca: la causa real del aviso en consola era que `"va"` (valenciano) no es una etiqueta BCP-47/ICU válida (`Intl.NumberFormat.supportedLocalesOf('va')` devuelve `[]`; comprobado con Node). Se añadió `CODIGO_LOCALE_ICU` en `frontend/src/idiomas/index.ts`, que traduce `"va"` a la etiqueta correcta `"ca-ES-valencia"` (catalán, variante valenciana) solo para lo que se le pasa a `Intl`/`IntlProvider`; el resto del código sigue usando `"va"` como código interno. eu/gl/ca/es/en ya eran válidos de por sí.
- [x] Accesibilidad (a11y): `document.documentElement.lang` se sincroniza con el idioma elegido; se restauró el anillo de foco del campo de `CapturaRapida` (tenía `focus-visible:ring-0`, quedaba sin ningún indicador visible al navegar con teclado); botones de alternar (Eisenhower urgente/importante, estrella de alto impacto en Kanban) llevan `aria-pressed` para anunciar su estado a lectores de pantalla; el checkbox de completar tarea en `ObjetivoTarjeta` tiene `aria-label` con el título de la tarea. El resto (botones de shadcn/ui, checkboxes de Radix) ya traía foco visible y `aria-label` de fábrica.
- [x] Modo oscuro: `interfazSlice` guarda `tema` (`'claro' | 'oscuro'`), con valor inicial desde `localStorage` o `prefers-color-scheme` del sistema si no hay nada guardado. Componente `SelectorTema` (botón 🌙/☀️ junto al `SelectorIdioma` en `PaginaInicio`) que alterna la clase `.dark` en `<html>` y el `<meta name="theme-color">`.
- [x] PWA: `public/manifest.webmanifest` (nombre, iconos, `display: standalone`) enlazado desde `index.html`; `public/sw.js` con estrategia stale-while-revalidate para peticiones `GET` al propio origen (nunca a la API, que es otro origen); registrado desde `main.tsx` solo en producción. `index.html` también actualizado: `<title>FocusFlow</title>` (antes "frontend"), meta descripción, `lang="es"`.
- [x] Iconos PNG dedicados de la PWA (`frontend/public/icons/icono-192.png` y `icono-512.png`, fondo blanco sólido, referenciados en el manifest junto al `favicon.svg` original) generados a partir del logo SVG existente. `sharp`/librsvg (usado para rasterizar SVG server-side) no soportaba bien los filtros de desenfoque del SVG y generaba barras negras; se resolvió renderizando el SVG en Chrome real (motor de renderizado completo, sí soporta esos filtros) sobre una página HTML servida por un servidor local temporal, capturando la región con la herramienta de zoom del navegador, y solo usando `sharp` al final para el redimensionado limpio a 192x192/512x512 sobre un PNG ya rasterizado (sin más filtros SVG de por medio). `apple-touch-icon` en `index.html` actualizado para usar el PNG de 192 (iOS no soporta bien SVG ahí).

## Historial de Pomodoro

- [x] Backend: nuevo modelo `SesionPomodoro` en `schema.prisma` (enum `FasePomodoro`, `duracionSegundos`, `usuarioId`, `tareaId` opcional con `onDelete: SetNull` — a diferencia de Objetivo→Tarea, que es en cascada, aquí se conserva el historial aunque se borre la tarea). Migración `20260918164219_historial_pomodoro` generada y aplicada contra Postgres real. Módulo `pomodoro/` (`ModuloPomodoro`) con `POST /pomodoro/sesiones` (registra una fase completada, comprobando que la tarea asociada — si la hay — es del usuario) y `GET /pomodoro/sesiones` (últimas 100 — el límite se subió de 20 a 100 para que las estadísticas de "hoy"/"esta semana" tengan margen suficiente sin necesitar un endpoint de agregación propio —, con el título de la tarea incluido). Probado con tests unitarios y con `curl` real contra la base de datos, incluido el caso de intentar asociar la sesión a la tarea de otro usuario (rechazado con 404).
- [x] Frontend: `pomodoroSlice` guarda qué fase se acaba de completar (`ultimaFaseCompletada`) para poder registrarla en el momento justo — antes, en cuanto sonaba el aviso, `estado.fase` ya apuntaba a la *siguiente* fase, no a la que acababa de terminar. `PaginaPomodoro` añade un desplegable "Tarea asociada (opcional)" (con las tareas no completadas del usuario) y una tarjeta "Historial reciente" (solo las 5 últimas, aunque el store guarda hasta 100 para las estadísticas) que carga las últimas sesiones al entrar en la página. Probado en Chrome con una cuenta real: se crea una tarea en Objetivos, aparece en el desplegable de Pomodoro, y una sesión registrada por la API aparece en el historial nada más recargar la página.
- [x] Estadísticas de Pomodoro en `PaginaEstadisticas`: tarjeta con pomodoros de trabajo completados hoy, completados esta semana y minutos de trabajo esta semana, calculados en el frontend a partir del mismo historial (igual que el resto de Estadísticas, sin endpoint de agregación dedicado). Probado en Chrome: tras registrar una sesión de 25 min, la tarjeta mostró "1 / 1 / 25" correctamente.
- [x] Tests: `pomodoro.service.spec.ts` y `pomodoro.controller.spec.ts` en el backend (mismo patrón de aislamiento por usuario que Objetivos/Tareas); `pomodoroSlice.test.ts` ampliado con los nuevos `extraReducers` del historial.

## Decisiones ya tomadas (para no volver a preguntarlas)

- Frontend: React + TypeScript, Tailwind CSS + shadcn/ui, Redux Toolkit, react-intl.
- Backend: NestJS + TypeScript, Prisma, PostgreSQL (no MySQL).
- Autenticación propia (bcrypt + JWT), sin servicios externos.
- Monorepo con carpetas `/frontend` y `/backend` separadas.
- Gestor de paquetes: pnpm.
- Contenedores: Docker + Docker Compose para PostgreSQL en desarrollo.
- Nombres de funciones/variables/componentes en castellano en todo el código.
- Repo GitHub: `anaborrellrichart79-debug/focusflow`.
- Prisma fijado a la versión estable `7.10.0` (la etiqueta "latest" del paquete apuntaba a una release candidate `8.0.0-rc.15`, evitada a propósito por no ser estable).
- Prisma 7 requiere un "driver adapter" explícito para conectar a la base de datos: se usa `@prisma/adapter-pg` (paquete `pg`) en `ServicioPrisma`, pasando `DATABASE_URL` como `connectionString`.
- Docker Desktop instalado con winget (motor basado en WSL2, ya configurado en esta máquina).
- El endpoint `/autenticacion/perfil` consulta siempre la base de datos (no confía solo en los datos del JWT) para que el nombre de usuario esté actualizado tras iniciar sesión de nuevo o recargar la página.
- La sesión del frontend se restaura automáticamente al cargar la app: si hay un token guardado en `localStorage`, se llama a `/autenticacion/perfil`; si el token ya no es válido, se borra.
- Modelo de datos: un `Objetivo` agrupa `Tarea`s (mini-tareas), pero una `Tarea` también puede existir suelta (sin objetivo) para permitir captura rápida estilo GTD. Al borrar un `Objetivo` se borran en cascada sus tareas.
- El progreso de cada objetivo (barra + "X de Y tareas") se calcula en el frontend a partir de las tareas ya cargadas en el store (`tareasSlice`), no del valor `totalTareas`/`tareasCompletadas` que devuelve el backend al listar objetivos — así se mantiene actualizado al instante al añadir/completar tareas sin tener que recargar la lista de objetivos.
- El temporizador Pomodoro en sí (cuenta atrás, fases, ciclos) sigue siendo puramente local en `pomodoroSlice` — no hay llamadas al backend mientras corre. Solo al completarse una fase se dispara una llamada para guardar esa sesión en el historial (`SesionPomodoro`), de forma asociativa (opcional) a una tarea concreta.
- El campo `Tarea.completada` (booleano) se sustituyó por `Tarea.estado` (enum `POR_HACER` / `EN_PROCESO` / `HECHA`) para poder soportar el tablero Kanban de 3 columnas sin tener dos fuentes de verdad sobre el estado de una tarea. El checkbox de "completada" en Objetivos/Tareas ahora alterna entre `POR_HACER` y `HECHA`.
- El tablero Kanban usa flechas (←/→) para mover tareas entre columnas en lugar de arrastrar y soltar, para no añadir una librería de drag-and-drop solo para esto; se puede revisar más adelante si se necesita una experiencia más visual.
- La priorización de Eisenhower se guarda como dos booleanos independientes (`urgente`, `importante`) en `Tarea`, no como un único enum de 4 valores, porque son dos criterios ortogonales que además se muestran como dos botones independientes en la UI.
- La captura rápida (GTD) reutiliza el mismo endpoint/acción de crear tarea suelta que ya existía en Objetivos/Kanban; lo único nuevo es que el formulario está siempre visible (fijo en la parte inferior) en vez de vivir solo dentro de una pantalla concreta.
- Para el gráfico de "Distribución de tareas" en Estadísticas se siguió el procedimiento del skill de dataviz: se sustituyeron los `--chart-1/2/3` grises por defecto de shadcn por la paleta categórica validada (azul/naranja/aguamarina) del skill, que garantiza distinción para daltonismo en las 3 primeras posiciones tanto en claro como en oscuro. No se añadió ninguna librería de gráficos: las barras son simples `div` de Tailwind.
- La página de Estadísticas no tiene endpoint propio en el backend: reutiliza las mismas listas de `/objetivos` y `/tareas` ya cargadas en Redux y calcula todo (progreso global, distribución, Pareto) en el frontend, igual que hacen Kanban y Eisenhower.
