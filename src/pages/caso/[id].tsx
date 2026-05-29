import React, { useEffect, useState } from "react"
import Link from "next/link"
import { useRouter } from "next/router"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import ClientData from "@/components/case-detail/ClientData"
import ClarityCard from "@/components/case-detail/ClarityCard"
import SimilarityWidget from "@/components/case-detail/SimilarityWidget"
import CopilotChat from "@/components/chatbot/CopilotChat"
import { ClaimDetailContentSkeleton } from "@/components/ui/Skeleton"
import { claimsService, Claim } from "@/services/claims"
import { 
  ArrowLeft, 
  ShieldAlert, 
  FolderOpen,
  Download,
  AlertTriangle,
  Mail,
  Sparkles,
  Loader2,
  Save,
  CheckCircle2,
  Trash2
} from "lucide-react"

export default function ClaimDetail() {
  const router = useRouter()
  const { id } = router.query
  
  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [status, setStatus] = useState<"Aprobado" | "Investigación" | "Rechazado" | "Pendiente">("Pendiente")
  const [savingStatus, setSavingStatus] = useState(false)
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(true)
  const [isDeleting, setIsDeleting] = useState(false)

  const handleDeleteClaim = async () => {
    if (!claim) return
    const confirm = window.confirm(
      `¿Está absolutamente seguro de que desea eliminar permanentemente el expediente ${claim.id}? Esta acción borrará de forma irreversible el radicado, las puntuaciones, los embeddings vectoriales y todo su historial de chats de la base de datos.`
    )
    if (!confirm) return

    setIsDeleting(true)
    try {
      const res = await claimsService.deleteClaim(claim.id)
      if (res.success) {
        setToast({
          message: `El expediente ${claim.id} ha sido borrado exitosamente de la base de datos.`,
          type: "success"
        })
        setTimeout(() => {
          setToast(null)
          router.push("/")
        }, 2200)
      }
    } catch (e) {
      console.error(e)
      setToast({
        message: "Ocurrió un error al intentar borrar el expediente.",
        type: "error"
      })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setIsDeleting(false)
    }
  }

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
        if (
          data.status === "Aprobado" ||
          data.status === "Investigación" ||
          data.status === "Rechazado" ||
          data.status === "Pendiente"
        ) {
          setStatus(data.status)
        }
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const handleStatusChange = (newStatus: "Aprobado" | "Investigación" | "Rechazado" | "Pendiente") => {
    setStatus(newStatus)
  }

  const handleSaveStatus = async () => {
    if (!claim) return
    setSavingStatus(true)
    try {
      const updatedClaim = await claimsService.updateClaimStatus(claim.id, status)
      if (updatedClaim) {
        setClaim(updatedClaim)
        setToast({ 
          message: `Dictamen guardado exitosamente. El siniestro ahora está en estado: ${status}.`, 
          type: "success" 
        })
        setTimeout(() => {
          setToast(null)
          router.push("/")
        }, 2200)
      }
    } catch (e) {
      console.error(e)
      setToast({ 
        message: "No se pudo guardar el dictamen. Verifica la conexión con el backend.", 
        type: "error" 
      })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setSavingStatus(false)
    }
  }

  // Si aún se está cargando el router o la data del siniestro
  if (loading) {
    return (
      <div className="flex bg-slate-50 min-h-screen">
        <Sidebar />
        <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
          <ClaimDetailContentSkeleton />
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

                {activeClaim.status !== status && (
                  <button
                    onClick={handleSaveStatus}
                    disabled={savingStatus}
                    title="Guardar Dictamen Técnico"
                    className="p-3 bg-brand-navy text-white hover:bg-brand-blue disabled:bg-slate-200 rounded-md shadow-md transition-all duration-300 flex items-center justify-center cursor-pointer select-none animate-pulse"
                  >
                    {savingStatus ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4" />
                    )}
                  </button>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 print:hidden">
              <Link
                href={`/preview-correo?id=${encodeURIComponent(activeClaim.id)}`}
                title="Ver y Enviar Correo"
                className="p-3 bg-white border border-slate-200 text-brand-navy hover:bg-slate-50 hover:border-slate-300 hover:text-brand-blue rounded-md shadow-sm transition-all duration-300 print:hidden flex items-center justify-center select-none cursor-pointer"
              >
                <Mail className="w-4 h-4 text-brand-blue" />
              </Link>

              <button 
                onClick={() => window.print()}
                title="Exportar Informe de Auditoría"
                className="p-3 bg-brand-navy text-white hover:bg-brand-blue hover:text-white rounded-md shadow-md transition-all duration-300 print:hidden flex items-center justify-center cursor-pointer select-none"
              >
                <Download className="w-4 h-4" />
              </button>

              <button 
                onClick={handleDeleteClaim}
                disabled={isDeleting}
                title="Eliminar Expediente Permanentemente"
                className="p-3 bg-rose-600 text-white hover:bg-rose-700 disabled:bg-slate-300 rounded-md shadow-md transition-all duration-300 print:hidden flex items-center justify-center cursor-pointer select-none"
              >
                {isDeleting ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Trash2 className="w-4 h-4" />
                )}
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

      {/* Notificación Toast Premium */}
      {toast && (
        <div className={`fixed bottom-6 right-6 z-50 flex items-center gap-3 px-4 py-3 rounded-lg shadow-2xl border transition-all duration-500 transform translate-y-0 ${
          toast.type === "success" 
            ? "bg-slate-900 border-emerald-500/30 text-white" 
            : "bg-slate-900 border-rose-500/30 text-white"
        }`}>
          {toast.type === "success" ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 animate-bounce" />
          ) : (
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 animate-pulse" />
          )}
          <div className="flex flex-col">
            <span className="text-xs font-black uppercase tracking-wider text-slate-200">
              {toast.type === "success" ? "Operación Exitosa" : "Error en Proceso"}
            </span>
            <span className="text-[11px] font-medium text-slate-400">{toast.message}</span>
          </div>
        </div>
      )}
    </div>
  )
}
