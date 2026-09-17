# ✅ Checklist de FocusFlow

Este fichero recoge en todo momento qué está hecho y qué queda pendiente en el desarrollo de FocusFlow. Se actualiza en cada sesión de trabajo.

## 👉 Empezar aquí la próxima sesión

Las Fases 1, 2 y 3 están completas (auth, CRUD objetivos/tareas, Pomodoro, Kanban, Eisenhower, captura rápida GTD, estadísticas + Pareto), con push ya hecho a `main`. Solo queda la **Fase 4 — Pulido**. Sugerencia de orden, de más rápido/aislado a más largo:

1. **Modo oscuro**: los valores de la clase `.dark` ya existen en `frontend/src/index.css` (copiados del preset de shadcn) pero no hay ningún interruptor en la UI que añada/quite esa clase al `<html>`. Es el más rápido de los cuatro: un botón junto al `SelectorIdioma` que alterne `.dark` y guarde la preferencia en `localStorage`.
2. **Accesibilidad (a11y)**: revisar `aria-label` que falten, contraste, navegación por teclado (sobre todo en Kanban/Eisenhower, que usan botones sin foco visible personalizado) y que los formularios anuncien errores a lectores de pantalla.
3. **PWA**: manifest + service worker básico (instalable, quizá cache del shell de la app). Es el más grande de los tres; conviene dejarlo para el final.

Antes de continuar, recuerda levantar Docker (`docker compose up -d` en la raíz del proyecto) — Postgres no arranca solo.

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

- [x] Tablero Kanban (`PaginaKanban`, ruta `/kanban` protegida): 3 columnas (Por hacer / En proceso / Hecha), tareas movibles con flechas ←/→, etiqueta con el objetivo al que pertenece cada tarea, captura rápida de tareas nuevas directamente desde el tablero.
- [x] Matriz de Eisenhower (`PaginaEisenhower`, ruta `/eisenhower` protegida): 4 cuadrantes (Hacer ya / Planificar / Delegar / Eliminar) según los campos `Tarea.urgente` y `Tarea.importante`; cada tarjeta tiene botones para alternar ambos criterios y moverla de cuadrante al instante.
- [x] Captura rápida estilo GTD (`CapturaRapida`): barra flotante fija visible en todas las páginas protegidas (Objetivos, Kanban, Eisenhower, Pomodoro), con un único campo de texto para anotar cualquier tarea al vuelo sin objetivo asignado; luego se organiza (Kanban/Eisenhower/objetivo) desde cualquiera de las otras vistas.

## Fase 3 — Analítica

- [x] Estadísticas de progreso visual (`PaginaEstadisticas`, ruta `/estadisticas` protegida): % global completado, distribución de tareas por estado (gráfico de barra apilada con leyenda, paleta validada para daltonismo), progreso por objetivo (barras reutilizadas de Objetivos).
- [x] Detección/marcado de tareas de alto impacto (Pareto 80/20): campo `Tarea.esAltoImpacto`, marcado con ★ desde el tablero Kanban, visualizado en Estadísticas con recuento, porcentaje sobre el total y listado de las tareas marcadas.

## Fase 4 — Pulido

- [x] Selector de idioma funcional (react-intl) con los 6 idiomas: castellano, valenciano, gallego, vasco, catalán, inglés (mensajes de ejemplo únicamente, ver pendiente de traducciones completas).
- [x] Traducciones completas para los 6 idiomas de todo lo construido hasta ahora (auth, objetivos/tareas, Pomodoro, Kanban, Eisenhower, captura rápida, estadísticas/Pareto).
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
- El campo `Tarea.completada` (booleano) se sustituyó por `Tarea.estado` (enum `POR_HACER` / `EN_PROCESO` / `HECHA`) para poder soportar el tablero Kanban de 3 columnas sin tener dos fuentes de verdad sobre el estado de una tarea. El checkbox de "completada" en Objetivos/Tareas ahora alterna entre `POR_HACER` y `HECHA`.
- El tablero Kanban usa flechas (←/→) para mover tareas entre columnas en lugar de arrastrar y soltar, para no añadir una librería de drag-and-drop solo para esto; se puede revisar más adelante si se necesita una experiencia más visual.
- La priorización de Eisenhower se guarda como dos booleanos independientes (`urgente`, `importante`) en `Tarea`, no como un único enum de 4 valores, porque son dos criterios ortogonales que además se muestran como dos botones independientes en la UI.
- La captura rápida (GTD) reutiliza el mismo endpoint/acción de crear tarea suelta que ya existía en Objetivos/Kanban; lo único nuevo es que el formulario está siempre visible (fijo en la parte inferior) en vez de vivir solo dentro de una pantalla concreta.
- Para el gráfico de "Distribución de tareas" en Estadísticas se siguió el procedimiento del skill de dataviz: se sustituyeron los `--chart-1/2/3` grises por defecto de shadcn por la paleta categórica validada (azul/naranja/aguamarina) del skill, que garantiza distinción para daltonismo en las 3 primeras posiciones tanto en claro como en oscuro. No se añadió ninguna librería de gráficos: las barras son simples `div` de Tailwind.
- La página de Estadísticas no tiene endpoint propio en el backend: reutiliza las mismas listas de `/objetivos` y `/tareas` ya cargadas en Redux y calcula todo (progreso global, distribución, Pareto) en el frontend, igual que hacen Kanban y Eisenhower.
