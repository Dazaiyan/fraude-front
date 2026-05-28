import type { ReactNode } from "react"
import { useRouter } from "next/router"
import { useEffect } from "react"
import { useAuth } from "@/context/AuthContext"

export default function AuthGate({ children }: { children: ReactNode }) {
  const router = useRouter()
  const { user, ready } = useAuth()
  const isLoginPage = router.pathname === "/login"

  useEffect(() => {
    if (!ready || isLoginPage) return
    if (!user) {
      router.replace(`/login?returnTo=${encodeURIComponent(router.asPath)}`)
    }
  }, [ready, user, isLoginPage, router])

  if (!ready) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Cargando sesión…
      </div>
    )
  }

  if (!user && !isLoginPage) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Redirigiendo al inicio de sesión…
      </div>
    )
  }

  return <>{children}</>
}
