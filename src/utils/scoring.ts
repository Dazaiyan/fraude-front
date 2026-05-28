/** Umbrales alineados con FraudScoringService (fraude-back/app/integrations/siniestros/scoring.py) */
export const SCORE_THRESHOLD_ROJO = 71
export const SCORE_THRESHOLD_AMARILLO = 36

export type ScoreColor = "Verde" | "Amarillo" | "Rojo"
export type ScoreBand = "Bajo" | "Medio" | "Alto"
export type RiskLevel = "low" | "medium" | "high"

/** A mayor puntaje, mayor probabilidad de fraude → color más severo */
export function scoreToColor(score: number): ScoreColor {
  if (score >= SCORE_THRESHOLD_ROJO) return "Rojo"
  if (score >= SCORE_THRESHOLD_AMARILLO) return "Amarillo"
  return "Verde"
}

export function scoreToBand(score: number): ScoreBand {
  if (score >= SCORE_THRESHOLD_ROJO) return "Alto"
  if (score >= SCORE_THRESHOLD_AMARILLO) return "Medio"
  return "Bajo"
}

export function scoreColorToRiskLevel(color: ScoreColor): RiskLevel {
  if (color === "Rojo") return "high"
  if (color === "Amarillo") return "medium"
  return "low"
}

export function riskLevelToScoreColor(level: RiskLevel): ScoreColor {
  if (level === "high") return "Rojo"
  if (level === "medium") return "Amarillo"
  return "Verde"
}

/** Normaliza color/banda desde el puntaje (fuente de verdad para la UI) */
export function normalizeScorePresentation(score: number): {
  total_score: number
  score_color: ScoreColor
  score_band: ScoreBand
  riskLevel: RiskLevel
} {
  const score_color = scoreToColor(score)
  return {
    total_score: score,
    score_color,
    score_band: scoreToBand(score),
    riskLevel: scoreColorToRiskLevel(score_color),
  }
}
