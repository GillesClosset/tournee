import { z } from 'zod'

export const createLocationSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(200),
  address: z.string().min(1, "L'adresse est requise").max(500),
  location_type: z.enum(['villa', 'rdv']),
  parking_difficulty: z.boolean().default(false),
  notes: z.string().max(500).optional(),
})

export const updateLocationSchema = createLocationSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
})

export type CreateLocationInput = z.infer<typeof createLocationSchema>
export type UpdateLocationInput = z.infer<typeof updateLocationSchema>
