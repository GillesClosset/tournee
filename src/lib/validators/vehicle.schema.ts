import { z } from 'zod'

// French license plate format: AB-123-CD
const licensePlateRegex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/

export const createVehicleSchema = z.object({
  name: z.string().min(1, 'Le nom est requis').max(100),
  license_plate: z
    .string()
    .min(1, "La plaque d'immatriculation est requise")
    .regex(licensePlateRegex, 'Format invalide — ex: AB-123-CD'),
  notes: z.string().max(500).optional(),
})

export const updateVehicleSchema = createVehicleSchema.partial().extend({
  id: z.string().uuid(),
  is_active: z.boolean().optional(),
})

export type CreateVehicleInput = z.infer<typeof createVehicleSchema>
export type UpdateVehicleInput = z.infer<typeof updateVehicleSchema>
