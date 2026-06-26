# Guia de Despliegue Independiente - NUMA

Esta guia te ayudara a desplegar la app sin depender del servidor de Emergent.

## Arquitectura Independiente

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│    Frontend     │────▶│    Backend      │────▶│    MongoDB      │
│    (Vercel)     │     │   (Railway)     │     │   (Atlas)       │
└─────────────────┘     └─────────────────┘     └─────────────────┘
```

## Paso 1: Configurar MongoDB Atlas (Gratis)

1. Ve a [mongodb.com/atlas](https://www.mongodb.com/atlas)
2. Crea una cuenta gratuita
3. Crea un cluster gratuito (M0 Sandbox)
4. En "Database Access", crea un usuario:
   - Username: `numa`
   - Password: `tu-password-seguro`
5. En "Network Access", agrega tu IP o `0.0.0.0/0` (para todos)
6. Ve a "Database" > "Connect" > "Connect your application"
7. Copia la URL de conexion (algo como):
   ```
   mongodb+srv://numa:tu-password@cluster0.xxxxx.mongodb.net/numa?retryWrites=true&w=majority
   ```

## Paso 2: Desplegar Backend en Railway (Gratis)

1. Ve a [railway.app](https://railway.app)
2. Crea una cuenta con GitHub
3. Haz push de tu codigo a GitHub (si no lo has hecho)
4. En Railway, haz click en "New Project" > "Deploy from GitHub repo"
5. Selecciona tu repositorio
6. Selecciona la carpeta `backend`
7. Ve a la pestaña "Variables" y agrega:

```
MONGO_URL=mongodb+srv://numa:tu-password@cluster0.xxxxx.mongodb.net/numa?retryWrites=true&w=majority
DB_NAME=numa
JWT_SECRET=genera-un-secreto-largo-aqui-mira-1234567890
ADMIN_EMAIL=admin@eduquest.com
ADMIN_PASSWORD=tu-password-seguro
CORS_ORIGINS=https://tu-app.vercel.app
```

8. Railway detectara automaticamente que es Python y usara el Dockerfile
9. Espera a que termine el build (2-3 minutos)
10. Copia la URL que Railway te da (algo como: `https://tu-app.up.railway.app`)

## Paso 3: Desplegar Frontend en Vercel (Gratis)

1. Ve a [vercel.com](https://vercel.com)
2. Crea una cuenta con GitHub
3. Haz click en "New Project"
4. Selecciona tu repositorio de GitHub
5. Selecciona la carpeta `frontend`
6. En "Environment Variables" agrega:

```
REACT_APP_BACKEND_URL=https://tu-app.up.railway.app
```

7. Haz click en "Deploy"
8. Espera a que termine (1-2 minutos)
9. Vercel te dara una URL como: `https://tu-app.vercel.app`

## Paso 4: Actualizar CORS

1. Ve a Railway > tu proyecto > Variables
2. Actualiza `CORS_ORIGINS` con tu URL de Vercel:
   ```
   CORS_ORIGINS=https://tu-app.vercel.app
   ```

## Paso 5: Probar la App

1. Ve a `https://tu-app.vercel.app`
2. Deberias ver la pagina de inicio
3. Registra una cuenta o usa:
   - Email: `admin@eduquest.com`
   - Password: `tu-password-seguro`

---

## Alternativa: Desplegar Backend en Render (Gratis)

Si prefieres Render en lugar de Railway:

1. Ve a [render.com](https://render.com)
2. Crea una cuenta
3. "New" > "Web Service"
4. Conecta tu repositorio de GitHub
5. Configura:
   - Name: `numa-backend`
   - Runtime: `Python`
   - Build Command: `pip install -r requirements.txt`
   - Start Command: `uvicorn server:app --host 0.0.0.0 --port $PORT`
6. Agrega las mismas variables de entorno que en Railway
7. Render te dara una URL similar

---

## Variables de Entorno Resumen

### Backend
| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `MONGO_URL` | URL de MongoDB Atlas | `mongodb+srv://user:pass@cluster.mongodb.net/numa` |
| `DB_NAME` | Nombre de la base de datos | `numa` |
| `JWT_SECRET` | Secreto para JWT (largo y seguro) | `mi-secreto-super-seguro-123` |
| `ADMIN_EMAIL` | Email del admin | `admin@eduquest.com` |
| `ADMIN_PASSWORD` | Password del admin | `admin123` |
| `CORS_ORIGINS` | URL del frontend | `https://tu-app.vercel.app` |

### Frontend
| Variable | Descripcion | Ejemplo |
|----------|-------------|---------|
| `REACT_APP_BACKEND_URL` | URL del backend | `https://tu-app.up.railway.app` |

---

## Comandos Utiles

### Ver logs en Railway
```bash
# Instala CLI de Railway
npm i -g @railway/cli

# Login
railway login

# Ver logs
railway logs
```

### Ver logs en Vercel
```bash
# Instala CLI de Vercel
npm i -g vercel

# Ver logs
vercel logs
```

---

## Solucion de Problemas

| Problema | Solucion |
|----------|----------|
| "CORS error" | Verificar que `CORS_ORIGINS` en backend coincida con la URL de Vercel |
| "Network error" | Verificar que `REACT_APP_BACKEND_URL` apunte al backend correcto |
| "Cannot connect to MongoDB" | Verificar la URL de MongoDB Atlas y que el usuario tiene permisos |
| "Build failed" | Verificar que el Dockerfile esta en la carpeta `backend` |

---

## Costos

| Servicio | Plan Gratis | Limitaciones |
|----------|-------------|--------------|
| **Vercel** | Hobby Plan | 100GB bandwidth/mes |
| **Railway** | Trial | $5 de credito gratis |
| **MongoDB Atlas** | M0 Sandbox | 512MB storage |

**Total: $0/mes** para empezar
