import React, { useEffect, useRef, useState } from "react"
import { useRouter } from "next/router"
import { Shield, ScanLine, RefreshCw } from "lucide-react"
import GoogleIcon from "@/components/icons/GoogleIcon"
import GmailScanLoader from "@/components/auth/GmailScanLoader"
import LoginSessionLoader from "@/components/auth/LoginSessionLoader"
import { useAuth } from "@/context/AuthContext"
import { appUserFromGmailScan, saveUser } from "@/services/auth"
import type { GmailScanAuditSummary } from "@/types/backend"
import { safeReplace } from "@/utils/navigation"

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

function oauthEmailFromQuery(email: string | string[] | undefined): string | null {
  if (typeof email !== "string") return null
  try {
    return decodeURIComponent(email)
  } catch {
    return email
  }
}

export default function LoginPage() {
  const router = useRouter()
  const { user, ready, scanning, syncInFlight, gmailConnected, loginWithGmailScan, connectGmail } = useAuth()
  const [error, setError] = useState<string | null>(null)
  const [scanSummary, setScanSummary] = useState<string | null>(null)
  const [postOAuthBusy, setPostOAuthBusy] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)

  const returnTo = typeof router.query.returnTo === "string" ? router.query.returnTo : "/"
  const postLoginRedirectRef = useRef(false)
  const oauthEmail = oauthEmailFromQuery(router.query.email)
  const isOAuthReturn = router.query.gmail === "connected"
  const isScanningInbox = scanning || syncInFlight || postOAuthBusy || isOAuthReturn

  useEffect(() => {
    if (!ready || !user || postLoginRedirectRef.current || isScanningInbox) return
    postLoginRedirectRef.current = true
    safeReplace(router, returnTo)
  }, [ready, user, router, returnTo, isScanningInbox])

  useEffect(() => {
    if (!ready || !isOAuthReturn || postLoginRedirectRef.current) return

    async function finishOAuthLogin() {
      setPostOAuthBusy(true)
      setError(null)
      try {
        if (oauthEmail) {
          saveUser(
            appUserFromGmailScan({
              email: oauthEmail,
              name: oauthEmail.split("@")[0] ?? oauthEmail,
              role: "Analista de Fraude",
            })
          )
        }

        const result = await loginWithGmailScan()
        if (result.saved > 0 || result.ignored > 0 || result.audits.length > 0) {
          setScanSummary(formatScanSummary(result))
        }
        postLoginRedirectRef.current = true
        safeReplace(router, returnTo)
      } catch (e) {
        postLoginRedirectRef.current = false
        setPostOAuthBusy(false)
        safeReplace(router, `/login?returnTo=${encodeURIComponent(returnTo)}`)
        setError(e instanceof Error ? e.message : "No se pudo completar el inicio de sesión.")
      }
    }

    void finishOAuthLogin()
  }, [ready, isOAuthReturn, oauthEmail, loginWithGmailScan, returnTo, router])

  useEffect(() => {
    if (router.query.gmail === "error" && typeof router.query.message === "string") {
      setError(decodeURIComponent(router.query.message))
      setPostOAuthBusy(false)
    }
  }, [router.query.gmail, router.query.message])

  const handleConnect = async (revokeExisting = false) => {
    setError(null)
    setIsConnecting(true)
    try {
      await connectGmail(returnTo, revokeExisting)
      setIsConnecting(false)
    } catch (e) {
      setIsConnecting(false)
      setError(e instanceof Error ? e.message : "No se pudo iniciar OAuth de Gmail.")
    }
  }

  const handleScan = async () => {
    setError(null)
    setScanSummary(null)
    setPostOAuthBusy(true)
    try {
      const result = await loginWithGmailScan()
      if (result.saved > 0 || result.ignored > 0 || result.audits.length > 0) {
        setScanSummary(formatScanSummary(result))
      }
      postLoginRedirectRef.current = true
      safeReplace(router, returnTo)
    } catch (e) {
      setPostOAuthBusy(false)
      setError(e instanceof Error ? e.message : "Error al escanear Gmail.")
    }
  }

  if (!ready) {
    return <LoginSessionLoader />
  }

  if (isConnecting) {
    return <LoginSessionLoader message="Redirigiendo a Google…" />
  }

  if (isScanningInbox && !error) {
    return <GmailScanLoader email={oauthEmail ?? user?.email} />
  }

  if (user && !isScanningInbox) {
    return <LoginSessionLoader message="Abriendo bandeja de triaje…" />
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
              disabled={scanning || isConnecting}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white hover:bg-slate-50 disabled:bg-slate-100 disabled:opacity-60 text-slate-700 text-sm font-semibold border border-slate-300 rounded-md shadow-sm transition-colors"
            >
              <GoogleIcon className="w-5 h-5 shrink-0" />
              <span>Continuar con Google</span>
            </button>
          ) : (
            <button
              type="button"
              onClick={handleScan}
              disabled={scanning || postOAuthBusy}
              className="w-full flex items-center justify-center gap-2 py-3 bg-brand-blue hover:bg-brand-navy disabled:bg-slate-300 disabled:opacity-60 text-white text-xs font-black uppercase tracking-wider rounded-md transition-colors"
            >
              {scanning || postOAuthBusy ? (
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
              disabled={isConnecting}
              className="w-full flex items-center justify-center gap-2 py-2 text-[11px] font-semibold text-slate-500 hover:text-brand-blue disabled:opacity-50 transition-colors"
            >
              <GoogleIcon className="w-4 h-4 shrink-0" />
              Usar otra cuenta de Google
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
