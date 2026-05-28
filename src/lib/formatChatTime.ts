/** Hora de chat estable en SSR e hidratación (evita diferencias de locale Node vs navegador). */
export function formatChatTime(date: Date = new Date()): string {
  const hours = date.getHours()
  const minutes = date.getMinutes()
  const period = hours >= 12 ? "p. m." : "a. m."
  const hour12 = hours % 12 || 12
  return `${String(hour12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${period}`
}
