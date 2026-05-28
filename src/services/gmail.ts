import api from "./api"
import { appUserFromGmailScan, type AppUser } from "./auth"
import type { GmailAuthStatus, GmailAuthUrlResponse, GmailCorreoRead, GmailScanAuditSummary, GmailScanResponse } from "@/types/backend"

function extractApiError(error: unknown): string {
  const axiosError = error as {
    response?: { data?: { detail?: string | { msg?: string }[] }; status?: number }
    message?: string
  }
  const detail = axiosError.response?.data?.detail
  if (typeof detail === "string") return detail
  if (Array.isArray(detail) && detail[0]?.msg) return detail[0].msg
  if (axiosError.message === "Network Error") {
    return "No se pudo contactar al backend en localhost:8000."
  }
  return axiosError.message || "Error desconocido al conectar Gmail."
}

export async function getGmailAuthStatus(): Promise<GmailAuthStatus> {
  const response = await api.get<GmailAuthStatus>("/api/v1/gmail/auth/status", {
    timeout: 8000,
  })
  return response.data
}

export async function startGmailOAuth(returnTo: string): Promise<string> {
  const response = await api.get<GmailAuthUrlResponse>("/api/v1/gmail/auth/url", {
    params: { return_to: returnTo },
  })
  return response.data.authorization_url
}

export async function clearGmailToken(): Promise<void> {
  await api.post("/api/v1/gmail/auth/logout")
}

export async function listGmailCorreos(limit = 100): Promise<GmailCorreoRead[]> {
  const response = await api.get<GmailCorreoRead[]>("/api/v1/gmail/correos", {
    params: { limit },
  })
  return response.data
}

export async function processCorreoToBandeja(correoId: number): Promise<{
  correo_id: number
  processed: number
  audits: GmailScanAuditSummary[]
}> {
  const response = await api.post<{
    correo_id: number
    processed: number
    audits: GmailScanAuditSummary[]
  }>(`/api/v1/gmail/correos/${correoId}/procesar`, {}, { timeout: 180000 })
  return response.data
}

export async function scanGmailAndGetUser(): Promise<{
  user: AppUser
  saved: number
  ignored: number
  audits: GmailScanAuditSummary[]
}> {
  try {
    const response = await api.post<GmailScanResponse>("/api/v1/gmail/scan", {}, { timeout: 180000 })
    if (!response.data?.user?.email) {
      throw new Error("El backend respondió sin datos de usuario tras el escaneo.")
    }
    return {
      user: appUserFromGmailScan(response.data.user),
      saved: response.data.saved ?? 0,
      ignored: response.data.ignored ?? 0,
      audits: response.data.audits ?? [],
    }
  } catch (error) {
    const axiosError = error as { response?: { status?: number } }
    if (axiosError.response?.status === 401) {
      throw new Error("AUTH_REQUIRED")
    }
    throw new Error(extractApiError(error))
  }
}
