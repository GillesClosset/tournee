/**
 * Extracts day-of-week (1=lundi…7=dimanche) from free-form French strings.
 */

const DAY_MAP: Record<string, number> = {
  lundi: 1,
  mardi: 2,
  mercredi: 3,
  jeudi: 4,
  vendredi: 5,
  samedi: 6,
  dimanche: 7,
}

export function parseDayOfWeek(raw: string): number | null {
  if (!raw || !raw.trim()) return null

  const lower = raw.trim().toLowerCase()

  for (const [name, num] of Object.entries(DAY_MAP)) {
    if (lower.startsWith(name) || lower.includes(name)) {
      return num
    }
  }

  return null
}
