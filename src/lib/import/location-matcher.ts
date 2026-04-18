/**
 * Fuzzy-matches a location name against a list of known locations.
 */

interface LocationEntry {
  id: string
  name: string
}

interface MatchResult {
  locationId: string
  confidence: number
}

const MATCH_THRESHOLD = 0.6

function normalize(s: string): string {
  return s
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
}

function levenshtein(a: string, b: string): number {
  const m = a.length
  const n = b.length
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0))

  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] =
        a[i - 1] === b[j - 1]
          ? dp[i - 1][j - 1]
          : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1])
    }
  }

  return dp[m][n]
}

function similarity(a: string, b: string): number {
  const maxLen = Math.max(a.length, b.length)
  if (maxLen === 0) return 1
  return 1 - levenshtein(a, b) / maxLen
}

export function matchLocation(name: string, locations: LocationEntry[]): MatchResult | null {
  if (!name || !name.trim() || locations.length === 0) return null

  const normalized = normalize(name)

  // Exact match
  for (const loc of locations) {
    if (normalize(loc.name) === normalized) {
      return { locationId: loc.id, confidence: 1.0 }
    }
  }

  // Includes / startsWith
  for (const loc of locations) {
    const normLoc = normalize(loc.name)
    if (normLoc.includes(normalized) || normalized.includes(normLoc)) {
      return { locationId: loc.id, confidence: 0.9 }
    }
  }

  // Levenshtein fuzzy match
  let bestMatch: MatchResult | null = null
  for (const loc of locations) {
    const score = similarity(normalized, normalize(loc.name))
    if (score >= MATCH_THRESHOLD && (!bestMatch || score > bestMatch.confidence)) {
      bestMatch = { locationId: loc.id, confidence: score }
    }
  }

  return bestMatch
}
