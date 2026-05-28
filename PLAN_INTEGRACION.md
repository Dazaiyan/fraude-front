# Plan de Integración: fraude-front ↔ fraude-back

> Leer este documento antes de implementar con Codex.  
> Cada tarea tiene contexto, archivos afectados y resultado esperado.

---

## Estado actual

### Backend (`fraude-back`) — lo que YA existe
| Prefijo | Endpoints disponibles |
|---------|----------------------|
| `/api/v1/siniestros` | `GET /`, `GET /{id}`, `POST /{id}/score`, `POST /{id}/score/ai` |
| `/api/v1/gmail` | `GET /config`, `POST /watch/register`, `POST /scan`, `GET /correos` |
| `/api/v1/chat` | `POST /query`, `POST /index`, `GET /index/status`, `DELETE /session/{id}` |
| `/api/v1/webhooks` | `POST /gmail/push` |
| `/health` | `GET /` |

### Frontend (`fraude-front`) — lo que YA existe
| Página | Ruta | Estado |
|--------|------|--------|
| Dashboard (triaje) | `/` | Funciona con mocks |
| Detalle caso | `/caso/[id]` | Funciona con mocks |
| Copiloto AI | `/copiloto` | Funciona con respuestas simuladas |
| Reportar siniestro | `/reportar` | Funciona con mocks |
| Preview correo | `/preview-correo` | Funciona con mocks |

### Problema central
Los endpoints del frontend **no coinciden** con el backend real:

| Frontend llama | Backend real | Brecha |
|----------------|-------------|--------|
| `GET /claims` | `GET /api/v1/siniestros` | ruta + esquema distintos |
| `GET /claims/{id}` | `GET /api/v1/siniestros/{id_siniestro}` | id en backend es `id_siniestro` |
| `POST /claims` | No existe | ❌ Falta endpoint en backend |
| `POST /claims/{id}/send-email` | No existe | ❌ Falta endpoint en backend |
| `POST /chat` body `{claimId,text,scope}` | `POST /api/v1/chat/query` body `{question,session_id,k}` | estructura distinta |
| `POST /claims/ingest-email` | `POST /api/v1/gmail/scan` | diferente |

---

## Tareas de Backend (fraude-back)

### TAREA B-1: Habilitar CORS para el frontend

**Archivo:** `app/main.py`

**Qué hacer:** Agregar `CORSMiddleware` con `allow_origins=["http://localhost:3000", env.ALLOWED_ORIGINS]`.

**Variable nueva en `.env`:**
```env
ALLOWED_ORIGINS=http://localhost:3000
```

**Config:** agregar `allowed_origins: str = "http://localhost:3000"` en `Settings`.

---

### TAREA B-2: Endpoint `GET /api/v1/siniestros` → incluir score calculado

**Archivo:** `app/api/v1/endpoints/siniestros.py`

**Problema actual:** `GET /api/v1/siniestros` devuelve solo los campos del modelo ORM.  
El frontend espera `riskScore`, `riskLevel`, `score_color`, `score_band`.

**Qué hacer:** Agregar campo `score_summary` en la respuesta del listado. Puede calcularse al vuelo con `FraudScoringService` sin señales AI (llamada rápida de reglas).

**Schema nuevo:** `SiniestroWithScoreRead` (extiende `SiniestroRead` agregando `score_color`, `score_band`, `total_score`).

---

### TAREA B-3: Endpoint `POST /api/v1/siniestros` (crear siniestro manual)

**Archivo:** `app/api/v1/endpoints/siniestros.py`

**Para qué:** Página `/reportar` del frontend necesita crear siniestros desde formulario.

**Body esperado:**
```json
{
  "id_siniestro": "...",
  "id_poliza": "...",
  "id_asegurado": "...",
  "ramo": "Vehículos",
  "cobertura": "Choque",
  "fecha_ocurrencia": "2026-05-01",
  "fecha_reporte": "2026-05-03",
  "monto_reclamado": 5000,
  "monto_estimado": 4800,
  "estado": "Reserva",
  "sucursal": "Guayaquil",
  "descripcion": "Relato del siniestro...",
  "documentos_completos": false,
  "beneficiario": "Taller ABC",
  "dias_desde_inicio_poliza": 120,
  "dias_desde_fin_poliza": 245,
  "dias_entre_ocurrencia_reporte": 2,
  "historial_siniestros_asegurado": 0
}
```

**Response:** `SiniestroRead` + triggerea indexación de embedding.

**Schema nuevo:** `SiniestroCreate` (Pydantic).

---

### TAREA B-4: Endpoint `GET /api/v1/siniestros/summary` (estadísticas para dashboard)

**Archivo:** `app/api/v1/endpoints/siniestros.py`

**Para qué:** El dashboard del frontend necesita conteos de alto/medio/bajo riesgo.

**Response:**
```json
{
  "total": 100,
  "by_color": { "Rojo": 12, "Amarillo": 34, "Verde": 54 },
  "by_ramo": { "Vehículos": 60, "Salud": 20, ... },
  "pending_indexing": 5
}
```

---

### TAREA B-5: Endpoint `GET /api/v1/chat/sessions` (listar sesiones)

**Archivo:** `app/api/v1/endpoints/chat.py`

**Para qué:** Mostrar historial de sesiones de chat en el copiloto.

| Método | Ruta | Descripción |
|--------|------|-------------|
| `GET` | `/api/v1/chat/sessions` | Lista sesiones con última actividad |
| `GET` | `/api/v1/chat/session/{session_id}/messages` | Historial de mensajes de una sesión |

---

## Tareas de Frontend (fraude-front)

### TAREA F-1: Crear `.env.local` y `.env.example`

**Archivo nuevo:** `fraude-front/.env.example`

```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

### TAREA F-2: Adaptar capa de servicios a las rutas reales del backend

**Archivo:** `src/services/claims.ts`

**Mapa de cambios en `claimsService`:**

| Método actual | Cambio |
|--------------|--------|
| `getClaims()` → `GET /claims` | → `GET /api/v1/siniestros` + mapear respuesta |
| `getClaimById(id)` → `GET /claims/{id}` | → `GET /api/v1/siniestros/{id}` + mapear |
| `postNewClaim(data)` → `POST /claims` | → `POST /api/v1/siniestros` + mapear body |
| `sendMessageToAgent()` → `POST /chat` | → `POST /api/v1/chat/query` con `{question, session_id, k}` |
| `sendClaimEmail()` → `POST /claims/{id}/send-email` | Deshabilitado o redirigir a `/api/v1/gmail/scan` |
| `ingestClaimEmail()` → `POST /claims/ingest-email` | → `POST /api/v1/gmail/scan` |

**Función de mapeo backend → frontend** (`mapSiniestroToCliam`):

```typescript
// backend Siniestro → frontend Claim
function mapSiniestroToClaim(s: SiniestroBackend): Claim {
  return {
    id: s.id_siniestro,
    insuredName: s.id_asegurado,        // fallback hasta tener tabla asegurados
    line: mapRamoToLine(s.ramo),
    reportDate: s.fecha_reporte,
    amount: Number(s.monto_reclamado),
    riskScore: s.total_score ?? 0,
    riskLevel: mapColorToLevel(s.score_color),
    policyNumber: s.id_poliza,
    narrative: s.descripcion,
    status: mapEstadoToStatus(s.estado),
    // ... resto de campos
  }
}
```

---

### TAREA F-3: Adaptar el copiloto a `/api/v1/chat/query`

**Archivos:** `src/services/claims.ts` (método `sendMessageToAgent`), `src/pages/copiloto.tsx`, `src/components/chatbot/CopilotChat.tsx`

**Cambio en `sendMessageToAgent`:**

```typescript
// Antes:
api.post("/chat", { claimId, text, scope })

// Después:
api.post("/api/v1/chat/query", {
  question: text,
  session_id: scope === "global" ? "global" : `caso-${claimId}`,
  k: 8
})
```

**Mapeo de respuesta:**
```typescript
// backend responde:
{ answer: string, sources: ChatSource[], session_id: string, model: string }
// frontend espera:
{ sender: "ai", text: string, timestamp: string }
```

---

### TAREA F-4: Integrar scoring real en detalle de caso

**Archivo:** `src/pages/caso/[id].tsx`

**Qué agregar:**  
Botón "Calcular score" que llame a:
- `POST /api/v1/siniestros/{id}/score` → scoring por reglas
- `POST /api/v1/siniestros/{id}/score/ai` → scoring con IA + OpenAI

**Mostrar en `ClarityCard`:** reglas activadas, puntos, color del semáforo, resumen IA.

**Nuevo hook o función:**
```typescript
async function fetchScore(id: string, useAI: boolean): Promise<ScoreResponse>
```

---

### TAREA F-5: Página `/reportar` conectada al backend

**Archivo:** `src/pages/reportar.tsx`

**Cambio:**  
`postNewClaim()` debe enviar al body exacto que espera `POST /api/v1/siniestros` (Tarea B-3).  
Mapear los campos del formulario actual a `SiniestroCreate`.

---

### TAREA F-6: Agregar tipos TypeScript del backend

**Archivo nuevo:** `src/types/backend.ts`

Tipos que reflejen los schemas de Pydantic del backend:

```typescript
export interface SiniestroBackend {
  id_siniestro: string
  id_poliza: string
  id_asegurado: string
  ramo: string
  cobertura: string
  fecha_ocurrencia: string
  fecha_reporte: string
  monto_reclamado: string | number
  monto_estimado: string | number
  monto_pagado: string | number
  estado: string
  sucursal: string
  descripcion: string
  documentos_completos: boolean
  beneficiario: string
  dias_desde_inicio_poliza: number
  dias_desde_fin_poliza: number
  dias_entre_ocurrencia_reporte: number
  historial_siniestros_asegurado: number
  etiqueta_fraude_simulada: boolean
  // scoring (cuando viene enriquecido)
  total_score?: number
  score_color?: string
  score_band?: string
}

export interface ScoringResponse {
  id_siniestro: string
  total_score: number
  average_points: number
  score_color: "Verde" | "Amarillo" | "Rojo"
  score_band: "Bajo" | "Medio" | "Alto"
  rules: RuleResult[]
  breakdown: BreakdownItem[]
  matched_rules: string[]
  version: string
  ai?: AIScoringExplanation
}

export interface ChatQueryRequest {
  question: string
  session_id: string
  k?: number
}

export interface ChatQueryResponse {
  answer: string
  session_id: string
  model: string
  sources: ChatSource[]
}

export interface ChatSource {
  id_siniestro: string
  ramo: string
  cobertura: string
  estado: string
  similarity: number
}
```

---

### TAREA F-7: Agregar hook `useSiniestros` y `useChatQuery`

**Archivo nuevo:** `src/hooks/useSiniestros.ts`

```typescript
export function useSiniestros() {
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  // ...fetch + retry + fallback mock
}
```

**Archivo nuevo:** `src/hooks/useChatQuery.ts`

```typescript
export function useChatQuery(sessionId: string) {
  const sendMessage = async (question: string, k?: number)
  const clearSession = async ()
  // ...
}
```

---

### TAREA F-8: Indicadores de estado en el Dashboard (datos reales)

**Archivo:** `src/pages/index.tsx`

**Qué agregar:**
- Conteos Verde/Amarillo/Rojo calculados de la data real (no hardcodeados)
- Badge de "Pendientes de indexar embeddings" usando `GET /api/v1/chat/index/status`
- Botón "Indexar ahora" que llame a `POST /api/v1/chat/index`

---

## Archivos nuevos a crear (resumen)

```
fraude-front/
├── .env.example                         F-1
├── src/
│   ├── types/
│   │   └── backend.ts                   F-6
│   ├── hooks/
│   │   ├── useSiniestros.ts             F-7
│   │   └── useChatQuery.ts              F-7
│   └── services/
│       └── claims.ts    (modificar)     F-2, F-3
```

```
fraude-back/
├── app/
│   ├── main.py                (modificar)   B-1
│   ├── schemas/
│   │   └── siniestro.py       (modificar)   B-2, B-3
│   └── api/v1/endpoints/
│       ├── siniestros.py      (modificar)   B-2, B-3, B-4
│       └── chat.py            (modificar)   B-5
```

---

## Orden de implementación recomendado para Codex

```
1. B-1  CORS en backend
2. F-1  .env.example en frontend
3. F-6  Tipos TypeScript del backend
4. B-3  POST /api/v1/siniestros (crear siniestro)
5. B-2  GET /api/v1/siniestros incluye score básico
6. F-2  Adaptar claims.ts a rutas reales + mappers
7. F-7  Hooks useSiniestros + useChatQuery
8. F-3  Copiloto → /api/v1/chat/query
9. F-4  Scoring real en detalle de caso
10. F-5  Reportar conectado a backend
11. B-4  GET /api/v1/siniestros/summary
12. F-8  Dashboard con datos reales + estado embeddings
13. B-5  Sesiones de chat en API
```

---

## Notas clave para Codex

### Mapeo `ramo` (backend) → `line` (frontend)
```typescript
const RAMO_MAP: Record<string, Claim["line"]> = {
  "Vehiculos": "Vehículos",
  "Vehículos": "Vehículos",
  "Salud": "Salud",
  "Vida": "Vida",
  "Incendios": "Incendios",
  "Hogar": "Hogar",
}
```

### Mapeo `score_color` → `riskLevel`
```typescript
const COLOR_MAP: Record<string, Claim["riskLevel"]> = {
  "Verde": "low",
  "Amarillo": "medium",
  "Rojo": "high",
}
```

### Mapeo `estado` → `status`
```typescript
const ESTADO_MAP: Record<string, Claim["status"]> = {
  "Reserva": "Pendiente",
  "Pago Total": "Aprobado",
  "Negativa": "Rechazado",
  "Liquidado": "Aprobado",
}
```

### Estrategia fallback (mantener mocks)
- Cada servicio sigue el patrón: `try { real API } catch { fallback mock }`
- El frontend siempre funciona para demo aunque el backend esté caído.

### CORS: orígenes permitidos
- Desarrollo: `http://localhost:3000`
- Si hay deploy: agregar la URL pública en `ALLOWED_ORIGINS`

### session_id del chat
- Copiloto por caso: `caso-{id_siniestro}` (ej: `caso-SIN-001`)
- Copiloto global: `global`
- El frontend puede persistir el `session_id` en `localStorage` para mantener historial entre recargas.
