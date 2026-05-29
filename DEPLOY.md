# Despliegue — fraude-front (Vercel)

Guía para publicar el frontend en **Vercel**. El API corre en Railway → ver `fraude-back/DEPLOY.md`.

## URLs de producción (referencia)

| Servicio | URL |
|----------|-----|
| Front | https://fraude-front.vercel.app |
| Login | https://fraude-front.vercel.app/login |
| API (backend) | https://fraude-back-production.up.railway.app |
| Swagger API | https://fraude-back-production.up.railway.app/swagger |

---

## Requisitos

- Node.js 20+ ([nvm-windows](https://github.com/coreybutler/nvm-windows) recomendado)
- pnpm (`npm install -g pnpm`) o npm
- Cuenta en [Vercel](https://vercel.com)
- Backend desplegado y accesible

---

## Desarrollo local

```powershell
cd D:\work\fraude-front

# Si node/pnpm no se reconocen:
. .\scripts\ensure-node.ps1

copy .env.example .env.local
# Edita .env.local:
# NEXT_PUBLIC_API_URL=http://localhost:8000

pnpm install
pnpm dev
```

Abre http://localhost:3000

Atajo:

```powershell
.\scripts\dev-up.ps1
```

---

## Primera vez en Vercel

### 1. Instalar CLI e iniciar sesión

```powershell
npm install -g vercel
cd D:\work\fraude-front
vercel login
```

### 2. Variables de entorno

Plantilla: **`.env.despligue`**

```env
NEXT_PUBLIC_API_URL=https://fraude-back-production.up.railway.app
```

> `NEXT_PUBLIC_*` se embebe en el build. Si cambias la URL del API, hay que **volver a desplegar**.

### 3. Desplegar

```powershell
.\scripts\vercel-deploy.ps1
```

El script:

1. Enlaza el proyecto `fraude-front` (si hace falta)
2. Sube variables de `.env.despligue` a Vercel (production)
3. Ejecuta `vercel deploy --prod`

Preview (sin producción):

```powershell
.\scripts\vercel-deploy.ps1 -Preview
```

---

## Despliegue manual (sin script)

```powershell
cd D:\work\fraude-front
vercel link --yes --project fraude-front
echo "https://fraude-back-production.up.railway.app" | vercel env add NEXT_PUBLIC_API_URL production --force
vercel deploy --prod --yes
```

---

## Configurar el backend (CORS + OAuth)

En **Railway** (`fraude-back`), variables:

```env
FRONTEND_URL=https://fraude-front.vercel.app
ALLOWED_ORIGINS=https://fraude-front.vercel.app
APP_ENV=production
```

Con `APP_ENV=production` el backend también acepta URLs preview de Vercel (`https://*.vercel.app`).

Redeploy del backend tras cambiar CORS:

```powershell
cd D:\work\fraude-back
railway redeploy --service fraude-back -y
```

---

## Google OAuth (flujo completo)

1. Usuario entra a https://fraude-front.vercel.app/login
2. Front llama al API → `/api/v1/gmail/auth/url`
3. Google redirige al **backend**:  
   `https://fraude-back-production.up.railway.app/api/v1/gmail/auth/callback`
4. Backend redirige al front:  
   `https://fraude-front.vercel.app/login?gmail=connected`

El redirect de Google debe estar configurado en el cliente OAuth **Web** (ver `fraude-back/DEPLOY.md`).

---

## Redeploy

```powershell
cd D:\work\fraude-front
.\scripts\vercel-deploy.ps1
```

Comandos útiles:

```powershell
vercel whoami
vercel env ls
vercel logs --prod
vercel inspect fraude-front.vercel.app
```

---

## Despliegue automático (push a `main`)

### Opción A — Recomendada: GitHub en Vercel (sin Actions)

1. Repo: `https://github.com/Dazaiyan/fraude-front`
2. [Vercel Dashboard](https://vercel.com) → **fraude-front** → **Settings → Git**
3. Conecta el repo y pon **Production Branch**: `main`
4. Variable en Vercel (una vez): `NEXT_PUBLIC_API_URL=https://fraude-back-production.up.railway.app`

Flujo: `git push origin main` → build y deploy en https://fraude-front.vercel.app

### Opción B — GitHub Actions

Archivo: `.github/workflows/deploy-vercel.yml`

Secrets en GitHub → **fraude-front** → **Settings → Secrets and variables → Actions**:

| Secret | Cómo obtenerlo |
|--------|----------------|
| `VERCEL_TOKEN` | [vercel.com/account/tokens](https://vercel.com/account/tokens) |
| `VERCEL_ORG_ID` | Tras `vercel link`: `.vercel/project.json` → `orgId` |
| `VERCEL_PROJECT_ID` | Tras `vercel link`: `.vercel/project.json` → `projectId` |

En la carpeta del front:

```powershell
cd D:\work\fraude-front
vercel link --yes --project fraude-front
Get-Content .vercel\project.json
```

Si usas **Opción A**, no hace falta el workflow.

---

## Verificar que funciona

1. Abre https://fraude-front.vercel.app/login (usa el alias, no la URL preview larga)
2. DevTools → Network: las peticiones deben ir a `fraude-back-production.up.railway.app`
3. No debe aparecer error CORS
4. **Conectar con Google** debe abrir la pantalla de Google (sin `redirect_uri_mismatch`)

Comprobar API desde terminal:

```powershell
Invoke-RestMethod https://fraude-back-production.up.railway.app/health
```

---

## Problemas frecuentes

### `node.exe` no se reconoce

```powershell
. .\scripts\ensure-node.ps1
node -v
```

Cierra y reabre Cursor si el PATH no se actualiza.

### CORS / `Network Error` en login

- Usa https://fraude-front.vercel.app (alias estable)
- Revisa `ALLOWED_ORIGINS` y `FRONTEND_URL` en Railway
- Confirma `NEXT_PUBLIC_API_URL` en Vercel apunta al backend correcto

### El front sigue llamando a `localhost:8000`

Variable no aplicada en build. Vuelve a desplegar:

```powershell
echo "https://fraude-back-production.up.railway.app" | vercel env add NEXT_PUBLIC_API_URL production --force
vercel deploy --prod --yes
```

### `redirect_uri_mismatch` en Google

Configura OAuth Web en Google Cloud con la URI del backend (ver `fraude-back/DEPLOY.md`).

### `favicon.ico` 404

Cosmético. Opcional: añadir `public/favicon.ico`.

---

## Archivos de despliegue

| Archivo | Uso |
|---------|-----|
| `.env.despligue` | Variables para Vercel (production) |
| `.env.example` | Plantilla local |
| `.env.local` | Desarrollo local (gitignored) |
| `scripts/vercel-deploy.ps1` | Deploy automatizado |
| `scripts/ensure-node.ps1` | Arreglar Node en la sesión Windows |
| `scripts/dev-up.ps1` | Dev local con deps |

---

## Stack

- Next.js 14 (Pages Router, TypeScript)
- Tailwind CSS, Axios, Recharts
- Build: `pnpm build` (Vercel lo ejecuta automáticamente)
