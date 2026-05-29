import React, { useCallback, useEffect, useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { useAuth } from "@/context/AuthContext"
import { listGmailCorreos, processCorreoToBandeja } from "@/services/gmail"
import type { GmailCorreoRead } from "@/types/backend"
import { Mail, Paperclip, RefreshCw, Send } from "lucide-react"
import Link from "next/link"
import { CorreosTableSkeleton } from "@/components/ui/Skeleton"

function formatDate(value?: string | null): string {
  if (!value) return "—"
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString("es-EC", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  })
}

export default function CorreosPage() {
  const { ready, user, scanning, syncInFlight, syncGmailInbox, lastSyncAt } = useAuth()
  const [correos, setCorreos] = useState<GmailCorreoRead[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [processingId, setProcessingId] = useState<number | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)

  const [syncSummary, setSyncSummary] = useState<string | null>(null)

  const loadFromDb = useCallback(async () => {
    const data = await listGmailCorreos(200)
    setCorreos(data)
  }, [])

  const load = useCallback(async () => {
    if (!ready || !user?.email) {
      setCorreos([])
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    setSyncSummary(null)
    try {
      const result = await syncGmailInbox()
      if (result.saved > 0 || result.audits.length > 0) {
        const parts: string[] = []
        if (result.saved > 0) parts.push(`${result.saved} correo(s) nuevo(s)`)
        if (result.audits.length > 0) {
          parts.push(`${result.audits.length} siniestro(s) auditado(s)`)
        }
        setSyncSummary(parts.join(" · "))
      }
      await loadFromDb()
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudieron sincronizar los correos.")
      try {
        await loadFromDb()
      } catch {
        // ignore secondary failure
      }
    } finally {
      setLoading(false)
    }
  }, [ready, user?.email, syncGmailInbox, loadFromDb])

  useEffect(() => {
    if (!ready || !user?.email) {
      setCorreos([])
      setLoading(false)
      return
    }
    if (syncInFlight) return

    setLoading(true)
    setError(null)
    loadFromDb()
      .catch((e) => setError(e instanceof Error ? e.message : "No se pudieron cargar los correos."))
      .finally(() => setLoading(false))
  }, [ready, user?.email, syncInFlight, loadFromDb])

  useEffect(() => {
    if (!lastSyncAt || syncInFlight) return
    void loadFromDb()
  }, [lastSyncAt, syncInFlight, loadFromDb])

  const handleProcess = async (correo: GmailCorreoRead) => {
    setProcessingId(correo.id)
    setError(null)
    setSuccessMsg(null)
    try {
      const result = await processCorreoToBandeja(correo.id)
      if (result.processed > 0) {
        setSuccessMsg(
          `${result.processed} siniestro(s) creado(s) y auditado(s). Revisa la bandeja de entrada.`
        )
      } else {
        setSuccessMsg("El PDF ya fue procesado o no contiene siniestros nuevos.")
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo procesar el correo.")
    } finally {
      setProcessingId(null)
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Header
          title="Correos Gmail"
          subtitle={
            user?.email
              ? `Correos escaneados de ${user.email} con palabras clave de siniestros`
              : "Bandeja de correos ingestados desde Gmail"
          }
        />

        <div className="flex-1 p-6 md:p-8 pb-24 lg:pb-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex items-center justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-brand-navy flex items-center gap-2">
                <Mail className="w-5 h-5 text-brand-blue" />
                Correos detectados
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {correos.length} correo(s) asociados a tu cuenta de analista
              </p>
            </div>

            <button
              type="button"
              onClick={load}
              disabled={loading || scanning}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 rounded-md text-xs font-bold text-brand-navy hover:bg-slate-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${loading || scanning ? "animate-spin" : ""}`} />
              {loading || scanning ? "Sincronizando Gmail…" : "Sincronizar Gmail"}
            </button>
          </div>

          {syncSummary && (
            <div className="p-4 bg-sky-50 border border-sky-200 rounded-md text-xs text-sky-800 font-semibold">
              {syncSummary}
            </div>
          )}

          {successMsg && (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-md text-xs text-emerald-800 font-semibold flex items-center justify-between gap-3">
              <span>{successMsg}</span>
              <Link href="/" className="text-brand-blue font-bold underline whitespace-nowrap">
                Ir a bandeja
              </Link>
            </div>
          )}

          {error && (
            <div className="p-4 bg-rose-50 border border-rose-200 rounded-md text-xs text-rose-700 font-semibold">
              {error}
            </div>
          )}

          <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-sm">
            {loading ? (
              <CorreosTableSkeleton rows={6} />
            ) : correos.length === 0 ? (
              <div className="p-10 text-center text-sm text-slate-500 space-y-2">
                <p>No hay correos tuyos en la base de datos.</p>
                <p className="text-xs">Escanea Gmail desde el login para importar mensajes con palabras clave.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
                    <tr>
                      <th className="px-4 py-3 font-bold">Fecha</th>
                      <th className="px-4 py-3 font-bold">Remitente</th>
                      <th className="px-4 py-3 font-bold">Asunto</th>
                      <th className="px-4 py-3 font-bold">Palabra clave</th>
                      <th className="px-4 py-3 font-bold">Adjunto</th>
                      <th className="px-4 py-3 font-bold">Acción</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {correos.map((correo) => (
                      <tr key={correo.id} className="hover:bg-slate-50/80">
                        <td className="px-4 py-3 whitespace-nowrap text-slate-600">
                          {formatDate(correo.fecha_correo || correo.fecha_registro)}
                        </td>
                        <td className="px-4 py-3 text-slate-700 max-w-[220px] truncate" title={correo.remitente}>
                          {correo.remitente}
                        </td>
                        <td className="px-4 py-3 text-brand-navy font-semibold max-w-[320px] truncate" title={correo.asunto}>
                          {correo.asunto}
                        </td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded bg-brand-blue/10 text-brand-blue font-bold text-[10px] uppercase">
                            {correo.palabra_clave_detectada || "—"}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-slate-600">
                          {correo.tiene_adjunto ? (
                            <span className="inline-flex items-center gap-1">
                              <Paperclip className="w-3.5 h-3.5" />
                              {correo.adjunto_nombre || "Sí"}
                            </span>
                          ) : (
                            "No"
                          )}
                        </td>
                        <td className="px-4 py-3">
                          {correo.tiene_adjunto ? (
                            <button
                              type="button"
                              onClick={() => handleProcess(correo)}
                              disabled={processingId === correo.id}
                              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-brand-blue text-white rounded-md text-[10px] font-bold uppercase tracking-wider hover:bg-brand-navy disabled:opacity-50"
                            >
                              {processingId === correo.id ? (
                                <RefreshCw className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3" />
                              )}
                              A bandeja
                            </button>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  )
}
