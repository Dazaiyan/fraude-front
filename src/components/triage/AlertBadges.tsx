import React from "react"
import { AlertCircle, CheckCircle, HelpCircle } from "lucide-react"
import { SCORE_THRESHOLD_AMARILLO, SCORE_THRESHOLD_ROJO } from "@/utils/scoring"

interface RiskBadgeProps {
  score: number
}

export function RiskBadge({ score }: RiskBadgeProps) {
  let textColor = "text-emerald-600 border-emerald-100 bg-emerald-50/30"

  if (score >= SCORE_THRESHOLD_ROJO) {
    textColor = "text-rose-600 border-rose-100 bg-rose-50/30"
  } else if (score >= SCORE_THRESHOLD_AMARILLO) {
    textColor = "text-amber-600 border-amber-100 bg-amber-50/30"
  }

  return (
    <div className={`inline-flex items-center justify-center px-2.5 py-1 rounded border text-[10.5px] font-black uppercase tracking-wider ${textColor}`}>
      <span className="font-mono font-extrabold text-[11px]">{score} pts</span>
    </div>
  )
}

interface StatusBadgeProps {
  status: "Aprobado" | "Investigación" | "Rechazado" | "Pendiente"
}

export function StatusBadge({ status }: StatusBadgeProps) {
  let style = "bg-slate-100 text-slate-700 border-slate-200"
  let Icon = HelpCircle

  switch (status) {
    case "Aprobado":
      style = "bg-emerald-50 text-emerald-700 border-emerald-100"
      Icon = CheckCircle
      break
    case "Investigación":
      style = "bg-brand-lightBlue/10 text-brand-lightBlue border-brand-lightBlue/20"
      Icon = AlertCircle
      break
    case "Rechazado":
      style = "bg-rose-50 text-rose-700 border-rose-100"
      Icon = AlertCircle
      break
    case "Pendiente":
      style = "bg-slate-100 text-slate-600 border-slate-200"
      Icon = HelpCircle
      break
  }

  return (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-[11px] font-medium border ${style}`}>
      <Icon className="w-3.5 h-3.5" />
      {status}
    </span>
  )
}

interface FeatureTagProps {
  text: string
}

export function FeatureTag({ text }: FeatureTagProps) {
  return (
    <span className="inline-flex items-center px-2 py-0.5 rounded-md bg-brand-navy/5 text-brand-navy/80 text-[10px] font-medium border border-slate-200">
      {text}
    </span>
  )
}
