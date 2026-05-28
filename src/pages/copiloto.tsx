import React, { useState, useEffect, useRef } from "react"
import Sidebar from "@/components/layout/Sidebar"
import Header from "@/components/layout/Header"
import { claimsService, ChatMessage, Claim } from "@/services/claims"
import { useSiniestros } from "@/hooks/useSiniestros"
import { displayClaimId } from "@/services/mappers"
import {
  MessageSquare,
  Sparkles,
  Send,
  Database,
  ShieldAlert,
  HelpCircle,
  User,
  AlertTriangle,
  ArrowRight,
  Shield,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { formatChatTime } from "@/lib/formatChatTime"

function buildCaseWelcome(claim: Claim): ChatMessage {
  return {
    sender: "ai",
    text: `Hola, soy tu **Copiloto AI de Siniestro**. Estoy conectado al expediente **${displayClaimId(claim.id)}** (${claim.insuredName}). Pregúntame por las causas de su score de riesgo, solicitar resúmenes, o consultarme sobre qué documentos le hacen falta para agilizar la resolución.`,
    timestamp: formatChatTime(),
  }
}

const defaultGlobalMessage: ChatMessage = {
  sender: "ai",
  text: "Bienvenido al **Centro de Control e Integridad**. Aquí puedes hacer **Consultas Agénticas Globales** sobre la concentración de alertas rojas, proveedores en listas restrictivas, o anomalías territoriales a nivel nacional.",
  timestamp: formatChatTime(),
}

export default function CopilotoControlCenter() {
  const { claims, loading, summary } = useSiniestros()
  const [activeTab, setActiveTab] = useState<"case" | "global">("case")
  const [selectedClaimId, setSelectedClaimId] = useState("")
  const [inputValue, setInputValue] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const chatEndRef = useRef<HTMLDivElement>(null)

  const [caseMessages, setCaseMessages] = useState<ChatMessage[]>([])
  const [globalMessages, setGlobalMessages] = useState<ChatMessage[]>([defaultGlobalMessage])

  const selectedClaim = claims.find((c) => c.id === selectedClaimId) ?? null
  const activeMessages = activeTab === "case" ? caseMessages : globalMessages

  useEffect(() => {
    if (claims.length === 0 || selectedClaimId) return
    const featured = claims.find((c) => c.riskLevel === "high") ?? claims[0]
    setSelectedClaimId(featured.id)
    setCaseMessages([buildCaseWelcome(featured)])
  }, [claims, selectedClaimId])

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [caseMessages, globalMessages, isTyping, activeTab])

  const handleClaimChange = (claimId: string) => {
    setSelectedClaimId(claimId)
    const claim = claims.find((c) => c.id === claimId)
    if (claim) setCaseMessages([buildCaseWelcome(claim)])
  }

  const handleSendMessage = async (text: string, tabOverride?: "case" | "global") => {
    if (!text.trim()) return

    const currentTab = tabOverride || activeTab
    const timestamp = formatChatTime()

    const userMsg: ChatMessage = { sender: "user", text, timestamp }

    if (currentTab === "case") {
      setCaseMessages((prev) => [...prev, userMsg])
    } else {
      setGlobalMessages((prev) => [...prev, userMsg])
    }

    setInputValue("")
    setIsTyping(true)

    try {
      const reply = await claimsService.sendMessageToAgent(selectedClaimId, text, currentTab)

      const aiMsg: ChatMessage = {
        sender: "ai",
        text: reply,
        timestamp: formatChatTime(),
      }

      if (currentTab === "case") {
        setCaseMessages((prev) => [...prev, aiMsg])
      } else {
        setGlobalMessages((prev) => [...prev, aiMsg])
      }
    } catch (e) {
      console.error(e)
    } finally {
      setIsTyping(false)
    }
  }

  const formatText = (txt: string) => {
    return txt.split("\n").map((line, i) => {
      const formatted = line.replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
      return (
        <p key={i} className="text-xs my-1 leading-relaxed" dangerouslySetInnerHTML={{ __html: formatted }} />
      )
    })
  }

  const criticalCount = summary?.by_color?.Rojo ?? claims.filter((c) => c.riskLevel === "high").length

  return (
    <div className="flex bg-slate-50 min-h-screen">
      <Sidebar />

      <main className="flex-1 flex flex-col min-h-screen overflow-y-auto">
        <Header
          title="Centro de Control: Copiloto Antifraude"
          subtitle="Panel central de auditoría y consultas en lenguaje natural para la aseguradora"
        />

        <div className="flex-1 p-6 md:p-8 pb-24 lg:pb-8 grid grid-cols-1 xl:grid-cols-12 gap-8 max-w-7xl w-full mx-auto">
          <div className="xl:col-span-5 space-y-6 flex flex-col justify-start">
            <div className="bg-white border border-slate-200 rounded-lg p-5 shadow-sm">
              <h3 className="text-xs font-black text-brand-navy uppercase tracking-wider mb-4 flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-brand-blue" />
                Resumen de Alertas Activas
              </h3>

              <div className="grid grid-cols-2 gap-3.5">
                <div className="bg-rose-50 border border-rose-100 rounded-md p-3.5">
                  <span className="text-[10px] font-bold text-rose-500 uppercase tracking-wider block">
                    Alertas Críticas
                  </span>
                  <span className="text-xl font-black text-rose-600 block mt-1">
                    {loading ? "…" : `${criticalCount} Casos`}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    Model 2 (Rojo)
                  </span>
                </div>

                <div className="bg-brand-lightBlue/5 border border-brand-lightBlue/10 rounded-md p-3.5">
                  <span className="text-[10px] font-bold text-brand-lightBlue uppercase tracking-wider block">
                    Siniestros en Base
                  </span>
                  <span className="text-xl font-black text-brand-navy block mt-1">
                    {loading ? "…" : summary?.total ?? claims.length}
                  </span>
                  <span className="text-[10px] text-slate-500 font-semibold block mt-0.5">
                    Datos en vivo
                  </span>
                </div>
              </div>

              <div className="mt-4 p-3 bg-amber-50 border border-amber-100 rounded-md flex items-start gap-2.5">
                <AlertTriangle className="w-4.5 h-4.5 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <span className="text-[10px] font-black text-amber-800 uppercase tracking-wider block">
                    Alerta de Proveedor Crítico
                  </span>
                  <p className="text-[11px] text-brand-navy font-bold mt-1">
                    Taller San José (Guayaquil)
                  </p>
                  <p className="text-[10.5px] text-slate-600 font-medium mt-0.5 leading-relaxed">
                    Concentra el 45% de alertas rojas en la sucursal de Guayaquil con 4 expedientes en investigación.
                  </p>
                </div>
              </div>
            </div>

            {selectedClaim && (
              <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 bg-brand-blue flex items-center justify-center rounded-md border border-brand-lightBlue/20 text-brand-lightBlue">
                    <Shield className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-[9px] text-[#00adef] font-bold tracking-wider uppercase block">
                      Expediente Activo
                    </span>
                    <span className="text-xs font-black text-white block">
                      {selectedClaim.insuredName} ({displayClaimId(selectedClaim.id)})
                    </span>
                  </div>
                </div>
                <Link
                  href={`/caso/${encodeURIComponent(selectedClaim.id)}`}
                  className="text-[10px] font-bold text-white hover:text-[#00adef] bg-slate-800 px-3 py-1.5 rounded-md border border-slate-700 hover:border-brand-lightBlue flex items-center gap-1 transition-all"
                >
                  Ver Expediente
                  <ArrowRight className="w-3 h-3" />
                </Link>
              </div>
            )}
          </div>

          <div className="xl:col-span-7 bg-white border border-slate-200 rounded-lg flex flex-col justify-between h-[680px] shadow-sm">
            <div className="p-4 border-b border-slate-200 bg-brand-navy text-white rounded-t-lg flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 bg-brand-lightBlue/10 flex items-center justify-center text-brand-lightBlue border border-brand-lightBlue/20 rounded-md">
                    <MessageSquare className="w-5 h-5" />
                  </div>
                  <div>
                    <h4 className="text-xs font-black tracking-wide text-white uppercase">
                      Copiloto AI Antifraude
                    </h4>
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider block -mt-0.5">
                      {activeTab === "case"
                        ? `Contexto Siniestro: ${displayClaimId(selectedClaimId) || "—"}`
                        : "Centro de Auditoría Global"}
                    </span>
                  </div>
                </div>

                {activeTab === "case" && (
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">
                      Siniestro Activo:
                    </span>
                    {loading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-brand-lightBlue" />
                    ) : (
                      <select
                        value={selectedClaimId}
                        onChange={(e) => handleClaimChange(e.target.value)}
                        disabled={claims.length === 0}
                        className="bg-slate-900 border border-slate-800 text-[10px] font-bold rounded px-1.5 py-0.5 text-white focus:outline-none focus:ring-1 focus:ring-brand-lightBlue max-w-[180px]"
                      >
                        {claims.map((claim) => (
                          <option key={claim.id} value={claim.id}>
                            {displayClaimId(claim.id)} ({claim.insuredName.split(" ")[0]})
                          </option>
                        ))}
                      </select>
                    )}
                  </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-1 p-0.5 bg-slate-950 border border-slate-900 rounded-md">
                <button
                  onClick={() => setActiveTab("case")}
                  className={`py-2 text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "case"
                      ? "bg-brand-blue text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Caso Específico
                </button>
                <button
                  onClick={() => setActiveTab("global")}
                  className={`py-2 text-[10.5px] font-bold rounded-md flex items-center justify-center gap-1.5 transition-all ${
                    activeTab === "global"
                      ? "bg-brand-blue text-white"
                      : "text-slate-400 hover:text-white"
                  }`}
                >
                  <Database className="w-3.5 h-3.5" />
                  Consulta Global Agéntica
                </button>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto space-y-4 bg-slate-50/50">
              {loading && activeTab === "case" && caseMessages.length === 0 ? (
                <div className="flex items-center justify-center py-16 text-slate-400 text-xs gap-2">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Cargando siniestros desde el backend…
                </div>
              ) : (
                activeMessages.map((msg, idx) => (
                  <div
                    key={idx}
                    className={`flex gap-3 max-w-[85%] ${msg.sender === "user" ? "ml-auto flex-row-reverse" : ""}`}
                  >
                    <div
                      className={`w-8 h-8 flex items-center justify-center text-[10.5px] font-bold rounded-full shrink-0 ${
                        msg.sender === "user"
                          ? "bg-brand-lightBlue text-white"
                          : "bg-brand-navy text-brand-lightBlue border border-brand-lightBlue/20"
                      }`}
                    >
                      {msg.sender === "user" ? (
                        <User className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4 text-brand-lightBlue" />
                      )}
                    </div>

                    <div
                      className={`p-3.5 border rounded-md shadow-sm ${
                        msg.sender === "user"
                          ? "bg-brand-blue text-white border-brand-blue"
                          : "bg-white text-brand-navy border-slate-200"
                      }`}
                    >
                      <div className="space-y-1.5">{formatText(msg.text)}</div>
                      <span
                        className={`text-[8px] block text-right mt-1.5 font-semibold ${
                          msg.sender === "user" ? "text-slate-200" : "text-slate-400"
                        }`}
                      >
                        {msg.timestamp}
                      </span>
                    </div>
                  </div>
                ))
              )}

              {isTyping && (
                <div className="flex gap-3 max-w-[80%]">
                  <div className="w-8 h-8 bg-brand-navy flex items-center justify-center border border-brand-lightBlue/20 text-brand-lightBlue shrink-0 rounded-full">
                    <Sparkles className="w-4 h-4 text-brand-lightBlue animate-spin" />
                  </div>
                  <div className="p-3.5 bg-white border border-slate-200 text-xs flex items-center gap-1 rounded-md shadow-sm">
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.2s]" />
                    <span className="w-1.5 h-1.5 bg-slate-400 rounded-full animate-bounce [animation-delay:0.4s]" />
                  </div>
                </div>
              )}
              <div ref={chatEndRef} />
            </div>

            <div className="p-3 border-t border-slate-100 bg-white">
              <span className="text-[9px] text-slate-400 font-extrabold uppercase tracking-wider block px-1 mb-1.5 flex items-center gap-1">
                <HelpCircle className="w-3.5 h-3.5 text-brand-blue" />
                Preguntas Sugeridas
              </span>
              <div className="flex flex-wrap gap-1.5">
                {(activeTab === "case"
                  ? [
                      { q: "¿Por qué es de alto riesgo?", text: "¿Por qué este caso tiene score de riesgo alto?" },
                      {
                        q: "¿Qué documento le falta?",
                        text: "El cliente me pregunta qué documento le hace falta para pasar el flujo normal. ¿Qué le respondo?",
                      },
                    ]
                  : [
                      {
                        q: "¿Qué taller concentra alertas rojas?",
                        text: "¿Qué proveedores concentran la mayor cantidad de alertas rojas este mes?",
                      },
                      {
                        q: "Análisis de sucursales",
                        text: "¿Qué sucursales tienen mayores incidencias de fraude?",
                      },
                    ]
                ).map((sug, i) => (
                  <button
                    key={i}
                    onClick={() => handleSendMessage(sug.text)}
                    className="px-2.5 py-1.5 border border-slate-200 hover:border-brand-lightBlue hover:bg-slate-50 text-[10px] font-bold text-brand-navy rounded-md hover:text-brand-blue flex items-center gap-1 transition-all cursor-pointer"
                  >
                    <span>{sug.q}</span>
                    <ArrowRight className="w-2.5 h-2.5 text-slate-400" />
                  </button>
                ))}
              </div>
            </div>

            <div className="p-4 border-t border-slate-200 bg-white flex items-center gap-2 rounded-b-lg">
              <input
                type="text"
                placeholder={
                  activeTab === "case"
                    ? `Pregunta sobre el siniestro ${displayClaimId(selectedClaimId) || "…"}...`
                    : "Escribe tu consulta global agéntica..."
                }
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendMessage(inputValue)}
                disabled={activeTab === "case" && !selectedClaimId}
                className="flex-1 px-3.5 py-2.5 border border-slate-200 text-xs text-brand-navy focus:outline-none focus:ring-1 focus:ring-brand-lightBlue focus:border-brand-lightBlue rounded-md font-sans transition-all disabled:bg-slate-50"
              />
              <button
                onClick={() => handleSendMessage(inputValue)}
                disabled={activeTab === "case" && !selectedClaimId}
                className="w-10 h-10 bg-brand-blue text-white flex items-center justify-center hover:bg-brand-navy cursor-pointer shrink-0 rounded-md shadow-sm transition-all disabled:bg-slate-300"
              >
                <Send className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
