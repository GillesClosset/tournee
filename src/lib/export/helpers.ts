/**
 * Shared constants and helpers for Excel/PDF export builders.
 */

/** French day names indexed by dayOfWeek (1 = Monday). */
export const DAY_NAMES: Record<number, string> = {
  1: 'Lundi',
  2: 'Mardi',
  3: 'Mercredi',
  4: 'Jeudi',
  5: 'Vendredi',
}

/**
 * Format a time string (HH:MM:SS or HH:MM) to HH:MM display.
 */
export function formatTime(time: string): string {
  return time.slice(0, 5)
}

/**
 * Format a week start date (YYYY-MM-DD) into a French label.
 * e.g. "2026-04-20" → "Semaine du 20/04/2026"
 */
export function formatWeekLabel(weekStartDate: string): string {
  const [y, m, d] = weekStartDate.split('-')
  return `Semaine du ${d}/${m}/${y}`
}
