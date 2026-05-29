import React, { useEffect, useState } from "react"
import { Database, Shield, Sparkles } from "lucide-react"
import { SkeletonBar } from "@/components/ui/Skeleton"

const LOAD_STEPS = [
  {
    icon: Database,
    label: "Conectando con la base de siniestros",
    detail: "Recuperando expedientes y scores de riesgo en vivo…",
  },
  {
    icon: Shield,
    label: "Calculando alertas activas",
    detail: "Clasificando casos críticos y concentración por proveedor…",
  },
  {
    icon: Sparkles,
    label: "Preparando copiloto AI",
    detail: "Indexando contexto del siniestro para consultas en lenguaje natural…",
  },
] as const

export function AlertsSummarySkeleton() {
  return (
    <>
      <div className="grid grid-cols-2 gap-3.5">
        <div className="bg-rose-50/80 border border-rose-100 rounded-md p-3.5 space-y-2">
          <SkeletonBar className="h-2.5 w-[72%]" />
          <SkeletonBar className="h-7 w-20" />
          <SkeletonBar className="h-2 w-24" />
        </div>
        <div className="bg-brand-lightBlue/5 border border-brand-lightBlue/10 rounded-md p-3.5 space-y-2">
          <SkeletonBar className="h-2.5 w-[78%]" />
          <SkeletonBar className="h-7 w-10" />
          <SkeletonBar className="h-2 w-20" />
        </div>
      </div>

      <div className="mt-4 p-3 bg-amber-50/80 border border-amber-100 rounded-md space-y-2">
        <SkeletonBar className="h-2.5 w-40" />
        <SkeletonBar className="h-3 w-48" />
        <SkeletonBar className="h-2.5 w-full" />
        <SkeletonBar className="h-2.5 w-[88%]" />
      </div>
    </>
  )
}

export function ActiveCaseSkeleton() {
  return (
    <div className="bg-slate-900 border border-slate-800 rounded-lg p-4 flex items-center justify-between animate-pulse">
      <div className="flex items-center gap-2.5 flex-1 min-w-0">
        <div className="w-8 h-8 bg-slate-700 rounded-md shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <SkeletonBar className="h-2 w-24 bg-slate-700" />
          <SkeletonBar className="h-3 w-44 max-w-full bg-slate-700" />
        </div>
      </div>
      <SkeletonBar className="h-7 w-24 shrink-0 bg-slate-700 rounded-md" />
    </div>
  )
}

export function ClaimSelectSkeleton() {
  return <SkeletonBar className="h-6 w-[180px] rounded bg-slate-700/80" />
}

export function SuggestedQuestionsSkeleton() {
  return (
    <div className="flex flex-wrap gap-1.5">
      <SkeletonBar className="h-7 w-40 rounded-md" />
      <SkeletonBar className="h-7 w-44 rounded-md" />
    </div>
  )
}

export function ChatWelcomeSkeleton() {
  const [stepIndex, setStepIndex] = useState(0)

  useEffect(() => {
    const timer = window.setInterval(() => {
      setStepIndex((prev) => (prev + 1) % LOAD_STEPS.length)
    }, 2600)
    return () => window.clearInterval(timer)
  }, [])

  const step = LOAD_STEPS[stepIndex]
  const StepIcon = step.icon

  return (
    <div className="space-y-6">
      <div className="flex gap-3 max-w-[85%]">
        <div className="w-8 h-8 bg-brand-navy/80 border border-brand-lightBlue/20 rounded-full shrink-0 flex items-center justify-center">
          <Sparkles className="w-4 h-4 text-brand-lightBlue animate-pulse" />
        </div>
        <div className="flex-1 p-3.5 bg-white border border-slate-200 rounded-md shadow-sm space-y-2.5">
          <SkeletonBar className="h-2.5 w-full" />
          <SkeletonBar className="h-2.5 w-[94%]" />
          <SkeletonBar className="h-2.5 w-[78%]" />
          <SkeletonBar className="h-2.5 w-[62%]" />
        </div>
      </div>

      <div key={stepIndex} className="max-w-sm mx-auto text-center space-y-3 copilot-load-step">
        <div className="flex justify-center gap-1.5">
          {LOAD_STEPS.map((_, index) => (
            <span
              key={index}
              className={`h-1.5 rounded-full transition-all duration-500 ${
                index === stepIndex
                  ? "w-8 bg-brand-blue"
                  : index < stepIndex
                    ? "w-1.5 bg-brand-lightBlue/60"
                    : "w-1.5 bg-slate-200"
              }`}
            />
          ))}
        </div>
        <div className="w-10 h-10 mx-auto rounded-full bg-brand-blue/10 border border-brand-blue/20 flex items-center justify-center">
          <StepIcon className="w-5 h-5 text-brand-blue animate-pulse" />
        </div>
        <div>
          <p className="text-xs font-bold text-brand-navy">{step.label}…</p>
          <p className="text-[11px] text-slate-500 mt-1 leading-relaxed px-4">{step.detail}</p>
        </div>
        <div className="relative h-1 bg-slate-100 rounded-full overflow-hidden max-w-xs mx-auto">
          <div className="absolute inset-y-0 w-1/3 bg-gradient-to-r from-brand-blue to-brand-lightBlue rounded-full copilot-load-bar" />
        </div>
      </div>

      <style jsx global>{`
        @keyframes copilot-load-slide {
          0% {
            left: -35%;
          }
          100% {
            left: 100%;
          }
        }
        @keyframes copilot-load-step-in {
          from {
            opacity: 0;
            transform: translateY(6px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .copilot-load-bar {
          animation: copilot-load-slide 1.8s ease-in-out infinite;
        }
        .copilot-load-step {
          animation: copilot-load-step-in 0.45s ease-out;
        }
      `}</style>
    </div>
  )
}
