# 🎯 FocusFlow

**FocusFlow** es una aplicación web anti-procrastinación enfocada en la **productividad personal**. Ayuda a dividir objetivos grandes en tareas y mini-tareas manejables, combina las técnicas de organización del tiempo más reconocidas en un único flujo de trabajo y ofrece seguimiento visual del progreso, todo con una interfaz **moderna, clara e intuitiva**.

## 📑 Índice

- [Características principales](#-características-principales)
- [Filosofía de producto](#-filosofía-de-producto)
- [Stack tecnológico](#️-stack-tecnológico)
- [Estructura del proyecto](#-estructura-del-proyecto)
- [Puesta en marcha](#-puesta-en-marcha)
- [Roadmap](#️-roadmap)
- [Internacionalización](#-internacionalización)
- [Contribución](#-contribución)
- [Licencia](#-licencia)

## ✨ Características principales

- **Gestión inteligente de tareas**: divide objetivos grandes en tareas y mini-tareas accionables.
- **Seguimiento de progreso**: visualiza de un vistazo cuánto avanzas hacia tus objetivos.
- **Técnica Pomodoro**: temporizador de bloques de trabajo (25 min) y descansos (5 min), con descanso largo (15-30 min) cada 4 ciclos.
- **Matriz de Eisenhower**: clasifica tus tareas en 4 cuadrantes según urgencia e importancia para decidir qué hacer, programar, delegar o eliminar.
- **Metodología GTD (Getting Things Done)**: captura rápida de tareas para sacarlas de la cabeza, organizadas por contexto y siguiente acción.
- **Tablero Kanban**: columnas visuales (Por hacer / En proceso / Hecho) para ver el flujo de trabajo y limitar el trabajo en curso.
- **Principio de Pareto (80/20)**: identifica y destaca las tareas de alto impacto que generan la mayoría de tus resultados.
- **Registro y autenticación seguros**: alta mediante correo electrónico y contraseña segura.
- **Multi-idioma**: castellano, valenciano, gallego, vasco, catalán e inglés.
- **Diseño moderno e intuitivo**: pensado para minimizar la fricción y mantener el foco.

## 🧠 Filosofía de producto

FocusFlow no impone una única metodología: combina lo mejor de cada técnica para adaptarse a distintos momentos del flujo de trabajo de la persona usuaria.

| Técnica | Rol dentro de FocusFlow |
|---|---|
| **GTD** | Punto de entrada: capturar cualquier tarea u objetivo sin fricción antes de organizarlo. |
| **Matriz de Eisenhower** | Priorización: decidir qué tareas capturadas son urgentes/importantes y en qué orden abordarlas. |
| **Kanban** | Visualización del flujo: mover las tareas priorizadas por sus estados (por hacer, en proceso, hecho). |
| **Pomodoro** | Ejecución: trabajar cada tarea en bloques de foco con descansos programados. |
| **Pareto (80/20)** | Analítica: destacar qué tareas completadas han generado más impacto, para reforzar el foco en lo esencial. |

## 🛠️ Stack tecnológico

| Área | Tecnología |
|---|---|
| Frontend | React + TypeScript |
| Estilos / UI | Tailwind CSS + shadcn/ui |
| Gestión de estado | Redux Toolkit |
| Internacionalización | react-intl (FormatJS) |
| Backend | NestJS + TypeScript |
| Base de datos | PostgreSQL |
| ORM | Prisma |
| Autenticación | Registro/login propio con bcrypt (hash de contraseñas) + JWT (sesiones) |
| Gestor de paquetes | pnpm |
| Contenedores | Docker + Docker Compose (PostgreSQL en desarrollo local) |

> **Nota de convención de código**: los nombres de funciones, variables, componentes, tipos, etc. se escriben en **castellano** en todo el código fuente del proyecto.

## 📁 Estructura del proyecto

Monorepo con frontend y backend como proyectos independientes:

```
focusflow/
├── frontend/           # Aplicación React (Vite + TypeScript)
│   ├── src/
│   │   ├── componentes/
│   │   ├── paginas/
│   │   ├── almacen/        # Redux Toolkit (store, slices)
│   │   ├── idiomas/        # Ficheros de traducción (react-intl)
│   │   └── servicios/      # Llamadas a la API
│   └── package.json
├── backend/            # API REST (NestJS + TypeScript)
│   ├── src/
│   │   ├── autenticacion/
│   │   ├── usuarios/
│   │   ├── tareas/
│   │   └── prisma/
│   ├── prisma/
│   │   └── schema.prisma
│   └── package.json
├── docker-compose.yml  # PostgreSQL (+ servicios en el futuro)
└── README.md
```

## 🚀 Puesta en marcha

### Requisitos previos

- [Node.js](https://nodejs.org/) (LTS)
- [pnpm](https://pnpm.io/)
- [Docker](https://www.docker.com/) y Docker Compose

### Clonar el repositorio

```bash
gh repo clone anaborrellrichart79-debug/focusflow
cd focusflow
```

### Configurar variables de entorno

Crea un fichero `.env` en `backend/` a partir de `.env.example`, con al menos:

```env
DATABASE_URL="postgresql://usuario:password@localhost:5432/focusflow"
JWT_SECRET="cambia-esto-por-un-secreto-seguro"
```

### Levantar PostgreSQL con Docker

```bash
docker compose up -d
```

### Instalar dependencias y arrancar en desarrollo

```bash
# Backend
cd backend
pnpm install
pnpm prisma migrate dev
pnpm start:dev

# Frontend (en otra terminal)
cd frontend
pnpm install
pnpm dev
```

## 🗺️ Roadmap

- [ ] **Fase 1 — MVP**: autenticación (registro/login), CRUD de tareas y objetivos, temporizador Pomodoro.
- [ ] **Fase 2 — Organización**: tablero Kanban, Matriz de Eisenhower, captura y listas estilo GTD.
- [ ] **Fase 3 — Analítica**: estadísticas de progreso y detección de tareas de alto impacto (Pareto 80/20).
- [ ] **Fase 4 — Pulido**: soporte completo de los 6 idiomas, accesibilidad, modo oscuro, PWA.

## 🌍 Internacionalización

FocusFlow estará disponible en **castellano, valenciano, gallego, vasco, catalán e inglés**. La persona usuaria podrá elegir su idioma preferido desde la propia aplicación. Las traducciones se gestionan con `react-intl`, con un fichero de mensajes independiente por idioma en `frontend/src/idiomas/`.

## 🤝 Contribución

Proyecto personal actualmente en desarrollo. Las guías de contribución se añadirán más adelante.

## 📄 Licencia

Por definir.
