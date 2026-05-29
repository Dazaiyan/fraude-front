import React, { useEffect, useState } from "react"
import { useRouter } from "next/router"
import Link from "next/link"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { claimsService, Claim } from "@/services/claims"
import { 
  Mail, 
  Send, 
  CheckCircle, 
  ArrowLeft, 
  Inbox, 
  Clock, 
  ShieldAlert, 
  UserCheck, 
  RefreshCw,
  Sparkles,
  Database,
  ArrowRight,
  Play,
  Save,
  CheckCircle2,
  AlertTriangle
} from "lucide-react"

export default function PreviewCorreo() {
  const router = useRouter()
  const { id } = router.query

  const [claim, setClaim] = useState<Claim | null>(null)
  const [loading, setLoading] = useState(true)
  const [dispatchStatus, setDispatchStatus] = useState<"pending" | "sending" | "sent">("pending")
  const [emailTemplate, setEmailTemplate] = useState<string>("")
  const [recipientEmail, setRecipientEmail] = useState("")
  const [subjectLine, setSubjectLine] = useState("")
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" } | null>(null)
  const [statusMessage, setStatusMessage] = useState<string>("")

  // Estado de las Pestañas (outbound = bandeja salida, inbound = simulador de entrada)
  const [activeTab, setActiveTab] = useState<"outbound" | "inbound">("outbound")

  // --- Estados para el simulador de Ingestión (Inbound) ---
  const [inboundId, setInboundId] = useState("")
  const [inboundPoliza, setInboundPoliza] = useState("")
  const [inboundAsegurado, setInboundAsegurado] = useState("")
  const [inboundBeneficiario, setInboundBeneficiario] = useState("")
  const [inboundRamo, setInboundRamo] = useState("Vehículos")
  const [inboundCobertura, setInboundCobertura] = useState("Cobertura Integral")
  const [inboundSucursal, setInboundSucursal] = useState("Guayaquil")
  const [inboundFechaOcurrencia, setInboundFechaOcurrencia] = useState("")
  const [inboundMontoReclamado, setInboundMontoReclamado] = useState("")
  const [inboundMontoEstimado, setInboundMontoEstimado] = useState("")
  const [inboundNarrativa, setInboundNarrativa] = useState("")
  const [inboundDocCompleto, setInboundDocCompleto] = useState("No")
  const [inboundDiasInicio, setInboundDiasInicio] = useState("")
  const [inboundDiasFin, setInboundDiasFin] = useState("")
  const [inboundDiasEntre, setInboundDiasEntre] = useState("")
  const [inboundHistorial, setInboundHistorial] = useState("")
  const [inboundFraudeLabel, setInboundFraudeLabel] = useState("Alta/Crítica")

  const [intakeRunning, setIntakeRunning] = useState(false)
  const [intakeCompleted, setIntakeCompleted] = useState(false)
  const [createdIntakeId, setCreatedIntakeId] = useState("")

  // Cargar datos de bandeja de salida
  useEffect(() => {
    if (!id) return

    async function loadClaimData() {
      setLoading(true)
      try {
        const claimId = decodeURIComponent(id as string)
        const data = await claimsService.getClaimById(claimId)
        if (data) {
          setClaim(data)
          
          // Pre-llenar campos de correo con el destinatario real
          let email = ""
          if (data.remitente_correo) {
            const match = data.remitente_correo.match(/<([^>]+)>/)
            email = match ? match[1] : data.remitente_correo
          } else {
            const cleanInsuredName = data.insuredName.split("(")[0].trim()
            email = cleanInsuredName.toLowerCase().replace(/\s+/g, ".") + "@gmail.com"
          }
          setRecipientEmail(email)
          
          // Asunto acorde al estado
          let statusLabel = "Confirmación de Ingreso"
          if (data.status === "Aprobado") statusLabel = "Dictamen de Aprobación"
          if (data.status === "Rechazado") statusLabel = "Notificación de Rechazo"
          if (data.status === "Investigación") statusLabel = "Bandeja de Investigación"
          setSubjectLine(`[Oficial] ${statusLabel} - Siniestro ${data.id}`)

          const res = await claimsService.sendClaimEmail(data.id)
          
          // Enriquecer la plantilla dinámicamente con el estado actual
          let templateHtml = res.htmlTemplate
          if (data.status === "Aprobado") {
            templateHtml = templateHtml
              .replace("Pendiente de Auditoría", "Aprobado para Pago y Liquidación")
              .replace("ingresado exitosamente", "<strong>APROBADO</strong> para su pago inmediato")
              .replace("#d97706", "#10b981") // Cambiar color amarillo a verde
          } else if (data.status === "Rechazado") {
            templateHtml = templateHtml
              .replace("Pendiente de Auditoría", "Rechazado / Declinado")
              .replace("ingresado exitosamente", "<strong>RECHAZADO</strong> por inconsistencias graves detectadas en la auditoría de riesgo")
              .replace("#d97706", "#ef4444") // Cambiar color amarillo a rojo
          } else if (data.status === "Investigación") {
            templateHtml = templateHtml
              .replace("Pendiente de Auditoría", "Bajo Investigación Especial")
              .replace("ingresado exitosamente", "retenido temporalmente bajo proceso de <strong>INVESTIGACIÓN ESPECIAL</strong>")
          }
          
          setEmailTemplate(templateHtml)
        }
      } catch (err) {
        console.error("Error al cargar siniestro para correo:", err)
      } finally {
        setLoading(false)
      }
    }

    loadClaimData()
  }, [id])

  // Cambiar a pestaña inbound genera un ID de siniestro nuevo
  useEffect(() => {
    if (activeTab === "inbound" && !inboundId) {
      setInboundId(`SHM-${Math.floor(1000 + Math.random() * 9000)}`)
    }
  }, [activeTab])

  // Despachar correo de notificación (Outbound)
  const handleDispatchEmail = async () => {
    if (!claim) return
    
    setDispatchStatus("sending")
    try {
      const res = await claimsService.sendCustomClaimEmail(
        claim.id,
        recipientEmail,
        subjectLine,
        emailTemplate
      )
      setDispatchStatus("sent")
      setStatusMessage(res.message)
      setToast({ message: "¡Correo electrónico enviado exitosamente!", type: "success" })
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      console.error(err)
      setDispatchStatus("pending")
      setToast({ message: "Error al transmitir correo vía Gmail API.", type: "error" })
      setTimeout(() => setToast(null), 4000)
    }
  }

  // Pre-llenar presets del simulador de Ingestión
  const loadPreset = (type: "theft" | "health") => {
    const randomId = `SHM-${Math.floor(1000 + Math.random() * 9000)}`
    setInboundId(randomId)
    setCreatedIntakeId("")
    setIntakeCompleted(false)

    if (type === "theft") {
      setInboundPoliza("POL-VEH-2025-9981")
      setInboundAsegurado("1723456789")
      setInboundBeneficiario("Alejandro Mendoza")
      setInboundRamo("Vehículos")
      setInboundCobertura("Cobertura Integral")
      setInboundSucursal("Guayaquil")
      setInboundFechaOcurrencia("2026-05-05")
      setInboundMontoReclamado("8400")
      setInboundMontoEstimado("8000")
      setInboundDocCompleto("No")
      setInboundDiasInicio("3")
      setInboundDiasFin("362")
      setInboundDiasEntre("15")
      setInboundHistorial("2")
      setInboundFraudeLabel("Alta/Crítica")
      setInboundNarrativa("El día 5 de mayo me encontraba estacionado fuera del centro comercial cuando otro vehículo de color gris retrocedió rápidamente y me impactó en la parte delantera izquierda. El conductor se dio a la fuga de inmediato. No hubo testigos y me percaté del golpe minutos después al regresar a mi vehículo.")
    } else {
      setInboundPoliza("POL-MED-2024-0012")
      setInboundAsegurado("1709876543")
      setInboundBeneficiario("Valentina Rossi")
      setInboundRamo("Salud")
      setInboundCobertura("Gastos Médicos Mayores")
      setInboundSucursal("Quito")
      setInboundFechaOcurrencia("2026-05-23")
      setInboundMontoReclamado("12500")
      setInboundMontoEstimado("12500")
      setInboundDocCompleto("Sí")
      setInboundDiasInicio("180")
      setInboundDiasFin("185")
      setInboundDiasEntre("1")
      setInboundHistorial("0")
      setInboundFraudeLabel("Baja")
      setInboundNarrativa("Paciente Valentina Rossi ingresó por emergencias al Hospital Metropolitano presentando un cuadro de dolor agudo abdominal generalizado compatible con apendicitis aguda. Se procedió a realizar apendicetomía laparoscópica de emergencia.")
    }
  }

  // Ejecutar el motor de ingestión (Inbound)
  const handleIntakeEmail = async () => {
    if (!inboundPoliza || !inboundAsegurado || !inboundBeneficiario || !inboundMontoReclamado) {
      alert("Por favor, pre-llene un caso de demostración o complete los campos del formulario de correo.")
      return
    }

    setIntakeRunning(true)
    setIntakeCompleted(false)
    setCreatedIntakeId("")

    try {
      await claimsService.ingestClaimEmail({
        id: inboundId,
        policyNumber: inboundPoliza,
        insuredId: inboundAsegurado,
        line: inboundRamo as any,
        cobertura: inboundCobertura,
        occurrenceDate: inboundFechaOcurrencia || new Date().toISOString().split("T")[0],
        reportDate: new Date().toISOString().split("T")[0],
        amount: Number(inboundMontoReclamado) || 0,
        estimatedAmount: Number(inboundMontoEstimado) || 0,
        paidAmount: 0,
        status: "Pendiente",
        branch: inboundSucursal,
        narrative: inboundNarrativa,
        documentsComplete: inboundDocCompleto,
        insuredName: inboundBeneficiario,
        daysSincePolicyStart: Number(inboundDiasInicio) || 0,
        daysUntilPolicyEnd: Number(inboundDiasFin) || 0,
        daysBetweenOccurrenceReport: Number(inboundDiasEntre) || 0,
        claimHistoryCount: Number(inboundHistorial) || 0,
        simulatedFraudLabel: inboundFraudeLabel
      })

      setCreatedIntakeId(inboundId)
      setIntakeCompleted(true)
      setToast({
        message: `Siniestro ${inboundId} registrado y auditado. Ya está en la bandeja de triaje.`,
        type: "success",
      })
      setTimeout(() => setToast(null), 4000)
    } catch (e) {
      console.error(e)
      setToast({
        message: "No se pudo registrar el siniestro. Verifica la conexión con el backend.",
        type: "error",
      })
      setTimeout(() => setToast(null), 4000)
    } finally {
      setIntakeRunning(false)
    }
  }

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar Lateral */}
      <Sidebar />

      {/* Panel Principal */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Cabecera superior */}
        <Header 
          title="Consola de Notificación y Entrada" 
          subtitle="Previsualización de despacho y motor de ingestión automática de siniestros por correo" 
        />

        {/* Contenido Principal */}
        <div className="flex-1 p-6 md:p-8 pb-24 lg:pb-8 space-y-6 max-w-7xl w-full mx-auto">
          
          {/* Botón superior de retroceso e interruptor de Tabs */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-2 border-b border-slate-200">
            <Link
              href={id ? `/caso/${id}` : "/"}
              className="inline-flex items-center gap-2 text-xs font-black text-brand-blue hover:text-brand-navy transition-colors py-2 px-3 border border-slate-200 bg-white shadow-xs uppercase tracking-wider rounded-none"
            >
              <ArrowLeft className="w-4 h-4" />
              Regresar al Triaje
            </Link>
            
            {/* TABS SELECTOR GEOMÉTRICO */}
            <div className="flex bg-slate-200 p-1 rounded-md border border-slate-300">
              <button
                onClick={() => setActiveTab("outbound")}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "outbound"
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-500 hover:text-brand-navy"
                }`}
              >
                1. Correo de Confirmación (Outbound)
              </button>
              <button
                onClick={() => setActiveTab("inbound")}
                className={`px-4 py-1.5 text-[11px] font-black uppercase tracking-wider transition-all duration-200 ${
                  activeTab === "inbound"
                    ? "bg-white text-brand-navy shadow-sm"
                    : "text-slate-500 hover:text-brand-navy"
                }`}
              >
                2. Ingestión de Correo (Inbound Simulator)
              </button>
            </div>
          </div>

          {/* TAB 1: BANDEJA DE SALIDA (OUTBOUND PREVIEW) */}
          {activeTab === "outbound" && (
            <>
              {loading ? (
                <div className="bg-white border border-slate-200 p-12 text-center flex flex-col items-center justify-center space-y-4">
                  <RefreshCw className="w-8 h-8 text-brand-blue animate-spin" />
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">
                    Cargando Ficha de Correo...
                  </p>
                </div>
              ) : !claim ? (
                <div className="bg-white border border-slate-200 p-12 text-center space-y-3">
                  <ShieldAlert className="w-12 h-12 text-rose-500 mx-auto" />
                  <h4 className="text-sm font-bold text-brand-navy">Siniestro No Especificado</h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto">
                    Esta pestaña previsualiza el correo de confirmación de un siniestro existente. Selecciona un caso en el Triaje y haz clic en "Ver Correo" o cámbiate a la pestaña de Ingestión.
                  </p>
                  <Link
                    href="/"
                    className="inline-block text-xs font-bold text-white bg-brand-blue hover:bg-brand-navy px-4 py-2 uppercase rounded-none"
                  >
                    Ir al Triaje
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
                  
                  {/* Columna Izquierda: Panel de Control Outbound */}
                  <div className="lg:col-span-4 space-y-6">
                    <div className="bg-white border border-slate-200 p-6 space-y-6 shadow-sm rounded-none">
                      <div className="border-b border-slate-100 pb-3">
                        <h4 className="text-xs font-black text-brand-navy uppercase tracking-widest">
                          Servicio de Notificación
                        </h4>
                      </div>

                      <div className="space-y-4 text-xs">
                        <div className="flex justify-between items-center text-xs">
                          <span className="font-bold text-slate-400">Canal de Envío:</span>
                          <span className="font-extrabold text-brand-navy font-mono">GOOGLE GMAIL API</span>
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Destinatario (Email):</label>
                          <input
                            type="email"
                            value={recipientEmail}
                            onChange={(e) => setRecipientEmail(e.target.value)}
                            className="w-full p-2 border border-slate-200 text-brand-navy rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-blue/30 font-bold"
                          />
                        </div>

                        <div className="flex flex-col gap-1.5">
                          <label className="font-bold text-slate-400 uppercase tracking-wider text-[9px]">Asunto del Correo:</label>
                          <input
                            type="text"
                            value={subjectLine}
                            onChange={(e) => setSubjectLine(e.target.value)}
                            className="w-full p-2 border border-slate-200 text-brand-navy rounded bg-slate-50 focus:outline-none focus:ring-1 focus:ring-brand-blue/30 font-bold"
                          />
                        </div>

                        <div className="flex justify-between items-center text-xs border-t border-slate-100 pt-3">
                          <span className="font-bold text-slate-400">Estado de Envío:</span>
                          {dispatchStatus === "sent" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-mono uppercase">
                              Transmitido
                            </span>
                          ) : dispatchStatus === "sending" ? (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-brand-blue bg-brand-blue/5 border border-brand-blue/20 px-2 py-0.5 rounded font-mono uppercase animate-pulse">
                              Enviando...
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-[10px] font-extrabold text-amber-600 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded font-mono uppercase">
                              Pendiente
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="pt-2">
                        {dispatchStatus === "sent" ? (
                          <div className="space-y-4">
                            <div className="bg-emerald-50/50 border border-emerald-200 p-4 flex gap-3 items-start">
                              <CheckCircle className="w-5 h-5 text-emerald-500 shrink-0 mt-0.5" />
                              <div className="space-y-1">
                                <span className="text-xs font-bold text-emerald-800">Transmisión Exitosa</span>
                                <p className="text-[10.5px] leading-relaxed text-emerald-700">
                                  {statusMessage || "El correo ha sido despachado correctamente a la bandeja del cliente."}
                                </p>
                              </div>
                            </div>
                            
                            <button
                              onClick={() => setDispatchStatus("pending")}
                              className="w-full text-center py-2.5 text-xs font-black text-brand-blue border border-brand-blue bg-white hover:bg-brand-blue/5 uppercase tracking-wider transition-colors rounded-none"
                            >
                              Simular Nuevo Envío
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={handleDispatchEmail}
                            disabled={dispatchStatus === "sending"}
                            className="w-full inline-flex items-center justify-center gap-2 py-3 bg-brand-blue hover:bg-brand-navy disabled:bg-slate-300 text-white text-xs font-black uppercase tracking-widest transition-colors rounded-none shadow-sm cursor-pointer"
                          >
                            {dispatchStatus === "sending" ? (
                              <>
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                Transmitiendo Plantilla...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4" />
                                Despachar Correo Oficial
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>

                    <div className="bg-slate-900 border border-slate-800 p-6 space-y-4 text-white rounded-none shadow-sm">
                      <div className="flex items-center gap-2 border-b border-slate-800 pb-3">
                        <Sparkles className="w-4 h-4 text-brand-lightBlue" />
                        <h5 className="text-[10px] font-black uppercase tracking-widest text-brand-lightBlue">
                          Explicabilidad de Salida
                        </h5>
                      </div>
                      <p className="text-[11px] leading-relaxed text-slate-300">
                        Esta Ficha de Despacho confirma al asegurado el radicado de su siniestro junto con todos los **20 campos oficiales** que envió, dándole explicabilidad y transparencia directa a su bandeja.
                      </p>
                    </div>
                  </div>

                  {/* Columna Derecha: Cliente de Correo */}
                  <div className="lg:col-span-8 space-y-4">
                    <div className="flex items-center justify-between bg-slate-200/80 px-4 py-2 border border-slate-300 text-slate-600 font-semibold text-xs rounded-t-md">
                      <div className="flex items-center gap-2">
                        <Inbox className="w-4 h-4 text-slate-400" />
                        <span>Visor y Editor Interactivo (Haz clic sobre el texto para modificarlo)</span>
                      </div>
                      <span className="bg-brand-blue/10 text-brand-blue text-[9px] px-2 py-0.5 rounded font-black uppercase shrink-0">
                        Editable
                      </span>
                    </div>

                    <div className="bg-white border-x border-b border-slate-200 shadow-sm rounded-b-md overflow-hidden">
                      <div className="p-5 border-b border-slate-100 bg-slate-50/50 space-y-2">
                        <div className="flex items-start justify-between text-[11px] gap-2">
                          <div className="space-y-1.5 flex-1">
                            <div>
                              <strong className="text-slate-400 font-bold uppercase tracking-wider mr-2">De:</strong>
                              <span className="font-extrabold text-slate-800">auditoria-ia@aseguradoradelsur.com</span>
                            </div>
                            <div>
                              <strong className="text-slate-400 font-bold uppercase tracking-wider mr-2">Para:</strong>
                              <span className="font-bold text-slate-700 underline">{recipientEmail}</span>
                            </div>
                            <div>
                              <strong className="text-slate-400 font-bold uppercase tracking-wider mr-2">Asunto:</strong>
                              <span className="font-extrabold text-brand-navy">
                                {subjectLine}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="bg-[#f4f6f9] p-6 overflow-x-auto min-h-[500px]">
                        {emailTemplate ? (
                          <div 
                            contentEditable
                            suppressContentEditableWarning
                            className="email-rendered-container shadow-sm mx-auto bg-white p-8 outline-none border border-slate-200 focus:border-brand-blue rounded-lg cursor-text min-h-[480px]"
                            onBlur={(e) => setEmailTemplate(e.currentTarget.innerHTML)}
                            dangerouslySetInnerHTML={{ __html: emailTemplate }} 
                          />
                        ) : (
                          <div className="text-center py-20 text-slate-400 italic text-xs">
                            Error al renderizar el correo.
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                </div>
              )}
            </>
          )}

          {/* TAB 2: SIMULADOR DE INGESTIÓN (INBOUND INTAKE SIMULATOR) */}
          {activeTab === "inbound" && (
            <div className="max-w-3xl mx-auto space-y-6">
              <div className="bg-white border border-slate-200 p-6 shadow-sm space-y-6 rounded-none">
                  
                  <div className="border-b border-slate-100 pb-3 flex items-center justify-between">
                    <div className="space-y-0.5">
                      <h4 className="text-xs font-black text-brand-navy uppercase tracking-widest">
                        Formulario de Correo del Asegurado
                      </h4>
                      <p className="text-[10px] text-slate-400 font-semibold">
                        Este es el documento que se envía por correo en blanco para que el asegurado lo llene.
                      </p>
                    </div>
                  </div>

                  {/* Botones rápidos de demo */}
                  <div className="bg-slate-50 p-4 border border-slate-200 space-y-3">
                    <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest block text-center">
                      Pre-llenado de Demostración (HackIAthon 2026)
                    </span>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        onClick={() => loadPreset("theft")}
                        className="py-2 px-3 text-[10px] font-black uppercase bg-rose-600 hover:bg-rose-700 text-white transition-colors text-center rounded-none shadow-sm cursor-pointer"
                      >
                        Caso Vehículos (Sospechoso de Fraude)
                      </button>
                      <button
                        onClick={() => loadPreset("health")}
                        className="py-2 px-3 text-[10px] font-black uppercase bg-emerald-600 hover:bg-emerald-700 text-white transition-colors text-center rounded-none shadow-sm cursor-pointer"
                      >
                        Caso Salud (Limpio Sin Alertas)
                      </button>
                    </div>
                  </div>

                  {/* Rejilla de Variables del Formulario */}
                  <div className="grid grid-cols-2 gap-4 text-xs">
                    
                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Código de Radicado (Auto):</label>
                      <input 
                        type="text" 
                        value={inboundId} 
                        readOnly 
                        className="p-2 border border-slate-200 bg-slate-50 font-mono font-bold text-brand-navy"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Código de Póliza:</label>
                      <input 
                        type="text" 
                        placeholder="ej: POL-VEH-2025-9981" 
                        value={inboundPoliza} 
                        onChange={(e) => setInboundPoliza(e.target.value)} 
                        className="p-2 border border-slate-200 font-mono text-brand-navy"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Identificación Asegurado:</label>
                      <input 
                        type="text" 
                        placeholder="ej: 1723456789" 
                        value={inboundAsegurado} 
                        onChange={(e) => setInboundAsegurado(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Nombre del Asegurado:</label>
                      <input 
                        type="text" 
                        placeholder="ej: Alejandro Mendoza" 
                        value={inboundBeneficiario} 
                        onChange={(e) => setInboundBeneficiario(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Ramo de Seguro:</label>
                      <select 
                        value={inboundRamo} 
                        onChange={(e) => setInboundRamo(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy bg-white"
                      >
                        <option value="Vehículos">Vehículos</option>
                        <option value="Salud">Salud</option>
                        <option value="Hogar">Hogar</option>
                        <option value="Vida">Vida</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Sucursal:</label>
                      <select 
                        value={inboundSucursal} 
                        onChange={(e) => setInboundSucursal(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy bg-white"
                      >
                        <option value="Guayaquil">Guayaquil</option>
                        <option value="Quito">Quito</option>
                        <option value="Cuenca">Cuenca</option>
                      </select>
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Monto Reclamado (USD):</label>
                      <input 
                        type="number" 
                        placeholder="ej: 8400" 
                        value={inboundMontoReclamado} 
                        onChange={(e) => setInboundMontoReclamado(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy font-bold"
                      />
                    </div>

                    <div className="flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Etiqueta Fraude IA (Simulada):</label>
                      <select 
                        value={inboundFraudeLabel} 
                        onChange={(e) => setInboundFraudeLabel(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy bg-white font-extrabold"
                      >
                        <option value="Alta/Crítica">Alta/Crítica (Fraude)</option>
                        <option value="Media">Media (Duda)</option>
                        <option value="Baja">Baja (Seguro)</option>
                      </select>
                    </div>

                    {/* Campos cronológicos ocultos en formulario simple pero necesarios */}
                    <div className="col-span-2 grid grid-cols-4 gap-2 bg-slate-50 p-2.5 border border-slate-200 rounded">
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Días Inicio Póliza</label>
                        <input type="number" value={inboundDiasInicio} onChange={(e) => setInboundDiasInicio(e.target.value)} className="p-1 border border-slate-200 bg-white text-[10px]" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Días Fin Póliza</label>
                        <input type="number" value={inboundDiasFin} onChange={(e) => setInboundDiasFin(e.target.value)} className="p-1 border border-slate-200 bg-white text-[10px]" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Días Ocurrencia-Rep</label>
                        <input type="number" value={inboundDiasEntre} onChange={(e) => setInboundDiasEntre(e.target.value)} className="p-1 border border-slate-200 bg-white text-[10px]" />
                      </div>
                      <div className="flex flex-col gap-0.5">
                        <label className="text-[8px] font-bold text-slate-400 uppercase">Historial Siniestros</label>
                        <input type="number" value={inboundHistorial} onChange={(e) => setInboundHistorial(e.target.value)} className="p-1 border border-slate-200 bg-white text-[10px]" />
                      </div>
                    </div>

                    <div className="col-span-2 flex flex-col gap-1">
                      <label className="font-bold text-slate-400 uppercase tracking-wider">Descripción de los Hechos (Narrativa):</label>
                      <textarea 
                        rows={3} 
                        placeholder="Detalle exactamente lo ocurrido..." 
                        value={inboundNarrativa} 
                        onChange={(e) => setInboundNarrativa(e.target.value)} 
                        className="p-2 border border-slate-200 text-brand-navy font-semibold resize-none"
                      />
                    </div>

                  </div>

                  <div className="pt-2">
                    <button
                      onClick={handleIntakeEmail}
                      disabled={intakeRunning}
                      className="w-full inline-flex items-center justify-center gap-2 py-3 bg-brand-navy hover:bg-brand-blue text-white text-xs font-black uppercase tracking-widest transition-colors rounded-none shadow-sm cursor-pointer disabled:bg-slate-300"
                    >
                      {intakeRunning ? (
                        <>
                          <RefreshCw className="w-4 h-4 animate-spin" />
                          Procesando ingesta…
                        </>
                      ) : (
                        <>
                          <Play className="w-4 h-4 fill-current" />
                          Simular Envío de Correo (Responder)
                        </>
                      )}
                    </button>
                  </div>

              </div>

              {intakeCompleted && createdIntakeId && (
                <div className="bg-emerald-50 border border-emerald-200 p-6 space-y-4 shadow-sm animate-fade-in">
                  <div className="flex gap-3 items-start">
                    <CheckCircle className="w-6 h-6 text-emerald-500 shrink-0 mt-0.5" />
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-emerald-900 uppercase tracking-wide">
                        Siniestro ingerido exitosamente
                      </h4>
                      <p className="text-xs text-emerald-800 leading-relaxed">
                        ShieldMind AI registró el radicado <strong>{createdIntakeId}</strong> y lo auditó automáticamente. Ya está disponible en la bandeja central.
                      </p>
                    </div>
                  </div>

                  <div className="pt-2 flex items-center justify-between gap-4">
                    <span className="text-[10px] text-emerald-600 font-bold font-mono">
                      ID: {createdIntakeId}
                    </span>
                    <Link
                      href={`/caso/${createdIntakeId}`}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-black uppercase tracking-wider transition-all rounded-none shadow-xs cursor-pointer"
                    >
                      Ver caso
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              )}
            </div>
          )}

        </div>

      </main>

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
