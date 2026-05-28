import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import ClientData from "@/components/case-detail/ClientData"
import ClarityCard from "@/components/case-detail/ClarityCard"
import SimilarityWidget from "@/components/case-detail/SimilarityWidget"
import CopilotChat from "@/components/chatbot/CopilotChat"
import { claimsService, Claim } from "@/services/claims"
import { applyScoringToClaim } from "@/services/mappers"
import { 
  ArrowLeft, 
  ShieldAlert, 
  FolderOpen,
  Download,
  AlertTriangle,
  Mail,
  Sparkles,
  Loader2
} from "lucide-react"

export default function ClaimDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [scoring, setScoring] = useState(false)
  const [status, setStatus] = useState<"Aprobado" | "Investigación" | "Rechazado">("Investigación")
  const [isChatOpen, setIsChatOpen] = useState(true)

  useEffect(() => {
    if (id) {
      loadClaimData(id as string)
    }
  }, [id])

  const loadClaimData = async (claimId: string) => {
    setLoading(true)
    try {
      const data = await claimsService.getClaimById(claimId)
      if (data) {
        setClaim(data)
        // Alinear el estado local interactivo del dictamen con el estado de la DB
        if (data.status === "Aprobado" || data.status === "Investigación" || data.status === "Rechazado") {
          setStatus(data.status)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: "Aprobado" | "Investigación" | "Rechazado") => {
    setStatus(newStatus)
    if (claim) {
      claim.status = newStatus
    }
  }

  const handleCalculateScore = async () => {
    if (!claim) return
    setScoring(true)
    try {
      const scoringResult = await claimsService.fetchScore(claim.id, true)
      setClaim(applyScoringToClaim(claim, scoringResult))
    } catch (e) {
      console.error(e)
      alert("No se pudo recalcular la auditoría. Verifica que el backend esté activo.")
    } finally {
      setScoring(false)
    }
  }

  // Si aún se está cargando el router o la data del siniestro
  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="w-10 h-10 border-4 border-brand-blue/30 border-t-brand-blue rounded-full animate-spin mb-4" />
          <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">
            Cargando Expediente Analítico...
          </span>
        </main>
      </div>
    )
  }

  // Siniestro no localizado
  if (!claim) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="w-14 h-14 bg-rose-50 border border-rose-200 text-rose-500 rounded-md flex items-center justify-center">
            <AlertTriangle className="w-8 h-8" />
          </div>
          <div className="space-y-1">
            <h2 className="text-sm font-black text-brand-navy uppercase tracking-wider">Expediente no Localizado</h2>
            <p className="text-xs text-slate-500 max-w-sm">
              El número de radicado <strong className="font-mono text-brand-blue">{id || "N/A"}</strong> no existe en la base de datos de Aseguradora del Sur.
            </p>
          </div>
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-brand-blue text-white rounded-md text-xs font-black uppercase tracking-wider hover:bg-brand-navy transition-all"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Volver a la Bandeja Central</span>
          </Link>
        </main>
      </div>
    )
  }

  // Caso activo
  const activeClaim = claim!
  const hasAutoAudit = Boolean(
    activeClaim.rules && activeClaim.rules.length > 0 && activeClaim.total_score !== undefined
  )

  return (
    <div className="flex bg-slate-50 min-h-screen print:bg-white print:min-h-0">
      {/* Sidebar Lateral - Oculto al imprimir */}
      <div className="print:hidden sticky top-0 h-screen shrink-0 z-40">
        <Sidebar />
      </div>

      {/* Panel Principal */}
      <main className={`flex-1 flex flex-col min-h-screen overflow-y-auto print:pr-0 print:bg-white transition-all duration-300 ${
        isChatOpen ? "pr-0 xl:pr-96" : "pr-0"
      }`}>
        
        {/* Header superior - Oculto al imprimir */}
        <div className="print:hidden">
          <Header 
            title={`Expediente Analítico ${activeClaim.id}`} 
            subtitle={`Auditoría integral del siniestro de ${activeClaim.insuredName}`} 
          />
        </div>

        {/* Workbench del Auditor */}
        <div className="flex-1 p-6 md:p-8 pb-24 lg:pb-8 space-y-6 max-w-6xl w-full mx-auto animate-fade-in print:p-0 print:my-0">
          
          {/* Cabecera Oficial de Impresión (Solo visible al imprimir el PDF de auditoría) */}
          <div className="hidden print:flex items-center justify-between border-b-2 border-brand-navy pb-4 mb-6">
            <div>
              <h1 className="text-xl font-black text-brand-navy">INFORME OFICIAL DE AUDITORÍA DE SINIESTROS</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                Generado por ShieldMind AI • Aseguradora del Sur
              </p>
            </div>
            <div className="text-right text-xs font-mono font-bold text-brand-navy">
              <span>Siniestro: <strong>{activeClaim.id}</strong></span>
              <br />
              <span>Fecha: {new Date().toLocaleDateString("es-EC")}</span>
            </div>
          </div>

          {/* Top Actions: Volver, Modificadores de Estado e Impresión */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white p-6 rounded-lg border border-slate-200 shadow-sm print:hidden">
            
            <Link
              href="/"
              className="inline-flex items-center gap-2 text-xs font-black uppercase tracking-wider text-slate-500 hover:text-brand-blue py-2.5 px-4 bg-slate-50 hover:bg-slate-100 rounded-md border border-slate-200/50 shadow-sm transition-all print:hidden select-none"
            >
              <ArrowLeft className="w-4 h-4 text-slate-400" />
              <span>Regresar al Triaje</span>
            </Link>

            {/* Selector de Estado del Analista */}
            <div className="flex flex-wrap items-center gap-3 print:hidden">
              <span className="text-[10px] text-slate-400 font-extrabold uppercase tracking-wider pr-1">
                Dictamen Técnico:
              </span>
              <div className="flex items-center gap-1.5">
                {[
                  { label: "Aprobar", val: "Aprobado" as const, color: "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100", active: "bg-emerald-600 text-white border-transparent" },
                  { label: "Investigar", val: "Investigación" as const, color: "bg-brand-lightBlue/10 text-brand-lightBlue border-brand-lightBlue/20 hover:bg-brand-lightBlue/15", active: "bg-[#00adef] text-white border-transparent" },
                  { label: "Rechazar", val: "Rechazado" as const, color: "bg-rose-50 text-rose-700 border-rose-200 hover:bg-rose-100", active: "bg-rose-600 text-white border-transparent" }
                ].map((btn) => (
                  <button
                    key={btn.val}
                    onClick={() => handleStatusChange(btn.val)}
                    className={`px-6 py-2.5 border text-[10.5px] font-black uppercase tracking-wider rounded-md transition-all duration-300 cursor-pointer select-none ${
                      status === btn.val 
                        ? btn.active + " scale-102 shadow-md"
                        : btn.color
                    }`}
                  >
                    {btn.label}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 print:hidden">
              <Link
                href={`/preview-correo?id=${encodeURIComponent(activeClaim.id)}`}
                className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-slate-200 text-brand-navy hover:bg-slate-50 hover:border-slate-300 rounded-md shadow-sm transition-all duration-300 print:hidden text-xs font-black uppercase tracking-widest select-none cursor-pointer"
              >
                <Mail className="w-3.5 h-3.5 text-brand-blue" />
                <span>Ver Correo</span>
              </Link>

              <button 
                onClick={() => window.print()}
                className="inline-flex items-center gap-2 px-5 py-2.5 bg-brand-navy text-white hover:bg-brand-blue hover:text-white rounded-md shadow-md transition-all duration-300 print:hidden cursor-pointer text-xs font-black uppercase tracking-widest select-none"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Exportar Informe</span>
              </button>
            </div>

          </div>

          {/* Split Screen Grid (Dos paneles de 1/2 columna en Desktop) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start print:grid-cols-1 print:gap-4">
            
            {/* Panel Izquierdo: Ficha de Datos Duros y Expediente */}
            <div className="space-y-6 print:break-after-page">
              <div className="flex items-center gap-2 pl-1 print:hidden">
                <FolderOpen className="w-4 h-4 text-brand-blue" />
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                  Dossier e Historial Técnico
                </h4>
              </div>
              <ClientData claim={activeClaim} />
            </div>

            {/* Panel Derecho: Explicabilidad IA & Widget NLP de Similitud */}
            <div className="space-y-8 print:my-4">
              <div className="flex items-center justify-between gap-2 pl-1 print:hidden">
                <div className="flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-[#00adef]" />
                  <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                    Auditoría y Algoritmo Éxito IA
                  </h4>
                </div>
                <div className="flex items-center gap-2">
                  {hasAutoAudit ? (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-md">
                      <Sparkles className="w-3 h-3" />
                      Auditoría automática
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-amber-50 border border-amber-200 text-amber-700 rounded-md">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      Auditoría pendiente
                    </span>
                  )}
                  <button
                    onClick={handleCalculateScore}
                    disabled={scoring}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider bg-white border border-slate-200 text-slate-600 rounded-md hover:bg-slate-50 disabled:opacity-50"
                  >
                    {scoring ? <Loader2 className="w-3 h-3 animate-spin" /> : <Sparkles className="w-3 h-3" />}
                    Recalcular
                  </button>
                </div>
              </div>
              
              <ClarityCard claim={activeClaim} />

              {/* Widget de Similitud Lingüística BERT */}
              <SimilarityWidget claim={activeClaim} />
            </div>

          </div>

        </div>

      </main>

      {/* Copiloto de Inteligencia Artificial - Oculto al imprimir */}
      <div className="print:hidden">
        <CopilotChat 
          claimId={activeClaim.id} 
          isOpen={isChatOpen} 
          setIsOpen={setIsChatOpen} 
        />
      </div>
    </div>
  )
}
