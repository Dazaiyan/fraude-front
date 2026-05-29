import React, { useState, useEffect } from "react"
import Link from "next/link"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { claimsService } from "@/services/claims"
import { 
  Shield, 
  ArrowLeft, 
  Send, 
  CheckCircle, 
  Sparkles, 
  FileText, 
  DollarSign, 
  Hash, 
  User, 
  ChevronRight,
  Database,
  Calendar,
  Layers,
  MapPin,
  Clock,
  Activity,
  FileCheck,
  Image as ImageIcon
} from "lucide-react"

export default function ReportarSiniestro() {
  // 20 campos obligatorios de la TABLA: SINIESTROS
  const [idSiniestro] = useState(`SHM-${Math.floor(1000 + Math.random() * 9000)}`)
  const [idPoliza, setIdPoliza] = useState("")
  const [idAsegurado, setIdAsegurado] = useState("")
  const [ramo, setRamo] = useState("Vehículos")
  const [cobertura, setCobertura] = useState("Cobertura Integral")
  const [fechaOcurrencia, setFechaOcurrencia] = useState("")
  const [fechaReporte] = useState(new Date().toISOString().split("T")[0])
  const [montoReclamado, setMontoReclamado] = useState("")
  const [montoEstimado, setMontoEstimado] = useState("")
  const [montoPagado] = useState("0") // Protegido, por defecto 0 USD al reportarse
  const [estado] = useState("Pendiente") // Protegido, por defecto Pendiente al registrar
  const [sucursal, setSucursal] = useState("Guayaquil")
  const [descripcion, setDescripcion] = useState("")
  const [documentosCompletos, setDocumentosCompletos] = useState("No")
  const [beneficiario, setBeneficiario] = useState("")
  const [diasDesdeInicioPoliza, setDiasDesdeInicioPoliza] = useState("")
  const [diasDesdeFinPoliza, setDiasDesdeFinPoliza] = useState("")
  const [diasEntreOcurrenciaReporte, setDiasEntreOcurrenciaReporte] = useState("")
  const [historialSiniestrosAsegurado, setHistorialSiniestrosAsegurado] = useState("")
  const [etiquetaFraudeSimulada, setEtiquetaFraudeSimulada] = useState("Alta/Crítica")

  // Auto-calcular días entre la ocurrencia del siniestro y la fecha de reporte
  useEffect(() => {
    if (fechaOcurrencia && fechaReporte) {
      const dateOcur = new Date(fechaOcurrencia)
      const dateRep = new Date(fechaReporte)
      
      // Ajustar zonas horarias para cálculo exacto de días locales
      const utc1 = Date.UTC(dateOcur.getFullYear(), dateOcur.getMonth(), dateOcur.getDate())
      const utc2 = Date.UTC(dateRep.getFullYear(), dateRep.getMonth(), dateRep.getDate())
      
      const diffTime = utc2 - utc1
      const diffDays = Math.max(0, Math.floor(diffTime / (1000 * 60 * 60 * 24)))
      setDiasEntreOcurrenciaReporte(String(diffDays))
    }
  }, [fechaOcurrencia, fechaReporte])
  
  // Pruebas fotográficas adjuntas
  const [images, setImages] = useState<string[]>([])

  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const [createdId, setCreatedId] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    
    setLoading(true)
    try {
      // Simular tiempo de transmisión de red
      await new Promise(resolve => setTimeout(resolve, 800))
      
      const response = await claimsService.postNewClaim({
        id: idSiniestro,
        policyNumber: idPoliza,
        insuredId: idAsegurado,
        line: ramo as any,
        cobertura: cobertura,
        occurrenceDate: fechaOcurrencia,
        reportDate: fechaReporte,
        amount: Number(montoReclamado) || 0,
        estimatedAmount: Number(montoEstimado) || 0,
        paidAmount: Number(montoPagado) || 0,
        status: estado as any,
        branch: sucursal,
        narrative: descripcion,
        documentsComplete: documentosCompletos,
        insuredName: beneficiario,
        daysSincePolicyStart: Number(diasDesdeInicioPoliza) || 0,
        daysUntilPolicyEnd: Number(diasDesdeFinPoliza) || 0,
        daysBetweenOccurrenceReport: Number(diasEntreOcurrenciaReporte) || 0,
        claimHistoryCount: Number(historialSiniestrosAsegurado) || 0,
        simulatedFraudLabel: etiquetaFraudeSimulada
      })
      
      if (response.success) {
        setCreatedId(idSiniestro)
        setSuccess(true)
      }
    } catch (err) {
      console.error(err)
      alert("Hubo un problema al transmitir el reporte. Por favor intente nuevamente.")
    } finally {
      setLoading(false)
    }
  }

  const handleReset = () => {
    setIdPoliza("")
    setIdAsegurado("")
    setRamo("Vehículos")
    setCobertura("Cobertura Integral")
    setFechaOcurrencia("")
    setMontoReclamado("")
    setMontoEstimado("")
    setSucursal("Guayaquil")
    setDescripcion("")
    setDocumentosCompletos("No")
    setBeneficiario("")
    setDiasDesdeInicioPoliza("")
    setDiasDesdeFinPoliza("")
    setDiasEntreOcurrenciaReporte("")
    setHistorialSiniestrosAsegurado("")
    setEtiquetaFraudeSimulada("Alta/Crítica")
    setImages([])
    setSuccess(false)
  }

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const filesArray = Array.from(e.target.files)
      filesArray.forEach(file => {
        const reader = new FileReader()
        reader.onloadend = () => {
          setImages(prev => [...prev, reader.result as string])
        }
        reader.readAsDataURL(file)
      })
    }
  }

  const handleRemoveImage = (index: number) => {
    setImages(prev => prev.filter((_, i) => i !== index))
  }

  // Dynamic color styling for simulated fraud label
  const getFraudStyle = () => {
    switch (etiquetaFraudeSimulada) {
      case "Ninguna":
      case "Baja":
        return {
          container: "bg-emerald-50/20 focus-within:bg-emerald-50/40 border-l-2 border-l-emerald-400",
          label: "text-emerald-700",
          icon: "text-emerald-500",
          select: "text-emerald-700"
        }
      case "Media":
        return {
          container: "bg-amber-50/20 focus-within:bg-amber-50/40 border-l-2 border-l-amber-400",
          label: "text-amber-700",
          icon: "text-amber-500",
          select: "text-amber-700"
        }
      case "Alta/Crítica":
      default:
        return {
          container: "bg-rose-50/20 focus-within:bg-rose-50/40 border-l-2 border-l-rose-400",
          label: "text-rose-700",
          icon: "text-rose-500",
          select: "text-rose-700"
        }
    }
  }

  const fraudStyle = getFraudStyle()

  return (
    <div className="flex bg-slate-50 min-h-screen">
      {/* Sidebar Lateral */}
      <Sidebar />

      {/* Panel Principal */}
      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        
        {/* Header superior */}
        <Header 
          title="Ficha Registral de Siniestros" 
          subtitle="Formulario oficial estructurado para la base de datos de Aseguradora del Sur" 
        />

        {/* Cuerpo Principal del Formulario (Grande: max-w-6xl para mayor presencia e impacto visual) */}
        <div className="flex-1 p-6 md:p-8 pb-24 lg:pb-8 space-y-6 max-w-6xl w-full mx-auto">
          
          {/* Fila superior de título interno */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h3 className="text-base font-bold text-brand-navy flex items-center gap-2">
                <Database className="w-5 h-5 text-brand-blue" />
                Registrar Nuevo Expediente
              </h3>
              <p className="text-xs text-slate-500 font-medium">
                Ingrese las variables de la base de datos central de Aseguradora del Sur
              </p>
            </div>
            
            <Link
              href="/"
              className="inline-flex items-center gap-1.5 text-xs font-black text-brand-blue hover:text-brand-navy transition-colors py-2 px-3 hover:bg-slate-100 rounded-md uppercase tracking-wider print:hidden"
            >
              <ArrowLeft className="w-4 h-4" />
              <span>Volver al Triaje</span>
            </Link>
          </div>

          {/* Contenedor Principal (Elegant canvas styled like an official paper registry document) */}
          <div className="bg-white border border-slate-200 shadow-premium rounded-lg overflow-hidden w-full">
            
            {success ? (
              /* Vista de Éxito al Reportar */
              <div className="p-8 text-center space-y-6 flex flex-col items-center justify-center">
                <div className="w-16 h-16 bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-500 rounded-md">
                  <CheckCircle className="w-10 h-10" />
                </div>

                <div className="space-y-2">
                  <h2 className="text-xl font-black text-brand-navy">¡Ficha Registral de Siniestro Transmitida con Éxito!</h2>
                  <p className="text-xs font-semibold text-slate-500 max-w-xl mx-auto leading-relaxed">
                    El expediente de reclamación bajo la estructura oficial de la base de datos **TABLA: SINIESTROS** ha sido registrado e insertado en la base de datos central de Aseguradora del Sur. El triaje ético de IA se encuentra auditando los parámetros en tiempo real.
                  </p>
                </div>

                {/* ID de Radicado */}
                <div className="p-4 bg-brand-navy text-white rounded-md font-mono text-center inline-block shadow-sm">
                  <span className="text-[10px] block text-slate-400 font-bold uppercase tracking-widest mb-0.5">ID Siniestro Generado</span>
                  <span className="text-lg font-black text-brand-lightBlue">{createdId}</span>
                </div>

                {/* Explicación de paso de IA */}
                <div className="p-4 bg-brand-lightBlue/5 border border-brand-lightBlue/10 rounded-md max-w-xl text-left flex gap-3">
                  <Sparkles className="w-6 h-6 text-brand-lightBlue shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-[11px] font-black text-brand-navy uppercase tracking-wider mb-0.5">ShieldMind Engine v2.4 Activado</h4>
                    <p className="text-[10.5px] text-brand-navy font-semibold leading-relaxed">
                      El análisis de contradicciones lingüísticas BERT (NLP) ha detectado las banderas configuradas de score, bloqueando preventivamente el siniestro para la bandeja de triaje manual con un score simulado de alto riesgo.
                    </p>
                  </div>
                </div>

                {/* Acciones de éxito */}
                <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full justify-center">
                  <button
                    onClick={handleReset}
                    className="px-5 py-3 border border-slate-200 text-xs font-black uppercase tracking-wider text-brand-navy hover:bg-slate-50 transition-all rounded-md cursor-pointer select-none"
                  >
                    Registrar Otro Reporte
                  </button>
                  <Link
                    href="/"
                    className="px-5 py-3 bg-brand-blue text-white text-xs font-black uppercase tracking-wider hover:bg-brand-navy flex items-center justify-center gap-1.5 shadow-sm transition-all rounded-md"
                  >
                    <span>Ir a la Bandeja Central</span>
                    <ChevronRight className="w-4 h-4" />
                  </Link>
                </div>
              </div>
            ) : (
              /* Formulario de Entrada Estilo Plantilla de Base de Datos */
              <form onSubmit={handleSubmit} className="p-8 space-y-8">
                
                {/* Encabezado del Documento Oficial */}
                <div className="pb-6 border-b border-slate-200 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                  <div>
                    <span className="text-[10px] text-brand-blue font-black uppercase tracking-widest block mb-0.5">
                      Aseguradora del Sur • Sistema Triage
                    </span>
                    <h2 className="text-base font-black text-brand-navy flex items-center gap-2">
                      <Database className="w-5 h-5 text-brand-blue" />
                      FICHA REGISTRAL DE EXPEDIENTE — BASE DE DATOS
                    </h2>
                  </div>
                  
                  {/* ID Siniestro (Protegido / No Modificable) */}
                  <div className="bg-slate-100 border border-slate-200 text-slate-500 px-4 py-2 font-mono text-[11px] font-black rounded-md flex flex-col items-center justify-center shadow-sm select-none">
                    <span className="text-[8px] text-slate-400 uppercase font-black tracking-widest mb-0.5">ID del Siniestro (Protegido)</span>
                    <span className="text-sm tracking-tight text-slate-700">{idSiniestro}</span>
                  </div>
                </div>

                {/* GRID ESTRUCTURADO ESTILO PLANTILLA CONTRACTUAL (20 Campos Integrados) */}
                <div className="space-y-6">
                  
                  {/* SECCIÓN A: DATOS GENERALES DEL EXPEDIENTE */}
                  <div>
                    <h3 className="text-[10.5px] text-brand-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Layers className="w-4 h-4 text-brand-blue" />
                      Sección A: Datos Generales del Expediente (Valores de Control)
                    </h3>
                    
                    {/* Grid de 3 Columnas con Bordes Finos */}
                    <div className="border-t border-l border-slate-200 grid grid-cols-1 md:grid-cols-3">
                      
                      {/* 1. id_siniestro (Protegido) */}
                      <div className="p-3 border-r border-b border-slate-200 bg-slate-50/70 flex flex-col justify-between select-none">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">ID del Siniestro [PROTEGIDO]</label>
                        <span className="text-xs font-mono font-black text-slate-500">{idSiniestro}</span>
                      </div>

                      {/* 2. fecha_reporte (Protegido - Auto Rellenado) */}
                      <div className="p-3 border-r border-b border-slate-200 bg-slate-50/70 flex flex-col justify-between select-none">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fecha de Reporte [PROTEGIDO]</label>
                        <span className="text-xs font-mono font-black text-slate-500">{fechaReporte}</span>
                      </div>

                      {/* 3. estado (Protegido - Por Defecto Pendiente) */}
                      <div className="p-3 border-r border-b border-slate-200 bg-slate-50/70 flex flex-col justify-between select-none">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Estado de Reclamación [PROTEGIDO]</label>
                        <span className="text-xs font-black uppercase text-brand-blue">{estado}</span>
                      </div>

                    </div>
                  </div>

                  {/* SECCIÓN B: IDENTIFICACIÓN Y CONTRATO */}
                  <div>
                    <h3 className="text-[10.5px] text-brand-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <User className="w-4 h-4 text-brand-blue" />
                      Sección B: Identificación y Contratación
                    </h3>
                    
                    {/* Grid de 3 Columnas */}
                    <div className="border-t border-l border-slate-200 grid grid-cols-1 md:grid-cols-3">
                      
                      {/* 4. id_poliza */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Código de Póliza *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. POL-VEH-2025-9981"
                          value={idPoliza}
                          onChange={(e) => setIdPoliza(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                      {/* 5. id_asegurado */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Identificación del Asegurado *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. 1723456789"
                          value={idAsegurado}
                          onChange={(e) => setIdAsegurado(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                      {/* 6. beneficiario */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Nombre del Beneficiario *</label>
                        <input
                          type="text"
                          required
                          placeholder="e.g. Alejandro Mendoza"
                          value={beneficiario}
                          onChange={(e) => setBeneficiario(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                      {/* 7. ramo */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Ramo de Seguro *</label>
                        <select
                          value={ramo}
                          onChange={(e) => setRamo(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-brand-navy focus:ring-0 focus:outline-none cursor-pointer"
                        >
                          <option value="Vehículos">Vehículos</option>
                          <option value="Salud">Salud</option>
                          <option value="Incendios">Incendios</option>
                          <option value="Vida">Vida</option>
                          <option value="Hogar">Hogar</option>
                        </select>
                      </div>

                      {/* 8. cobertura (Spans 2 cols on md) */}
                      <div className="p-3 border-r border-b border-slate-200 md:col-span-2 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Cobertura Contratada *</label>
                        <select
                          value={cobertura}
                          onChange={(e) => setCobertura(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-brand-navy focus:ring-0 focus:outline-none cursor-pointer"
                        >
                          <option value="Cobertura Integral">Cobertura Integral Automotriz (Daños Totales y Parciales)</option>
                          <option value="Gastos Médicos Mayores">Gastos Médicos Mayores con Convenio Clínico</option>
                          <option value="Pérdidas Totales y Robo">Pérdidas Totales por Accidente de Tránsito</option>
                          <option value="Daños Estructurales y Contenido">Daños Estructurales y Contenido del Hogar</option>
                          <option value="Indemnización por Fallecimiento">Indemnización Directa y Gastos Exequiales</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* SECCIÓN C: CRONOLOGÍA Y TIEMPOS */}
                  <div>
                    <h3 className="text-[10.5px] text-brand-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <Clock className="w-4 h-4 text-brand-blue" />
                      Sección C: Cronología e Historial de Tiempos
                    </h3>
                    
                    {/* Grid de 4 Columnas */}
                    <div className="border-t border-l border-slate-200 grid grid-cols-1 md:grid-cols-4">
                      
                      {/* 9. sucursal */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Sucursal de Registro *</label>
                        <select
                          value={sucursal}
                          onChange={(e) => setSucursal(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-brand-navy focus:ring-0 focus:outline-none cursor-pointer"
                        >
                          <option value="Guayaquil">Guayaquil (Costa)</option>
                          <option value="Quito">Quito (Sierra)</option>
                          <option value="Cuenca">Cuenca (Austral)</option>
                          <option value="Ambato">Ambato (Central)</option>
                          <option value="Manta">Manta (Pacífico)</option>
                        </select>
                      </div>

                      {/* 10. fecha_ocurrencia */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Fecha del Accidente *</label>
                        <input
                          type="date"
                          required
                          value={fechaOcurrencia}
                          onChange={(e) => setFechaOcurrencia(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                      {/* 11. dias_desde_inicio_poliza */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Días desde Inicio de Póliza</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 15"
                          value={diasDesdeInicioPoliza}
                          onChange={(e) => setDiasDesdeInicioPoliza(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                      {/* 12. dias_desde_fin_poliza */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Días hasta Fin de Póliza</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 350"
                          value={diasDesdeFinPoliza}
                          onChange={(e) => setDiasDesdeFinPoliza(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                      {/* 13. dias_entre_ocurrencia_reporte */}
                      <div className="p-3 border-r border-b border-slate-200 md:col-span-2 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Días entre Accidente y Reporte</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 3"
                          value={diasEntreOcurrenciaReporte}
                          onChange={(e) => setDiasEntreOcurrenciaReporte(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none animate-none"
                        />
                      </div>

                      {/* 14. historial_siniestros_asegurado */}
                      <div className="p-3 border-r border-b border-slate-200 md:col-span-2 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Siniestros Anteriores del Asegurado</label>
                        <input
                          type="number"
                          min="0"
                          placeholder="e.g. 0"
                          value={historialSiniestrosAsegurado}
                          onChange={(e) => setHistorialSiniestrosAsegurado(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                        />
                      </div>

                    </div>
                  </div>

                  {/* SECCIÓN D: ANÁLISIS FINANCIERO Y CONTROL IA */}
                  <div>
                    <h3 className="text-[10.5px] text-brand-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <DollarSign className="w-4 h-4 text-brand-blue" />
                      Sección D: Análisis Financiero y Simulación de IA
                    </h3>
                    
                    {/* Grid de 3 Columnas */}
                    <div className="border-t border-l border-slate-200 grid grid-cols-1 md:grid-cols-3">
                      
                      {/* 15. monto_reclamado */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Monto Reclamado (USD) *</label>
                        <div className="relative mt-1 flex items-center">
                          <span className="text-slate-400 text-xs font-bold mr-1">$</span>
                          <input
                            type="number"
                            required
                            placeholder="0"
                            value={montoReclamado}
                            onChange={(e) => setMontoReclamado(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 16. monto_estimado */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Monto Estimado de Daños (USD) *</label>
                        <div className="relative mt-1 flex items-center">
                          <span className="text-slate-400 text-xs font-bold mr-1">$</span>
                          <input
                            type="number"
                            required
                            placeholder="0"
                            value={montoEstimado}
                            onChange={(e) => setMontoEstimado(e.target.value)}
                            className="w-full bg-transparent border-none p-0 text-xs font-mono font-bold text-brand-navy focus:ring-0 focus:outline-none"
                          />
                        </div>
                      </div>

                      {/* 17. monto_pagado (Protegido - Por Defecto 0 USD) */}
                      <div className="p-3 border-r border-b border-slate-200 bg-slate-50/70 flex flex-col justify-between select-none">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">Monto Pagado Inicial [PROTEGIDO]</label>
                        <span className="text-xs font-mono font-black text-slate-500">$0 USD</span>
                      </div>

                      {/* 18. documentos_completos */}
                      <div className="p-3 border-r border-b border-slate-200 flex flex-col justify-between focus-within:bg-brand-blue/5 transition-all">
                        <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-1">¿Documentos Completos? *</label>
                        <select
                          value={documentosCompletos}
                          onChange={(e) => setDocumentosCompletos(e.target.value)}
                          className="w-full bg-transparent border-none p-0 text-xs font-bold text-brand-navy focus:ring-0 focus:outline-none cursor-pointer"
                        >
                          <option value="Sí">Sí (Requisitos completos)</option>
                          <option value="No">No (Incompletos / Pendientes)</option>
                        </select>
                      </div>

                      {/* 19. etiqueta_fraude_simulada (Spans 2 cols, styled as a highlighted control block) */}
                      <div className={`p-3 border-r border-b border-slate-200 md:col-span-2 flex flex-col justify-between transition-all ${fraudStyle.container}`}>
                        <label className={`font-sans text-[9.5px] font-black uppercase tracking-widest block mb-1 flex items-center gap-1 ${fraudStyle.label}`}>
                          <Sparkles className={`w-3.5 h-3.5 animate-pulse ${fraudStyle.icon}`} />
                          Simulación de Nivel de Riesgo *
                        </label>
                        <select
                          value={etiquetaFraudeSimulada}
                          onChange={(e) => setEtiquetaFraudeSimulada(e.target.value)}
                          className={`w-full bg-transparent border-none p-0 text-xs font-black uppercase tracking-wider focus:ring-0 focus:outline-none cursor-pointer ${fraudStyle.select}`}
                        >
                          <option value="Ninguna" className="text-emerald-700">Ninguna (Riesgo Bajo / Semáforo Verde)</option>
                          <option value="Baja" className="text-emerald-700">Baja (Riesgo Bajo / Semáforo Verde)</option>
                          <option value="Media" className="text-amber-700">Media (Riesgo Medio / Semáforo Amarillo)</option>
                          <option value="Alta/Crítica" className="text-rose-700">Alta/Crítica (Riesgo Alto / Semáforo Rojo)</option>
                        </select>
                      </div>

                    </div>
                  </div>

                  {/* SECCIÓN E: HECHOS Y DECLARACIÓN */}
                  <div>
                    <h3 className="text-[10.5px] text-brand-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-brand-blue" />
                      Sección E: Descripción Circunstancial de los Hechos
                    </h3>
                    
                    {/* 20. descripcion (Full Spanned Cell) */}
                    <div className="border border-slate-200 p-4 focus-within:bg-brand-blue/5 transition-all">
                      <label className="font-sans text-[9px] font-bold text-slate-400 uppercase tracking-widest block mb-2">Descripción de los Hechos *</label>
                      <textarea
                        required
                        rows={5}
                        value={descripcion}
                        onChange={(e) => setDescripcion(e.target.value)}
                        placeholder="Redacte minuciosamente las circunstancias, hechos, lugar y detalles del siniestro ocurrido..."
                        className="w-full bg-transparent border-none p-0 text-xs font-semibold leading-relaxed text-brand-navy focus:ring-0 focus:outline-none"
                      />
                    </div>
                  </div>

                  {/* SECCIÓN F: PRUEBAS FOTOGRÁFICAS Y ARCHIVOS DE SOPORTE */}
                  <div>
                    <h3 className="text-[10.5px] text-brand-blue font-black uppercase tracking-widest mb-3 flex items-center gap-1.5">
                      <FileCheck className="w-4 h-4 text-brand-blue" />
                      Sección F: Pruebas Fotográficas y Documentales (Evidencias de Soporte)
                    </h3>
                    
                    <div className="border border-slate-200 p-6 bg-slate-50/30 rounded-md space-y-4">
                      {/* Drag & Drop File Zone */}
                      <div className="border-2 border-dashed border-slate-300 rounded-lg p-8 text-center hover:border-brand-blue/50 hover:bg-brand-blue/5 transition-all relative group cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          multiple
                          onChange={handleImageUpload}
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                        />
                        <div className="flex flex-col items-center justify-center space-y-2">
                          <div className="p-3 bg-white border border-slate-200 rounded-md shadow-sm group-hover:scale-105 transition-transform">
                            <ImageIcon className="w-6 h-6 text-brand-blue" />
                          </div>
                          <div>
                            <p className="text-xs font-bold text-brand-navy">Arrastre o seleccione fotos del siniestro</p>
                            <p className="text-[10px] text-slate-400 font-medium mt-0.5">Soporta múltiples archivos PNG, JPG o JPEG. Máx. 10MB por archivo.</p>
                          </div>
                        </div>
                      </div>

                      {/* Image Preview Grid */}
                      {images.length > 0 && (
                        <div className="grid grid-cols-2 sm:grid-cols-4 md:grid-cols-6 gap-4 pt-2">
                          {images.map((img, index) => (
                            <div key={index} className="relative group aspect-square rounded-md overflow-hidden border border-slate-200 bg-white shadow-sm">
                              <img src={img} alt={`Prueba ${index + 1}`} className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => handleRemoveImage(index)}
                                className="absolute top-1.5 right-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-none w-6 h-6 flex items-center justify-center shadow-md transition-all select-none cursor-pointer"
                                title="Eliminar prueba"
                              >
                                <span className="text-[10px] font-black uppercase">✕</span>
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                </div>

                {/* Botón de Envío Oficial */}
                <div className="pt-6 border-t border-slate-200 flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-8 py-3.5 bg-brand-blue text-white hover:bg-brand-navy rounded-md text-xs font-black uppercase tracking-widest cursor-pointer shadow-md transition-all select-none"
                  >
                    {loading ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        <span>Transmitiendo Ficha de Siniestro...</span>
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        <span>Transmitir Siniestro (POST)</span>
                      </>
                    )}
                  </button>
                </div>

              </form>
            )}

          </div>

        </div>

      </main>
    </div>
  )
}
