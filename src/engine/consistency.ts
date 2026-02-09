import { DreamCard, OptionEffect, RiasecKey } from "./types";

const RIASC_WEIGHT = 4;
const SECONDARY_WEIGHT = 2;
const INTEGRITY_WEIGHT = 1;

const clamp = (value: number, min: number, max: number) =>
  Math.max(min, Math.min(max, value));

export interface ConsistencyResult {
  delta: number;
  scandalPenalty: number;
  notes: string[];
}

export function scoreConsistency(
  dreamCard: DreamCard,
  effect: OptionEffect
): ConsistencyResult {
  const notes: string[] = [];
  let score = 0;
  let scandalPenalty = 0;

  const riasec = effect.riasec ?? {};
  const primary = dreamCard.primaryRiasec;
  const secondary = dreamCard.secondaryRiasec;

  score += (riasec[primary] ?? 0) * RIASC_WEIGHT;
  if (secondary) {
    score += (riasec[secondary] ?? 0) * SECONDARY_WEIGHT;
  }

  if (effect.lifeStatus?.integrity) {
    score += effect.lifeStatus.integrity * INTEGRITY_WEIGHT;
  }

  if (effect.triggers?.scandal) {
    scandalPenalty += 15;
    notes.push("Scandal warning triggered");
  }

  if (effect.triggers?.legend) {
    score += 20;
    notes.push("Legendary action aligned with dream card");
  }

  if (effect.consistencyWeight) {
    score *= effect.consistencyWeight;
  }

  const delta = clamp(Math.round(score - scandalPenalty), -30, 30);
  return { delta, scandalPenalty, notes };
}

export function dominantRiasec(riasec: Record<RiasecKey, number>) {
  return Object.entries(riasec).sort((a, b) => b[1] - a[1])[0][0] as RiasecKey;
}
