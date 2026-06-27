<p align="center">
  <img src="frontend/public/logo.svg" width="80" alt="NUMA Logo"/>
</p>

<h1 align="center">NUMA</h1>

<p align="center">
  <strong>Plataforma educativa gamificada de plantas medicinales y bienestar</strong>
</p>

<p align="center">
  <a href="https://numa-front.vercel.app">Ver Demo</a> ·
  <a href="https://n-ma-ww9o.vercel.app/docs">API Docs</a> ·
  <a href="#getting-started">Instalación Local</a>
</p>

<p align="center">
  <a href="https://numa-front.vercel.app"><img src="https://img.shields.io/badge/Frontend-Deployed-000?logo=vercel&logoColor=white" alt="Frontend Deployed"/></a>
  <a href="https://n-ma-ww9o.vercel.app/docs"><img src="https://img.shields.io/badge/Backend-Deployed-000?logo=vercel&logoColor=white" alt="Backend Deployed"/></a>
  <a href="https://numa-front.vercel.app"><img src="https://img.shields.io/badge/Status-Online-brightgreen" alt="Status"/></a>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-19-61DAFB?logo=react" alt="React"/>
  <img src="https://img.shields.io/badge/FastAPI-0.110-009688?logo=fastapi" alt="FastAPI"/>
  <img src="https://img.shields.io/badge/MongoDB-8.0-47A248?logo=mongodb" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.4-06B6D4?logo=tailwindcss" alt="Tailwind"/>
  <img src="https://img.shields.io/badge/Tests-Passing-brightgreen" alt="Tests"/>
  <img src="https://img.shields.io/badge/PWA-Enabled-5A0FC8" alt="PWA"/>
</p>

---

## Sobre el proyecto

NUMA es una plataforma educativa donde los profesores crean cursos, suben recursos y califican actividades, mientras los estudiantes ganan XP, desbloquean insignias y escalan un ranking. Diseñada para funcionar sin conexión y desplegada como arquitectura serverless en Vercel.

## Capturas

<p align="center">
  <img src="https://github.com/user-attachments/placeholder-landing.png" width="80%" alt="Landing Page"/>
</p>

## Funcionalidades

### Profesor
- Crear, gestionar y eliminar cursos
- Agregar lecciones con contenido Markdown
- Subir recursos (archivos y enlaces externos)
- Crear quizzes con retroalimentación automática y tareas abiertas
- Calificar entregas de estudiantes

### Estudiante
- Explorar catálogo de cursos e inscribirse
- Completar lecciones y responder quizzes
- Subir tareas con archivos adjuntos
- Ganar XP y subir de nivel
- Desbloquear insignias por logros

### Técnicas
- **Autenticación** con JWT + HttpOnly cookies (cross-origin seguro)
- **Modo offline** con IndexedDB y service worker
- **Gestión de archivos** con MongoDB GridFS
- **Rate limiting** para proteger la API
- **Manejo centralizado de errores**

## Arquitectura

```
N-ma/
├── backend/
│   ├── api/index.py          # Entry point Vercel serverless
│   ├── server.py             # FastAPI app + startup events
│   ├── config.py             # Pydantic Settings (env vars)
│   ├── models/               # Pydantic schemas
│   ├── services/             # Auth, gamificación, archivos, cursos
│   ├── routes/               # Endpoints REST
│   ├── middleware/            # Error handlers, rate limiter
│   └── vercel.json           # Build config para Vercel
├── frontend/
│   ├── src/
│   │   ├── pages/            # Landing, Dashboard, Cursos, Quiz, etc.
│   │   ├── components/       # UI reutilizable (nb-ui, Skeleton, etc.)
│   │   ├── hooks/            # useCourses, useGamification
│   │   └── lib/              # api.js, auth.js, offline.js
│   └── public/               # Logo, manifest, service worker
├── docker-compose.yml        # Desarrollo local con Docker
└── .env.example              # Variables de entorno requeridas
```

## Stack tecnológico

| Capa | Tecnología | Por qué |
|------|-----------|---------|
| Frontend | React 19 + Tailwind CSS | SPA rápida con diseño responsive |
| UI | Radix UI + shadcn/ui | Componentes accesibles y consistentes |
| State | React Context + Hooks | Manejo de estado sin dependencias pesadas |
| Offline | IndexedDB + Service Worker | Funciona sin conexión a internet |
| Backend | FastAPI (Python) | API async de alto rendimiento |
| Base de datos | MongoDB Atlas | NoSQL flexible para contenido educativo |
| Archivos | MongoDB GridFS | Almacenamiento de archivos grandes |
| Auth | JWT + HttpOnly cookies | Seguridad y prevención de XSS |
| Despliegue | Vercel (serverless) | Escalado automático, sin servidor dedicado |
| Validación | Pydantic V2 | Tipado estricto en Python |

## Getting Started (instalación local)

### Prerrequisitos
- Python 3.12+
- Node.js 18+ / Yarn
- MongoDB (local o Atlas)

### 1. Clonar el repositorio

```bash
git clone https://github.com/Victor-Diaz-18/N-ma.git
cd N-ma
```

### 2. Backend

```bash
cd backend
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt

# Crear archivo .env con tus variables
cp ../.env.example .env
# Editar .env con tu MONGO_URL, JWT_SECRET, etc.

uvicorn server:app --reload --port 8000
```

### 3. Frontend

```bash
cd frontend
yarn install
yarn start
```

La app corre en `http://localhost:3000` y la API en `http://localhost:8000`.

### Variables de entorno

```env
MONGO_URL=mongodb+srv://<user>:<pass>@cluster.mongodb.net/?retryWrites=true&w=majority
DB_NAME=numa
JWT_SECRET=tu_clave_secreta_aleatoria
ADMIN_EMAIL=admin@numa.com
ADMIN_PASSWORD=tu_contraseña_segura
CORS_ORIGINS=http://localhost:3000
```

## Despliegue

### Docker

```bash
docker-compose up --build
```

### Vercel

1. Conectar repositorio a Vercel
2. Crear dos proyectos: frontend (Root: `frontend`) y backend (Root: `backend`)
3. Configurar variables de entorno en cada proyecto
4. Deploy automático al hacer push a `main`

Ver [DEPLOY.md](DEPLOY.md) para guía detallada.

## Lo que aprendí

- **Arquitectura fullstack** de principio a fin: diseño, desarrollo, testing y despliegue
- **Comunicación cross-origin** segura entre frontend y backend en dominios diferentes
- **Autenticación** con JWT y cookies HttpOnly para prevenir ataques XSS
- **Patrones de diseño** en Python: servicio, repositorio, inyección de dependencias
- **React custom hooks** para separar lógica de presentación
- **Modo offline** con service workers e IndexedDB para apps educativas
- **Despliegue serverless** en Vercel con Python y React
- **MongoDB** con Motor (async driver), GridFS para archivos, e índices para performance

## Licencia

Proyecto académico — [Universidad del Magdalena](https://unimagdalena.edu.co)
