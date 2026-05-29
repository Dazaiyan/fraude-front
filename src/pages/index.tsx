import React, { useEffect, useState } from "react"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import ClaimTable from "@/components/triage/ClaimTable"
import { useAuth } from "@/context/AuthContext"
import { useSiniestros } from "@/hooks/useSiniestros"
import { listGmailCorreos } from "@/services/gmail"
import { Filter, Layers, Plus, Search, Database, RefreshCw, Mail, Inbox, Archive, Globe } from "lucide-react"
import Link from "next/link"

export default function Dashboard() {
  const { ready, user, syncGmailInbox, scanning, syncInFlight } = useAuth()
  const { claims, loading, summary, indexStatus, indexEmbeddings, reload } = useSiniestros()
  const [correoCount, setCorreoCount] = useState<number | null>(null)
  const [syncing, setSyncing] = useState(false)
  const [filteredClaims, setFilteredClaims] = useState(claims)
  const [searchTerm, setSearchTerm] = useState("")
  const [selectedRiskFilter, setSelectedRiskFilter] = useState<"all" | "high" | "medium" | "low">("all")
  const [activeTab, setActiveTab] = useState<"inbox" | "archived" | "all">("inbox")
  const [indexing, setIndexing] = useState(false)

  useEffect(() => {
    if (!ready || !user?.email || syncInFlight) {
      if (!syncInFlight) setCorreoCount(null)
      return
    }

    listGmailCorreos(200)
      .then((items) => setCorreoCount(items.length))
      .catch(() => setCorreoCount(null))
  }, [ready, user?.email, claims.length, syncInFlight])

  const handleRefresh = async () => {
    setSyncing(true)
    try {
      await syncGmailInbox()
      await reload()
      const items = await listGmailCorreos(200)
      setCorreoCount(items.length)
    } catch {
      await reload()
    } finally {
      setSyncing(false)
    }
  }

  useEffect(() => {
    let result = claims

    // 1. Filtrar por Tab (Bandeja de Entrada vs Archivados vs Todos)
    if (activeTab === "inbox") {
      result = result.filter((c) => c.status === "Pendiente" || !c.status)
    } else if (activeTab === "archived") {
      result = result.filter((c) => c.status === "Aprobado" || c.status === "Investigación" || c.status === "Rechazado")
    }

    // 2. Filtrar por Nivel de Riesgo (Rojo, Amarillo, Verde)
    if (selectedRiskFilter !== "all") {
      result = result.filter((c) => c.riskLevel === selectedRiskFilter)
    }

    setFilteredClaims(result)
  }, [activeTab, selectedRiskFilter, claims])

  const handleIndex = async () => {
    setIndexing(true)
    try {
      await indexEmbeddings()
    } finally {
      setIndexing(false)
    }
  }

  const riskCounts = summary?.by_color ?? {
    Rojo: claims.filter((c) => c.riskLevel === "high").length,
    Amarillo: claims.filter((c) => c.riskLevel === "medium").length,
    Verde: claims.filter((c) => c.riskLevel === "low").length,
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Header
          title="Bandeja de Entrada"
          subtitle="Triaje interactivo de siniestros y auditoría ética en tiempo real"
        />

        <div className="flex-1 p-6 md:p-8 pb-24 lg:pb-8 space-y-6 max-w-7xl w-full mx-auto">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-brand-navy flex items-center gap-2">
                <Layers className="w-5 h-5 text-brand-blue" />
                Siniestros Entrantes
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                {summary
                  ? `${summary.total} siniestros de tu cuenta`
                  : "Solo se muestran siniestros asociados a tu sesión de Gmail"}
              </p>
            </div>

            <Link
              href="/reportar"
              className="inline-flex items-center gap-1.5 px-4 py-2.5 bg-brand-blue text-white rounded-md text-xs font-bold hover:bg-brand-navy group transition-colors"
            >
              <Plus className="w-4 h-4" />
              <span>Reportar Siniestro</span>
            </Link>
          </div>

          {correoCount !== null && correoCount > 0 && (
            <Link
              href="/correos"
              className="flex items-center justify-between gap-3 bg-white border border-brand-blue/20 rounded-lg p-4 hover:bg-brand-blue/5 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-md bg-brand-blue/10 flex items-center justify-center">
                  <Mail className="w-5 h-5 text-brand-blue" />
                </div>
                <div>
                  <p className="text-sm font-bold text-brand-navy">
                    {correoCount} correo{correoCount === 1 ? "" : "s"} de siniestros en Gmail
                  </p>
                  <p className="text-xs text-slate-500">
                    Reclamos recibidos en tu bandeja (SINIESTRO, RECLAMO, etc.). Los que traen PDF aparecen abajo como casos.
                  </p>
                </div>
              </div>
              <span className="text-xs font-bold text-brand-blue uppercase tracking-wider shrink-0">Ver correos →</span>
            </Link>
          )}

          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { label: "Rojo", value: riskCounts.Rojo ?? 0, color: "text-rose-700 bg-rose-50 border-rose-200" },
              { label: "Amarillo", value: riskCounts.Amarillo ?? 0, color: "text-amber-700 bg-amber-50 border-amber-200" },
              { label: "Verde", value: riskCounts.Verde ?? 0, color: "text-emerald-700 bg-emerald-50 border-emerald-200" },
              {
                label: "Sin indexar",
                value: indexStatus?.pending ?? summary?.pending_indexing ?? 0,
                color: "text-brand-navy bg-brand-blue/5 border-brand-blue/20",
              },
            ].map((stat) => (
              <div key={stat.label} className={`rounded-lg border p-3 ${stat.color}`}>
                <p className="text-[10px] font-bold uppercase tracking-wider opacity-70">{stat.label}</p>
                <p className="text-xl font-black">{stat.value}</p>
              </div>
            ))}
          </div>

          {indexStatus && indexStatus.pending > 0 && (
            <div className="flex items-center justify-between gap-3 bg-white border border-brand-blue/20 rounded-lg p-3">
              <div className="flex items-center gap-2 text-xs text-brand-navy">
                <Database className="w-4 h-4 text-brand-blue" />
                <span>
                  <strong>{indexStatus.pending}</strong> siniestros pendientes de indexar para el chat RAG
                </span>
              </div>
              <button
                onClick={handleIndex}
                disabled={indexing}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold bg-brand-blue text-white rounded-md hover:bg-brand-navy disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${indexing ? "animate-spin" : ""}`} />
                Indexar ahora
              </button>
            </div>
          )}

          {/* Selector de Bandeja de Entrada vs Archivados */}
          <div className="flex border-b border-slate-200">
            {[
              { id: "inbox", label: "Bandeja de Entrada", icon: Inbox, count: claims.filter(c => c.status === "Pendiente" || !c.status).length },
              { id: "archived", label: "Expedientes Archivados", icon: Archive, count: claims.filter(c => c.status === "Aprobado" || c.status === "Investigación" || c.status === "Rechazado").length },
              { id: "all", label: "Todos los Casos", icon: Globe, count: claims.length }
            ].map((tab) => {
              const Icon = tab.icon
              return (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as typeof activeTab)}
                  className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-black uppercase tracking-wider transition-all duration-300 cursor-pointer select-none ${
                    activeTab === tab.id
                      ? "border-brand-blue text-brand-navy font-black scale-102"
                      : "border-transparent text-slate-400 hover:text-slate-650"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0" />
                  <span>{tab.label}</span>
                  <span className={`px-2 py-0.5 text-[10px] font-extrabold rounded-full ${
                    activeTab === tab.id
                      ? "bg-brand-blue/10 text-brand-blue"
                      : "bg-slate-100 text-slate-500"
                  }`}>
                    {tab.count}
                  </span>
                </button>
              )
            })}
          </div>

          <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-sm">
            <div className="flex flex-wrap items-center gap-1.5">
              <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider pr-1 flex items-center gap-1">
                <Filter className="w-3.5 h-3.5 text-slate-400" />
                Filtrar:
              </span>
              {[
                { id: "all", label: "Todos", color: "bg-slate-50 text-brand-navy border-slate-200" },
                { id: "high", label: "Rojo (Crítico)", color: "bg-rose-50 text-rose-700 border-rose-200" },
                { id: "medium", label: "Amarillo (Medio)", color: "bg-amber-50 text-amber-700 border-amber-200" },
                { id: "low", label: "Verde (Bajo)", color: "bg-emerald-50 text-emerald-700 border-emerald-200" },
              ].map((btn) => (
                <button
                  key={btn.id}
                  onClick={() => setSelectedRiskFilter(btn.id as typeof selectedRiskFilter)}
                  className={`px-3 py-1.5 rounded-md border text-[11px] font-bold transition-all duration-300 ${
                    selectedRiskFilter === btn.id
                      ? "ring-1 ring-brand-blue border-transparent font-extrabold"
                      : "text-slate-500 border-slate-200 hover:bg-slate-50"
                  } ${selectedRiskFilter === btn.id ? btn.color : ""}`}
                >
                  {btn.label}
                </button>
              ))}
              <button
                onClick={handleRefresh}
                disabled={syncing || scanning}
                className="ml-1 px-2 py-1.5 text-slate-400 hover:text-brand-blue disabled:opacity-50"
                title="Sincronizar Gmail y recargar"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing || scanning ? "animate-spin" : ""}`} />
              </button>
            </div>

            <div className="relative w-full md:w-80">
              <span className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
                <Search className="w-4 h-4 text-slate-400" />
              </span>
              <input
                type="text"
                placeholder="Buscar asegurado, ID o ramo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs rounded-md bg-slate-50 border border-slate-200 text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-lightBlue focus:border-brand-lightBlue transition-all"
              />
            </div>
          </div>

          {loading ? (
            <div className="py-24 text-center bg-white border border-slate-200 rounded-lg shadow-sm">
              <div className="w-8 h-8 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mx-auto mb-4" />
              <span className="text-sm font-semibold text-slate-400">Analizando base de datos de siniestros...</span>
            </div>
          ) : (
            <div className="space-y-4">
              <ClaimTable claims={filteredClaims} searchTerm={searchTerm} />

              <div className="flex items-center justify-end text-[10.5px] text-slate-400 font-bold px-1">
                <span>Procesando {filteredClaims.length} siniestros filtrados</span>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}
