import { z } from 'zod'

export const createDriverSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  notes: z.string().max(500).optional(),
})

export const updateDriverSchema = createDriverSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
})

export type CreateDriverInput = z.infer<typeof createDriverSchema>
export type UpdateDriverInput = z.infer<typeof updateDriverSchema>
