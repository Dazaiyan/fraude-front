import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import { Shield, ScanLine, RefreshCw, LogIn } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import type { GmailScanAuditSummary } from "@/types/backend"

function formatScanSummary(result: { saved: number; ignored: number; audits: GmailScanAuditSummary[] }) {
  const parts = [`${result.saved} correos nuevos · ${result.ignored} ignorados`]
  if (result.audits.length > 0) {
    parts.push(`${result.audits.length} siniestro${result.audits.length === 1 ? "" : "s"} auditado${result.audits.length === 1 ? "" : "s"} automáticamente`)
    const critical = result.audits.filter((audit) => audit.score_color === "Rojo").length
    if (critical > 0) {
      parts.push(`${critical} con riesgo alto`)
    }
  }
  return parts.join(" · ")
}

export default function LoginPage() {
  const router = useRouter()
  const { user, ready, scanning, gmailConnected, loginWithGmailScan, connectGmail } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [scanSummary, setScanSummary] = useState<string | null>(null)

  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/"

  useEffect(() => {
    if (!ready || !user) return
    router.replace(returnTo)
  }, [ready, user, router, returnTo])

  useEffect(() => {
    if (!ready || router.query.gmail !== "connected") return

    async function finishOAuthLogin() {
      setError(null)
      try {
        const result = await loginWithGmailScan()
        if (result.saved > 0 || result.ignored > 0 || result.audits.length > 0) {
          setScanSummary(formatScanSummary(result))
        }
        router.replace(returnTo)
      } catch (e) {
        setError(e instanceof Error ? e.message : "No se pudo completar el inicio de sesión.")
      }
    }

    finishOAuthLogin()
  }, [ready, router.query.gmail, loginWithGmailScan, returnTo, router])

  useEffect(() => {
    if (router.query.gmail === "error" && typeof router.query.message === "string") {
      setError(decodeURIComponent(router.query.message))
    }
  }, [router.query.gmail, router.query.message])

  const handleConnect = async (revokeExisting = false) => {
    setError(null)
    try {
      await connectGmail(returnTo, revokeExisting)
    } catch (e) {
      setError(e instanceof Error ? e.message : "No se pudo iniciar OAuth de Gmail.")
    }
  }

  const handleScan = async () => {
    setError(null)
    setScanSummary(null)
    try {
      const result = await loginWithGmailScan()
      if (result.saved > 0 || result.ignored > 0 || result.audits.length > 0) {
        setScanSummary(formatScanSummary(result))
      }
      router.replace(returnTo)
    } catch (e) {
      setError(e instanceof Error ? e.message : "Error al escanear Gmail.")
    }
  }

  if (!ready || user) {
    return (
      <div className="min-h-screen bg-brand-navy flex items-center justify-center text-white text-sm">
        Cargando sesión…
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-slate-100 flex items-center justify-center p-6">
      <div className="w-full max-w-md bg-white border border-slate-200 shadow-lg rounded-lg overflow-hidden">
        <div className="bg-brand-navy px-6 py-8 text-center text-white">
          <div className="w-14 h-14 mx-auto mb-4 bg-brand-blue flex items-center justify-center rounded-lg border border-brand-lightBlue/30">
            <Shield className="w-8 h-8 text-brand-lightBlue" />
          </div>
          <h1 className="text-lg font-black tracking-tight">ShieldMind AI</h1>
          <p className="text-[11px] text-brand-lightBlue font-semibold uppercase tracking-wider mt-1">
            Aseguradora del Sur
          </p>
        </div>

        <div className="p-6 space-y-4">
          <p className="text-xs text-slate-600 leading-relaxed text-center">
            {gmailConnected
              ? "Tu cuenta de Gmail ya está autorizada. Escanea la bandeja para ingresar al sistema."
              : "Primero autoriza tu cuenta de Gmail con Google OAuth. Luego se escanearán los correos y se abrirá tu sesión."}
          </p>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-md text-[11px] text-rose-700 font-semibold">
              {error}
            </div>
          )}

          {scanSummary && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md text-[11px] text-emerald-700 font-semibold">
              {scanSummary}
            </div>
          )}

          {!gmailConnected ? (
            <button
              type="button"
              onClick={() => handleConnect(false)}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue hover:bg-brand-navy disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-md transition-colors"
            >
              <LogIn className="w-4 h-4" />
              Conectar con Google
            </button>
          ) : (
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue hover:bg-brand-navy disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-wider rounded-md transition-colors"
            >
              {scanning ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Escaneando Gmail…
                </>
              ) : (
                <>
                  <ScanLine className="w-4 h-4" />
                  Escanear Gmail e ingresar
                </>
              )}
            </button>
          )}

          {gmailConnected && (
            <button
              type="button"
              onClick={() => handleConnect(true)}
            >
              Usar otra cuenta de Google
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
