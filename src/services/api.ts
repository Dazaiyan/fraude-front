import axios, { type InternalAxiosRequestConfig } from "axios"
import { loadStoredUser } from "./auth"

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000",
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
})

function attachAnalystHeader(config: InternalAxiosRequestConfig): void {
  const user = loadStoredUser()
  if (!user?.email) return

  if (config.headers) {
    if (typeof config.headers.set === "function") {
      config.headers.set("X-Analyst-Email", user.email)
    } else {
      (config.headers as any)["X-Analyst-Email"] = user.email
    }
  }
}

api.interceptors.request.use(
  (config) => {
    attachAnalystHeader(config)
    return config
  },
  (error) => Promise.reject(error)
)

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status
    const url = error.config?.url ?? ""
    const isMissingChatSession =
      status === 404 && url.includes("/api/v1/chat/session/") && url.endsWith("/messages")
    const isSendEmailFallback = status === 404 && url.includes("/send-email")
    const isMissingSiniestro =
      status === 404 &&
      url.includes("/api/v1/siniestros/") &&
      !url.includes("/summary") &&
      !url.endsWith("/siniestros")
    const isAuthRequired = status === 401 && url.includes("/api/v1/")
    const isHealthTimeout = error.code === "ECONNABORTED" && url.includes("/health")
    const isTimeout = error.code === "ECONNABORTED"

    if (
      !isMissingChatSession &&
      !isSendEmailFallback &&
      !isMissingSiniestro &&
      !isAuthRequired &&
      !isHealthTimeout &&
      !isTimeout
    ) {
      console.error("ShieldMind API Error:", error.response || error.message)
    }
    return Promise.reject(error)
  }
)

export default api
