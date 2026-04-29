// Simulated AI priority scoring engine for ReliefLink
// Combines rule-based factors: need type, people affected, urgency keywords, waiting time

const CRITICAL_KEYWORDS = [
  "trapped", "bleeding", "unconscious", "dying", "drowning", "collapsed",
  "child", "infant", "baby", "elderly", "pregnant", "disabled",
  "fire", "smoke", "burning", "buried",
];

const HIGH_KEYWORDS = [
  "injured", "hurt", "stuck", "broken", "wound", "fracture",
  "no water", "no food", "starving", "dehydrated", "weak", "sick",
];

export type Urgency = "low" | "medium" | "high" | "critical";
export type NeedType = "food" | "medicine" | "rescue" | "blood" | "shelter" | "transport";

const NEED_WEIGHT: Record<NeedType, number> = {
  rescue: 35,
  blood: 32,
  medicine: 25,
  shelter: 18,
  food: 12,
  transport: 10,
};

export interface ScoreInput {
  needType: NeedType;
  peopleAffected: number;
  description: string;
  createdAt?: Date;
}

export interface ScoreResult {
  score: number; // 0-100
  urgency: Urgency;
  reasons: string[];
}

export function scoreRequest(input: ScoreInput): ScoreResult {
  const reasons: string[] = [];
  let score = 20;

  // Need-type weight
  const needScore = NEED_WEIGHT[input.needType] ?? 15;
  score += needScore;
  reasons.push(`${input.needType} need (+${needScore})`);

  // People affected
  const people = Math.max(1, input.peopleAffected || 1);
  const peopleScore = Math.min(25, Math.floor(Math.log2(people + 1) * 6));
  score += peopleScore;
  if (peopleScore > 0) reasons.push(`${people} affected (+${peopleScore})`);

  // Keywords
  const desc = (input.description || "").toLowerCase();
  const criticalHits = CRITICAL_KEYWORDS.filter((k) => desc.includes(k));
  const highHits = HIGH_KEYWORDS.filter((k) => desc.includes(k));
  if (criticalHits.length) {
    const k = Math.min(25, criticalHits.length * 12);
    score += k;
    reasons.push(`critical signal: ${criticalHits.slice(0, 2).join(", ")} (+${k})`);
  }
  if (highHits.length) {
    const k = Math.min(15, highHits.length * 6);
    score += k;
    reasons.push(`risk signal: ${highHits.slice(0, 2).join(", ")} (+${k})`);
  }

  // Waiting time bonus (older = higher urgency)
  if (input.createdAt) {
    const ageMin = (Date.now() - input.createdAt.getTime()) / 60000;
    if (ageMin > 30) {
      const w = Math.min(15, Math.floor(ageMin / 10));
      score += w;
      reasons.push(`waiting ${Math.floor(ageMin)}m (+${w})`);
    }
  }

  score = Math.max(0, Math.min(100, score));

  let urgency: Urgency = "low";
  if (score >= 80) urgency = "critical";
  else if (score >= 60) urgency = "high";
  else if (score >= 40) urgency = "medium";

  return { score, urgency, reasons };
}

// Haversine distance in km
export function distanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((lat1 * Math.PI) / 180) * Math.cos((lat2 * Math.PI) / 180) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(a));
}

export interface DuplicateCandidate {
  id: string;
  needType: NeedType;
  latitude: number;
  longitude: number;
  description: string;
  created_at?: string;
}

export function findDuplicates(
  newReq: { needType: NeedType; latitude: number; longitude: number; description: string },
  existing: DuplicateCandidate[],
  radiusKm = 0.5
): DuplicateCandidate[] {
  const newWords = new Set(newReq.description.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
  return existing.filter((e) => {
    if (e.needType !== newReq.needType) return false;
    const d = distanceKm(newReq.latitude, newReq.longitude, e.latitude, e.longitude);
    if (d > radiusKm) return false;
    if (newWords.size === 0) return true; // proximity + same need is enough
    const eWords = new Set(e.description.toLowerCase().split(/\W+/).filter((w) => w.length > 3));
    let overlap = 0;
    newWords.forEach((w) => { if (eWords.has(w)) overlap++; });
    return overlap >= 2 || (newWords.size <= 3 && overlap >= 1);
  });
}

export const URGENCY_COLORS: Record<Urgency, string> = {
  critical: "oklch(0.62 0.27 18)",
  high: "oklch(0.7 0.22 25)",
  medium: "oklch(0.8 0.18 80)",
  low: "oklch(0.72 0.18 155)",
};

export const URGENCY_LABEL: Record<Urgency, string> = {
  critical: "CRITICAL",
  high: "HIGH",
  medium: "MEDIUM",
  low: "LOW",
};
