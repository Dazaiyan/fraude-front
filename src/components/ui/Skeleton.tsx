import React from "react"

export function SkeletonBar({ className }: { className?: string }) {
  return <div className={`rounded bg-slate-200 animate-pulse ${className ?? ""}`} aria-hidden />
}

export function StatCardsSkeleton({ count = 4 }: { count?: number }) {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
          <SkeletonBar className="h-2.5 w-14" />
          <SkeletonBar className="h-7 w-10" />
        </div>
      ))}
    </div>
  )
}

export function GmailBannerSkeleton() {
  return (
    <div className="flex items-center justify-between gap-3 bg-white border border-slate-200 rounded-lg p-4 animate-pulse">
      <div className="flex items-center gap-3 flex-1 min-w-0">
        <div className="w-10 h-10 rounded-md bg-slate-200 shrink-0" />
        <div className="space-y-2 flex-1 min-w-0">
          <SkeletonBar className="h-3.5 w-56 max-w-full" />
          <SkeletonBar className="h-2.5 w-full max-w-md" />
        </div>
      </div>
      <SkeletonBar className="h-3 w-24 shrink-0" />
    </div>
  )
}

function ClaimTableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      <td className="py-4 px-4">
        <SkeletonBar className="h-3 w-28" />
      </td>
      <td className="py-4 px-4 space-y-1.5">
        <SkeletonBar className="h-3.5 w-36" />
        <SkeletonBar className="h-2.5 w-44" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar className="h-3 w-20" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar className="h-3.5 w-20 ml-auto" />
      </td>
      <td className="py-4 px-4 space-y-1.5">
        <SkeletonBar className="h-5 w-40 rounded-sm" />
        <SkeletonBar className="h-5 w-36 rounded-sm" />
        <SkeletonBar className="h-5 w-32 rounded-sm" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar className="h-6 w-16 mx-auto rounded-md" />
      </td>
      <td className="py-4 px-4">
        <SkeletonBar className="h-7 w-[72px] mx-auto rounded-md" />
      </td>
    </tr>
  )
}

export function ClaimTableSkeleton({ rows = 5 }: { rows?: number }) {
  return (
    <div className="w-full bg-white rounded-lg border border-slate-200 overflow-hidden shadow-sm">
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse min-w-[950px]">
          <thead>
            <tr className="bg-slate-50/50 border-b border-slate-200 text-[10.5px] font-bold text-brand-navy/60 uppercase tracking-wider">
              <th className="py-4 px-4 w-[11%]">ID Siniestro</th>
              <th className="py-4 px-4 w-[23%]">Asegurado</th>
              <th className="py-4 px-4 w-[12%]">Fecha Reporte</th>
              <th className="py-4 px-4 text-right w-[14%]">Monto Reclamado</th>
              <th className="py-4 px-4 w-[23%]">Alertas Rápidas (IA)</th>
              <th className="py-4 px-4 text-center w-[10%]">Riesgo</th>
              <th className="py-4 px-4 text-center w-[7%]">Acción</th>
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: rows }).map((_, i) => (
              <ClaimTableRowSkeleton key={i} />
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex items-center justify-end px-4 py-3 border-t border-slate-100">
        <SkeletonBar className="h-2.5 w-44" />
      </div>
    </div>
  )
}

function CorreosTableRowSkeleton() {
  return (
    <tr className="border-b border-slate-100">
      <td className="px-4 py-3"><SkeletonBar className="h-3 w-24" /></td>
      <td className="px-4 py-3"><SkeletonBar className="h-3 w-40" /></td>
      <td className="px-4 py-3"><SkeletonBar className="h-3 w-52" /></td>
      <td className="px-4 py-3"><SkeletonBar className="h-6 w-20 rounded" /></td>
      <td className="px-4 py-3"><SkeletonBar className="h-3 w-12" /></td>
      <td className="px-4 py-3"><SkeletonBar className="h-7 w-24 rounded-md" /></td>
    </tr>
  )
}

export function CorreosTableSkeleton({ rows = 6 }: { rows?: number }) {
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-left text-xs">
        <thead className="bg-slate-50 border-b border-slate-200 text-[10px] uppercase tracking-wider text-slate-500">
          <tr>
            <th className="px-4 py-3 font-bold">Fecha</th>
            <th className="px-4 py-3 font-bold">Remitente</th>
            <th className="px-4 py-3 font-bold">Asunto</th>
            <th className="px-4 py-3 font-bold">Palabra clave</th>
            <th className="px-4 py-3 font-bold">Adjunto</th>
            <th className="px-4 py-3 font-bold">Acción</th>
          </tr>
        </thead>
        <tbody>
          {Array.from({ length: rows }).map((_, i) => (
            <CorreosTableRowSkeleton key={i} />
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function ClaimDetailContentSkeleton() {
  return (
    <>
      <div className="h-20 bg-white border-b border-slate-100 px-8 flex flex-col justify-center space-y-2">
        <SkeletonBar className="h-5 w-72 max-w-full" />
        <SkeletonBar className="h-3 w-96 max-w-full" />
      </div>

      <div className="flex-1 p-6 md:p-8 space-y-6 max-w-6xl w-full mx-auto">
          <div className="bg-white p-6 rounded-lg border border-slate-200 shadow-sm flex flex-wrap items-center justify-between gap-4">
            <SkeletonBar className="h-9 w-40 rounded-md" />
            <div className="flex gap-2">
              <SkeletonBar className="h-9 w-24 rounded-md" />
              <SkeletonBar className="h-9 w-28 rounded-md" />
              <SkeletonBar className="h-9 w-24 rounded-md" />
            </div>
            <div className="flex gap-2">
              <SkeletonBar className="h-10 w-10 rounded-md" />
              <SkeletonBar className="h-10 w-10 rounded-md" />
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-4">
              <SkeletonBar className="h-3 w-48" />
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-4">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex justify-between gap-4">
                    <SkeletonBar className="h-3 w-28" />
                    <SkeletonBar className="h-3 w-36" />
                  </div>
                ))}
              </div>
            </div>
            <div className="space-y-4">
              <SkeletonBar className="h-3 w-52" />
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-3">
                <SkeletonBar className="h-8 w-24 rounded-full" />
                <SkeletonBar className="h-3 w-full" />
                <SkeletonBar className="h-3 w-[92%]" />
                <SkeletonBar className="h-3 w-[85%]" />
                <div className="pt-2 space-y-2">
                  <SkeletonBar className="h-10 w-full rounded-md" />
                  <SkeletonBar className="h-10 w-full rounded-md" />
                </div>
              </div>
              <div className="bg-white border border-slate-200 rounded-lg p-5 space-y-2">
                <SkeletonBar className="h-3 w-40" />
                <SkeletonBar className="h-16 w-full rounded-md" />
              </div>
            </div>
          </div>
        </div>
    </>
  )
}

export function PreviewCorreoSkeleton() {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
      <div className="lg:col-span-4 space-y-6">
        <div className="bg-white border border-slate-200 p-6 space-y-5 shadow-sm">
          <SkeletonBar className="h-3 w-40" />
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="space-y-2">
              <SkeletonBar className="h-2 w-24" />
              <SkeletonBar className="h-9 w-full rounded" />
            </div>
          ))}
          <SkeletonBar className="h-10 w-full rounded-md" />
        </div>
      </div>
      <div className="lg:col-span-8">
        <div className="bg-white border border-slate-200 p-8 space-y-4 min-h-[480px]">
          <SkeletonBar className="h-4 w-3/4 max-w-md" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-full" />
          <SkeletonBar className="h-3 w-[88%]" />
          <div className="pt-6 space-y-3">
            <SkeletonBar className="h-3 w-32" />
            <SkeletonBar className="h-20 w-full rounded-md" />
            <SkeletonBar className="h-20 w-full rounded-md" />
          </div>
        </div>
      </div>
    </div>
  )
}

export function NotificationsSkeleton({ count = 3 }: { count?: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="p-3.5 flex gap-3 border-b border-slate-100">
          <div className="w-9 h-9 rounded-md bg-slate-200 animate-pulse shrink-0" />
          <div className="flex-1 space-y-2 py-0.5">
            <SkeletonBar className="h-3 w-[75%]" />
            <SkeletonBar className="h-2.5 w-full" />
            <SkeletonBar className="h-2 w-20" />
          </div>
        </div>
      ))}
    </>
  )
}
