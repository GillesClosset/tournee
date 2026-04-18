'use client'

import { useEffect, useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { toast } from 'sonner'
import { Location } from '@/lib/db/schema'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { GeocodingResult } from '@/lib/routing/ors-client'

// Unified form schema (id optional for create, required for edit but we send it if present)
const locationFormSchema = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(1, 'Le nom est requis').max(200),
  address: z.string().min(1, "L'adresse est requise").max(500),
  location_type: z.enum(['villa', 'rdv']),
  parking_difficulty: z.boolean(),
  notes: z.string().max(500).optional(),
})

type LocationFormValues = z.infer<typeof locationFormSchema>

interface LocationFormProps {
  location?: Location
  open: boolean
  onOpenChange: (open: boolean) => void
  onSuccess: () => void
}

export function LocationForm({ location, open, onOpenChange, onSuccess }: LocationFormProps) {
  const isEdit = !!location

  const [geocodePreview, setGeocodePreview] = useState<GeocodingResult | null>(null)
  const [geocodeChecking, setGeocodeChecking] = useState(false)
  const [geocodingWarning, setGeocodingWarning] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LocationFormValues>({
    resolver: zodResolver(locationFormSchema),
    defaultValues: location
      ? {
          id: location.id,
          name: location.name,
          address: location.address,
          location_type: location.locationType,
          parking_difficulty: location.parkingDifficulty,
          notes: location.notes ?? undefined,
        }
      : { name: '', address: '', location_type: 'villa', parking_difficulty: false, notes: '' },
  })

  useEffect(() => {
    if (open) {
      setGeocodePreview(null)
      setGeocodingWarning(null)
      reset(
        location
          ? {
              id: location.id,
              name: location.name,
              address: location.address,
              location_type: location.locationType,
              parking_difficulty: location.parkingDifficulty,
              notes: location.notes ?? undefined,
            }
          : {
              name: '',
              address: '',
              location_type: 'villa',
              parking_difficulty: false,
              notes: '',
            },
      )
    }
  }, [open, location, reset])

  const addressValue = watch('address')
  const locationTypeValue = watch('location_type')
  const parkingDifficultyValue = watch('parking_difficulty')

  async function handleGeocodeCheck() {
    if (!addressValue) return
    setGeocodeChecking(true)
    setGeocodePreview(null)
    try {
      const response = await fetch('/api/locations/geocode', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addressValue }),
      })
      const json = await response.json()
      if (!response.ok) {
        toast.error(json.error ?? 'Adresse introuvable')
      } else {
        setGeocodePreview(json.data as GeocodingResult)
      }
    } catch {
      toast.error('Erreur lors de la vérification')
    } finally {
      setGeocodeChecking(false)
    }
  }

  async function onSubmit(data: LocationFormValues) {
    setGeocodingWarning(null)
    try {
      const method = isEdit ? 'PATCH' : 'POST'
      const payload = isEdit ? data : { ...data, id: undefined }
      const response = await fetch('/api/locations', {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      const json = await response.json()

      if (!response.ok) {
        throw new Error((json.error as string) ?? 'Erreur serveur')
      }

      if (json.geocoding_warning) {
        setGeocodingWarning(json.geocoding_warning as string)
      }

      toast.success(isEdit ? 'Point de passage modifié' : 'Point de passage créé')
      if (!json.geocoding_warning) {
        onOpenChange(false)
      }
      onSuccess()
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Erreur inconnue')
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? 'Modifier le point de passage' : 'Ajouter un point de passage'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
          {isEdit && <input type="hidden" {...register('id')} />}

          <div className="flex flex-col gap-1">
            <label htmlFor="location-name" className="text-sm font-medium">
              Nom <span className="text-destructive">*</span>
            </label>
            <Input id="location-name" aria-invalid={!!errors.name} {...register('name')} />
            {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="location-address" className="text-sm font-medium">
              Adresse <span className="text-destructive">*</span>
            </label>
            <div className="flex gap-2">
              <Input
                id="location-address"
                aria-invalid={!!errors.address}
                className="flex-1"
                {...register('address')}
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleGeocodeCheck}
                disabled={geocodeChecking || !addressValue}
              >
                {geocodeChecking ? 'Vérification…' : 'Vérifier adresse'}
              </Button>
            </div>
            {errors.address && <p className="text-xs text-destructive">{errors.address.message}</p>}
            {geocodePreview && (
              <div className="rounded-md bg-muted/50 px-3 py-2 text-xs text-muted-foreground">
                <span className="font-medium text-foreground">
                  {geocodePreview.formatted_address}
                </span>
                <br />
                Lat: {geocodePreview.latitude.toFixed(5)}, Lng:{' '}
                {geocodePreview.longitude.toFixed(5)} — Confiance:{' '}
                {(geocodePreview.confidence * 100).toFixed(0)}%
              </div>
            )}
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="location-type" className="text-sm font-medium">
              Type <span className="text-destructive">*</span>
            </label>
            <Select
              value={locationTypeValue}
              onValueChange={(val) => setValue('location_type', val as 'villa' | 'rdv')}
            >
              <SelectTrigger id="location-type" className="w-full">
                <SelectValue placeholder="Choisir un type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="villa">Villa</SelectItem>
                <SelectItem value="rdv">RDV</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-2">
            <input
              id="parking-difficulty"
              type="checkbox"
              className="h-4 w-4 rounded border-input"
              checked={!!parkingDifficultyValue}
              onChange={(e) => setValue('parking_difficulty', e.target.checked)}
            />
            <label htmlFor="parking-difficulty" className="text-sm font-medium">
              Stationnement difficile
            </label>
          </div>

          <div className="flex flex-col gap-1">
            <label htmlFor="location-notes" className="text-sm font-medium">
              Notes
            </label>
            <Input id="location-notes" {...register('notes')} />
          </div>

          {geocodingWarning && (
            <Alert className="border-yellow-500/50 bg-yellow-50 dark:bg-yellow-950/20">
              <AlertTitle className="text-yellow-700 dark:text-yellow-400">
                Adresse non géocodée
              </AlertTitle>
              <AlertDescription className="text-yellow-600 dark:text-yellow-500">
                {geocodingWarning}
              </AlertDescription>
            </Alert>
          )}

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
