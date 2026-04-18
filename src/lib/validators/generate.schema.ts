import { z } from 'zod'

export const generateRequestSchema = z.object({
  force: z.boolean().optional().default(false),
})

/** Valid schedule statuses that allow generation */
export const GENERATABLE_STATUSES = ['configured', 'imported'] as const

export type GenerateRequestInput = z.infer<typeof generateRequestSchema>
