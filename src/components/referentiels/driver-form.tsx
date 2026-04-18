'use client'

import { useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Driver } from '@/lib/db/schema'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'

const driverFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Le nom est requis').max(100),
  notes: z.string().max(500).optional(),
})

type DriverFormValues = z.infer<typeof driverFormSchema>

interface DriverFormProps {
  driver?: Driver
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function DriverForm({ driver, open, onOpenChange, onSuccess }: DriverFormProps) {
  const isEdit = !!driver

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<DriverFormValues>({
    resolver: zodResolver(driverFormSchema),
    defaultValues: driver
      ? { id: driver.id, name: driver.name, notes: driver.notes ?? undefined }
      : { name: '', notes: '' },
  })

  useEffect(() => {
    if (open) {
      reset(
        driver
          ? { id: driver.id, name: driver.name, notes: driver.notes ?? undefined }
          : { name: '', notes: '' },
      )
    }
  }, [open, driver, reset])

  async function onSubmit(data: DriverFormValues) {
    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const payload = isEdit ? data : { name: data.name, notes: data.notes }
      const response = await fetch('/api/drivers', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const err = await response.json()
        throw new Error((err.error as string) ?? 'Erreur serveur')
      }

      toast.success(isEdit ? 'Chauffeur modifié' : 'Chauffeur créé')
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
          <DialogTitle>{isEdit ? 'Modifier le chauffeur' : 'Ajouter un chauffeur'}</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" {...register('id')} />}

          <div className="flex flex-col gap-1">
            <label htmlFor="driver-name" className="text-sm font-medium">
              Nom <span className="text-destructive">*</span>
            </label>
            <Input id="driver-name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="driver-notes" className="text-sm font-medium">
              Notes
            </label>
            <Input id="driver-notes" {...register('notes')} />
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
