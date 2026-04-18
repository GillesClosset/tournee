import { z } from 'zod'

export const importedMissionSchema = z.object({
  dayOfWeek: z.number().min(1).max(7),
  locationId: z.string().uuid().nullable(),
  requestedTime: z.string().regex(/^\d{2}:\d{2}$/),
  timeRangeEnd: z
    .string()
    .regex(/^\d{2}:\d{2}$/)
    .nullable(),
  minorName: z.string().nullable(),
  missionText: z.string().min(1),
  missionType: z.enum(['accompagnement', 'recuperation', 'both']),
  accompanimentType: z.enum(['scolaire', 'medical', 'loisir', 'famille', 'autre']),
  isPriorityFlagged: z.boolean(),
  observations: z.string().nullable(),
  rawRowData: z.unknown(),
})

export type ImportedMission = z.infer<typeof importedMissionSchema>

export const importResultSchema = z.object({
  rows: z.array(importedMissionSchema),
  warnings: z.array(z.string()),
  errors: z.array(z.string()),
})

export type ImportResult = z.infer<typeof importResultSchema>
