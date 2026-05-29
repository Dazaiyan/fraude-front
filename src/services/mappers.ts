import type { Claim } from "./claims"
import type { ScoringResponse, SiniestroBackend } from "@/types/backend"
import { normalizeScorePresentation, scoreColorToRiskLevel, scoreToColor } from "@/utils/scoring"

const RAMO_MAP: Record<string, Claim["line"]> = {
  Vehiculos: "Vehículos",
  Vehículos: "Vehículos",
  Salud: "Salud",
  Vida: "Vida",
  Incendios: "Incendios",
  Hogar: "Hogar",
}

const COLOR_MAP: Record<string, Claim["riskLevel"]> = {
  Verde: "low",
  Amarillo: "medium",
  Rojo: "high",
}

const ESTADO_MAP: Record<string, Claim["status"]> = {
  Reserva: "Pendiente",
  Pendiente: "Pendiente",
  "Pago Total": "Aprobado",
  Liquidado: "Aprobado",
  Negativa: "Rechazado",
  Investigación: "Investigación",
  Aprobado: "Aprobado",
  Rechazado: "Rechazado",
}

export function mapRamoToLine(ramo: string): Claim["line"] {
  return RAMO_MAP[ramo] ?? "Vehículos"
}

export function mapColorToLevel(color?: string): Claim["riskLevel"] {
  if (!color) return "low"
  return COLOR_MAP[color] ?? "low"
}

export function mapEstadoToStatus(estado: string): Claim["status"] {
  return ESTADO_MAP[estado] ?? "Pendiente"
}

export function mapLineToRamo(line: Claim["line"]): string {
  return line
}

export function mapStatusToEstado(status: Claim["status"]): string {
  const reverse: Record<string, string> = {
    Pendiente: "Reserva",
    Aprobado: "Liquidado",
    Rechazado: "Negativa",
    Investigación: "Investigación",
  }
  return reverse[status] ?? "Reserva"
}

export function mapSiniestroToClaim(s: SiniestroBackend): Claim {
  const score = s.total_score ?? 0
  const normalized = normalizeScorePresentation(score, s.score_color, s.score_band)

  const base: Claim = {
    id: s.id_siniestro,
    insuredName: s.beneficiario || s.id_asegurado,
    line: mapRamoToLine(s.ramo),
    reportDate: s.fecha_reporte,
    amount: Number(s.monto_reclamado),
    riskScore: normalized.total_score,
    riskLevel: normalized.riskLevel,
    policyNumber: s.id_poliza,
    beneficiaries: [s.beneficiario ? `${s.beneficiario} (Titular)` : `${s.id_asegurado} (Titular)`],
    narrative: s.descripcion,
    status: mapEstadoToStatus(s.estado),
    documents: [
      { name: "Póliza Vigente", uploaded: true },
      { name: "Documentación del siniestro", uploaded: s.documentos_completos },
    ],
    clarityScoreBreakdown: [],
    similarity: null,
    alerts: normalized.score_color === "Rojo" ? ["Alerta de riesgo crítico"] : normalized.score_color === "Amarillo" ? ["Alerta moderada"] : [],
    insuredId: s.id_asegurado,
    cobertura: s.cobertura,
    occurrenceDate: s.fecha_ocurrencia,
    estimatedAmount: Number(s.monto_estimado),
    paidAmount: Number(s.monto_pagado),
    branch: s.sucursal,
    documentsComplete: s.documentos_completos ? "Sí" : "No",
    daysSincePolicyStart: s.dias_desde_inicio_poliza,
    daysUntilPolicyEnd: s.dias_desde_fin_poliza,
    daysBetweenOccurrenceReport: s.dias_entre_ocurrencia_reporte,
    claimHistoryCount: s.historial_siniestros_asegurado,
    simulatedFraudLabel: s.etiqueta_fraude_simulada ? "Alta/Crítica" : "Baja",
    remitente_correo: s.remitente_correo,
    total_score: normalized.total_score,
    average_points: s.average_points,
    score_color: normalized.score_color,
    score_band: normalized.score_band,
    rules: s.rules,
  }

  if (s.rules && s.rules.length > 0) {
    return applyScoringToClaim(base, {
      id_siniestro: s.id_siniestro,
      total_score: s.total_score ?? 0,
      average_points: s.average_points ?? 0,
      score_color: s.score_color ?? "Verde",
      score_band: s.score_band ?? "Bajo",
      rules: s.rules,
      breakdown: s.breakdown ?? [],
      matched_rules: s.matched_rules ?? [],
      version: s.scoring_version ?? "",
      ai: s.ai,
      signals: s.signals,
    })
  }

  return base
}

export function applyScoringToClaim(claim: Claim, scoring: ScoringResponse): Claim {
  const normalized = normalizeScorePresentation(
    scoring.total_score,
    scoring.score_color,
    scoring.score_band,
  )
  const clarityScoreBreakdown = scoring.breakdown
    .filter((item) => item.matched && item.points > 0)
    .map((item) => ({ label: item.title, points: item.points }))

  const alerts = scoring.rules
    .filter((rule) => rule.matched && rule.points > 0)
    .map((rule) => `${rule.code}: ${rule.title}`)

  return {
    ...claim,
    riskScore: normalized.total_score,
    riskLevel: normalized.riskLevel,
    total_score: normalized.total_score,
    average_points: scoring.average_points,
    score_color: normalized.score_color,
    score_band: normalized.score_band,
    rules: scoring.rules,
    breakdown: scoring.rules,
    clarityScoreBreakdown: clarityScoreBreakdown.length > 0 ? clarityScoreBreakdown : claim.clarityScoreBreakdown,
    alerts: alerts.length > 0 ? alerts : claim.alerts,
    ai: scoring.ai
      ? {
          model: scoring.ai.model,
          summary: scoring.ai.summary,
          tools_called: scoring.ai.tools_called,
          signal_rationale: scoring.ai.signal_rationale,
        }
      : claim.ai,
    signals: scoring.signals,
  }
}

export interface NewClaimFormData {
  id: string
  policyNumber: string
  insuredId: string
  line: Claim["line"]
  cobertura: string
  occurrenceDate: string
  reportDate: string
  amount: number
  estimatedAmount: number
  paidAmount: number
  status: Claim["status"]
  branch: string
  narrative: string
  documentsComplete: string
  insuredName: string
  daysSincePolicyStart: number
  daysUntilPolicyEnd: number
  daysBetweenOccurrenceReport: number
  claimHistoryCount: number
  simulatedFraudLabel: string
}

export function mapClaimFormToCreatePayload(data: NewClaimFormData) {
  return {
    id_siniestro: data.id,
    id_poliza: data.policyNumber,
    id_asegurado: data.insuredId,
    ramo: mapLineToRamo(data.line),
    cobertura: data.cobertura,
    fecha_ocurrencia: data.occurrenceDate,
    fecha_reporte: data.reportDate,
    monto_reclamado: data.amount,
    monto_estimado: data.estimatedAmount,
    monto_pagado: data.paidAmount,
    estado: mapStatusToEstado(data.status),
    sucursal: data.branch,
    descripcion: data.narrative,
    documentos_completos: data.documentsComplete === "Sí",
    beneficiario: data.insuredName,
    dias_desde_inicio_poliza: data.daysSincePolicyStart,
    dias_desde_fin_poliza: data.daysUntilPolicyEnd,
    dias_entre_ocurrencia_reporte: data.daysBetweenOccurrenceReport,
    historial_siniestros_asegurado: data.claimHistoryCount,
    etiqueta_fraude_simulada: data.simulatedFraudLabel === "Alta/Crítica",
  }
}

export function normalizeClaimId(claimId: string): string {
  return claimId.split("|")[0].trim()
}

export function displayClaimId(claimId: string): string {
  return normalizeClaimId(claimId)
}

export function chatSessionId(claimId: string, scope: "case" | "global"): string {
  if (scope === "global") return "global"
  return `caso-${claimId.trim()}`.slice(0, 100)
}
