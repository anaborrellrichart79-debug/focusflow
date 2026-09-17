# ✅ Checklist de FocusFlow

Este fichero recoge en todo momento qué está hecho y qué queda pendiente en el desarrollo de FocusFlow. Se actualiza en cada sesión de trabajo.

## Documentación

- [x] README.md inicial con visión, características, stack tecnológico, estructura de carpetas y roadmap.
- [x] checklist.md de seguimiento (este fichero).
- [x] comandos.md con explicación de los comandos usados (no se sube a GitHub).

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

- [ ] Tablero Kanban (por hacer / en proceso / hecho).
- [ ] Matriz de Eisenhower (4 cuadrantes de priorización).
- [ ] Captura rápida y listas por contexto estilo GTD.

## Fase 3 — Analítica

- [ ] Estadísticas de progreso (visual).
- [ ] Detección/marcado de tareas de alto impacto (Pareto 80/20).

## Fase 4 — Pulido

- [x] Selector de idioma funcional (react-intl) con los 6 idiomas: castellano, valenciano, gallego, vasco, catalán, inglés (mensajes de ejemplo únicamente, ver pendiente de traducciones completas).
- [ ] Traducciones completas para los 6 idiomas (ahora mismo hay claves de ejemplo + autenticación + objetivos/tareas + Pomodoro, faltan Kanban/Eisenhower/Pareto).
- [ ] Cargar datos de locale de `Intl.NumberFormat`/`DateTimeFormat` para eu/gl/va/ca si se usa formateo de números o fechas (aviso visto en consola: "Missing locale data for locale eu").
- [ ] Accesibilidad (a11y).
- [ ] Modo oscuro.
- [ ] PWA (instalable, offline básico).

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
- El Pomodoro es una funcionalidad de frontend puramente local (slice `pomodoroSlice`, sin llamadas al backend todavía): no guarda historial de sesiones en la base de datos. Eso quedaría para la Fase 3 (estadísticas de progreso) si se decide asociar pomodoros completados a tareas concretas.
