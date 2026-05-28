import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react"
import { AppUser, clearUser, loadStoredUser, saveUser } from "@/services/auth"
import {
  clearGmailToken,
  getGmailAuthStatus,
  scanGmailAndGetUser,
  startGmailOAuth,
} from "@/services/gmail"
import type { GmailScanAuditSummary } from "@/types/backend"

type SyncResult = { saved: number; ignored: number; audits: GmailScanAuditSummary[] }

interface AuthContextValue {
  user: AppUser | null
  ready: boolean
  scanning: boolean
  syncInFlight: boolean
  gmailConnected: boolean
  lastSyncAt: number | null
  lastSyncResult: SyncResult | null
  loginWithGmailScan: () => Promise<SyncResult>
  syncGmailInbox: (options?: { silent?: boolean }) => Promise<SyncResult>
  connectGmail: (returnTo?: string, revokeExisting?: boolean) => Promise<void>
  logout: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

const BACKGROUND_SYNC_INTERVAL_MS = 180000
const MIN_BACKGROUND_SYNC_GAP_MS = 120000
const GMAIL_STATUS_CACHE_MS = 120000

let moduleLastBackgroundSyncAt = 0

function readGmailStatusCache(): boolean | null {
  if (typeof window === "undefined") return null
  try {
    const raw = sessionStorage.getItem("shieldmind_gmail_status")
    if (!raw) return null
    const parsed = JSON.parse(raw) as { connected: boolean; at: number }
    if (Date.now() - parsed.at > GMAIL_STATUS_CACHE_MS) return null
    return parsed.connected
  } catch {
    return null
  }
}

function writeGmailStatusCache(connected: boolean): void {
  if (typeof window === "undefined") return
  sessionStorage.setItem(
    "shieldmind_gmail_status",
    JSON.stringify({ connected, at: Date.now() })
  )
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AppUser | null>(null)
  const [ready, setReady] = useState(false)
  const [scanning, setScanning] = useState(false)
  const [syncInFlight, setSyncInFlight] = useState(false)
  const [gmailConnected, setGmailConnected] = useState(false)
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null)
  const [lastSyncResult, setLastSyncResult] = useState<SyncResult | null>(null)

  const syncInFlightRef = useRef<Promise<SyncResult> | null>(null)
  const mountedRef = useRef(true)
  const lastBackgroundSyncAtRef = useRef(moduleLastBackgroundSyncAt)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const refreshGmailStatus = useCallback(async () => {
    const cached = readGmailStatusCache()
    if (cached !== null) {
      setGmailConnected(cached)
      return
    }

    try {
      const status = await getGmailAuthStatus()
      writeGmailStatusCache(status.connected)
      if (mountedRef.current) setGmailConnected(status.connected)
    } catch {
      const stored = loadStoredUser()
      if (mountedRef.current) setGmailConnected(Boolean(stored?.email))
    }
  }, [])

  useEffect(() => {
    const stored = loadStoredUser()
    setUser(stored)
    const cached = readGmailStatusCache()
    if (cached !== null) {
      setGmailConnected(cached)
    } else if (stored?.email) {
      setGmailConnected(true)
    }
    setReady(true)
    void refreshGmailStatus()
  }, [refreshGmailStatus])

  const connectGmail = useCallback(async (returnTo = "/", revokeExisting = false) => {
    if (revokeExisting) {
      await clearGmailToken()
      setGmailConnected(false)
      writeGmailStatusCache(false)
    }
    const url = await startGmailOAuth(returnTo)
    window.location.href = url
  }, [])

  const syncGmailInbox = useCallback(async (options?: { silent?: boolean }) => {
    if (syncInFlightRef.current) {
      return syncInFlightRef.current
    }

    const run = (async (): Promise<SyncResult> => {
      if (!options?.silent) setScanning(true)
      setSyncInFlight(true)
      try {
        const result = await scanGmailAndGetUser()
        saveUser(result.user)
        writeGmailStatusCache(true)
        if (!mountedRef.current) {
          return { saved: result.saved, ignored: result.ignored, audits: result.audits }
        }
        setUser(result.user)
        setGmailConnected(true)
        const syncResult = {
          saved: result.saved,
          ignored: result.ignored,
          audits: result.audits,
        }
        setLastSyncResult(syncResult)
        if (syncResult.saved > 0 || syncResult.audits.length > 0) {
          setLastSyncAt(Date.now())
        }
        return syncResult
      } catch (error) {
        if (error instanceof Error && error.message === "AUTH_REQUIRED") {
          setGmailConnected(false)
          writeGmailStatusCache(false)
          return { saved: 0, ignored: 0, audits: [] }
        }
        throw error
      } finally {
        if (mountedRef.current) {
          setSyncInFlight(false)
          if (!options?.silent) setScanning(false)
        }
      }
    })()

    syncInFlightRef.current = run
    try {
      return await run
    } finally {
      syncInFlightRef.current = null
    }
  }, [])

  const loginWithGmailScan = useCallback(async () => {
    try {
      return await syncGmailInbox()
    } catch (error) {
      if (error instanceof Error && error.message === "AUTH_REQUIRED") {
        await connectGmail("/login")
        return { saved: 0, ignored: 0, audits: [] }
      }
      throw error
    }
  }, [connectGmail, syncGmailInbox])

  useEffect(() => {
    if (!ready || !user?.email || !gmailConnected) return

    let cancelled = false

    const runBackgroundSync = async () => {
      if (cancelled || syncInFlightRef.current) return
      if (typeof document !== "undefined" && document.visibilityState !== "visible") return

      const now = Date.now()
      const lastAt = Math.max(lastBackgroundSyncAtRef.current, moduleLastBackgroundSyncAt)
      if (now - lastAt < MIN_BACKGROUND_SYNC_GAP_MS) return

      lastBackgroundSyncAtRef.current = now
      moduleLastBackgroundSyncAt = now

      try {
        await syncGmailInbox({ silent: true })
      } catch {
        // sync en segundo plano: no interrumpir la UI
      }
    }

    const intervalId = window.setInterval(() => {
      void runBackgroundSync()
    }, BACKGROUND_SYNC_INTERVAL_MS)

    return () => {
      cancelled = true
      window.clearInterval(intervalId)
    }
  }, [ready, user?.email, gmailConnected, syncGmailInbox])

  const logout = useCallback(async () => {
    try {
      await clearGmailToken()
    } catch {
      // fallback silencioso
    }
    clearUser()
    setUser(null)
    setGmailConnected(false)
    setLastSyncAt(null)
    setLastSyncResult(null)
    moduleLastBackgroundSyncAt = 0
    if (typeof window !== "undefined") {
      sessionStorage.removeItem("shieldmind_gmail_status")
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      ready,
      scanning,
      syncInFlight,
      gmailConnected,
      lastSyncAt,
      lastSyncResult,
      loginWithGmailScan,
      syncGmailInbox,
      connectGmail,
      logout,
    }),
    [
      user,
      ready,
      scanning,
      syncInFlight,
      gmailConnected,
      lastSyncAt,
      lastSyncResult,
      loginWithGmailScan,
      syncGmailInbox,
      connectGmail,
      logout,
    ]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext)
  if (!ctx) {
    throw new Error("useAuth debe usarse dentro de AuthProvider")
  }
  return ctx
}
