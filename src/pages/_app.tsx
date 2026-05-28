import "@/styles/globals.css"
import type { AppProps } from "next/app"
import Head from "next/head"
import { AuthProvider } from "@/context/AuthContext"
import AuthGate from "@/components/layout/AuthGate"

export default function App({ Component, pageProps }: AppProps) {
  if (!Component) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center text-slate-500 text-sm">
        Cargando página…
      </div>
    )
  }

  return (
    <>
      <Head>
        <title>ShieldMind AI - Aseguradora del Sur</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="description" content="Sistema Inteligente de Triaje, Análisis Ético y Detección de Fraudes en Siniestros de Seguros." />
        <link rel="icon" href="/favicon.ico" />
      </Head>
      <AuthProvider>
        <AuthGate>
          <Component {...pageProps} />
        </AuthGate>
      </AuthProvider>
    </>
  )
}
