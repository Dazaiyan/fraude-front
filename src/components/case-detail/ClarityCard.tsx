import React from "react"
import { Sparkles, ShieldCheck } from "lucide-react"
import { Claim } from "@/services/claims"
import { scoreToBand, scoreToColor } from "@/utils/scoring"

interface ClarityCardProps {
  claim?: Claim | null
}

export default function ClarityCard({ claim }: ClarityCardProps) {
  // Fallback predeterminado para Alejandro Mendoza (o en caso de que no venga la prop claim)
  const defaultBreakdown = [
    { label: "Frecuencia de reclamos anteriores", points: 8 },
    { label: "Proveedor/Taller mecánico observado en lista restrictiva", points: 10 },
    { label: "Reporte tardío de siniestro (>15 días)", points: 8 },
    { label: "Similitud lingüística severa en narrativa (NLP)", points: 52 },
  ]

  const activeClaim = (claim || {
    riskScore: 78,
    riskLevel: "high",
    clarityScoreBreakdown: defaultBreakdown
  }) as Claim

  // Si viene total_score del backend lo prioriza, de lo contrario usa riskScore
  const score = activeClaim.total_score !== undefined ? activeClaim.total_score : activeClaim.riskScore
  const riskColor = scoreToColor(score)
  const riskBand = scoreToBand(score)
  
  const breakdown = activeClaim.clarityScoreBreakdown || defaultBreakdown
  const rules = activeClaim.rules

  // Configuración dinámica de estilos según nivel de riesgo o color
  const getRiskConfig = (levelOrColor: string) => {
    const lower = levelOrColor?.toLowerCase()
    if (lower === "high" || lower === "rojo") {
      return {
        textColor: "text-rose-600",
        borderColor: "border-rose-200",
        bgColor: "bg-rose-50/50",
        scoreBorder: "border-rose-500",
        title: "Riesgo Crítico de Fraude",
        description: "Múltiples banderas de alerta activadas. Requiere auditoría ética profunda y peritaje presencial obligatorio debido a sospecha severa de inconsistencias o plagio."
      }
    } else if (lower === "medium" || lower === "amarillo") {
      return {
        textColor: "text-amber-700",
        borderColor: "border-amber-200",
        bgColor: "bg-amber-50/50",
        scoreBorder: "border-amber-500",
        title: "Riesgo Medio (Alerta Moderada)",
        description: "Inconsistencias puntuales detectadas en la cronología o valores reclamados. Recomendamos auditoría documental manual antes de autorizar liquidación."
      }
    } else {
      return {
        textColor: "text-emerald-700",
        borderColor: "border-emerald-200",
        bgColor: "bg-emerald-50/50",
        scoreBorder: "border-emerald-500",
        title: "Riesgo Bajo (Tránsito Automatizado)",
        description: "No se identificaron anomalías significativas. El expediente es apto para el proceso de liquidación automática simplificada bajo directrices estándar."
      }
    }
  }

  const config = getRiskConfig(riskColor)

  return (
    <div className="bg-white rounded-lg border border-slate-200 p-6 space-y-6 shadow-sm">
      
      {/* Encabezado */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-200">
        <div className="flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-lightBlue animate-pulse" />
          <h3 className="text-sm font-bold text-brand-navy">Explicabilidad Algorítmica (Clarity Card)</h3>
        </div>
        <span className="text-[10px] bg-brand-blue/5 text-brand-blue font-extrabold px-2 py-0.5 rounded-md border border-brand-blue/10 font-mono">
          IA-Model v2.4
        </span>
      </div>

      {/* Grid del Score Central (Contenedor Cuadrado Plano) */}
      <div className={`p-5 rounded-lg border ${config.borderColor} ${config.bgColor} flex flex-col sm:flex-row items-center gap-6`}>
        
        {/* Score Box Cuadrado */}
        <div className={`w-24 h-24 flex items-center justify-center bg-white border-2 ${config.scoreBorder} shrink-0 text-center rounded-md`}>
          <div>
            <span className={`text-3xl font-black ${config.textColor} block leading-none mb-1`}>{score}</span>
            <span className="text-[9px] block text-slate-400 font-bold uppercase tracking-wider">Score</span>
          </div>
        </div>

        {/* Detalle descriptivo del score */}
        <div className="space-y-1.5 text-center sm:text-left">
          <h4 className={`text-xs font-black uppercase tracking-widest ${config.textColor}`}>
            {config.title}
          </h4>
          <p className="text-[10px] font-bold uppercase tracking-wider text-slate-500">
            {riskColor} · banda {riskBand} · {score} pts
          </p>
          <p className="text-xs text-brand-navy font-semibold leading-relaxed">
            {config.description}
          </p>
        </div>

      </div>

      {/* Desglose de puntos de auditoría */}
      <div className="space-y-4">
        <h5 className="text-[10px] text-slate-400 font-bold uppercase tracking-wider flex items-center gap-1">
          Banderas de Riesgo Evaluadas (Auditoría Técnica)
        </h5>

        <div className="space-y-3">
          {rules && rules.length > 0 ? (
            rules.map((rule, idx) => {
              const { code, title, classification, matched, points, reason } = rule
              
              // Determinar colores y estilos según matching y clasificación
              let styleConfig = {
                text: "text-slate-500",
                badgeBg: "bg-slate-50 border-slate-200 text-slate-500",
                bg: "bg-slate-50/20 border-slate-100 opacity-60 border-dashed"
              }
              
              if (matched) {
                const lowerClass = classification?.toLowerCase()
                if (lowerClass === "rojo" || lowerClass === "red") {
                  styleConfig = {
                    text: "text-rose-700",
                    badgeBg: "bg-rose-50 text-rose-600 border-rose-200 font-extrabold",
                    bg: "bg-rose-50/60 border-rose-200 shadow-sm"
                  }
                } else if (lowerClass === "amarillo" || lowerClass === "yellow") {
                  styleConfig = {
                    text: "text-amber-700",
                    badgeBg: "bg-amber-50 text-amber-700 border-amber-200 font-extrabold",
                    bg: "bg-amber-50/60 border-amber-200 shadow-sm"
                  }
                } else {
                  styleConfig = {
                    text: "text-emerald-700",
                    badgeBg: "bg-emerald-50 text-emerald-600 border-emerald-200 font-extrabold",
                    bg: "bg-emerald-50/60 border-emerald-200 shadow-sm"
                  }
                }
              }

              return (
                <div 
                  key={code || idx} 
                  className={`p-3 rounded-md border transition-all duration-200 ${styleConfig.bg}`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className={`text-[9px] font-mono px-1 rounded border uppercase font-bold tracking-wider ${
                          matched 
                            ? "bg-slate-800 text-white border-slate-800" 
                            : "bg-slate-100 text-slate-400 border-slate-200"
                        }`}>
                          {code}
                        </span>
                        <h6 className={`text-xs font-bold tracking-tight ${matched ? "text-brand-navy" : "text-slate-400"}`}>
                          {title}
                        </h6>
                      </div>
                      <p className={`text-[10.5px] leading-relaxed font-semibold pl-1 ${
                        matched ? "text-brand-navy/90" : "text-slate-400/80 italic font-normal"
                      }`}>
                        {reason}
                      </p>
                    </div>
                    <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border shrink-0 ${styleConfig.badgeBg}`}>
                      {matched ? `+${points}` : "0"} pts
                    </span>
                  </div>
                </div>
              )
            })
          ) : (
            // Fallback Legacy
            breakdown.map((item, idx) => {
              const isCritical = item.points >= 10
              const isBenefit = item.points < 0
              
              return (
                <div 
                  key={idx} 
                  className="flex items-center justify-between p-3 rounded-md bg-slate-50 border border-slate-200"
                >
                  <span className="text-xs font-semibold text-brand-navy">
                    {item.label}
                  </span>
                  <span className={`text-xs font-bold font-mono px-2 py-0.5 rounded-md border ${
                    isBenefit
                      ? "bg-emerald-50 text-emerald-600 border-emerald-200 font-extrabold"
                      : isCritical 
                        ? "bg-rose-50 text-rose-600 border-rose-200 font-extrabold"
                        : "bg-white text-slate-700 border-slate-200"
                  }`}>
                    {isBenefit ? "" : "+"}{item.points} pts
                  </span>
                </div>
              )
            })
          )}
        </div>
      </div>

      {/* Nota de integridad ética */}
      <div className="pt-2 flex gap-2 items-start text-[10.5px] text-slate-400 font-medium border-t border-slate-100">
        <ShieldCheck className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
        <span>
          <strong>Garantía de Ética e Imparcialidad:</strong> Este score es meramente indicativo y explicable. Ha sido evaluado bajo los lineamientos éticos de Aseguradora del Sur para prevenir sesgos o penalizaciones discriminatorias.
        </span>
      </div>

    </div>
  )
}
