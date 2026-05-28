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
  gmail_correo_id?: number | null
  total_score?: number
  average_points?: number
  score_color?: string
  score_band?: string
  rules?: RuleResult[]
  breakdown?: BreakdownItem[]
  matched_rules?: string[]
  scoring_version?: string
  ai?: AIScoringExplanation
  signals?: Record<string, boolean>
  scoring_audited_at?: string | null
}

export interface RuleResult {
  code: string
  title: string
  classification: string
  matched: boolean
  points: number
  reason: string
}

export interface BreakdownItem {
  code: string
  title: string
  matched: boolean
  points: number
  running_total: number
  percent_of_total: number
  reason: string
}

export interface AIScoringExplanation {
  model: string
  summary: string
  tools_called: string[]
  signal_rationale: Record<string, string>
}

export interface ScoringResponse {
  id_siniestro: string
  total_score: number
  average_points: number
  score_color: "Verde" | "Amarillo" | "Rojo" | string
  score_band: "Bajo" | "Medio" | "Alto" | string
  rules: RuleResult[]
  breakdown: BreakdownItem[]
  matched_rules: string[]
  version: string
  ai?: AIScoringExplanation
  signals?: Record<string, boolean>
}

export interface SiniestrosSummary {
  total: number
  by_color: Record<string, number>
  by_ramo: Record<string, number>
  pending_indexing: number
}

export interface ChatQueryRequest {
  question: string
  session_id: string
  id_siniestro?: string | null
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

export interface ChatIndexStatusResponse {
  total: number
  indexed: number
  pending: number
}

export interface ChatIndexResponse {
  indexed: number
  skipped: number
}

export interface ChatSessionRead {
  session_id: string
  created_at: string
  updated_at: string
  message_count: number
}

export interface ChatMessageRead {
  role: string
  content: string
  created_at: string
}

export interface GmailScanUser {
  email: string
  name: string
  role: string
}

export interface GmailScanAuditSummary {
  id_siniestro: string
  total_score: number
  score_color: string
  score_band: string
  summary: string
}

export interface GmailScanResponse {
  saved: number
  ignored: number
  user: GmailScanUser
  audits?: GmailScanAuditSummary[]
}

export interface GmailAuthStatus {
  credentials_configured: boolean
  token_configured: boolean
  connected: boolean
  redirect_uri: string
  user: GmailScanUser | null
}

export interface GmailAuthUrlResponse {
  authorization_url: string
  state: string
}

export interface GmailCorreoRead {
  id: number
  gmail_message_id: string
  thread_id?: string | null
  remitente: string
  asunto: string
  descripcion: string
  adjunto_nombre?: string | null
  adjunto_ruta?: string | null
  tiene_adjunto: boolean
  fecha_correo?: string | null
  palabra_clave_detectada?: string | null
  owner_email?: string | null
  fecha_registro: string
}
