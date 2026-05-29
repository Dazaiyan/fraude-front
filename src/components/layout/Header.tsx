import React, { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/router"
import { Bell, ShieldAlert, Sparkles, AlertTriangle, CheckCircle, Clock, RefreshCw } from "lucide-react"
import {
  AppNotification,
  fetchNotifications,
  markAllNotificationsRead,
  markNotificationRead,
} from "@/services/notifications"
import { NotificationsSkeleton } from "@/components/ui/Skeleton"

interface HeaderProps {
  title?: string
  subtitle?: string
}

export default function Header({
  title = "Bandeja de Entrada",
  subtitle = "Triaje inteligente y detección de anomalías en siniestros",
}: HeaderProps) {
  const router = useRouter()
  const [isOpen, setIsOpen] = useState(false)
  const [notifications, setNotifications] = useState<AppNotification[]>([])
  const [loading, setLoading] = useState(true)

  const loadNotifications = useCallback(async () => {
    setLoading(true)
    try {
      const data = await fetchNotifications()
      setNotifications(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  const unreadCount = notifications.filter((n) => n.unread).length

  const handleToggle = () => {
    setIsOpen(!isOpen)
    if (!isOpen) loadNotifications()
  }

  const handleMarkAsRead = (item: AppNotification) => {
    markNotificationRead(item.id)
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, unread: false } : n))
    )
    if (item.claimId) {
      setIsOpen(false)
      router.push(`/caso/${encodeURIComponent(item.claimId)}`)
    }
  }

  const handleMarkAllAsRead = () => {
    markAllNotificationsRead(notifications.map((n) => n.id))
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })))
  }

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":
        return <ShieldAlert className="w-4 h-4 text-rose-600" />
      case "warning":
        return <AlertTriangle className="w-4 h-4 text-amber-600" />
      case "success":
        return <CheckCircle className="w-4 h-4 text-emerald-600" />
      case "info":
      default:
        return <Sparkles className="w-4 h-4 text-brand-blue" />
    }
  }

  const getColorClasses = (type: string, unread: boolean) => {
    if (unread) {
      switch (type) {
        case "critical":
          return "bg-rose-50/50 border-l-rose-500 hover:bg-rose-50/80"
        case "warning":
          return "bg-amber-50/50 border-l-amber-500 hover:bg-amber-50/80"
        case "success":
          return "bg-emerald-50/50 border-l-emerald-500 hover:bg-emerald-50/80"
        case "info":
        default:
          return "bg-blue-50/30 border-l-brand-blue hover:bg-blue-50/50"
      }
    }
    return "bg-white border-l-transparent hover:bg-slate-50/50"
  }

  return (
    <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 shadow-sm relative z-20">
      <div>
        <h2 className="text-xl font-bold text-brand-navy flex items-center gap-2">{title}</h2>
        <p className="text-xs text-slate-500 font-medium">{subtitle}</p>
      </div>

      <div className="flex items-center gap-6 relative">
        <button
          onClick={handleToggle}
          className="relative p-2.5 rounded-md bg-slate-50 hover:bg-slate-100 text-brand-navy border border-slate-200/50 shadow-sm transition-all focus:outline-none select-none cursor-pointer"
          aria-label="Notificaciones"
        >
          <Bell className="w-4.5 h-4.5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1.5 -right-1.5 min-w-[20px] h-5 px-1 flex items-center justify-center rounded-full bg-rose-600 text-[10px] font-black text-white leading-none border-2 border-white shadow-sm animate-pulse">
              {unreadCount}
            </span>
          )}
        </button>

        {isOpen && (
          <>
            <div className="fixed inset-0 z-40 bg-transparent" onClick={() => setIsOpen(false)} />

            <div className="absolute right-0 top-12 w-80 bg-white border border-slate-200 shadow-premium rounded-lg z-50 overflow-hidden select-none">
              <div className="p-4 border-b border-slate-150 flex items-center justify-between bg-slate-50/50">
                <div className="flex items-center gap-1.5">
                  <span className="text-xs font-black text-brand-navy uppercase tracking-wider">Notificaciones</span>
                  {unreadCount > 0 && (
                    <span className="px-1.5 py-0.5 rounded bg-rose-100 text-rose-700 text-[9px] font-extrabold">
                      {unreadCount} nuevas
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={loadNotifications}
                    className="p-1 text-slate-400 hover:text-brand-blue"
                    title="Actualizar"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
                  </button>
                  {unreadCount > 0 && (
                    <button
                      onClick={handleMarkAllAsRead}
                      className="text-[10px] font-extrabold text-brand-blue hover:text-brand-navy hover:underline uppercase transition-all cursor-pointer"
                    >
                      Marcar leído
                    </button>
                  )}
                </div>
              </div>

              <div className="max-h-96 overflow-y-auto divide-y divide-slate-100">
                {loading && notifications.length === 0 ? (
                  <NotificationsSkeleton count={3} />
                ) : notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400">
                    <p className="text-xs font-bold">No tienes notificaciones de auditoría</p>
                  </div>
                ) : (
                  notifications.map((item) => (
                    <div
                      key={item.id}
                      onClick={() => handleMarkAsRead(item)}
                      className={`p-3.5 border-l-4 transition-all duration-300 text-left cursor-pointer flex gap-3 relative group ${getColorClasses(item.type, item.unread)}`}
                    >
                      <div className="mt-0.5 shrink-0 p-1.5 bg-white border border-slate-100 rounded-md shadow-sm group-hover:scale-105 transition-transform">
                        {getIcon(item.type)}
                      </div>

                      <div className="space-y-1 pr-4">
                        <div className="flex items-center justify-between gap-2">
                          <h4
                            className={`text-[11.5px] font-black tracking-tight leading-tight ${item.unread ? "text-brand-navy" : "text-slate-500"}`}
                          >
                            {item.title}
                          </h4>
                          {item.unread && <span className="w-1.5 h-1.5 bg-rose-600 rounded-full shrink-0" />}
                        </div>
                        <p
                          className={`text-[10.5px] font-semibold leading-normal ${item.unread ? "text-slate-600" : "text-slate-400"}`}
                        >
                          {item.desc}
                        </p>
                        <div className="flex items-center gap-1 text-[9px] text-slate-400 font-extrabold uppercase">
                          <Clock className="w-3 h-3" />
                          <span>{item.time}</span>
                          {item.claimId && (
                            <span className="text-brand-blue normal-case font-bold">· Ver caso</span>
                          )}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>

              <div className="p-2.5 border-t border-slate-100 text-center bg-slate-50/20">
                <span className="text-[9.5px] text-slate-400 font-extrabold uppercase">
                  ShieldMind AI • Auditoría de Siniestros
                </span>
              </div>
            </div>
          </>
        )}
      </div>
    </header>
  )
}
