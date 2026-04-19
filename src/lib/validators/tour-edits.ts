import { z } from 'zod'

// ─── Tour edit action schemas ────────────────────────────────────────────────

export const reorderStopsSchema = z.object({
  type: z.literal('reorder'),
  tourId: z.string().uuid(),
  stopIds: z.array(z.string().uuid()).min(1),
})

export const moveStopSchema = z.object({
  type: z.literal('move'),
  stopId: z.string().uuid(),
  fromTourId: z.string().uuid(),
  toTourId: z.string().uuid(),
  insertIndex: z.number().int().min(0),
})

export const removeStopSchema = z.object({
  type: z.literal('remove'),
  stopId: z.string().uuid(),
})

export const assignMissionSchema = z.object({
  type: z.literal('assign'),
  missionId: z.string().uuid(),
  tourId: z.string().uuid(),
})

export const tourEditActionSchema = z.discriminatedUnion('type', [
  reorderStopsSchema,
  moveStopSchema,
  removeStopSchema,
  assignMissionSchema,
])

export const tourEditPayloadSchema = z.object({
  actions: z.array(tourEditActionSchema).min(1),
})

// ─── Inferred types ──────────────────────────────────────────────────────────

export type ReorderStopsAction = z.infer<typeof reorderStopsSchema>
export type MoveStopAction = z.infer<typeof moveStopSchema>
export type RemoveStopAction = z.infer<typeof removeStopSchema>
export type AssignMissionAction = z.infer<typeof assignMissionSchema>
export type TourEditAction = z.infer<typeof tourEditActionSchema>
export type TourEditPayload = z.infer<typeof tourEditPayloadSchema>
