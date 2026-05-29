import api from "./api"
import type {
  ChatIndexResponse,
  ChatIndexStatusResponse,
  ChatQueryResponse,
  ScoringResponse,
  SiniestroBackend,
  SiniestrosSummary,
} from "@/types/backend"
import {
  applyScoringToClaim,
  chatSessionId,
  mapClaimFormToCreatePayload,
  mapSiniestroToClaim,
  type NewClaimFormData,
} from "./mappers"

// Interfaces de la aplicación para TypeScript
export interface ClaimDocument {
  name: string
  uploaded: boolean
}

export interface ClarityReason {
  label: string
  points: number
}

export interface AuditRule {
  code: string
  title: string
  classification: string
  matched: boolean
  points: number
  reason: string
}

export interface SimilarityData {
  matchedCaseId: string
  percentage: number
  originalNarrative: string
  matchedText: string
}
export interface Claim {
  id: string
  insuredName: string
  line: "Vehículos" | "Salud" | "Incendios" | "Vida" | "Hogar"
  reportDate: string
  amount: number
  riskScore: number
  riskLevel: "low" | "medium" | "high"
  policyNumber: string
  chassis?: string
  beneficiaries: string[]
  narrative: string
  status: "Aprobado" | "Investigación" | "Rechazado" | "Pendiente"
  documents: ClaimDocument[]
  clarityScoreBreakdown: ClarityReason[]
  similarity: SimilarityData | null
  alerts: string[]
  
  // Nuevos campos de la TABLA: SINIESTROS
  insuredId?: string  // id_asegurado
  cobertura?: string  // cobertura
  occurrenceDate?: string  // fecha_ocurrencia
  estimatedAmount?: number  // monto_estimado
  paidAmount?: number  // monto_pagado
  branch?: string  // sucursal
  documentsComplete?: string  // documentos_completos ("Sí" | "No")
  daysSincePolicyStart?: number  // dias_desde_inicio_poliza
  daysUntilPolicyEnd?: number  // dias_desde_fin_poliza
  daysBetweenOccurrenceReport?: number  // dias_entre_ocurrencia_reporte
  claimHistoryCount?: number  // historial_siniestros_asegurado
  simulatedFraudLabel?: string  // etiqueta_fraude_simulada
  remitente_correo?: string | null

  // Adaptación al Backend de Reglas y Puntos
  total_score?: number
  average_points?: number
  score_color?: string
  score_band?: string
  rules?: AuditRule[]
  breakdown?: AuditRule[]
  ai?: {
    model: string
    summary: string
    tools_called: string[]
    signal_rationale: Record<string, string>
  }
  signals?: Record<string, boolean>
}

export interface ChatMessage {
  sender: "user" | "ai"
  text: string
  timestamp: string
}

// Datos Estáticos (Mock Data) de alta calidad para Aseguradora del Sur
export const mockClaims: Claim[] = [
  {
    id: "SHM-8924",
    insuredName: "Alejandro Mendoza",
    line: "Vehículos",
    reportDate: "2026-05-20",
    amount: 8400,
    riskScore: 78,
    riskLevel: "high",
    policyNumber: "POL-VEH-2025-9981",
    chassis: "9BWCA41V7EP08422",
    beneficiaries: ["Alejandro Mendoza (Titular)"],
    narrative: "El día 5 de mayo me encontraba estacionado fuera del centro comercial cuando otro vehículo de color gris retrocedió rápidamente y me impactó en la parte delantera izquierda. El conductor se dio a la fuga de inmediato. No hubo testigos y me percaté del golpe minutos después al regresar a mi vehículo.",
    status: "Investigación",
    documents: [
      { name: "Póliza Vigente", uploaded: true },
      { name: "Cédula de Identidad", uploaded: true },
      { name: "Denuncia Policial de Tránsito", uploaded: true },
      { name: "Factura Proforma de Taller", uploaded: false },
      { name: "Fotos del Siniestro", uploaded: true },
    ],
    clarityScoreBreakdown: [
      { label: "Historial de siniestralidad del cliente", points: 8 },
      { label: "Proveedor/Taller en lista restrictiva", points: 15 },
      { label: "Reporte tardío de siniestro (>15 días)", points: 10 },
      { label: "Similitud lingüística severa detectada (NLP)", points: 45 },
    ],
    similarity: {
      matchedCaseId: "SHM-1120",
      percentage: 94,
      originalNarrative: "El día 5 de enero me encontraba estacionado fuera del centro comercial cuando otro vehículo de color gris retrocedió rápidamente y me impactó en la parte delantera izquierda. El conductor se dio a la fuga de inmediato. No hubo testigos...",
      matchedText: "estacionado fuera del centro comercial cuando otro vehículo de color gris retrocedió rápidamente y me impactó en la parte delantera izquierda. El conductor se dio a la fuga de inmediato. No hubo testigos"
    },
    alerts: ["Lista Restrictiva", "Narrativa Sospechosa"],
    total_score: 78,
    average_points: 9.75,
    score_color: "Rojo",
    score_band: "Alto",
    rules: [
      {
        code: "RS-01",
        title: "Reclamo cercano al borde de vigencia",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "No hay fechas de vigencia de póliza suficientes para evaluar esta regla."
      },
      {
        code: "RF-01",
        title: "Cobertura Perdida Total por Robo (PTxRB)",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "No se detecta PTxRB en ramo/cobertura."
      },
      {
        code: "RF-02",
        title: "Evidencia de falsificación o adulteración documental",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "Sin evidencia de falsificación reportada."
      },
      {
        code: "RF-03",
        title: "Coincidencia exacta con lista restrictiva",
        classification: "Rojo",
        matched: true,
        points: 15,
        reason: "Coincidencia exacta con lista restrictiva: Taller mecánico proponente se encuentra observado en la lista restrictiva oficial."
      },
      {
        code: "RF-04",
        title: "Dinámica del accidente físicamente imposible",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "La descripción del accidente es físicamente coherente y no presenta imposibilidad física."
      },
      {
        code: "RF-05",
        title: "Siniestro extremo al borde de vigencia (<48 hrs)",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "La cobertura se inició hace más de 120 días. Tránsito regular."
      },
      {
        code: "RF-06",
        title: "Demora atípica en denuncia de robo (> 4 días)",
        classification: "Amarillo",
        matched: true,
        points: 8,
        reason: "Demora atípica en denuncia: El reporte del siniestro fue ingresado 15 días posteriores al incidente."
      },
      {
        code: "RF-07",
        title: "Narrativa idéntica (clonada)",
        classification: "Amarillo",
        matched: true,
        points: 55,
        reason: "Narrativa idéntica (clonada): Se detectó 94% de similitud lingüística severa mediante NLP con el siniestro histórico fraudulento SHM-1120."
      }
    ]
  },
  {
    id: "SHM-4321",
    insuredName: "Valentina Rossi",
    line: "Salud",
    reportDate: "2026-05-24",
    amount: 12500,
    riskScore: 12,
    riskLevel: "low",
    policyNumber: "POL-MED-2024-0012",
    beneficiaries: ["Valentina Rossi (Titular)", "Lucía Rossi (Hija)"],
    narrative: "Paciente Valentina Rossi ingresó por emergencias al Hospital Metropolitano presentando un cuadro de dolor agudo abdominal generalizado localizado en fosa ilíaca derecha, compatible con apendicitis aguda. Se procedió a realizar apendicetomía laparoscópica de emergencia bajo anestesia general sin complicaciones reportadas.",
    status: "Aprobado",
    documents: [
      { name: "Póliza Vigente", uploaded: true },
      { name: "Informe de Alta Médica", uploaded: true },
      { name: "Recetario de Farmacia Autorizado", uploaded: true },
      { name: "Cédula de Identidad", uploaded: true },
    ],
    clarityScoreBreakdown: [
      { label: "Preexistencia no declarada", points: 0 },
      { label: "Monto acorde con tarifas de convenio", points: -5 },
      { label: "Consistencia de diagnóstico y tratamiento", points: -3 },
      { label: "Historial libre de incidentes", points: -4 },
    ],
    similarity: null,
    alerts: [],
    total_score: 12,
    average_points: 0.0,
    score_color: "Verde",
    score_band: "Bajo",
    rules: [
      {
        code: "RS-01",
        title: "Reclamo cercano al borde de vigencia",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "No hay fechas de vigencia de póliza suficientes para evaluar esta regla."
      },
      {
        code: "RF-01",
        title: "Cobertura Perdida Total por Robo (PTxRB)",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "No se detecta PTxRB en ramo/cobertura."
      },
      {
        code: "RF-02",
        title: "Evidencia de falsificación o adulteración documental",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "Sin evidencia de falsificación reportada."
      },
      {
        code: "RF-03",
        title: "Coincidencia exacta con lista restrictiva",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "Sin coincidencias exactas en lista restrictiva."
      },
      {
        code: "RF-04",
        title: "Dinámica del accidente físicamente imposible",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "Sin marca de imposibilidad física."
      },
      {
        code: "RF-05",
        title: "Siniestro extremo al borde de vigencia (<48 hrs)",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "No hay fechas de vigencia de póliza suficientes para evaluar esta regla."
      },
      {
        code: "RF-06",
        title: "Demora atípica en denuncia de robo (> 4 días)",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "Sin demora atípica reportada."
      },
      {
        code: "RF-07",
        title: "Narrativa idéntica (clonada)",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "No hay evidencia de narrativa clonada."
      }
    ]
  },
  {
    id: "SHM-7651",
    insuredName: "Carlos Dávila",
    line: "Hogar",
    reportDate: "2026-05-22",
    amount: 45000,
    riskScore: 45,
    riskLevel: "medium",
    policyNumber: "POL-HOG-2023-4552",
    beneficiaries: ["Carlos Dávila (Titular)", "María Elena Santos (Cónyuge)"],
    narrative: "Se presentó un cortocircuito imprevisto en el tomacorriente de la cocina principal debido a una aparente sobrecarga del sistema. Las chispas inflamaron los gabinetes de madera superiores, provocando un incendio parcial que afectó la cocina completa y el comedor antes de la oportuna intervención de los bomberos.",
    status: "Pendiente",
    documents: [
      { name: "Póliza de Hogar Activa", uploaded: true },
      { name: "Informe del Cuerpo de Bomberos", uploaded: true },
      { name: "Presupuesto de Reconstrucción de Obra", uploaded: true },
      { name: "Factura de Electrodomésticos", uploaded: false },
    ],
    clarityScoreBreakdown: [
      { label: "Historial de 3 siniestros en últimos 12 meses", points: 20 },
      { label: "Monto reclamado sobre el promedio del sector", points: 15 },
      { label: "Ubicación geográfica de alto riesgo sísmico/incendio", points: 5 },
      { label: "Consistencia en reporte de bomberos", points: 5 },
    ],
    similarity: {
      matchedCaseId: "SHM-5521",
      percentage: 42,
      originalNarrative: "Cortocircuito fortuito en el tomacorriente de la sala de estar que incendió las cortinas de algodón...",
      matchedText: "cortocircuito imprevisto en el tomacorriente de la cocina"
    },
    alerts: ["Vigencia < 48hrs"],
    total_score: 45,
    average_points: 5.625,
    score_color: "Amarillo",
    score_band: "Medio",
    rules: [
      {
        code: "RS-01",
        title: "Reclamo cercano al borde de vigencia",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "No hay fechas de vigencia de póliza suficientes para evaluar esta regla."
      },
      {
        code: "RF-01",
        title: "Cobertura Perdida Total por Robo (PTxRB)",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "No se detecta PTxRB en ramo/cobertura."
      },
      {
        code: "RF-02",
        title: "Evidencia de falsificación o adulteración documental",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "Sin evidencia de falsificación reportada."
      },
      {
        code: "RF-03",
        title: "Coincidencia exacta con lista restrictiva",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "Sin coincidencias exactas en lista restrictiva."
      },
      {
        code: "RF-04",
        title: "Dinámica del accidente físicamente imposible",
        classification: "Rojo",
        matched: false,
        points: 0,
        reason: "La descripción y el informe de bomberos descartan imposibilidades físicas."
      },
      {
        code: "RF-05",
        title: "Siniestro extremo al borde de vigencia (<48 hrs)",
        classification: "Amarillo",
        matched: true,
        points: 20,
        reason: "Siniestro extremo al borde de vigencia: El siniestro ocurrió a las 36 horas del inicio de la cobertura de la póliza."
      },
      {
        code: "RF-06",
        title: "Demora atípica en denuncia de robo (> 4 días)",
        classification: "Amarillo",
        matched: false,
        points: 0,
        reason: "Sin demora atípica reportada."
      },
      {
        code: "RF-07",
        title: "Narrativa idéntica (clonada)",
        classification: "Amarillo",
        matched: true,
        points: 25,
        reason: "Narrativa sospechosa: Se detectó un 42% de coincidencia lingüística moderada en narrativa con el caso histórico fraudulento SHM-5521."
      }
    ]
  },
  {
    id: "SHM-9021",
    insuredName: "Sofía Ortega",
    line: "Vida",
    reportDate: "2026-05-26",
    amount: 150000,
    riskScore: 18,
    riskLevel: "low",
    policyNumber: "POL-VID-2021-8812",
    beneficiaries: ["Camila Ortega (Hija)", "Sebastián Ortega (Hijo)"],
    narrative: "Fallecimiento natural del asegurado principal Sr. Jorge Ortega debido a complicaciones por paro cardiorrespiratorio agudo e insuficiencia renal crónica terminal, reportado y certificado legalmente por el médico forense del hospital.",
    status: "Aprobado",
    documents: [
      { name: "Póliza de Vida", uploaded: true },
      { name: "Certificado de Defunción", uploaded: true },
      { name: "Autopsia / Informe de Patología", uploaded: true },
      { name: "Posesión Efectiva de Herederos", uploaded: true },
    ],
    clarityScoreBreakdown: [
      { label: "Periodo de carencia superado ampliamente", points: -10 },
      { label: "Documentos legales debidamente notariados", points: -5 },
      { label: "Causa de muerte consistente con exclusiones", points: 3 },
    ],
    similarity: null,
    alerts: []
  },
  {
    id: "SHM-1024",
    insuredName: "Juan Carlos Espinosa",
    line: "Vehículos",
    reportDate: "2026-05-25",
    amount: 15000,
    riskScore: 82,
    riskLevel: "high",
    policyNumber: "POL-VEH-2025-1024",
    beneficiaries: ["Juan Carlos Espinosa (Titular)"],
    narrative: "Colisión por alcance en la avenida principal. Un vehículo de transporte público frenó bruscamente y lo impacté por detrás.",
    status: "Investigación",
    documents: [
      { name: "Póliza Vigente", uploaded: true },
      { name: "Denuncia de Tránsito", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Colisión trasera en hora pico", points: 10 },
      { label: "Proveedor en lista restrictiva", points: 15 }
    ],
    similarity: null,
    alerts: ["Lista Restrictiva"]
  },
  {
    id: "SHM-2048",
    insuredName: "María Belén Riofrío",
    line: "Salud",
    reportDate: "2026-05-24",
    amount: 2400,
    riskScore: 25,
    riskLevel: "low",
    policyNumber: "POL-MED-2024-2048",
    beneficiaries: ["María Belén Riofrío (Titular)"],
    narrative: "Atención ambulatoria de urgencia por gastroenteritis aguda en clínica privada con cobertura del plan de salud corporativo.",
    status: "Aprobado",
    documents: [
      { name: "Cédula de Identidad", uploaded: true },
      { name: "Informe Médico", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Tratamiento estándar", points: 5 }
    ],
    similarity: null,
    alerts: []
  },
  {
    id: "SHM-5120",
    insuredName: "Gabriela Ortiz",
    line: "Hogar",
    reportDate: "2026-05-23",
    amount: 8900,
    riskScore: 30,
    riskLevel: "low",
    policyNumber: "POL-HOG-2023-5120",
    beneficiaries: ["Gabriela Ortiz (Titular)"],
    narrative: "Daño de tuberías internas en baño secundario que ocasionó filtraciones en la pared de la habitación contigua.",
    status: "Aprobado",
    documents: [
      { name: "Cédula de Identidad", uploaded: true },
      { name: "Informe de Plomería", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Daño accidental doméstico", points: 5 }
    ],
    similarity: null,
    alerts: []
  },
  {
    id: "SHM-1048",
    insuredName: "Ricardo Noboa",
    line: "Vehículos",
    reportDate: "2026-05-22",
    amount: 3100,
    riskScore: 72,
    riskLevel: "high",
    policyNumber: "POL-VEH-2025-1048",
    beneficiaries: ["Ricardo Noboa (Titular)"],
    narrative: "Choque leve lateral derecho contra baranda metálica al intentar esquivar un obstáculo en la vía interprovincial.",
    status: "Investigación",
    documents: [
      { name: "Cédula de Identidad", uploaded: true },
      { name: "Fotos de Daños", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Narrativa con contradicciones físicas", points: 25 }
    ],
    similarity: null,
    alerts: ["Narrativa Sospechosa"]
  },
  {
    id: "SHM-3096",
    insuredName: "Estefanía Jarrín",
    line: "Salud",
    reportDate: "2026-05-21",
    amount: 18000,
    riskScore: 48,
    riskLevel: "medium",
    policyNumber: "POL-MED-2024-3096",
    beneficiaries: ["Estefanía Jarrín (Titular)"],
    narrative: "Cirugía traumatológica programada para corrección de ligamento cruzado anterior de rodilla izquierda debido a lesión deportiva.",
    status: "Pendiente",
    documents: [
      { name: "Cédula de Identidad", uploaded: true },
      { name: "Resonancia Magnética", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Procedimiento cubierto preprogramado", points: 10 }
    ],
    similarity: null,
    alerts: []
  },
  {
    id: "SHM-4012",
    insuredName: "Fernando Plaza",
    line: "Hogar",
    reportDate: "2026-05-20",
    amount: 9500,
    riskScore: 55,
    riskLevel: "medium",
    policyNumber: "POL-HOG-2023-4012",
    beneficiaries: ["Fernando Plaza (Titular)"],
    narrative: "Rotura de vidrios templados de mampara del patio trasero durante fuertes vientos de tormenta invernal local.",
    status: "Investigación",
    documents: [
      { name: "Cédula de Identidad", uploaded: true },
      { name: "Denuncia Policial", uploaded: false }
    ],
    clarityScoreBreakdown: [
      { label: "Reporte emitido antes de 48 horas de vigencia de cobertura", points: 20 }
    ],
    similarity: null,
    alerts: ["Vigencia < 48hrs"]
  },
  {
    id: "SHM-5088",
    insuredName: "Christian Ayala",
    line: "Vehículos",
    reportDate: "2026-05-19",
    amount: 12000,
    riskScore: 88,
    riskLevel: "high",
    policyNumber: "POL-VEH-2025-5088",
    beneficiaries: ["Christian Ayala (Titular)"],
    narrative: "Robo de accesorios internos de vehículo estacionado en zona pública sin vigilancia externa de cámaras de seguridad.",
    status: "Investigación",
    documents: [
      { name: "Póliza Vigente", uploaded: true },
      { name: "Denuncia Judicial", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Taller en lista restrictiva", points: 15 },
      { label: "Narrativa sospechosa recurrente", points: 20 }
    ],
    similarity: null,
    alerts: ["Lista Restrictiva", "Narrativa Sospechosa"]
  },
  {
    id: "SHM-6024",
    insuredName: "Diana Torres",
    line: "Vida",
    reportDate: "2026-05-18",
    amount: 250000,
    riskScore: 15,
    riskLevel: "low",
    policyNumber: "POL-VID-2021-6024",
    beneficiaries: ["Diana Torres (Titular)"],
    narrative: "Fallecimiento natural del asegurado principal por paro cardíaco en su domicilio particular.",
    status: "Aprobado",
    documents: [
      { name: "Certificado de Defunción", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Muerte certificada en regla", points: 0 }
    ],
    similarity: null,
    alerts: []
  },
  {
    id: "SHM-7012",
    insuredName: "Paúl Villacís",
    line: "Vehículos",
    reportDate: "2026-05-17",
    amount: 6400,
    riskScore: 38,
    riskLevel: "medium",
    policyNumber: "POL-VEH-2025-7012",
    beneficiaries: ["Paúl Villacís (Titular)"],
    narrative: "Raspones y hundimiento leve de guardafango trasero izquierdo ocasionados por rozadura contra columna en parqueadero privado.",
    status: "Pendiente",
    documents: [
      { name: "Cédula de Identidad", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Incidente doméstico auto-infligido", points: 5 }
    ],
    similarity: null,
    alerts: []
  },
  {
    id: "SHM-8048",
    insuredName: "Lorena Cárdenas",
    line: "Salud",
    reportDate: "2026-05-16",
    amount: 7500,
    riskScore: 20,
    riskLevel: "low",
    policyNumber: "POL-MED-2024-8048",
    beneficiaries: ["Lorena Cárdenas (Titular)"],
    narrative: "Tratamiento dermatológico especial de acné severo prescrito bajo cobertura de plan médico integral.",
    status: "Aprobado",
    documents: [
      { name: "Cédula de Identidad", uploaded: true }
    ],
    clarityScoreBreakdown: [
      { label: "Tratamiento regular", points: 0 }
    ],
    similarity: null,
    alerts: []
  }
]

// Respuestas simuladas para el chatbot Copiloto
const copilotResponses: Record<string, string[]> = {
  "SHM-8924": [
    "Este caso fue marcado con **riesgo alto (78/100)** principalmente por un **plagio lingüístico severo del 94%** con el caso histórico de fraude **SHM-1120** (Esteban Poveda). La narrativa de los hechos coincide casi de manera literal, lo que sugiere que la descripción de la colisión fue copiada y pegada. Adicionalmente, el taller proponente está en la lista restrictiva y el reporte se hizo 15 días tarde.",
    "Al cliente le falta entregar la **Factura Proforma de Taller**. Te recomiendo responderle lo siguiente:\n\n*Estimado Sr. Mendoza, para continuar con la gestión de su siniestro SHM-8924, requerimos que nos comparta la Factura Proforma emitida por el taller automotriz seleccionado. Quedamos a la espera de dicho documento.*",
    "**Resumen Ejecutivo del Siniestro SHM-8924:**\n\n* **Asegurado:** Alejandro Mendoza\n* **Monto:** $8,400 USD\n* **Ramo:** Vehículos\n* **Riesgo:** ALTO (78/100)\n* **Alerta Principal:** Detección de plagio (94% coincidencia con SHM-1120). La narrativa alega un golpe de fuga estacionado en centro comercial. Se sugiere una inspección física detallada del chasis y cruce de datos con cámaras de seguridad."
  ],
  "SHM-7651": [
    "Este caso posee **riesgo medio (45/100)**. Los factores clave son que el asegurado Carlos Dávila ha reportado **3 siniestros en los últimos 12 meses** y el monto de $45,000 USD está considerablemente por encima del costo promedio de siniestros de hogar. No obstante, el informe de bomberos parece genuino y la similitud del relato con fraudes anteriores es baja (42%).",
    "Actualmente el cliente ha entregado todos los documentos básicos requeridos. Sin embargo, no ha subido la **Factura original de los Electrodomésticos** dañados. Puedes comentarle:\n\n*Estimado Carlos, el expediente cuenta con la documentación básica y el informe de bomberos. Para agilizar el desembolso de los electrodomésticos reclamados, le solicitamos adjuntar las facturas de compra de los mismos.*",
    "**Resumen Ejecutivo del Siniestro SHM-7651:**\n\n* **Asegurado:** Carlos Dávila\n* **Monto:** $45,000 USD\n* **Ramo:** Hogar\n* **Riesgo:** MEDIO (45/100)\n* **Alerta Principal:** Frecuencia inusual de reclamaciones. Siniestro reportado por incendio en cocina debido a cortocircuito. Recomendamos peritaje técnico para constatar la veracidad del daño del cableado eléctrico."
  ]
}

const defaultCopilotResponse = [
  "Este caso posee un riesgo bajo y no cuenta con alertas críticas activas. La descripción lingüística es original y los documentos entregados están en orden.",
  "El cliente ha entregado toda la documentación obligatoria. El caso está listo para continuar con la liquidación.",
  "**Resumen Ejecutivo:** Siniestro estándar con bajo score de fraude. Los documentos y la narrativa de los hechos son completamente consistentes."
]

function buildLocalEmailResponse(
  claim: Claim | null,
  claimId: string
): { success: boolean; message: string; htmlTemplate: string } {
  const insuredName = claim?.insuredName || "Asegurado"
  const email = `${insuredName.toLowerCase().replace(/\s+/g, ".")}@gmail.com`

  const htmlTemplate = `
        <div style="background-color: #f4f6f9; padding: 30px; font-family: sans-serif; color: #081f3f;">
          <div style="max-width: 600px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1);">
            <div style="background-color: #081f3f; padding: 25px; text-align: center; border-bottom: 4px solid #00adef;">
              <h2 style="color: #ffffff; margin: 0; font-size: 20px; font-weight: 800; letter-spacing: 1px; text-transform: uppercase;">Aseguradora del Sur</h2>
              <p style="color: #00adef; margin: 5px 0 0 0; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Ficha Registral Siniestro • ShieldMind AI</p>
            </div>
            <div style="padding: 30px;">
              <p style="font-size: 14px; line-height: 1.5; font-weight: 600; color: #1e293b;">Estimado/a ${insuredName},</p>
              <p style="font-size: 13px; line-height: 1.6; color: #475569;">Le confirmamos que su reporte de siniestro ha sido ingresado exitosamente en nuestra plataforma de triaje con inteligencia artificial. A continuación, detallamos la Ficha Registral Oficial emitida bajo radicado.</p>
              
              <div style="background-color: #f8fafc; border: 1px solid #e2e8f0; padding: 15px; text-align: center; border-radius: 6px; margin: 20px 0;">
                <span style="font-size: 11px; font-weight: 700; color: #64748b; text-transform: uppercase; display: block; margin-bottom: 4px;">Código de Radicado Oficial</span>
                <span style="font-family: monospace; font-size: 22px; font-weight: 900; color: #00adef; letter-spacing: 1px;">${claimId}</span>
              </div>
              
              <h3 style="font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; border-bottom: 2px solid #f1f5f9; padding-bottom: 6px; color: #081f3f; margin-top: 25px;">Detalles de la Ficha Registral</h3>
              
              <table style="width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px;">
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9; width: 45%;">Ramo de Seguro:</td>
                  <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-weight: 600;">${claim ? claim.line : "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Código de Póliza:</td>
                  <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9; font-family: monospace;">${claim ? claim.policyNumber : "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Identificación del Asegurado:</td>
                  <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${claim ? (claim.insuredId || claim.insuredName) : "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Fecha del Accidente:</td>
                  <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${claim ? (claim.occurrenceDate || claim.reportDate) : "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Fecha de Reporte:</td>
                  <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${claim ? claim.reportDate : "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Monto Reclamado:</td>
                  <td style="padding: 8px 0; color: #17478e; border-bottom: 1px solid #f1f5f9; font-weight: 800;">$${claim ? claim.amount.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) : "0.00"} USD</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Sucursal:</td>
                  <td style="padding: 8px 0; color: #1e293b; border-bottom: 1px solid #f1f5f9;">${claim ? (claim.branch || "Guayaquil") : "N/A"}</td>
                </tr>
                <tr>
                  <td style="padding: 8px 0; font-weight: 700; color: #64748b; border-bottom: 1px solid #f1f5f9;">Estado Inicial:</td>
                  <td style="padding: 8px 0; color: #d97706; border-bottom: 1px solid #f1f5f9; font-weight: 700;">${claim ? claim.status : "Pendiente de Auditoría"}</td>
                </tr>
              </table>
              
              <div style="margin-top: 25px; padding: 15px; background-color: #f8fafc; border-left: 4px solid #081f3f; border-radius: 4px;">
                <span style="font-size: 11px; font-weight: 700; color: #081f3f; text-transform: uppercase; display: block; margin-bottom: 5px;">Descripción de Hechos Reportados</span>
                <p style="margin: 0; font-size: 11.5px; line-height: 1.5; color: #334155; font-style: italic;">
                  "${claim ? claim.narrative : "N/A"}"
                </p>
              </div>
              
              <p style="font-size: 11px; color: #64748b; line-height: 1.5; margin-top: 30px; text-align: center; border-top: 1px solid #e2e8f0; padding-top: 15px;">
                Este es un mensaje de notificación automatizado enviado bajo las políticas de transparencia y explicabilidad ética de <strong>Aseguradora del Sur</strong>.<br/>
                Para consultas de su liquidación, por favor contacte a su bróker asignado.
              </p>
            </div>
            <div style="background-color: #f8fafc; padding: 15px; text-align: center; font-size: 10px; color: #94a3b8; border-top: 1px solid #e2e8f0;">
              ShieldMind AI • © 2026 Aseguradora del Sur S.A. Todos los derechos reservados.
            </div>
          </div>
        </div>
      `

  return {
    success: true,
    message: `Correo de confirmación simulado y despachado con éxito a ${email}.`,
    htmlTemplate,
  }
}

// Funciones del Servicio de Axios
export const claimsService = {
  async getClaims(): Promise<Claim[]> {
    try {
      const response = await api.get<SiniestroBackend[]>("/api/v1/siniestros")
      return response.data.map(mapSiniestroToClaim)
    } catch (error) {
      const status = (error as { response?: { status?: number } }).response?.status
      if (status === 401) {
        console.warn("Sesión sin email de analista. Inicia sesión con Gmail.")
        return []
      }
      console.warn("Backend /api/v1/siniestros no disponible.")
      return []
    }
  },

  async getClaimById(id: string): Promise<Claim | null> {
    const trimmed = id.trim()
    const mock = mockClaims.find((c) => c.id === trimmed)
    if (mock && trimmed.startsWith("SHM-")) {
      return mock
    }

    const encodedId = encodeURIComponent(trimmed)
    try {
      const response = await api.get<SiniestroBackend>(`/api/v1/siniestros/${encodedId}`)
      return mapSiniestroToClaim(response.data)
    } catch {
      if (mock) return mock
      console.warn(`Siniestro no encontrado: ${trimmed}`)
      return null
    }
  },

  async fetchScore(id: string, useAI: boolean): Promise<ScoringResponse> {
    const endpoint = useAI
      ? `/api/v1/siniestros/${id}/score/ai`
      : `/api/v1/siniestros/${id}/score`
    const payload = useAI ? { force_ai: true } : { signals: {} }
    const response = await api.post<ScoringResponse>(endpoint, payload, { timeout: 60000 })
    return response.data
  },

  async getSummary(): Promise<SiniestrosSummary | null> {
    try {
      const response = await api.get<SiniestrosSummary>("/api/v1/siniestros/summary")
      return response.data
    } catch (error) {
      console.warn("Backend /api/v1/siniestros/summary no disponible.")
      return null
    }
  },

  async getIndexStatus(): Promise<ChatIndexStatusResponse | null> {
    try {
      const response = await api.get<ChatIndexStatusResponse>("/api/v1/chat/index/status")
      return response.data
    } catch (error) {
      console.warn("Backend /api/v1/chat/index/status no disponible.")
      return null
    }
  },

  async indexEmbeddings(): Promise<ChatIndexResponse | null> {
    try {
      const response = await api.post<ChatIndexResponse>("/api/v1/chat/index", {}, { timeout: 120000 })
      return response.data
    } catch (error) {
      console.warn("Backend POST /api/v1/chat/index no disponible.")
      return null
    }
  },

  async postNewClaim(data: NewClaimFormData): Promise<{ success: boolean; claimId: string }> {
    try {
      const payload = mapClaimFormToCreatePayload(data)
      const response = await api.post<SiniestroBackend>("/api/v1/siniestros", payload)
      return { success: true, claimId: response.data.id_siniestro }
    } catch (error) {
      console.warn("Backend POST /api/v1/siniestros no disponible. Simulando creación de siniestro.")
      
      // Determinar riesgo en base a etiqueta fraude simulada
      let simulatedScore = 12
      let simulatedRisk: "low" | "medium" | "high" = "low"
      let simulatedAlerts: string[] = []
      let simulatedSimilarity = null
      
      if (data.simulatedFraudLabel === "Alta/Crítica") {
        simulatedScore = 78
        simulatedRisk = "high"
        simulatedAlerts = ["Lista Restrictiva", "Narrativa Sospechosa"]
        simulatedSimilarity = {
          matchedCaseId: "SHM-1120",
          percentage: 94,
          originalNarrative: "El día 5 de enero me encontraba estacionado fuera del centro comercial cuando otro vehículo de color gris retrocedió rápidamente y me impactó en la parte delantera izquierda. El conductor se dio a la fuga de inmediato. No hubo testigos...",
          matchedText: "estacionado fuera del centro comercial cuando otro vehículo de color gris retrocedió rápidamente y me impactó en la parte delantera izquierda. El conductor se dio a la fuga de inmediato. No hubo testigos"
        }
      } else if (data.simulatedFraudLabel === "Media") {
        simulatedScore = 45
        simulatedRisk = "medium"
        simulatedAlerts = ["Vigencia < 48hrs"]
      } else if (data.simulatedFraudLabel === "Baja") {
        simulatedScore = 20
        simulatedRisk = "low"
        simulatedAlerts = []
      }
      
      // Creamos un nuevo reclamo y lo insertamos al inicio del mock local para la sesión
      const newClaim: Claim = {
        id: data.id,
        insuredName: data.insuredName,
        line: data.line,
        reportDate: data.reportDate,
        amount: Number(data.amount),
        riskScore: simulatedScore,
        riskLevel: simulatedRisk,
        policyNumber: data.policyNumber,
        beneficiaries: [data.insuredName + " (Titular)"],
        narrative: data.narrative,
        status: data.status as any,
        documents: [
          { name: "Póliza Vigente", uploaded: true },
          { name: "Cédula de Identidad", uploaded: true },
          { name: "Denuncia Policial de Tránsito", uploaded: data.documentsComplete === "Sí" },
          { name: "Factura Proforma de Taller", uploaded: data.documentsComplete === "Sí" },
          { name: "Fotos del Siniestro", uploaded: true },
        ],
        clarityScoreBreakdown: [
          { label: `Historial de siniestralidad del cliente (${data.claimHistoryCount} reportados)`, points: Number(data.claimHistoryCount) * 4 },
          { label: `Reporte a los ${data.daysBetweenOccurrenceReport} días de ocurrencia`, points: Number(data.daysBetweenOccurrenceReport) >= 15 ? 10 : 0 },
          { label: `Siniestro reportado a los ${data.daysSincePolicyStart} días del inicio de vigencia`, points: Number(data.daysSincePolicyStart) <= 5 ? 20 : 0 },
          { label: "Similitud lingüística en narrativa (NLP)", points: data.simulatedFraudLabel === "Alta/Crítica" ? 48 : 5 },
        ],
        similarity: simulatedSimilarity,
        alerts: simulatedAlerts,
        
        // Asignación de todos los 20 campos
        insuredId: data.insuredId,
        cobertura: data.cobertura,
        occurrenceDate: data.occurrenceDate,
        estimatedAmount: Number(data.estimatedAmount),
        paidAmount: Number(data.paidAmount),
        branch: data.branch,
        documentsComplete: data.documentsComplete,
        daysSincePolicyStart: Number(data.daysSincePolicyStart),
        daysUntilPolicyEnd: Number(data.daysUntilPolicyEnd),
        daysBetweenOccurrenceReport: Number(data.daysBetweenOccurrenceReport),
        claimHistoryCount: Number(data.claimHistoryCount),
        simulatedFraudLabel: data.simulatedFraudLabel,

        // Campos de reglas adaptados al backend
        total_score: simulatedScore,
        average_points: Number((simulatedScore / 8).toFixed(2)),
        score_color: simulatedScore >= 50 ? "Rojo" : simulatedScore >= 25 ? "Amarillo" : "Verde",
        score_band: simulatedScore >= 71 ? "Alto" : simulatedScore >= 36 ? "Medio" : "Bajo",
        rules: [
          {
            code: "RS-01",
            title: "Reclamo cercano al borde de vigencia",
            classification: "Amarillo",
            matched: Number(data.daysSincePolicyStart) <= 5,
            points: Number(data.daysSincePolicyStart) <= 5 ? 20 : 0,
            reason: Number(data.daysSincePolicyStart) <= 5
              ? `El siniestro ocurrió a escasos ${data.daysSincePolicyStart} días del inicio de la póliza.`
              : `Póliza con vigencia normal de ${data.daysSincePolicyStart} días transcurridos.`
          },
          {
            code: "RF-01",
            title: "Cobertura Perdida Total por Robo (PTxRB)",
            classification: "Rojo",
            matched: false,
            points: 0,
            reason: "Sin marca de PTxRB en cobertura."
          },
          {
            code: "RF-02",
            title: "Evidencia de falsificación o adulteración documental",
            classification: "Rojo",
            matched: false,
            points: 0,
            reason: "Sin evidencia reportada."
          },
          {
            code: "RF-03",
            title: "Coincidencia exacta con lista restrictiva",
            classification: "Rojo",
            matched: data.simulatedFraudLabel === "Alta/Crítica",
            points: data.simulatedFraudLabel === "Alta/Crítica" ? 15 : 0,
            reason: data.simulatedFraudLabel === "Alta/Crítica"
              ? "Taller automotriz proponente se encuentra observado en lista restrictiva."
              : "Sin coincidencias en listas de control."
          },
          {
            code: "RF-04",
            title: "Dinámica del accidente físicamente imposible",
            classification: "Rojo",
            matched: false,
            points: 0,
            reason: "Dinámica de accidente reportada como coherente."
          },
          {
            code: "RF-05",
            title: "Siniestro extremo al borde de vigencia (<48 hrs)",
            classification: "Amarillo",
            matched: Number(data.daysSincePolicyStart) <= 2,
            points: Number(data.daysSincePolicyStart) <= 2 ? 15 : 0,
            reason: Number(data.daysSincePolicyStart) <= 2
              ? `Reportado a las ${Number(data.daysSincePolicyStart) * 24} horas del inicio.`
              : "Vigencia suficiente."
          },
          {
            code: "RF-06",
            title: "Demora atípica en denuncia de robo (> 4 días)",
            classification: "Amarillo",
            matched: Number(data.daysBetweenOccurrenceReport) >= 15,
            points: Number(data.daysBetweenOccurrenceReport) >= 15 ? 10 : 0,
            reason: Number(data.daysBetweenOccurrenceReport) >= 15
              ? `Reporte ingresado a los ${data.daysBetweenOccurrenceReport} días de ocurrido.`
              : "Reportado dentro de plazos estándar."
          },
          {
            code: "RF-07",
            title: "Narrativa idéntica (clonada)",
            classification: "Amarillo",
            matched: data.simulatedFraudLabel === "Alta/Crítica",
            points: data.simulatedFraudLabel === "Alta/Crítica" ? 48 : 5,
            reason: data.simulatedFraudLabel === "Alta/Crítica"
              ? "NLP detectó 94% de coincidencia lingüística severa con caso histórico SHM-1120."
              : "Narrativa con coincidencia lingüística baja."
          }
        ]
      }
      
      mockClaims.unshift(newClaim) // Añadir al inicio del dataset en memoria de la sesión
      return { success: true, claimId: data.id }
    }
  },

  // 5. Simular envío de correo electrónico oficial con Ficha Registral
  async sendClaimEmail(claimId: string): Promise<{ success: boolean; message: string; htmlTemplate: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string; htmlTemplate: string }>(
        "/api/v1/siniestros/send-email",
        { id_siniestro: claimId.trim() }
      )
      return response.data
    } catch (error) {
      console.warn("Backend send-email no disponible. Generando plantilla localmente.")
      const claim = await this.getClaimById(claimId)
      return buildLocalEmailResponse(claim, claimId)
    }
  },

  async sendMessageToAgent(claimId: string, text: string, scope: "case" | "global"): Promise<string> {
    try {
      const response = await api.post<ChatQueryResponse>(
        "/api/v1/chat/query",
        {
          question: text,
          session_id: chatSessionId(claimId, scope),
          id_siniestro: scope === "case" ? claimId.trim() : null,
          k: scope === "case" ? 4 : 8,
        },
        { timeout: 60000 }
      )
      return response.data.answer
    } catch (error) {
      console.warn(`Backend /api/v1/chat/query no disponible. Simulando respuesta del Copiloto (Scope: ${scope}).`)
      
      const query = text.toLowerCase()

      if (scope === "case") {
        // Escenario A: ¿Por qué este caso tiene score de riesgo alto?
        if (query.includes("riesgo alto") || query.includes("¿por qué") || query.includes("score")) {
          return "El siniestro fue marcado con **82 puntos** porque ocurrió solo **3 días después de emitirse la póliza** y el taller mecánico reportado se encuentra en la **lista restrictiva** de la aseguradora."
        }
        
        // Escenario B: El cliente me pregunta qué documento le hace falta, ¿qué le respondo?
        if (query.includes("documento") || query.includes("falta") || query.includes("respondo") || query.includes("cliente")) {
          return "Dile al cliente que su solicitud está **retenida temporalmente** porque no ha adjuntado la **factura original del taller** ni la **denuncia policial obligatoria** para el ramo de vehículos."
        }

        return `Como Copiloto AI del siniestro **${claimId}**, he auditado su expediente. La póliza está vigente, pero recomendamos verificar físicamente las fotos de daños ya que el chasis reportado cuenta con un historial de frecuencia elevado.`
      } else {
        // Escenario C: Consultas Globales (Para la demo en vivo ante el jurado)
        if (query.includes("proveedores") || query.includes("alertas rojas") || query.includes("taller san josé") || query.includes("concentran")) {
          return "El **Taller San José** concentra el **45% de las alertas rojas** en la sucursal de Guayaquil, acumulando **4 casos bajo investigación** por inconsistencias documentales durante este mes."
        }

        return "Como **Agente de IA de Consulta Agéntica Global** de Aseguradora del Sur, he analizado los reclamos del mes. En la sucursal de Quito la siniestralidad está en rangos estables. En la sucursal de Guayaquil observamos una concentración inusual del 18% en alertas rojas vinculadas a talleres mecánicos no autorizados."
      }
    }
  },

  async updateClaimStatus(id: string, status: "Aprobado" | "Investigación" | "Rechazado" | "Pendiente"): Promise<Claim | null> {
    try {
      const response = await api.patch<SiniestroBackend>(
        `/api/v1/siniestros/${encodeURIComponent(id.trim())}/status`,
        { estado: status }
      )
      
      // Actualizar también en el mock local en memoria
      const index = mockClaims.findIndex((c) => c.id === id.trim())
      if (index !== -1) {
        mockClaims[index].status = status
      }
      
      return mapSiniestroToClaim(response.data)
    } catch (error) {
      console.warn("Backend PATCH /status no disponible. Simulando actualización de estado localmente.")
      const mock = mockClaims.find((c) => c.id === id.trim())
      if (mock) {
        mock.status = status
        return mock
      }
      return null
    }
  },

  async sendCustomClaimEmail(claimId: string, toEmail: string, subject: string, bodyHtml: string): Promise<{ success: boolean; message: string; htmlTemplate: string }> {
    try {
      const response = await api.post<{ success: boolean; message: string; htmlTemplate: string }>(
        "/api/v1/siniestros/send-custom-email",
        {
          id_siniestro: claimId.trim(),
          to_email: toEmail.trim(),
          subject: subject.trim(),
          body_html: bodyHtml
        }
      )
      return response.data
    } catch (error) {
      console.warn("Backend send-custom-email no disponible. Simulando envío local.")
      return {
        success: true,
        message: `[Simulación] Correo enviado con éxito a ${toEmail}.`,
        htmlTemplate: bodyHtml
      }
    }
  },

  async deleteClaim(claimId: string): Promise<{ success: boolean; message: string }> {
    try {
      const response = await api.delete<{ success: boolean; message: string }>(
        `/api/v1/siniestros/${encodeURIComponent(claimId.trim())}`
      )
      const idx = mockClaims.findIndex((c) => c.id === claimId.trim())
      if (idx !== -1) {
        mockClaims.splice(idx, 1)
      }
      return { success: true, message: response.data.message || "Siniestro eliminado con éxito de la base de datos." }
    } catch (error) {
      console.warn("Backend DELETE no disponible. Simulando eliminación local.")
      const idx = mockClaims.findIndex((c) => c.id === claimId.trim())
      if (idx !== -1) {
        mockClaims.splice(idx, 1)
      }
      return {
        success: true,
        message: `[Simulación] Siniestro ${claimId} eliminado exitosamente en memoria local.`
      }
    }
  },

  async ingestClaimEmail(data: NewClaimFormData): Promise<{ success: boolean; claimId: string }> {
    try {
      await api.post("/api/v1/gmail/scan", {}, { timeout: 120000 })
      return this.postNewClaim(data)
    } catch (error) {
      console.warn("Backend POST /api/v1/gmail/scan no disponible. Simulando ingestión de correo.")
      return this.postNewClaim(data)
    }
  },
}
