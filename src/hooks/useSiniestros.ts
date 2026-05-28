import { useCallback, useEffect, useState } from "react"
import { useAuth } from "@/context/AuthContext"
import { claimsService, Claim } from "@/services/claims"
import type { ChatIndexStatusResponse, SiniestrosSummary } from "@/types/backend"

export function useSiniestros() {
  const { ready, user, syncInFlight, lastSyncAt } = useAuth()
  const [claims, setClaims] = useState<Claim[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [summary, setSummary] = useState<SiniestrosSummary | null>(null)
  const [indexStatus, setIndexStatus] = useState<ChatIndexStatusResponse | null>(null)

  const load = useCallback(async () => {
    if (!ready) return
    if (syncInFlight) return

    if (!user?.email) {
      setClaims([])
      setSummary(null)
      setIndexStatus(null)
      setError(null)
      setLoading(false)
      return
    }

    setLoading(true)
    setError(null)

    const fetchAll = async () => {
      const [claimsData, summaryData, indexData] = await Promise.all([
        claimsService.getClaims(),
        claimsService.getSummary(),
        claimsService.getIndexStatus(),
      ])
      setClaims(claimsData)
      setSummary(summaryData)
      setIndexStatus(indexData)
    }

    try {
      await fetchAll()
    } catch (e) {
      const message = e instanceof Error ? e.message : ""
      const isTransient = message === "Network Error" || message.includes("timeout")
      if (isTransient) {
        await new Promise((resolve) => setTimeout(resolve, 3000))
        try {
          await fetchAll()
          return
        } catch (retryError) {
          setError(retryError instanceof Error ? retryError.message : "Error al cargar siniestros")
          return
        }
      }
      setError(message || "Error al cargar siniestros")
    } finally {
      setLoading(false)
    }
  }, [ready, user?.email, syncInFlight])

  useEffect(() => {
    void load()
  }, [load])

  useEffect(() => {
    if (!lastSyncAt || syncInFlight) return
    const timer = window.setTimeout(() => {
      void load()
    }, 800)
    return () => window.clearTimeout(timer)
  }, [lastSyncAt, syncInFlight, load])

  const indexEmbeddings = useCallback(async () => {
    const result = await claimsService.indexEmbeddings()
    const status = await claimsService.getIndexStatus()
    if (status) setIndexStatus(status)
    return result
  }, [])

  return {
    claims,
    loading,
    error,
    summary,
    indexStatus,
    reload: load,
    indexEmbeddings,
  }
}
