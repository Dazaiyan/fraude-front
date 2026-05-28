import React, { useState, useEffect } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import { Shield, LayoutDashboard, FileText, MessageSquare, ChevronLeft, ChevronRight, LogOut, Mail } from "lucide-react"
import { useAuth } from "@/context/AuthContext"
import { getUserInitials } from "@/services/auth"

export default function Sidebar() {
  const router = useRouter()
  const { user, ready, logout } = useAuth()
  const [isCollapsed, setIsCollapsed] = useState(false)

  // SSR-safe loading of the preference from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("sidebar-collapsed")
    if (saved === "true") {
      setIsCollapsed(true)
    }
  }, [])

  const toggleCollapse = () => {
    const newVal = !isCollapsed
    setIsCollapsed(newVal)
    localStorage.setItem("sidebar-collapsed", String(newVal))
  }

  const menuItems = [
    {
      name: "Bandeja de Entrada",
      path: "/",
      icon: LayoutDashboard,
    },
    {
      name: "Correos Gmail",
      path: "/correos",
      icon: Mail,
    },
    {
      name: "Copiloto Antifraude",
      path: "/copiloto",
      icon: MessageSquare,
    },
    {
      name: "Reportar Siniestro",
      path: "/reportar",
      icon: FileText,
    },
  ]

  return (
    <>
      {/* Sidebar Lateral para Desktop (Oculto en móvil/tablet) */}
      <aside className={`hidden lg:flex ${isCollapsed ? "w-20" : "w-64"} bg-brand-navy text-white flex-col h-screen sticky top-0 border-r border-slate-800 shrink-0 transition-all duration-300 relative z-40 select-none shadow-lg`}>
        
        {/* Botón flotador elegante para colapsar/minimizar el menú */}
        <button
          onClick={toggleCollapse}
          title={isCollapsed ? "Expandir menú" : "Minimizar menú"}
          className="absolute top-8 -right-3 w-6 h-6 bg-brand-navy border border-slate-700 text-brand-lightBlue hover:text-white rounded-full flex items-center justify-center shadow-md cursor-pointer hover:scale-105 transition-all z-50 focus:outline-none"
        >
          {isCollapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>

        {/* Brand Logo Header */}
        <div className={`p-5 border-b border-slate-800 flex items-center ${isCollapsed ? "justify-center" : "gap-3"} transition-all duration-300 overflow-hidden`}>
          <div className="w-10 h-10 bg-brand-blue flex items-center justify-center text-brand-lightBlue border border-brand-lightBlue/20 rounded-md shrink-0">
            <Shield className="w-6 h-6 animate-pulse" />
          </div>
          {!isCollapsed && (
            <div className="animate-fade-in flex flex-col justify-center">
              <h1 className="font-bold text-base tracking-tight text-white truncate leading-none mb-1">
                ShieldMind AI
              </h1>
              <span className="text-[9px] text-brand-lightBlue font-semibold uppercase tracking-wider block truncate leading-none">
                Aseguradora del Sur
              </span>
            </div>
          )}
        </div>

        {/* Navigation Menu */}
        <nav className="flex-1 px-3 py-6 space-y-1.5 overflow-x-hidden">
          <div className={`text-[9px] text-slate-400 font-bold px-3 mb-3 uppercase tracking-widest ${isCollapsed ? "text-center" : ""}`}>
            {isCollapsed ? "MÓD" : "Módulos Principales"}
          </div>
          
          {menuItems.map((item) => {
            const isActive = router.pathname === item.path || (item.path !== "/" && router.pathname.startsWith(item.path))
            const Icon = item.icon
            
            return (
              <Link
                key={item.path}
                href={item.path}
                title={isCollapsed ? item.name : undefined}
                className={`flex items-center ${isCollapsed ? "justify-center py-3.5 px-0" : "gap-3.5 px-4 py-3"} rounded-md text-sm font-medium transition-colors ${
                  isActive
                    ? "bg-brand-blue text-white" + (!isCollapsed ? " border-l-4 border-brand-lightBlue" : "")
                    : "text-slate-300 hover:bg-slate-800/40 hover:text-white"
                }`}
              >
                <Icon className={`w-4.5 h-4.5 ${isActive ? "text-brand-lightBlue" : "text-slate-400 group-hover:text-white"} shrink-0`} />
                {!isCollapsed && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        {/* User Session Info */}
        <div className={`p-4 border-t border-slate-800 bg-slate-900/50 ${isCollapsed ? "flex flex-col items-center gap-2" : "space-y-2"}`}>
          <div className={`flex items-center ${isCollapsed ? "justify-center" : "gap-3"} transition-all duration-300 overflow-hidden`}>
            <div className="w-9 h-9 bg-brand-blue flex items-center justify-center font-bold text-sm border border-brand-lightBlue/30 text-white rounded-full shrink-0">
              {ready && user ? getUserInitials(user.name) : "…"}
            </div>
            {!isCollapsed && (
              <div className="overflow-hidden animate-fade-in flex flex-col min-w-0 flex-1">
                <h4 className="text-xs font-semibold text-white truncate leading-none mb-1">
                  {ready && user ? user.name : "Cargando…"}
                </h4>
                <p className="text-[10px] text-slate-400 truncate leading-none">
                  {ready && user ? user.role : "—"}
                </p>
              </div>
            )}
          </div>
          {!isCollapsed && ready && user && (
            <button
              type="button"
              onClick={async () => {
                await logout()
                router.push("/login")
              }}
              className="w-full flex items-center justify-center gap-1.5 py-1.5 text-[10px] font-bold text-slate-400 hover:text-white hover:bg-slate-800 rounded-md transition-colors"
            >
              <LogOut className="w-3 h-3" />
              Cerrar sesión
            </button>
          )}
        </div>
      </aside>

      {/* Barra de Navegación Inferior para Móvil y Tablet (Oculto en desktop) */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-brand-navy border-t border-slate-800 h-16 flex items-center justify-around px-4 z-50 shadow-lg select-none">
        {menuItems.map((item) => {
          const isActive = router.pathname === item.path || (item.path !== "/" && router.pathname.startsWith(item.path))
          const Icon = item.icon
          
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center justify-center gap-1.5 w-20 h-full transition-colors ${
                isActive ? "text-brand-lightBlue" : "text-slate-400 hover:text-white"
              }`}
            >
              <Icon className="w-5 h-5 shrink-0" />
              <span className="text-[9.5px] font-black uppercase tracking-wider">
                {item.name === "Bandeja de Entrada" ? "Bandeja" : item.name === "Copiloto Antifraude" ? "Copiloto" : "Reportar"}
              </span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
