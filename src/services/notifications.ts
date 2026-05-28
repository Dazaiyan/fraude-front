import api from "./api"
import { claimsService, Claim } from "./claims"
import { displayClaimId } from "./mappers"
import { scoreToColor } from "@/utils/scoring"

export type NotificationType = "critical" | "warning" | "info" | "success"

export interface AppNotification {
  id: string
  title: string
  desc: string
  time: string
  unread: boolean
  type: NotificationType
  claimId?: string
}

const READ_KEY = "shieldmind-read-notifications"

function loadReadIds(): Set<string> {
  if (typeof window === "undefined") return new Set()
  try {
    const raw = localStorage.getItem(READ_KEY)
    return raw ? new Set(JSON.parse(raw) as string[]) : new Set()
  } catch {
    return new Set()
  }
}

export function markNotificationRead(id: string): void {
  const ids = loadReadIds()
  ids.add(id)
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(ids)))
}

export function markAllNotificationsRead(ids: string[]): void {
  const current = loadReadIds()
  ids.forEach((id) => current.add(id))
  localStorage.setItem(READ_KEY, JSON.stringify(Array.from(current)))
}

function applyReadState(items: AppNotification[]): AppNotification[] {
  const readIds = loadReadIds()
  return items.map((item) => ({
    ...item,
    unread: item.unread && !readIds.has(item.id),
  }))
}

function formatRelativeDate(dateStr?: string): string {
  if (!dateStr) return "Reciente"
  const date = new Date(dateStr)
  if (Number.isNaN(date.getTime())) return "Reciente"

  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return "Ahora"
  if (diffMin < 60) return `Hace ${diffMin} minuto${diffMin === 1 ? "" : "s"}`
  const diffH = Math.floor(diffMin / 60)
  if (diffH < 24) return `Hace ${diffH} hora${diffH === 1 ? "" : "s"}`
  const diffD = Math.floor(diffH / 24)
  return `Hace ${diffD} día${diffD === 1 ? "" : "s"}`
}

function buildClaimNotifications(claims: Claim[]): AppNotification[] {
  const items: AppNotification[] = []

  for (const claim of claims) {
    const score = claim.total_score ?? claim.riskScore ?? 0
    const color = scoreToColor(score)
    const label = displayClaimId(claim.id)
    const name = claim.insuredName || claim.beneficiaries?.[0] || "Asegurado"
    const time = formatRelativeDate(claim.reportDate)

    if (color === "Rojo" || score >= 71) {
      items.push({
        id: `urgent-${claim.id}`,
        title: "Auditoría Urgente",
        desc: `El caso ${label} (${name}) superó el umbral de riesgo (${score} pts, ${color}). Requiere triaje manual.`,
        time,
        unread: true,
        type: "critical",
        claimId: claim.id,
      })
    }

    if (claim.similarity && claim.similarity.percentage >= 70) {
      items.push({
        id: `nlp-${claim.id}`,
        title: "Alerta de Coincidencia NLP",
        desc: `Similitud narrativa del ${claim.similarity.percentage}% detectada en ${label} vs caso ${claim.similarity.matchedCaseId}.`,
        time,
        unread: true,
        type: "warning",
        claimId: claim.id,
      })
    }

    if ((claim.daysSincePolicyStart ?? 999) <= 7) {
      items.push({
        id: `vigencia-${claim.id}`,
        title: "Vigencia Corta de Póliza",
        desc: `El siniestro ${label} fue reportado a solo ${claim.daysSincePolicyStart} días de activarse la póliza.`,
        time,
        unread: true,
        type: "warning",
        claimId: claim.id,
      })
    }

    if (claim.ai?.summary && (color === "Rojo" || score >= 36)) {
      items.push({
        id: `audit-${claim.id}`,
        title: "Auditoría IA completada",
        desc: `${label}: ${claim.ai.summary.slice(0, 140)}${claim.ai.summary.length > 140 ? "…" : ""}`,
        time,
        unread: true,
        type: color === "Rojo" ? "critical" : "warning",
        claimId: claim.id,
      })
    } else if (claim.alerts?.some((a) => /restrictiv|nlp|sospech/i.test(a)) && color !== "Rojo") {
      items.push({
        id: `alert-${claim.id}`,
        title: "Alerta de Integridad",
        desc: `${label}: ${claim.alerts.join(", ")}.`,
        time,
        unread: true,
        type: "warning",
        claimId: claim.id,
      })
    }
  }

  return items
}

const FALLBACK_NOTIFICATIONS: AppNotification[] = [
  {
    id: "demo-urgent",
    title: "Auditoría Urgente",
    desc: "El caso de Alejandro Mendoza superó el umbral ético (85 pts). Requiere triaje manual inmediato.",
    time: "Hace 5 minutos",
    unread: true,
    type: "critical",
    claimId: "SHM-8924",
  },
  {
    id: "demo-nlp",
    title: "Alerta de Coincidencia NLP",
    desc: "Similitud narrativa del 94% detectada contra el reporte histórico delictivo SHM-1120.",
    time: "Hace 15 minutos",
    unread: true,
    type: "warning",
    claimId: "SHM-8924",
  },
]

export async function fetchNotifications(): Promise<AppNotification[]> {
  const items: AppNotification[] = []

  try {
    await api.get("/health", { timeout: 15000 })
    items.push({
      id: "system-health",
      title: "Servidor AI Core Activo",
      desc: "ShieldMind FastAPI conectado. Chat RAG y scoring disponibles.",
      time: "Ahora",
      unread: false,
      type: "success",
    })
  } catch {
    items.push({
      id: "system-offline",
      title: "Backend no disponible",
      desc: "No se pudo conectar con el API en localhost:8000. Mostrando datos de demostración.",
      time: "Ahora",
      unread: true,
      type: "critical",
    })
    return applyReadState([...FALLBACK_NOTIFICATIONS, ...items])
  }

  try {
    const claims = await claimsService.getClaims()
    const claimAlerts = buildClaimNotifications(claims)

    if (claimAlerts.length === 0 && claims.length > 0) {
      items.push({
        id: "system-ok",
        title: "Bandeja sin alertas críticas",
        desc: `${claims.length} siniestros en revisión sin umbral rojo activo.`,
        time: "Ahora",
        unread: false,
        type: "info",
      })
    } else {
      items.push(...claimAlerts)
    }
  } catch {
    items.push(...FALLBACK_NOTIFICATIONS)
  }

  items.sort((a, b) => {
    const priority = { critical: 0, warning: 1, info: 2, success: 3 }
    return priority[a.type] - priority[b.type]
  })

  return applyReadState(items)
}
