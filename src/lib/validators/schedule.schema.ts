import { z } from 'zod'

// ─── Schedule schemas ────────────────────────────────────────────────────────

export const createScheduleSchema = z.object({
  week_start_date: z
    .string()
    .regex(/^\d{4}-\d{2}-\d{2}$/, 'Format de date invalide (YYYY-MM-DD)')
    .refine(
      (val) => {
        const d = new Date(val)
        return d.getUTCDay() === 1 // Monday
      },
      { message: 'La date doit être un lundi' },
    ),
})

export const updateScheduleSchema = z.object({
  status: z
    .enum(['draft', 'configured', 'imported', 'generated', 'modified', 'confirmed'])
    .optional(),
  notes: z.string().max(1000).optional(),
})

// ─── Availability schemas ────────────────────────────────────────────────────

const timeRegex = /^\d{2}:\d{2}(:\d{2})?$/

const availabilityItemSchema = z
  .object({
    driver_id: z.string().uuid(),
    vehicle_id: z.string().uuid().nullable().optional(),
    day_of_week: z.number().int().min(1).max(7),
    start_time: z.string().regex(timeRegex, 'Format HH:MM attendu'),
    end_time: z.string().regex(timeRegex, 'Format HH:MM attendu'),
    is_available: z.boolean(),
  })
  .refine((item) => item.end_time > item.start_time, {
    message: "L'heure de fin doit être après l'heure de début",
    path: ['end_time'],
  })

export const bulkUpsertAvailabilitiesSchema = z
  .array(availabilityItemSchema)
  .superRefine((items, ctx) => {
    // Vehicle overlap validation: same vehicle_id on same day_of_week must not overlap
    for (let i = 0; i < items.length; i++) {
      for (let j = i + 1; j < items.length; j++) {
        const a = items[i]
        const b = items[j]
        if (
          a.vehicle_id &&
          b.vehicle_id &&
          a.vehicle_id === b.vehicle_id &&
          a.day_of_week === b.day_of_week &&
          a.is_available &&
          b.is_available
        ) {
          // Check time overlap: a.start < b.end && b.start < a.end
          if (a.start_time < b.end_time && b.start_time < a.end_time) {
            ctx.addIssue({
              code: z.ZodIssueCode.custom,
              message: `Conflit véhicule : même véhicule assigné à deux chauffeurs avec des horaires chevauchants le jour ${a.day_of_week}`,
              path: [j, 'vehicle_id'],
            })
          }
        }
      }
    }
  })

// ─── Inferred types ──────────────────────────────────────────────────────────

export type CreateScheduleInput = z.infer<typeof createScheduleSchema>
export type UpdateScheduleInput = z.infer<typeof updateScheduleSchema>
export type AvailabilityItem = z.infer<typeof availabilityItemSchema>
export type BulkUpsertAvailabilitiesInput = z.infer<typeof bulkUpsertAvailabilitiesSchema>
