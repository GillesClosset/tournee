'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Vehicle } from '@/lib/db/schema'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const licensePlateRegex = /^[A-Z]{2}-\d{3}-[A-Z]{2}$/

const vehicleFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Le nom est requis').max(100),
  license_plate: z
    .string()
    .min(1, "La plaque d'immatriculation est requise")
    .regex(licensePlateRegex, 'Format invalide — ex: AB-123-CD'),
  notes: z.string().max(500).optional(),
})

type VehicleFormValues = z.infer<typeof vehicleFormSchema>

interface VehicleFormProps {
  vehicle?: Vehicle
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function VehicleForm({ vehicle, open, onOpenChange, onSuccess }: VehicleFormProps) {
  const isEdit = !!vehicle

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<VehicleFormValues>({
    resolver: zodResolver(vehicleFormSchema),
    defaultValues: vehicle
      ? {
          id: vehicle.id,
          name: vehicle.name,
          license_plate: vehicle.licensePlate,
          notes: vehicle.notes ?? undefined,
        }
      : { name: '', license_plate: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      reset(
        vehicle
          ? {
              id: vehicle.id,
              name: vehicle.name,
              license_plate: vehicle.licensePlate,
              notes: vehicle.notes ?? undefined,
            }
          : { name: '', license_plate: '', notes: '' },
      )
    }
  }, [open, vehicle, reset])

  async function onSubmit(data: VehicleFormValues) {
    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const payload = isEdit
        ? data
        : { name: data.name, license_plate: data.license_plate, notes: data.notes }
      const response = await fetch('/api/vehicles', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error((err.error as string) ?? 'Erreur serveur')
      }

      toast.success(isEdit ? 'Véhicule modifié' : 'Véhicule créé')
      onOpenChange(false)
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{isEdit ? 'Modifier le véhicule' : 'Ajouter un véhicule'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" {...register('id')} />}

          <div className="flex flex-col gap-1">
            <label htmlFor="vehicle-name" className="text-sm font-medium">
              Nom <span className="text-destructive">*</span>
            </label>
            <Input id="vehicle-name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="vehicle-plate" className="text-sm font-medium">
              Immatriculation <span className="text-destructive">*</span>
            </label>
            <Input
              id="vehicle-plate"
              placeholder="AB-123-CD"
              aria-invalid={!!errors.license_plate}
              {...register('license_plate')}
            />
            {errors.license_plate && (
              <p className="text-xs text-destructive">{errors.license_plate.message}</p>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="vehicle-notes" className="text-sm font-medium">
              Notes
            </label>
            <Input id="vehicle-notes" {...register('notes')} />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Annuler
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Enregistrement…' : 'Enregistrer'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
