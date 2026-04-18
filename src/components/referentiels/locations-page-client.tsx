'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Location } from '@/lib/db/schema'
import { LocationTable } from '@/components/referentiels/location-table'
import { LocationForm } from '@/components/referentiels/location-form'
import { Button } from '@/components/ui/button'

interface LocationsPageClientProps {
  initialLocations: Location[]
}

export function LocationsPageClient({ initialLocations }: LocationsPageClientProps) {
  const router = useRouter()
  const [formOpen, setFormOpen] = useState(false)
  const [selectedLocation, setSelectedLocation] = useState<Location | undefined>()

  const handleSuccess = useCallback(() => {
    router.refresh()
  }, [router])

  function handleEdit(location: Location) {
    setSelectedLocation(location)
    setFormOpen(true)
  }

  function handleAdd() {
    setSelectedLocation(undefined)
    setFormOpen(true)
  }

  async function handleToggleActive(location: Location) {
    try {
      const response = await fetch('/api/locations', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: location.id, is_active: !location.isActive }),
      })
      if (!response.ok) throw new Error('Erreur serveur')
      toast.success(location.isActive ? 'Point de passage désactivé' : 'Point de passage réactivé')
      router.refresh()
    } catch {
      toast.error('Erreur lors de la mise à jour')
    }
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold">Points de passage</h1>
        <Button onClick={handleAdd}>Ajouter</Button>
      </div>

      <LocationTable
        locations={initialLocations}
        onEdit={handleEdit}
        onToggleActive={handleToggleActive}
      />

      <LocationForm
        location={selectedLocation}
        open={formOpen}
        onOpenChange={setFormOpen}
        onSuccess={handleSuccess}
      />
    </div>
  )
}
